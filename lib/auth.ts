import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export { hashPassword, verifyPassword } from './password'

export const SESSION_COOKIE = 'kijiji_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours

export type SessionUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'moderator'
}

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to .env.local.')
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey())
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    return {
      id: String(payload.sub ?? payload.id ?? ''),
      name: String(payload.name ?? ''),
      email: String(payload.email ?? ''),
      role: (payload.role as SessionUser['role']) ?? 'editor',
    }
  } catch {
    return null
  }
}

/** Read the current admin session from the request cookies (server-side only). */
export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value
  return verifySession(token)
}

export function sessionCookieOptions(req?: { headers: { get(name: string): string | null } }) {
  // `Secure` cookies are rejected over plain HTTP, except on localhost which
  // browsers treat as a secure context. So only force Secure in production
  // when the request isn't coming from localhost.
  const host = req?.headers.get('host') ?? ''
  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production' && !isLocalhost,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}
