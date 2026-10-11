'use client'

import { useEffect, useRef } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { hydrateCart, loadCart } from '@/store/cartSlice'
import { hydrateWishlist, loadWishlist } from '@/store/wishlistSlice'

/**
 * Loads the persisted cart and wishlist into Redux once, on mount.
 *
 * Deliberately a `useEffect` and not a slice initialiser: reading
 * `localStorage` during the first render would make the client's HTML disagree
 * with the server's, which React reports as a hydration mismatch. Rendering
 * `null` keeps this invisible.
 */
export default function StoreHydrator() {
  const dispatch = useAppDispatch()
  const done = useRef(false)

  useEffect(() => {
    // StrictMode runs effects twice in development; storage should only be read
    // once so a mid-session edit isn't clobbered by a second read.
    if (done.current) return
    done.current = true
    dispatch(hydrateCart(loadCart()))
    dispatch(hydrateWishlist(loadWishlist()))
  }, [dispatch])

  return null
}
