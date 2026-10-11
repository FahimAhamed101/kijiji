import dbConnect from '@/lib/mongodb'
import Order from '@/lib/models/Order'
import { getMemberSession } from '@/lib/auth'
import { orderView, type RawOrder } from '@/lib/order-view'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Orders belonging to the signed-in member.
 *
 * Matches on `member` **or** on `customerEmail`. The second clause picks up
 * orders the customer placed as a guest with the same address before signing
 * up — otherwise those would vanish the moment they created an account.
 */
export async function GET() {
  try {
    const session = await getMemberSession()
    if (!session) return jsonError('Not signed in', 401)

    await dbConnect()
    const orders = await Order.find({
      $or: [{ member: session.id }, { customerEmail: session.email.toLowerCase() }],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    return Response.json({
      items: (orders as unknown as RawOrder[]).map(orderView),
    })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
