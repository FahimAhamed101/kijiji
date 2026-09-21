import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Report from '@/lib/models/Report'
import { getSession } from '@/lib/auth'
import { reportCreateSchema, formatZodError } from '@/lib/validators'
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

    const [items, total] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
      Report.countDocuments(filter),
    ])

    return Response.json(paginated(items, total, pagination))
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

/** Public endpoint - "Report listing" on a detail page. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = reportCreateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const report = await Report.create(parsed.data)
    return Response.json({ ok: true, id: String(report._id) }, { status: 201 })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
