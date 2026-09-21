import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Message from '@/lib/models/Message'
import { getSession } from '@/lib/auth'
import { messageUpdateSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    const body = await req.json().catch(() => null)
    const parsed = messageUpdateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const message = await Message.findByIdAndUpdate(
      params.id,
      { status: parsed.data.status },
      { new: true }
    ).lean()
    if (!message) return jsonError('Message not found', 404)

    return Response.json(message)
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    await dbConnect()
    const deleted = await Message.findByIdAndDelete(params.id).lean()
    if (!deleted) return jsonError('Message not found', 404)

    return Response.json({ ok: true, id: params.id })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
