import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/lib/models/Order'
import { getSession, getMemberSession } from '@/lib/auth'
import { orderUpdateSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'
import { orderView, type RawOrder } from '@/lib/order-view'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

/**
 * Read one order.
 *
 * Three ways in: staff, the member who placed it, or anyone holding the order's
 * `accessToken` (how a guest's confirmation page proves it is the guest). The
 * token is required as a query param because it is deliberately `select: false`
 * and never serialised into any response body.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    await dbConnect()
    const order = await Order.findById(params.id).select('+accessToken')
    if (!order) return jsonError('Order not found', 404)

    const [staff, member] = await Promise.all([getSession(), getMemberSession()])
    const isOwner =
      (member && String(order.member) === member.id) ||
      (member && order.customerEmail === member.email.toLowerCase())
    const token = req.nextUrl.searchParams.get('token')
    const hasToken = Boolean(token) && token === order.accessToken

    if (!staff && !isOwner && !hasToken) {
      return jsonError('Not allowed to view this order', 403)
    }

    return Response.json({ order: orderView(order.toObject() as unknown as RawOrder) })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

/** Move an order through fulfilment. Staff only. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    const body = await req.json().catch(() => null)
    const parsed = orderUpdateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const order = await Order.findById(params.id)
    if (!order) return jsonError('Order not found', 404)

    const { status, note } = parsed.data

    if (status) {
      // An unpaid order can't be "shipped" — money has to land first, or the
      // status list would stop meaning anything.
      if (order.payment.status !== 'paid' && !['pending', 'cancelled'].includes(status)) {
        return jsonError('This order has not been paid yet', 409)
      }
      order.status = status
    }
    if (note !== undefined) order.note = note

    await order.save()
    return Response.json({ order: orderView(order.toObject() as unknown as RawOrder) })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
