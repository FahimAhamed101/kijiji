/**
 * Payment gateways: Stripe and PayPal.
 *
 * Both are implemented against their **REST APIs with `fetch`** rather than a
 * vendor SDK. That keeps the dependency tree empty, avoids the client bundle
 * ever seeing a secret, and means the exact HTTP the gateway receives is
 * visible in this file instead of buried in a wrapper.
 *
 * Both providers use the same shape: create a payment server-side, send the
 * browser to the gateway's own hosted page, then verify the result server-side
 * on return. Nothing about "was this paid?" is ever decided by the browser.
 *
 * ── Going live ───────────────────────────────────────────────────────────────
 * Add to `.env.local`:
 *   STRIPE_SECRET_KEY=sk_test_…            (or sk_live_…)
 *   PAYPAL_CLIENT_ID=…
 *   PAYPAL_CLIENT_SECRET=…
 *   PAYPAL_ENV=sandbox                     (or live)
 *
 * A configured gateway is **verified** before it is offered (see
 * `checkStripeCreds` / `checkPaypalCreds`). Credentials that don't authenticate
 * are never offered — but they are not hidden either: they are listed as
 * unavailable together with the reason and the env vars to fix (see
 * `UnavailableProvider`), so a bad key is visible rather than looking like "this
 * site has no card support". With no usable gateway, checkout runs in **demo
 * mode** — a simulated provider that exercises the whole flow without moving
 * money. See `paymentsConfig()`.
 */

import { CURRENCY, formatMoney, toMinorUnits } from './money'

export type ProviderId = 'stripe' | 'paypal' | 'demo'
export type ProviderMode = 'live' | 'sandbox' | 'demo'

export type ProviderInfo = {
  id: ProviderId
  label: string
  /** Ready to take a real payment right now. */
  enabled: boolean
  mode: ProviderMode
  /** Shown under the option in checkout so nobody mistakes demo for real. */
  note: string
}

/** Why a gateway is listed but cannot take money. */
export type UnavailableReason = 'not-configured' | 'rejected'

/**
 * A gateway that checkout still lists as an option, with the reason it can't be
 * used.
 *
 * These are deliberately **not** hidden. Hiding an unusable gateway produced a
 * checkout page with no card option and no explanation, which is
 * indistinguishable from "the site has no card support". Listing it and saying
 * what is wrong is what the operator asked for, and it is the more honest
 * behaviour: the shopper can see the method exists but is not working yet.
 *
 * Selecting one explains the problem and blocks placing the order, so a broken
 * gateway can still never sell a fake order.
 */
export type UnavailableProvider = {
  id: ProviderId
  label: string
  reason: UnavailableReason
  /** Convenience alias for `reason === 'rejected'`. */
  rejected: boolean
  /** Short state, safe to publish. */
  note: string
  /** The gateway's own message, redacted — see `redact()`. */
  detail?: string
  /** Env vars the operator has to set in `.env.local`. */
  envVars: string[]
}

/**
 * Provider errors can quote the credential back at you: Stripe's
 * `Invalid API Key provided: sk_test_51Ab…Zx9` carries the first and last few
 * characters of the secret. This payload is served to the browser, so anything
 * long enough to be a credential is masked before it leaves the server.
 */
function redact(message: string): string {
  return message
    .replace(/[A-Za-z0-9_-]{16,}/g, '•••')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}

export type CheckoutLine = { title: string; price: number; quantity: number }

export type CheckoutPayload = {
  orderId: string
  orderNumber: string
  items: CheckoutLine[]
  total: number
  currency?: string
}

/** Thrown for anything the customer should see as a checkout failure. */
export class PaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentError'
  }
}

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

function stripeKey(): string {
  return (process.env.STRIPE_SECRET_KEY ?? '').trim()
}

function paypalCreds(): { id: string; secret: string } {
  return {
    id: (process.env.PAYPAL_CLIENT_ID ?? '').trim(),
    secret: (process.env.PAYPAL_CLIENT_SECRET ?? '').trim(),
  }
}

export function paypalBase(): string {
  return (process.env.PAYPAL_ENV ?? 'sandbox').toLowerCase() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

/* ------------------------------------------------------------------ */
/* Credential health                                                   */
/* ------------------------------------------------------------------ */

/**
 * A provider is only advertised when its credentials actually authenticate.
 *
 * Presence of an env var is not the same as being able to take money: a typo'd
 * or revoked key would otherwise be advertised in checkout, suppress demo mode
 * (because the site would look "live"), and fail every order with a gateway
 * error. Verifying first means a broken key degrades to demo instead of
 * breaking the store.
 *
 * Cached because both the checkout page and `POST /api/checkout` read this.
 * Successes are held for 10 minutes; failures only 60 seconds so a corrected
 * key is picked up quickly.
 */
type CredCheck = { ok: boolean; error?: string }

const CHECK_OK_TTL = 10 * 60_000
const CHECK_FAIL_TTL = 60_000

let stripeCheck: (CredCheck & { key: string; expiresAt: number }) | null = null
let paypalCheck: (CredCheck & { key: string; expiresAt: number }) | null = null

/** Surfaced once per distinct failure so a misconfigured key is visible in logs. */
const warned = new Set<string>()
function warnOnce(id: string, message: string) {
  const fingerprint = `${id}:${message}`
  if (warned.has(fingerprint)) return
  warned.add(fingerprint)
  console.warn(`[payments] ${id} credentials rejected — provider hidden: ${message}`)
}

async function checkStripeCreds(): Promise<CredCheck> {
  const key = stripeKey()
  if (!key) return { ok: false, error: 'not configured' }
  if (stripeCheck && stripeCheck.key === key && stripeCheck.expiresAt > Date.now()) {
    return { ok: stripeCheck.ok, error: stripeCheck.error }
  }

  let result: CredCheck
  try {
    // Cheapest authenticated call Stripe offers.
    await stripeRequest<unknown>('balance', { method: 'GET' })
    result = { ok: true }
  } catch (err) {
    result = { ok: false, error: err instanceof Error ? err.message : 'Stripe auth failed' }
    warnOnce('stripe', result.error ?? 'unknown')
  }

  stripeCheck = {
    key,
    ...result,
    expiresAt: Date.now() + (result.ok ? CHECK_OK_TTL : CHECK_FAIL_TTL),
  }
  return result
}

async function checkPaypalCreds(): Promise<CredCheck> {
  const { id, secret } = paypalCreds()
  if (!id || !secret) return { ok: false, error: 'not configured' }
  const key = `${paypalBase()}|${id}|${secret}`
  if (paypalCheck && paypalCheck.key === key && paypalCheck.expiresAt > Date.now()) {
    return { ok: paypalCheck.ok, error: paypalCheck.error }
  }

  let result: CredCheck
  try {
    // Reuses the same OAuth call the real flow makes, so a pass here also warms
    // the token cache.
    await paypalToken()
    result = { ok: true }
  } catch (err) {
    result = { ok: false, error: err instanceof Error ? err.message : 'PayPal auth failed' }
    warnOnce('paypal', result.error ?? 'unknown')
  }

  paypalCheck = {
    key,
    ...result,
    expiresAt: Date.now() + (result.ok ? CHECK_OK_TTL : CHECK_FAIL_TTL),
  }
  return result
}

/** Test seam / manual re-check after rotating a key. */
export function resetCredentialChecks(): void {
  stripeCheck = null
  paypalCheck = null
  cachedToken = null
  warned.clear()
}

/**
 * `auto` (default) shows the demo option only when no real gateway is usable,
 * so a live site can never accidentally sell a fake order. `on` forces it on for
 * staging. `off` disables it outright.
 */
function demoEnabled(stripeOn: boolean, paypalOn: boolean): boolean {
  const flag = (process.env.PAYMENTS_DEMO ?? 'auto').toLowerCase()
  if (flag === 'off') return false
  if (flag === 'on') return true
  return !stripeOn && !paypalOn
}

export async function paymentsConfig(): Promise<{
  providers: ProviderInfo[]
  anyLive: boolean
  unavailable: UnavailableProvider[]
}> {
  const sk = stripeKey()
  const pp = paypalCreds()

  const [stripeResult, paypalResult] = await Promise.all([
    sk ? checkStripeCreds() : Promise.resolve(null),
    pp.id && pp.secret ? checkPaypalCreds() : Promise.resolve(null),
  ])

  const stripeOn = Boolean(stripeResult?.ok)
  const paypalOn = Boolean(paypalResult?.ok)

  const providers: ProviderInfo[] = []

  if (stripeOn) {
    providers.push({
      id: 'stripe',
      label: 'Card (Stripe)',
      enabled: true,
      mode: sk.startsWith('sk_live_') ? 'live' : 'sandbox',
      note: sk.startsWith('sk_live_')
        ? 'Visa, Mastercard, Amex — secured by Stripe'
        : 'Stripe test mode — use card 4242 4242 4242 4242',
    })
  }

  if (paypalOn) {
    providers.push({
      id: 'paypal',
      label: 'PayPal',
      enabled: true,
      mode: paypalBase().includes('sandbox') ? 'sandbox' : 'live',
      note: paypalBase().includes('sandbox')
        ? 'PayPal sandbox — sign in with a sandbox buyer account'
        : 'Pay with your PayPal balance or linked cards',
    })
  }

  if (demoEnabled(stripeOn, paypalOn)) {
    providers.push({
      id: 'demo',
      label: 'Demo payment',
      enabled: true,
      mode: 'demo',
      note: demoNote(stripeResult, paypalResult),
    })
  }

  /*
   * Every gateway that isn't usable, described well enough for checkout to list
   * it and explain itself. "You never added keys" and "your keys don't work"
   * need different fixes, so they must never look alike.
   */
  const unavailable: UnavailableProvider[] = []

  if (!stripeOn) {
    const configured = Boolean(sk)
    unavailable.push({
      id: 'stripe',
      label: 'Card (Stripe)',
      reason: configured ? 'rejected' : 'not-configured',
      rejected: configured,
      note: configured
        ? 'Stripe refused the key on this server'
        : 'No Stripe key on this server',
      detail: configured ? redact(stripeResult?.error ?? 'authentication failed') : undefined,
      envVars: ['STRIPE_SECRET_KEY'],
    })
  }

  if (!paypalOn) {
    const configured = Boolean(pp.id && pp.secret)
    unavailable.push({
      id: 'paypal',
      label: 'PayPal',
      reason: configured ? 'rejected' : 'not-configured',
      rejected: configured,
      note: configured
        ? 'PayPal refused the credentials on this server'
        : 'No PayPal keys on this server',
      detail: configured ? redact(paypalResult?.error ?? 'authentication failed') : undefined,
      envVars: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
    })
  }

  return { providers, anyLive: stripeOn || paypalOn, unavailable }
}

/**
 * The demo provider's one-liner has to reflect reality: saying "no keys
 * configured" while a rejected key sits in `.env.local` sends people looking in
 * exactly the wrong place.
 */
function demoNote(
  stripeResult: CredCheck | null,
  paypalResult: CredCheck | null
): string {
  const rejected = [stripeResult, paypalResult].filter((r) => r && !r.ok).length
  if (rejected > 0) {
    return 'Simulated — your gateway credentials were rejected, no money moves'
  }
  return 'Simulated — no gateway keys configured, no money moves'
}

/**
 * Whether a provider may actually be charged.
 *
 * `demo` is deliberately **not** special-cased here. It used to return `true`
 * unconditionally, which meant a live site would still settle a simulated
 * "paid" order for anyone who posted `provider: "demo"`: the checkout UI hid the
 * option, but the API honoured it. That made the `auto` promise — "a live site
 * can never accidentally sell a fake order" — true only in the browser.
 * `paymentsConfig()` already includes demo in `providers` exactly when
 * `demoEnabled()` allows it, so asking it is both correct and simpler.
 */
export async function providerEnabled(id: ProviderId): Promise<boolean> {
  const { providers } = await paymentsConfig()
  return providers.some((p) => p.id === id && p.enabled)
}

/* ------------------------------------------------------------------ */
/* Stripe — Checkout Sessions                                          */
/* ------------------------------------------------------------------ */

/**
 * Stripe's REST API takes `application/x-www-form-urlencoded` with bracketed
 * nesting, so `{ line_items: [{ quantity: 1 }] }` has to become
 * `line_items[0][quantity]=1`.
 */
function toForm(value: unknown, prefix = '', out: string[] = []): string[] {
  if (value === undefined || value === null) return out
  if (Array.isArray(value)) {
    value.forEach((v, i) => toForm(v, `${prefix}[${i}]`, out))
    return out
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      toForm(v, prefix ? `${prefix}[${k}]` : k, out)
    }
    return out
  }
  out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`)
  return out
}

async function stripeRequest<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  const body = (await res.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null
  if (!res.ok) {
    throw new PaymentError(
      body?.error?.message ?? `Stripe rejected the request (HTTP ${res.status})`
    )
  }
  if (!body) throw new PaymentError('Stripe returned an empty response')
  return body
}

export async function createStripeCheckout(
  payload: CheckoutPayload,
  origin: string
): Promise<{ url: string; reference: string }> {
  const currency = (payload.currency ?? CURRENCY).toLowerCase()

  const form = toForm({
    mode: 'payment',
    // The gateway sends the customer back here. `{CHECKOUT_SESSION_ID}` is
    // substituted by Stripe; we verify the session server-side on arrival
    // rather than trusting anything in the query string.
    success_url: `${origin}/checkout/success?order=${payload.orderId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel?order=${payload.orderId}`,
    client_reference_id: payload.orderNumber,
    metadata: { order_id: payload.orderId, order_number: payload.orderNumber },
    line_items: payload.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency,
        unit_amount: toMinorUnits(i.price),
        product_data: { name: i.title },
      },
    })),
  }).join('&')

  const session = await stripeRequest<{ id: string; url?: string }>('checkout/sessions', {
    method: 'POST',
    body: form,
  })

  if (!session.url) throw new PaymentError('Stripe did not return a checkout URL')
  return { url: session.url, reference: session.id }
}

export type StripeSession = {
  id: string
  payment_status: string
  amount_total: number | null
  currency: string | null
  metadata: { order_id?: string; order_number?: string } | null
}

export async function retrieveStripeSession(sessionId: string): Promise<StripeSession> {
  return stripeRequest<StripeSession>(`checkout/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'GET',
  })
}

/* ------------------------------------------------------------------ */
/* PayPal — Orders v2                                                  */
/* ------------------------------------------------------------------ */

/** Keyed on the credentials so rotating a key can't reuse a stale token. */
let cachedToken: { key: string; value: string; expiresAt: number } | null = null

async function paypalToken(): Promise<string> {
  const { id, secret } = paypalCreds()
  const key = `${paypalBase()}|${id}|${secret}`

  // PayPal tokens last ~9h; reuse until shortly before expiry so a burst of
  // checkouts doesn't mint a token per request.
  if (cachedToken && cachedToken.key === key && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value
  }

  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  const body = (await res.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error_description?: string }
    | null
  if (!res.ok || !body?.access_token) {
    throw new PaymentError(
      body?.error_description ?? `PayPal authentication failed (HTTP ${res.status})`
    )
  }
  cachedToken = {
    key,
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3000) * 1000,
  }
  return cachedToken.value
}

async function paypalRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = await paypalToken()
  const res = await fetch(`${paypalBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  const body = (await res.json().catch(() => null)) as
    | (T & { message?: string; details?: { description?: string }[] })
    | null
  if (!res.ok) {
    const detail = body?.details?.[0]?.description
    throw new PaymentError(detail ?? body?.message ?? `PayPal error (HTTP ${res.status})`)
  }
  if (!body) throw new PaymentError('PayPal returned an empty response')
  return body
}

type PaypalOrder = {
  id: string
  status: string
  links?: { rel: string; href: string }[]
}

/** PayPal wants a plain decimal string: 1234 -> "12.34". */
function paypalAmount(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2)
}

export async function createPaypalOrder(
  payload: CheckoutPayload,
  origin: string
): Promise<{ url: string; reference: string }> {
  const currency = (payload.currency ?? CURRENCY).toUpperCase()

  const order = await paypalRequest<PaypalOrder>('/v2/checkout/orders', {
    method: 'POST',
    // Idempotency: retrying the same order can't create two PayPal orders.
    headers: { 'PayPal-Request-Id': payload.orderId },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: payload.orderNumber,
          custom_id: payload.orderId,
          description: `Poorprice.com order ${payload.orderNumber}`,
          amount: {
            currency_code: currency,
            value: paypalAmount(payload.total),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: paypalAmount(payload.total),
              },
            },
          },
          items: payload.items.map((i) => ({
            name: i.title.slice(0, 127),
            quantity: String(i.quantity),
            unit_amount: { currency_code: currency, value: paypalAmount(i.price) },
          })),
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'Poorprice.com',
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
            return_url: `${origin}/checkout/success?order=${payload.orderId}`,
            cancel_url: `${origin}/checkout/cancel?order=${payload.orderId}`,
          },
        },
      },
    }),
  })

  // Newer API versions name this link `payer-action`; older ones `approve`.
  const approve = order.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve')
  if (!approve) throw new PaymentError('PayPal did not return an approval link')
  return { url: approve.href, reference: order.id }
}

export type PaypalCapture = {
  id: string
  status: string
  purchase_units?: {
    payments?: {
      captures?: { id: string; status: string; amount?: { value?: string } }[]
    }
  }[]
}

export async function capturePaypalOrder(paypalOrderId: string): Promise<PaypalCapture> {
  return paypalRequest<PaypalCapture>(
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: 'POST',
      headers: { 'PayPal-Request-Id': `capture-${paypalOrderId}` },
      body: '{}',
    }
  )
}

export async function getPaypalOrder(paypalOrderId: string): Promise<PaypalCapture> {
  return paypalRequest<PaypalCapture>(
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
    { method: 'GET' }
  )
}

/* ------------------------------------------------------------------ */

/** One-line summary used in logs and the admin order view. */
export function describePayment(
  provider: ProviderId,
  amount: number,
  currency = CURRENCY
): string {
  return `${provider} · ${formatMoney(amount, currency)}`
}
