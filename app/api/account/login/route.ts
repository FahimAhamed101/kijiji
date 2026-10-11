import { NextResponse, type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Member from '@/lib/models/Member'
import User from '@/lib/models/User'
import {
  signMemberSession,
  verifyPassword,
  memberCookieOptions,
  MEMBER_COOKIE,
} from '@/lib/auth'
import { memberLoginSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = memberLoginSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()

    // `passwordHash` is `select: false`, so ask for it explicitly.
    const member = await Member.findOne({ email: parsed.data.email }).select('+passwordHash')

    // Same message for unknown email and wrong password — don't leak which.
    const invalid = () => jsonError('Invalid email or password', 401)

    if (!member) {
      /*
       * The storefront and the admin panel are two separate sign-ins, and using
       * the wrong one is an easy mistake to make — the credentials look right and
       * the error gives no hint. Point it out, but ONLY when the password is
       * genuinely correct for a staff account: that way this can't be used to
       * discover which email addresses have admin access.
       */
      const staff = await User.findOne({ email: parsed.data.email }).select('+passwordHash')
      if (staff && (await verifyPassword(parsed.data.password, staff.passwordHash))) {
        return jsonError('That is a staff account. Use the admin panel sign-in instead.', 403, {
          useAdminSignIn: true,
        })
      }
      return invalid()
    }

    if (!member.active) return jsonError('This account has been disabled', 403)

    const ok = await verifyPassword(parsed.data.password, member.passwordHash)
    if (!ok) return invalid()

    member.lastLoginAt = new Date()
    await member.save()

    const token = await signMemberSession({
      id: String(member._id),
      name: member.name,
      email: member.email,
    })

    const res = NextResponse.json({
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
    res.cookies.set(MEMBER_COOKIE, token, memberCookieOptions(req))
    return res
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
