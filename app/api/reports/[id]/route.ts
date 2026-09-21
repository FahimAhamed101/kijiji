import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Report from '@/lib/models/Report'
import { getSession } from '@/lib/auth'
import { reportUpdateSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    const body = await req.json().catch(() => null)
    const parsed = reportUpdateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const report = await Report.findByIdAndUpdate(
      params.id,
      { status: parsed.data.status },
      { new: true }
    ).lean()
    if (!report) return jsonError('Report not found', 404)

    return Response.json(report)
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    await dbConnect()
    const deleted = await Report.findByIdAndDelete(params.id).lean()
    if (!deleted) return jsonError('Report not found', 404)

    return Response.json({ ok: true, id: params.id })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
