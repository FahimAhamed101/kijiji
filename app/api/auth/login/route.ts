import { NextResponse, type NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'
import { signSession, verifyPassword, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth'
import { loginSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(formatZodError(parsed.error), 422)
    }

    await dbConnect()

    // `passwordHash` is `select: false`, so ask for it explicitly.
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select(
      '+passwordHash'
    )

    // Same message for unknown user and bad password - don't leak which.
    const invalid = () => jsonError('Invalid email or password', 401)

    if (!user) return invalid()
    if (!user.active) return jsonError('This account has been disabled', 403)

    const ok = await verifyPassword(parsed.data.password, user.passwordHash)
    if (!ok) return invalid()

    user.lastLoginAt = new Date()
    await user.save()

    const token = await signSession({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'editor' | 'moderator',
    })

    const cookieOpts = sessionCookieOptions(req)
    const res = NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
    res.cookies.set(SESSION_COOKIE, token, cookieOpts)
    return res
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

/** Minimal cookie serialiser (avoids depending on the `cookie` package). */
function serializeCookie(
  name: string,
  value: string,
  opts: { maxAge?: number; path?: string; httpOnly?: boolean; sameSite?: string; secure?: boolean }
) {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  if (opts.path) parts.push(`Path=${opts.path}`)
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`)
  if (opts.httpOnly) parts.push('HttpOnly')
  if (opts.secure) parts.push('Secure')
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`)
  return parts.join('; ')
}
