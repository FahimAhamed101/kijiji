import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import dbConnect from '@/lib/mongodb'
import Product from '@/lib/models/Product'
import Order from '@/lib/models/Order'
import { getMemberSession } from '@/lib/auth'
import { checkoutSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'
import { computeTotals, generateOrderNumber } from '@/lib/money'
import {
  createPaypalOrder,
  createStripeCheckout,
  PaymentError,
  providerEnabled,
} from '@/lib/payments'
import { orderView, type RawOrder } from '@/lib/order-view'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Where the gateway should send the customer back to.
 *
 * The request's own origin wins, because that is provably the host the browser
 * is talking to — which is what makes local checkout work without editing env
 * vars. `PAYMENT_RETURN_ORIGIN` is the escape hatch for deployments behind a
 * proxy that rewrites Host.
 */
function resolveOrigin(req: NextRequest): string {
  const explicit = (process.env.PAYMENT_RETURN_ORIGIN ?? '').trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const origin = req.headers.get('origin')
  if (origin) return origin.replace(/\/+$/, '')

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (host) {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)
    const proto = req.headers.get('x-forwarded-proto') ?? (local ? 'http' : 'https')
    return `${proto}://${host}`
  }
  return req.nextUrl.origin
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    const { items: requested, provider, shippingAddress, note } = parsed.data

    // Verified, not merely configured: a key that fails to authenticate is
    // treated as unavailable rather than surfacing as a gateway error later.
    if (!(await providerEnabled(provider))) {
      return jsonError(`${provider} is not available on this server`, 400)
    }

    await dbConnect()

    /* --------------------------------------------------------------
     * Price the basket from the database.
     *
     * The browser sends only product ids and quantities. Every figure the
     * customer is charged is read from MongoDB here, so a tampered request
     * cannot influence the total.
     * -------------------------------------------------------------- */
    const ids = [...new Set(requested.map((i) => i.product))]
    const products = await Product.find({ _id: { $in: ids } }).lean()
    const byId = new Map(products.map((p) => [String(p._id), p]))

    const lineItems: {
      product: string
      title: string
      slug: string
      price: number
      quantity: number
      image: string
      sellerName: string
    }[] = []

    const unavailable: string[] = []

    for (const line of requested) {
      const p = byId.get(line.product)
      if (!p) {
        unavailable.push('an item that no longer exists')
        continue
      }
      if (p.status !== 'active') {
        unavailable.push(`“${p.title}” is no longer available`)
        continue
      }
      if (p.priceOnRequest || !p.price || p.price <= 0) {
        unavailable.push(`“${p.title}” has no online price — contact the seller`)
        continue
      }
      lineItems.push({
        product: String(p._id),
        title: p.title,
        slug: p.slug,
        price: p.price,
        quantity: line.quantity,
        image: p.images?.[0] ?? '',
        sellerName: p.seller?.name ?? '',
      })
    }

    if (lineItems.length === 0) {
      return jsonError(
        unavailable.length
          ? `We couldn't place this order: ${unavailable.join('; ')}`
          : 'Your cart is empty',
        409
      )
    }
    if (unavailable.length) {
      return jsonError(`Please review your cart: ${unavailable.join('; ')}`, 409)
    }

    const totals = computeTotals(lineItems)

    const session = await getMemberSession()

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      accessToken: randomUUID(),
      member: session?.id ?? null,
      customerEmail: shippingAddress.email,
      customerName: shippingAddress.name,
      items: lineItems,
      ...totals,
      shippingAddress,
      payment: { provider, status: 'unpaid', reference: '', amount: 0, paidAt: null },
      status: 'pending',
      note,
    })

    const orderId = String(order._id)
    const accessToken = order.accessToken

    /* --------------------------------------------------------------
     * Demo provider — settle immediately, no gateway involved.
     * -------------------------------------------------------------- */
    if (provider === 'demo') {
      order.payment.status = 'paid'
      order.payment.reference = `demo_${randomUUID().slice(0, 12)}`
      order.payment.amount = totals.total
      order.payment.paidAt = new Date()
      order.status = 'paid'
      await order.save()

      return NextResponse.json({
        mode: 'demo',
        orderId,
        orderNumber: order.orderNumber,
        accessToken,
        order: orderView(order.toObject() as unknown as RawOrder),
      })
    }

    /* --------------------------------------------------------------
     * Real gateway — hand off to its hosted page.
     * -------------------------------------------------------------- */
    const origin = resolveOrigin(req)
    const payload = {
      orderId,
      orderNumber: order.orderNumber,
      items: lineItems.map((i) => ({ title: i.title, price: i.price, quantity: i.quantity })),
      total: totals.total,
      currency: totals.currency,
    }

    try {
      const created =
        provider === 'stripe'
          ? await createStripeCheckout(payload, origin)
          : await createPaypalOrder(payload, origin)

      order.payment.reference = created.reference
      await order.save()

      return NextResponse.json({
        mode: 'redirect',
        url: created.url,
        orderId,
        orderNumber: order.orderNumber,
        accessToken,
      })
    } catch (err) {
      // The gateway refused, so this order can never be paid — remove it rather
      // than leaving a phantom 'pending' row in the admin panel.
      await Order.deleteOne({ _id: order._id }).catch(() => {})
      if (err instanceof PaymentError) return jsonError(err.message, 502)
      throw err
    }
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
