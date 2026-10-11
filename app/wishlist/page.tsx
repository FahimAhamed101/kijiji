'use client'

import Link from 'next/link'
import { ArrowRight, Check, Heart, ShoppingCart, Trash2, X } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { useAddLine } from '@/components/cart-actions'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  clearWishlist,
  removeWishlistItem,
  selectWishlistCount,
  selectWishlistHydrated,
  selectWishlistItems,
  type WishlistItem,
} from '@/store/wishlistSlice'
import { money, priceLabel } from '@/store/types'

/**
 * A saved listing can only be added to the cart if the snapshot still looks
 * buyable. The authoritative check happens server-side at checkout — this just
 * avoids offering a button that is certain to be rejected.
 */
function looksBuyable(item: WishlistItem): boolean {
  return item.status === 'active' && !item.priceOnRequest && item.price > 0
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const dispatch = useAppDispatch()
  const { addLine, added } = useAddLine()
  const buyable = looksBuyable(item)

  return (
    <article className="wishlist-card">
      <Link href={`/listing/${item.slug}`} className="wishlist-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.title} loading="lazy" />
      </Link>

      <button
        type="button"
        className="wishlist-remove"
        onClick={() => dispatch(removeWishlistItem(item.product))}
        aria-label={`Remove ${item.title} from favourites`}
        title="Remove from favourites"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="wishlist-card-body">
        <Link href={`/listing/${item.slug}`} className="wishlist-card-title">
          {item.title}
        </Link>
        <p className="wishlist-card-meta">{item.location || 'Canada'}</p>
        <strong className="wishlist-card-price">
          {priceLabel({ price: item.price, priceOnRequest: item.priceOnRequest })}
        </strong>

        {buyable ? (
          <button
            type="button"
            className={`wishlist-card-add ${added ? 'is-added' : ''}`}
            onClick={() =>
              addLine({
                product: item.product,
                slug: item.slug,
                title: item.title,
                price: item.price,
                image: item.image,
                sellerName: item.sellerName,
                location: item.location,
              })
            }
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
        ) : (
          <Link href={`/listing/${item.slug}`} className="wishlist-card-add is-muted">
            {item.status === 'sold' ? 'Sold — view listing' : 'View listing'}
          </Link>
        )}
      </div>
    </article>
  )
}

export default function WishlistPage() {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectWishlistItems)
  const hydrated = useAppSelector(selectWishlistHydrated)
  const count = useAppSelector(selectWishlistCount)

  return (
    <main className="site-shell">
      <SiteHeader />

      <div className="content-shell">
        <div className="wishlist-head">
          <h1 className="cart-title">
            <Heart className="h-5 w-5" aria-hidden="true" />
            Favourites
            {hydrated && count > 0 && (
              <span className="cart-title-count">
                {count} item{count === 1 ? '' : 's'}
              </span>
            )}
          </h1>

          {hydrated && count > 0 && (
            <button
              type="button"
              className="wishlist-clear"
              onClick={() => dispatch(clearWishlist())}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear all
            </button>
          )}
        </div>

        {/* Saved items live in localStorage, so nothing can be rendered until
            the client has read them. A skeleton avoids a hydration mismatch and
            a flash of the empty state. */}
        {!hydrated ? (
          <div className="wishlist-grid">
            {[0, 1, 2, 3].map((i) => (
              <div className="wishlist-card wishlist-card-skeleton" key={i} aria-hidden="true" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="cart-empty">
            <Heart className="cart-empty-icon" aria-hidden="true" />
            <p className="cart-empty-title">No favourites yet</p>
            <p className="cart-empty-sub">
              Tap the heart on any listing to save it here. Your favourites stay on this device
              — no account needed.
            </p>
            <Link href="/browse" className="cart-empty-cta">
              Start browsing
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <div className="wishlist-grid">
              {items.map((item) => (
                <WishlistCard key={item.product} item={item} />
              ))}
            </div>

            <p className="wishlist-foot-note">
              Prices shown are the ones saved with each listing — open a listing to see its
              current price. Your total is always recalculated at checkout.
            </p>
          </>
        )}
      </div>

      <SiteFooter />
    </main>
  )
}
