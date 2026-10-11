import { paymentsConfig } from '@/lib/payments'
import { CURRENCY, FREE_SHIPPING_OVER, SHIPPING_FLAT, TAX_RATE } from '@/lib/money'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public payment + pricing configuration for the storefront.
 *
 * Only ever exposes what the browser legitimately needs: which providers are
 * available and the shipping/tax rules, so the cart can show an estimated total
 * that matches what the server will actually charge. No keys, ever — Stripe and
 * PayPal both do their part on their own hosted page.
 */
export async function GET() {
  // Only reports providers whose credentials actually authenticate, so a bad
  // key degrades to demo mode instead of offering a payment option that fails.
  // `unavailable` distinguishes "never configured" from "configured but
  // rejected", which is otherwise impossible to tell apart from the outside.
  const { providers, anyLive, unavailable } = await paymentsConfig()
  return Response.json({
    providers,
    anyLive,
    unavailable,
    currency: CURRENCY,
    shippingFlat: SHIPPING_FLAT,
    freeShippingOver: FREE_SHIPPING_OVER,
    taxRate: TAX_RATE,
  })
}
