import { NextResponse, type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Member from '@/lib/models/Member'
import User from '@/lib/models/User'
import {
  signMemberSession,
  hashPassword,
  memberCookieOptions,
  MEMBER_COOKIE,
} from '@/lib/auth'
import { memberSignupSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = memberSignupSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const { name, email, password, phone, location } = parsed.data

    // Check staff accounts too. A member and a staff member sharing an address
    // would be genuinely confusing, and it would let someone register an
    // address that looks like an admin's.
    const [memberTaken, staffTaken] = await Promise.all([
      Member.exists({ email }),
      User.exists({ email }),
    ])
    if (memberTaken || staffTaken) {
      return jsonError('An account with that email already exists', 409)
    }

    const member = await Member.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      phone,
      location,
      lastLoginAt: new Date(),
    })

    const token = await signMemberSession({
      id: String(member._id),
      name: member.name,
      email: member.email,
    })

    const res = NextResponse.json(
      {
        member: {
          id: String(member._id),
          name: member.name,
          email: member.email,
          phone: member.phone,
          location: member.location,
          avatarColor: member.avatarColor,
          createdAt: member.createdAt,
        },
      },
      { status: 201 }
    )
    res.cookies.set(MEMBER_COOKIE, token, memberCookieOptions(req))
    return res
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
