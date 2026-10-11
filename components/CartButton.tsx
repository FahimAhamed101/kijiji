'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { selectCartCount, selectCartHydrated } from '@/store/cartSlice'

/**
 * Header cart entry point.
 *
 * The badge waits for `hydrated` before rendering. The server has no
 * localStorage, so it always renders an empty cart — painting the real count on
 * the first client render would be a hydration mismatch. `suppressHydrationWarning`
 * isn't the fix; not rendering until we actually know the count is.
 */
export default function CartButton() {
  const count = useAppSelector(selectCartCount)
  const hydrated = useAppSelector(selectCartHydrated)
  const showBadge = hydrated && count > 0

  return (
    <Link
      href="/cart"
      className="header-cart-btn"
      aria-label={showBadge ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'}
    >
      <ShoppingCart aria-hidden="true" className="header-cart-icon" />
      <span className="header-cart-label">Cart</span>
      {showBadge && <span className="header-cart-badge">{count > 99 ? '99+' : count}</span>}
    </Link>
  )
}
