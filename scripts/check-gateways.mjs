#!/usr/bin/env node
/*
 * Gateway credential check — "are my payment keys actually working?"
 *
 *   node scripts/check-gateways.mjs      (or: npm run check:gateways)
 *
 * Why this exists: a key can *look* perfectly valid — right length, right
 * character set — and still be rejected by the provider (deleted app, rotated
 * secret, credentials copied from the wrong environment, or a value that isn't
 * from that provider at all). Checkout can only say "this gateway refused the
 * keys"; this script tells you *which* gateway, *which* value, and the
 * provider's own error message.
 *
 * It reads .env.local directly, probes the real APIs, and prints a verdict.
 * Exit code 1 if a configured credential was rejected, 0 otherwise.
 */
import { readFileSync, existsSync } from 'node:fs'

// ---------------------------------------------------------------- env loading
// Prefer Node's built-in loader; fall back to a tiny parser so this works on
// older runtimes too.
function loadEnv(file = '.env.local') {
  if (!existsSync(file)) return {}
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(file)
    } catch {
      /* fall through to the manual parser */
    }
  }
  const out = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[m[1]] = v
  }
  return out
}

const fileEnv = loadEnv()
/** Prefer the real process env (matches what the server sees), then the file. */
const env = (k) => (process.env[k] ?? fileEnv[k] ?? '').trim()

const mask = (v) => (v.length <= 12 ? v : `${v.slice(0, 8)}…${v.slice(-4)}`)
const set = (v) => (v ? 'set  ' : 'MISSING')

const line = (s = '') => console.log(s)
const rule = (t) => line(`\n${t}\n${'─'.repeat(t.length)}`)

/** Gateways that authenticated, and those that refused — for an accurate verdict. */
const ready = []
const rejected = []
/** Configured, but the check itself could not complete (network, missing half a pair). */
const broken = []

// ---------------------------------------------------------------------- Stripe
const STRIPE_RE = /^(sk|rk|pk)_(test|live)_/
async function checkStripe() {
  rule('Stripe')
  const key = env('STRIPE_SECRET_KEY')
  if (!key) {
    line('  STRIPE_SECRET_KEY   MISSING   (optional — card payments stay off)')
    return
  }
  line(`  STRIPE_SECRET_KEY   ${set(key)} ${mask(key)}  (${key.length} chars)`)

  if (!STRIPE_RE.test(key)) {
    line('  ! Stripe keys always start with sk_ / rk_ / pk_ followed by _test_ or _live_.')
    line('    This value is not shaped like a Stripe key — it is probably from another provider.')
  }

  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${key}` },
    })
    const body = await res.text()
    if (res.ok) {
      ready.push('Stripe')
      line('  -> /v1/balance HTTP 200 — credentials are VALID. Stripe will be offered.')
    } else {
      rejected.push('Stripe')
      line(`  -> /v1/balance HTTP ${res.status} — REJECTED by Stripe.`)
      line(`     ${body.replace(/\s+/g, ' ').slice(0, 240)}`)
      line('     Get a fresh secret key: https://dashboard.stripe.com/apikeys')
    }
  } catch (err) {
    broken.push('Stripe')
    line(`  -> network error: ${err.message}`)
  }
}

// ---------------------------------------------------------------------- PayPal
async function paypalToken(host, a, b) {
  const res = await fetch(`https://${host}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${a}:${b}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  return { status: res.status, body: (await res.text()).replace(/\s+/g, ' ').slice(0, 240) }
}

async function checkPaypal() {
  rule('PayPal')
  const id = env('PAYPAL_CLIENT_ID')
  const secret = env('PAYPAL_CLIENT_SECRET')
  const envName = (env('PAYPAL_ENV') || 'sandbox').toLowerCase()
  const host = envName === 'live' ? 'api-m.paypal.com' : 'api-m.sandbox.paypal.com'

  if (!id && !secret) {
    line('  PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET   MISSING   (optional)')
    return
  }
  line(`  PAYPAL_CLIENT_ID     ${set(id)} ${id ? `${mask(id)}  (${id.length} chars)` : ''}`)
  line(`  PAYPAL_CLIENT_SECRET ${set(secret)} ${secret ? `${mask(secret)}  (${secret.length} chars)` : ''}`)
  line(`  PAYPAL_ENV           ${envName}  -> ${host}`)

  if (!id || !secret) {
    broken.push('PayPal')
    line('  -> incomplete pair; both values are required.')
    return
  }

  // PayPal client IDs are 80 chars; a different length usually means a truncated
  // or mistyped paste.
  if (id.length !== 80) line(`  ! A PayPal client ID is normally 80 chars — this one is ${id.length}.`)

  try {
    const primary = await paypalToken(host, id, secret)
    if (primary.status === 200) {
      ready.push('PayPal')
      line(`  -> OAuth ${host} HTTP 200 — credentials are VALID. PayPal will be offered.`)
      return
    }

    rejected.push('PayPal')
    line(`  -> OAuth ${host} HTTP ${primary.status} — REJECTED by PayPal.`)
    line(`     ${primary.body}`)

    // Swap the fields: distinguishes "wrong pair" from "right pair, wrong order".
    const swapped = await paypalToken(host, secret, id)
    line(
      swapped.status === 200
        ? '     NOTE: the pair works with the fields swapped — client id and secret are in the wrong env vars.'
        : '     Swapping client id and secret does not help, so this is not a field-order problem.',
    )

    line('  -> Most likely: the app was deleted or its secret regenerated, the values came')
    line('     from a different app or environment, or they are not PayPal credentials at all.')
    line('     Fresh ones: https://developer.paypal.com/dashboard/applications')
  } catch (err) {
    broken.push('PayPal')
    line(`  -> network error: ${err.message}`)
  }
}

// ---------------------------------------------------------------------- main
line('\nGateway credential check')
line('========================')

await checkStripe()
await checkPaypal()

rule('Verdict')
if (ready.length > 0) {
  const them = ready.length === 1 ? 'it' : 'them'
  line(`  Ready: ${ready.join(', ')}. Checkout can take real payments through ${them}.`)
} else {
  line('  No gateway is usable, so checkout runs in DEMO mode — simulated orders, no money.')
}
if (rejected.length > 0) {
  line('')
  line(`  Refused: ${rejected.join(', ')}. A refused gateway is still LISTED on the checkout`)
  line('  page with a "Keys rejected" badge, so the problem stays visible — but it cannot be')
  line('  used and Place order is disabled while it is selected. Fix the value above and')
  line('  restart the server; a failure is cached for 60 s, so a corrected key appears')
  line('  within a minute.')
}
if (broken.length > 0) {
  line('')
  line(`  Could not check: ${broken.join(', ')} — the request to the gateway failed, or half`)
  line('  the credential pair is missing.')
}
if (ready.length === 0 && rejected.length === 0 && broken.length === 0) {
  line('  No gateway is configured. Add STRIPE_SECRET_KEY or PayPal credentials to .env.local.')
}
line()

process.exit(rejected.length > 0 || broken.length > 0 ? 1 : 0)
