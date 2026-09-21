import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'
import { getSession, hashPassword } from '@/lib/auth'
import { userCreateSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)
    if (session.role !== 'admin') return jsonError('Admins only', 403)

    await dbConnect()
    const q = req.nextUrl.searchParams.get('q')?.trim()
    const filter: Record<string, unknown> = {}
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ name: rx }, { email: rx }]
    }

    const users = await User.find(filter).sort({ createdAt: 1 }).lean()
    return Response.json({
      items: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active,
        avatarColor: u.avatarColor,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
    })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)
    if (session.role !== 'admin') return jsonError('Admins only', 403)

    const body = await req.json().catch(() => null)
    const parsed = userCreateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const email = parsed.data.email.toLowerCase()

    if (await User.exists({ email })) {
      return jsonError('A user with that email already exists', 409)
    }

    const user = await User.create({
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
      active: parsed.data.active,
    })

    return Response.json(user.toJSON(), { status: 201 })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
