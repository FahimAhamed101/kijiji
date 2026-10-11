import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/lib/models/Order'
import { getSession, getMemberSession } from '@/lib/auth'
import { jsonError, errorMessage } from '@/lib/api-helpers'
import { toMinorUnits } from '@/lib/money'
import {
  capturePaypalOrder,
  getPaypalOrder,
  PaymentError,
  retrieveStripeSession,
  type PaypalCapture,
} from '@/lib/payments'
import { orderView, type RawOrder } from '@/lib/order-view'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Settle an order after the customer comes back from the gateway.
 *
 * This is the only place an order is ever marked paid, and it decides that
 * purely from the gateway's own answer — never from anything the browser
 * asserts. The `accessToken` only proves *who* may ask; it proves nothing about
 * whether money changed hands.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      orderId?: string
      accessToken?: string
      session_id?: string
      paypalOrderId?: string
    } | null

    if (!body?.orderId || !/^[0-9a-fA-F]{24}$/.test(body.orderId)) {
      return jsonError('A valid order id is required', 422)
    }

    await dbConnect()
    const order = await Order.findById(body.orderId).select('+accessToken')
    if (!order) return jsonError('Order not found', 404)

    /* --- Who is allowed to touch this order? --- */
    const [staff, member] = await Promise.all([getSession(), getMemberSession()])
    const isOwner =
      (member && String(order.member) === member.id) ||
      (member && order.customerEmail === member.email.toLowerCase())
    const hasToken = Boolean(body.accessToken) && body.accessToken === order.accessToken

    if (!staff && !isOwner && !hasToken) {
      return jsonError('Not allowed to view this order', 403)
    }

    // Idempotent: a page refresh after payment must not re-charge or re-capture.
    if (order.payment.status === 'paid') {
      return Response.json({ order: orderView(order.toObject() as unknown as RawOrder) })
    }

    const provider = order.payment.provider

    if (provider === 'demo') {
      order.payment.status = 'paid'
      order.payment.amount = order.total
      order.payment.paidAt = new Date()
      order.payment.reference = order.payment.reference || 'demo_manual'
      order.status = 'paid'
      await order.save()
      return Response.json({ order: orderView(order.toObject() as unknown as RawOrder) })
    }

    if (provider === 'stripe') {
      if (!body.session_id) return jsonError('Missing Stripe session id', 422)

      const session = await retrieveStripeSession(body.session_id)

      // Three independent checks: the gateway says it's paid, it's paid for
      // *this* order, and it's paid the amount we asked for.
      if (session.payment_status !== 'paid') {
        return jsonError('Stripe has not marked this payment as complete', 409)
      }
      if (session.metadata?.order_id && session.metadata.order_id !== String(order._id)) {
        return jsonError('This payment belongs to a different order', 409)
      }
      if (
        session.amount_total != null &&
        session.amount_total !== toMinorUnits(order.total)
      ) {
        return jsonError('The amount paid does not match the order total', 409)
      }

      order.payment.status = 'paid'
      order.payment.reference = session.id
      order.payment.amount = order.total
      order.payment.paidAt = new Date()
      order.status = 'paid'
      await order.save()

      return Response.json({ order: orderView(order.toObject() as unknown as RawOrder) })
    }

    if (provider === 'paypal') {
      // Prefer the id we stored when the order was created; fall back to the one
      // PayPal appends to the return URL.
      const paypalOrderId = order.payment.reference || body.paypalOrderId
      if (!paypalOrderId) return jsonError('Missing PayPal order id', 422)

      let capture: PaypalCapture
      try {
        capture = await capturePaypalOrder(paypalOrderId)
      } catch (err) {
        // A refresh or a second tab will hit an already-captured order. That is
        // a success, not a failure — confirm it by reading the order back.
        capture = await getPaypalOrder(paypalOrderId).catch(() => {
          throw err
        })
      }

      if (capture.status !== 'COMPLETED') {
        return jsonError(`PayPal payment is ${capture.status || 'not complete'}`, 409)
      }

      const captured = capture.purchase_units?.[0]?.payments?.captures?.[0]
      order.payment.status = 'paid'
      order.payment.reference = paypalOrderId
      order.payment.amount = order.total
      order.payment.paidAt = new Date()
      order.status = 'paid'
      await order.save()

      return Response.json({
        order: orderView(order.toObject() as unknown as RawOrder),
        captureId: captured?.id ?? null,
      })
    }

    return jsonError(`Unsupported payment provider: ${provider}`, 400)
  } catch (err) {
    if (err instanceof PaymentError) return jsonError(err.message, 502)
    return jsonError(errorMessage(err), 500)
  }
}
