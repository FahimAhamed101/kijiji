'use client'

import { useCallback } from 'react'
import { Heart } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  selectIsWishlisted,
  selectWishlistHydrated,
  toggleWishlist,
  toWishlistItem,
} from '@/store/wishlistSlice'
import type { Product } from '@/store/types'

/**
 * Save/unsave a listing.
 *
 * Accepts `undefined` because the listing page calls this before its product
 * query resolves — hooks can't be called conditionally, so the toggle simply
 * does nothing until there is something to save.
 *
 * `saved` is false until `localStorage` has been read, so the heart is never
 * painted as "saved" on the server and then contradicted on the client. The
 * button still works during that window — the toggle dispatches regardless.
 */
export function useWishlistToggle(product: Product | null | undefined) {
  const dispatch = useAppDispatch()
  const saved = useAppSelector(selectIsWishlisted(product?._id ?? ''))
  const hydrated = useAppSelector(selectWishlistHydrated)

  const toggle = useCallback(() => {
    if (!product) return
    dispatch(toggleWishlist(toWishlistItem(product)))
  }, [dispatch, product])

  return { saved, hydrated, toggle }
}

/** Filled heart once saved, outline before. */
function HeartGlyph({ saved, className }: { saved: boolean; className?: string }) {
  return (
    <Heart
      className={className}
      aria-hidden="true"
      fill={saved ? 'currentColor' : 'none'}
      strokeWidth={saved ? 0 : 2}
    />
  )
}

/**
 * Full-width secondary action for the listing page, sitting under the
 * Add to cart / Buy it now pair.
 */
export function WishlistToggleButton({
  product,
  className = 'buybox-favorite',
}: {
  product: Product
  className?: string
}) {
  const { saved, toggle } = useWishlistToggle(product)

  return (
    <button
      type="button"
      className={`${className} ${saved ? 'is-saved' : ''}`}
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.title} from favourites` : `Save ${product.title} to favourites`}
    >
      <HeartGlyph saved={saved} className="h-4 w-4" />
      {saved ? 'Saved to favourites' : 'Add to favourites'}
    </button>
  )
}

/**
 * Compact heart for grid cards.
 *
 * Like the card's add-to-cart button, this must sit *outside* the wrapping
 * `<a>`: a `<button>` nested in an anchor is invalid HTML and the click would
 * navigate instead of saving.
 */
export function WishlistIconButton({ product }: { product: Product }) {
  const { saved, toggle } = useWishlistToggle(product)

  return (
    <button
      type="button"
      className={`card-favorite-btn ${saved ? 'is-saved' : ''}`}
      onClick={toggle}
      aria-pressed={saved}
      aria-label={
        saved ? `Remove ${product.title} from favourites` : `Save ${product.title} to favourites`
      }
      title={saved ? 'Saved to favourites' : 'Add to favourites'}
    >
      <HeartGlyph saved={saved} className="h-4 w-4" />
    </button>
  )
}
