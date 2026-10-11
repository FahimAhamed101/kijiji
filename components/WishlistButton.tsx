'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { selectWishlistCount, selectWishlistHydrated } from '@/store/wishlistSlice'

/**
 * Header wishlist entry point, sitting directly after the cart.
 *
 * Same hydration rule as `CartButton`: the badge waits for `hydrated`, because
 * the server has no `localStorage` and would render an empty wishlist — painting
 * the real count on the first client render would be a mismatch.
 */
export default function WishlistButton() {
  const count = useAppSelector(selectWishlistCount)
  const hydrated = useAppSelector(selectWishlistHydrated)
  const showBadge = hydrated && count > 0

  return (
    <Link
      href="/wishlist"
      className="header-wishlist-btn"
      aria-label={
        showBadge
          ? `Favourites, ${count} item${count === 1 ? '' : 's'}`
          : 'Favourites'
      }
    >
      <Heart aria-hidden="true" className="header-wishlist-icon" />
      <span className="header-wishlist-label">Favourites</span>
      {showBadge && (
        <span className="header-wishlist-badge">{count > 99 ? '99+' : count}</span>
      )}
    </Link>
  )
}
