import { NextResponse } from 'next/server'
import { MEMBER_COOKIE } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  // Only clears the member session — a signed-in staff member stays signed in.
  res.cookies.delete(MEMBER_COOKIE)
  return res
}
