/**
 * Database seed runner.
 *
 *   npm run seed
 *
 * Creates the admin user, the category tree, sample listings and a little demo
 * inbox data. Safe to run repeatedly - everything is upserted on a unique key.
 *
 * It is written as a plain Node/tsx script (not a Next route) so it can be run
 * from a terminal or a deploy pipeline. The same logic is also exposed at
 * POST /api/seed for environments where you'd rather trigger it over HTTP.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/* ---- load .env.local (or .env) before importing anything that reads env ---- */
function loadEnvFile(file: string) {
  if (!existsSync(file)) return
  const raw = readFileSync(file, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

const root = process.cwd()
loadEnvFile(resolve(root, '.env.local'))
loadEnvFile(resolve(root, '.env'))

async function main() {
  const { runSeed } = await import('../lib/seed')
  const mongoose = (await import('mongoose')).default

  console.log('→ Seeding MongoDB database...')
  const result = await runSeed()

  console.log('')
  console.log('  ✓ admin user :', result.admin.email, result.admin.created ? '(created)' : '(already existed)')
  for (const extra of result.extraAdmins) {
    console.log('  ✓ admin user :', extra.email, extra.created ? '(created)' : '(already existed)')
  }
  console.log('  ✓ categories :', result.categories.total, 'total,', result.categories.inserted, 'new')
  console.log('  ✓ listings   :', result.products.total, 'total,', result.products.inserted, 'new')
  console.log('  ✓ messages   :', result.messages.inserted, 'new')
  console.log('  ✓ reports    :', result.reports.inserted, 'new')
  console.log('')
  console.log('  Sign in at /admin/login')

  // Every account this seed can sign you in with. Printed on purpose: this is a
  // local operator script, and the credentials are also listed (read-only) on
  // the login page itself.
  const logins: [string, string][] = [
    [result.admin.email, process.env.SEED_ADMIN_PASSWORD || 'admin123'],
    ['editor@kijiji.local', 'editor123'],
  ]
  if (process.env.SEED_ADMIN2_EMAIL && process.env.SEED_ADMIN2_PASSWORD) {
    logins.push([process.env.SEED_ADMIN2_EMAIL, process.env.SEED_ADMIN2_PASSWORD])
  }
  for (const [loginEmail, loginPassword] of logins) {
    console.log('   ', loginEmail.padEnd(28), loginPassword)
  }
  console.log('')

  await mongoose.disconnect()
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ Seed failed:', err?.message ?? err)
    process.exit(1)
  })
