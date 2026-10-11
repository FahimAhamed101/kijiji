/**
 * Money + totals maths for the storefront.
 *
 * Everything here runs **server-side** when an order is placed: the client only
 * ever sends product ids and quantities, and the server re-derives every figure
 * from the database. That is what stops a tampered request from buying a
 * $2,000 laptop for $1.
 */

export const CURRENCY = 'CAD'

/** Flat rate charged under the free-shipping threshold. */
export const SHIPPING_FLAT = 14.99
/** Orders at or above this subtotal ship free. */
export const FREE_SHIPPING_OVER = 150
/**
 * Placeholder sales tax. Real Canadian tax is per-province (GST/HST/PST and
 * Quebec's QST), so this single rate is deliberately simple — swap it for a
 * province lookup in `taxFor()` when you're ready to file returns.
 */
export const TAX_RATE = 0.05

export type TotalsInput = { price: number; quantity: number }[]

export type Totals = {
  subtotal: number
  shipping: number
  tax: number
  total: number
  currency: string
}

/** Round to cents, avoiding float dust like 0.30000000000000004. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function taxFor(subtotal: number): number {
  return round2(subtotal * TAX_RATE)
}

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0
  return subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT
}

/** Authoritative order maths. Never trust a total that came from the browser. */
export function computeTotals(items: TotalsInput): Totals {
  const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0))
  const shipping = shippingFor(subtotal)
  const tax = taxFor(subtotal)
  return {
    subtotal,
    shipping,
    tax,
    total: round2(subtotal + shipping + tax),
    currency: CURRENCY,
  }
}

/** "$1,234.56" */
export function formatMoney(amount: number, currency = CURRENCY): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Stripe wants integer minor units: $12.34 -> 1234. */
export function toMinorUnits(amount: number): number {
  return Math.round(round2(amount) * 100)
}

const ORDER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1

/**
 * Human-quotable order reference, e.g. `PP-7K4M2Q`. Uses an unambiguous
 * alphabet because customers read these out over the phone.
 */
export function generateOrderNumber(): string {
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += ORDER_ALPHABET[Math.floor(Math.random() * ORDER_ALPHABET.length)]
  }
  return `PP-${out}`
}
