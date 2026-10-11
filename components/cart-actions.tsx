'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { useAppDispatch } from '@/store/hooks'
import { addItem, type CartItem } from '@/store/cartSlice'
import { primaryImage, type Product } from '@/store/types'

/**
 * A listing can only be bought online when it is live, priced, and not marked
 * "price on request" — the same three conditions `POST /api/checkout` enforces.
 * Keeping them in one place means the button and the server can't disagree.
 */
export function isBuyable(product: Product): boolean {
  return product.status === 'active' && !product.priceOnRequest && product.price > 0
}

/**
 * Add an already-built cart line, with a short "Added" confirmation.
 *
 * Split out from `useAddToCart` because the wishlist stores a lightweight
 * snapshot rather than a full `Product`, and both paths should behave
 * identically.
 */
export function useAddLine() {
  const dispatch = useAppDispatch()
  const [added, setAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const addLine = useCallback(
    (line: Omit<CartItem, 'quantity'>, quantity = 1) => {
      dispatch(addItem({ ...line, quantity }))
      setAdded(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setAdded(false), 2200)
    },
    [dispatch]
  )

  return { addLine, added }
}

/** Snapshot a listing into the cart, with a short "Added" confirmation. */
export function useAddToCart(product: Product) {
  const { addLine, added } = useAddLine()

  const add = useCallback(
    (quantity = 1) => {
      addLine(
        {
          product: product._id,
          slug: product.slug,
          title: product.title,
          price: product.price,
          image: primaryImage(product),
          sellerName: product.seller?.name ?? '',
          location: product.location,
        },
        quantity
      )
    },
    [addLine, product]
  )

  return { add, added }
}

/** Full-width button for the listing page. */
export function AddToCartButton({
  product,
  quantity = 1,
  className = 'buybox-add',
}: {
  product: Product
  quantity?: number
  className?: string
}) {
  const { add, added } = useAddToCart(product)

  return (
    <button
      type="button"
      className={`${className} ${added ? 'is-added' : ''}`}
      onClick={() => add(quantity)}
      aria-live="polite"
    >
      {added ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          Added to cart
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          Add to cart
        </>
      )}
    </button>
  )
}

/**
 * Compact icon button for grid cards.
 *
 * Sits in the card footer *outside* the wrapping `<a>` — a `<button>` nested in
 * an anchor is invalid HTML and the click would navigate instead of adding.
 */
export function AddToCartIconButton({ product }: { product: Product }) {
  const { add, added } = useAddToCart(product)

  if (!isBuyable(product)) return null

  return (
    <button
      type="button"
      className={`card-cart-btn ${added ? 'is-added' : ''}`}
      onClick={() => add(1)}
      aria-label={added ? `${product.title} added to cart` : `Add ${product.title} to cart`}
      title={added ? 'Added to cart' : 'Add to cart'}
    >
      {added ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  )
}
