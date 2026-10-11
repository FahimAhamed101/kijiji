import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Member from '@/lib/models/Member'
import { getMemberSession, hashPassword, verifyPassword } from '@/lib/auth'
import { memberProfileSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getMemberSession()
    if (!session) return jsonError('Not signed in', 401)

    const body = await req.json().catch(() => null)
    const parsed = memberProfileSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    const { name, phone, location, newPassword, currentPassword } = parsed.data

    await dbConnect()
    const member = await Member.findById(session.id).select('+passwordHash')
    if (!member) return jsonError('Account not found', 404)

    if (name !== undefined) member.name = name
    if (phone !== undefined) member.phone = phone
    if (location !== undefined) member.location = location

    if (newPassword) {
      // Rotating a password always requires proving the current one, so a
      // hijacked session can't be used to lock the real owner out.
      if (!currentPassword) {
        return jsonError('Enter your current password to set a new one', 422)
      }
      const ok = await verifyPassword(currentPassword, member.passwordHash)
      if (!ok) return jsonError('Your current password is incorrect', 403)
      member.passwordHash = await hashPassword(newPassword)
    }

    await member.save()

    return Response.json({
      member: {
        id: String(member._id),
        name: member.name,
        email: member.email,
        phone: member.phone,
        location: member.location,
        avatarColor: member.avatarColor,
        createdAt: member.createdAt,
      },
    })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
