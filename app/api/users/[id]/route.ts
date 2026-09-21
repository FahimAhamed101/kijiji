import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'
import { getSession, hashPassword } from '@/lib/auth'
import { userUpdateSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    // Users may edit their own profile; only admins may edit other accounts.
    const isSelf = session.id === params.id
    if (!isSelf && session.role !== 'admin') return jsonError('Admins only', 403)

    const body = await req.json().catch(() => null)
    const parsed = userUpdateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const user = await User.findById(params.id)
    if (!user) return jsonError('User not found', 404)

    const { password, ...rest } = parsed.data

    // Non-admins can't change their own role or re-activate themselves.
    if (!isSelf || session.role === 'admin') {
      if (rest.role !== undefined) user.role = rest.role
      if (rest.active !== undefined) user.active = rest.active
    }
    if (rest.name !== undefined) user.name = rest.name
    if (rest.email !== undefined) user.email = rest.email.toLowerCase()
    if (rest.avatarColor !== undefined) user.avatarColor = rest.avatarColor
    if (password) user.passwordHash = await hashPassword(password)

    await user.save()
    return Response.json(user.toJSON())
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)
    if (session.role !== 'admin') return jsonError('Admins only', 403)

    if (session.id === params.id) {
      return jsonError('You cannot delete your own account', 400)
    }

    await dbConnect()
    const user = await User.findById(params.id)
    if (!user) return jsonError('User not found', 404)

    // Never let the last admin disappear.
    if (user.role === 'admin') {
      const admins = await User.countDocuments({ role: 'admin', active: true })
      if (admins <= 1) {
        return jsonError('Cannot delete the last active admin', 400)
      }
    }

    await user.deleteOne()
    return Response.json({ ok: true, id: params.id })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
