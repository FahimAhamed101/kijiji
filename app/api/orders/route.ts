import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/lib/models/Order'
import { getSession } from '@/lib/auth'
import { jsonError, errorMessage, getPagination, paginated } from '@/lib/api-helpers'
import { orderView, type RawOrder } from '@/lib/order-view'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Admin order list — staff only. */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    await dbConnect()

    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim()
    const status = sp.get('status')?.trim()
    const provider = sp.get('provider')?.trim()

    const filter: Record<string, unknown> = {}
    if (status && status !== 'all') filter.status = status
    if (provider && provider !== 'all') filter['payment.provider'] = provider
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ orderNumber: rx }, { customerEmail: rx }, { customerName: rx }]
    }

    const pagination = getPagination(req, 20)

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
      Order.countDocuments(filter),
    ])

    return Response.json(paginated((orders as unknown as RawOrder[]).map(orderView), total, pagination))
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
