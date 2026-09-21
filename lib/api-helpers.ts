import type { NextRequest } from 'next/server'

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return Response.json({ error: message, ...extra }, { status })
}

export type Pagination = { page: number; limit: number; skip: number }

/** Parse `?page=&limit=` with sane clamping. */
export function getPagination(req: NextRequest, defaultLimit = 20): Pagination {
  const sp = req.nextUrl.searchParams
  const page = Math.max(1, Number(sp.get('page') ?? 1) || 1)
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit') ?? defaultLimit) || defaultLimit))
  return { page, limit, skip: (page - 1) * limit }
}

export function paginated<T>(items: T[], total: number, { page, limit }: Pagination) {
  return {
    items,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  }
}

/** Pull a readable message out of an unknown thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'ValidationError') return err.message
    if (err.name === 'CastError') return 'Invalid id format'
    if ('code' in err && (err as { code?: number }).code === 11000) {
      return 'A record with that unique value already exists'
    }
    return err.message
  }
  return 'Unexpected server error'
}

/** Normalise a client-supplied id list into a Mongo-safe string array. */
export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean)
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}
