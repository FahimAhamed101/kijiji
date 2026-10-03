/**
 * Site-wide contact details — single source of truth.
 *
 * The business asked for ONE address to cover everything: the public site
 * contact, support, and the payment-gateway account. It is therefore a single
 * constant rather than a set of per-purpose addresses, so nothing drifts apart
 * when the address changes. Read it from here — never inline the literal.
 *
 * Override at build time with `NEXT_PUBLIC_SITE_EMAIL` if it ever needs to
 * differ per environment (staging, preview deploys).
 */
export const SITE_EMAIL = process.env.NEXT_PUBLIC_SITE_EMAIL || 'poorprice@yahoo.com'

/** Display name used in metadata, mail `From:` headers, and receipt copy. */
export const SITE_NAME = 'Poorprice.com'

/** Public origin, used for absolute links (OG tags, emails). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://poorprice.com'

/**
 * The address the payment gateway is registered under. Deliberately the same
 * value as `SITE_EMAIL` — kept as a named export so payment code reads
 * intentionally rather than by coincidence if that ever changes.
 */
export const PAYMENT_GATEWAY_EMAIL = SITE_EMAIL

/** `mailto:` href for the site address, with the subject pre-filled. */
export function mailto(subject?: string): string {
  return subject
    ? `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SITE_EMAIL}`
}
