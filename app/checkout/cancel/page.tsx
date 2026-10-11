import Link from 'next/link'
import { ArrowLeft, XCircle } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Where a gateway sends the customer when they back out.
 *
 * Nothing to verify here — no money moved — but the cart is deliberately left
 * intact so they can try again.
 */
export default function CheckoutCancelPage() {
  return (
    <main className="site-shell">
      <SiteHeader />
      <div className="content-shell">
        <div className="confirm-card">
          <div className="confirm-icon confirm-icon-warn">
            <XCircle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1>Checkout cancelled</h1>
          <p className="confirm-sub">
            No payment was taken and your cart is exactly as you left it.
          </p>

          <div className="confirm-actions">
            <Link href="/checkout" className="cart-checkout-btn confirm-btn-inline">
              Try checkout again
            </Link>
            <Link href="/cart" className="confirm-secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to cart
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
