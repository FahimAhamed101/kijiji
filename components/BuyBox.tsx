'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Minus, Plus, ShieldCheck, Truck } from 'lucide-react'
import { AddToCartButton, isBuyable, useAddToCart } from '@/components/cart-actions'
import { WishlistToggleButton } from '@/components/wishlist-actions'
import { PaypalMark, StripeMark } from '@/components/BrandIcons'
import { priceLabel, type Product } from '@/store/types'

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  'like-new': 'Like new',
  used: 'Used',
  'for-parts': 'For parts',
}

/**
 * The purchase panel on a listing page.
 *
 * A marketplace where some listings are "price on request" or already sold
 * can't show a buy button unconditionally, so every affordance here is gated on
 * the same `isBuyable()` check the checkout API uses. When it isn't buyable the
 * panel explains why instead of showing a dead button.
 */
export default function BuyBox({ product }: { product: Product }) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const { add } = useAddToCart(product)

  const buyable = isBuyable(product)

  function buyNow() {
    // Adding first means the cart and the order agree even if the customer
    // backs out of checkout and returns later.
    add(quantity)
    router.push('/checkout')
  }

  return (
    <div className="buybox">
      <div className="buybox-price-row">
        <span className="buybox-price">{priceLabel(product)}</span>
        {buyable && (
          <span className="buybox-condition">
            {CONDITION_LABEL[product.condition] ?? product.condition}
          </span>
        )}
      </div>

      {buyable ? (
        <>
          <p className="buybox-stock">
            <span className="buybox-dot" aria-hidden="true" />
            In stock — ships from {product.location || 'Canada'}
          </p>

          <div className="buybox-qty-row">
            <span className="buybox-qty-label">Quantity</span>
            <div className="qty-stepper">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  setQuantity(Number.isFinite(n) ? Math.min(99, Math.max(1, Math.round(n))) : 1)
                }}
                aria-label="Quantity"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                disabled={quantity >= 99}
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <AddToCartButton product={product} quantity={quantity} />

          <button type="button" className="buybox-buy-now" onClick={buyNow}>
            Buy it now
          </button>

          <WishlistToggleButton product={product} />

          <ul className="buybox-perks">
            <li>
              <Truck className="h-4 w-4" aria-hidden="true" />
              Free shipping on orders over $150
            </li>
            <li>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Buyer protection on every order
            </li>
          </ul>

          <div className="buybox-payments">
            <span className="buybox-payments-label">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Secure checkout
            </span>
            <span className="buybox-payment-marks">
              <StripeMark className="h-6 w-6" />
              <PaypalMark className="h-6 w-6" />
            </span>
          </div>
        </>
      ) : (
        <div className="buybox-unavailable">
          {product.status === 'sold'
            ? 'This item has been sold.'
            : product.priceOnRequest
              ? 'This seller prices on request — send them a message to buy.'
              : 'This listing is not available to buy online right now.'}
          <p className="buybox-unavailable-hint">
            Use “Send message” below to reach the seller directly.
          </p>
          {/* Saving still makes sense for a listing you can't buy yet. */}
          <WishlistToggleButton product={product} />
        </div>
      )}
    </div>
  )
}
