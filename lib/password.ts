import bcrypt from 'bcryptjs'

/**
 * Password hashing helpers.
 *
 * Kept separate from lib/auth.ts so CLI scripts (e.g. the seed runner) can use
 * them without pulling in `next/headers`.
 */

const ROUNDS = 10

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false
  return bcrypt.compare(plain, hash)
}
