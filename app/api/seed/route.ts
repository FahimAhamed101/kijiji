import type { NextRequest } from 'next/server'
import { runSeed } from '@/lib/seed'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/seed
 *
 * Idempotent database bootstrap: creates the admin user, categories, sample
 * listings and a little demo inbox data. Guarded by SEED_SECRET so it can't be
 * triggered by random visitors. Pass the secret either as a query param
 * (`?secret=...`) or an `x-seed-secret` header.
 */
export async function POST(req: NextRequest) {
  try {
    const expected = process.env.SEED_SECRET
    if (!expected) {
      return jsonError('SEED_SECRET is not configured on the server', 500)
    }

    const provided =
      req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-seed-secret') ?? ''

    if (provided !== expected) {
      return jsonError('Invalid seed secret', 401)
    }

    const result = await runSeed()
    return Response.json({ ok: true, ...result })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function GET() {
  return Response.json({
    hint: 'POST to this endpoint with ?secret=<SEED_SECRET> to seed the database.',
  })
}
