import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Message from '@/lib/models/Message'
import { getSession } from '@/lib/auth'
import { messageCreateSchema, formatZodError } from '@/lib/validators'
import { getPagination, paginated, jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    await dbConnect()
    const sp = req.nextUrl.searchParams
    const pagination = getPagination(req, 25)

    const filter: Record<string, unknown> = {}
    const status = sp.get('status')
    if (status && status !== 'all') filter.status = status

    const q = sp.get('q')?.trim()
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ name: rx }, { email: rx }, { body: rx }, { productTitle: rx }]
    }

    const [items, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
      Message.countDocuments(filter),
    ])

    return Response.json(paginated(items, total, pagination))
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

/** Public endpoint - powers the "Send message" form on a listing page. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = messageCreateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const message = await Message.create(parsed.data)
    return Response.json({ ok: true, id: String(message._id) }, { status: 201 })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
