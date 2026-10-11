import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export { hashPassword, verifyPassword } from './password'

/**
 * Two independent session realms, each with its own cookie:
 *
 *  - `SESSION_COOKIE`      staff signing in to /admin (role-gated)
 *  - `MEMBER_COOKIE`       public members shopping on the storefront
 *
 * Separate cookies rather than one with a role claim, because the two have
 * genuinely different trust levels and lifetimes. A staff session is short
 * (8h, shared machines); a member session is long (30d, personal device).
 * Keeping them apart means signing out of one never disturbs the other, and a
 * member cookie can never be replayed against an admin route.
 */

export const SESSION_COOKIE = 'kijiji_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours

export const MEMBER_COOKIE = 'kijiji_session'
const MEMBER_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export type SessionUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'moderator'
}

export type MemberSession = {
  id: string
  name: string
  email: string
}

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to .env.local.')
  }
  return new TextEncoder().encode(secret)
}

async function sign(payload: Record<string, unknown>, maxAge: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(payload.id))
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secretKey())
}

async function verify(token: string | undefined): Promise<Record<string, unknown> | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Staff sessions                                                      */
/* ------------------------------------------------------------------ */

export async function signSession(user: SessionUser): Promise<string> {
  return sign({ ...user }, SESSION_MAX_AGE)
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  const payload = await verify(token)
  if (!payload) return null
  return {
    id: String(payload.sub ?? payload.id ?? ''),
    name: String(payload.name ?? ''),
    email: String(payload.email ?? ''),
    role: (payload.role as SessionUser['role']) ?? 'editor',
  }
}

/** Read the current admin session from the request cookies (server-side only). */
export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value
  return verifySession(token)
}

/* ------------------------------------------------------------------ */
/* Member sessions                                                     */
/* ------------------------------------------------------------------ */

export async function signMemberSession(member: MemberSession): Promise<string> {
  return sign({ ...member }, MEMBER_MAX_AGE)
}

export async function verifyMemberSession(
  token: string | undefined
): Promise<MemberSession | null> {
  const payload = await verify(token)
  if (!payload) return null
  return {
    id: String(payload.sub ?? payload.id ?? ''),
    name: String(payload.name ?? ''),
    email: String(payload.email ?? ''),
  }
}

/** Read the current member session from the request cookies (server-side only). */
export async function getMemberSession(): Promise<MemberSession | null> {
  const token = cookies().get(MEMBER_COOKIE)?.value
  return verifyMemberSession(token)
}

/* ------------------------------------------------------------------ */
/* Cookie options                                                      */
/* ------------------------------------------------------------------ */

function cookieOptions(
  maxAge: number,
  req?: { headers: { get(name: string): string | null } }
) {
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
    maxAge,
  }
}

export function sessionCookieOptions(req?: { headers: { get(name: string): string | null } }) {
  return cookieOptions(SESSION_MAX_AGE, req)
}

export function memberCookieOptions(req?: { headers: { get(name: string): string | null } }) {
  return cookieOptions(MEMBER_MAX_AGE, req)
}
