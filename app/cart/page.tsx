'use client'

import Link from 'next/link'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { PaypalMark, StripeMark } from '@/components/BrandIcons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  removeItem,
  selectCartHydrated,
  selectCartItems,
  setQuantity,
} from '@/store/cartSlice'
import { useGetPaymentsConfigQuery } from '@/store/ordersApi'
import { money } from '@/store/types'

/** Mirror of the server's maths so the estimate on screen matches the charge. */
function estimate(
  subtotal: number,
  cfg: { shippingFlat: number; freeShippingOver: number; taxRate: number }
) {
  const shipping = subtotal <= 0 ? 0 : subtotal >= cfg.freeShippingOver ? 0 : cfg.shippingFlat
  const tax = Math.round(subtotal * cfg.taxRate * 100) / 100
  return { subtotal, shipping, tax, total: Math.round((subtotal + shipping + tax) * 100) / 100 }
}

export default function CartPage() {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectCartItems)
  const hydrated = useAppSelector(selectCartHydrated)
  const { data: cfg } = useGetPaymentsConfigQuery()

  const rules = {
    shippingFlat: cfg?.shippingFlat ?? 14.99,
    freeShippingOver: cfg?.freeShippingOver ?? 150,
    taxRate: cfg?.taxRate ?? 0.05,
  }

  const subtotal = Math.round(items.reduce((n, i) => n + i.price * i.quantity, 0) * 100) / 100
  const totals = estimate(subtotal, rules)
  const awayFromFreeShipping = rules.freeShippingOver - subtotal

  return (
    <main className="site-shell">
      <SiteHeader />

      <div className="content-shell">
        <h1 className="cart-title">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          Your cart
          {hydrated && items.length > 0 && (
            <span className="cart-title-count">
              {items.length} item{items.length === 1 ? '' : 's'}
            </span>
          )}
        </h1>

        {/* The cart lives in localStorage, so nothing can be rendered until the
            client has read it. Showing a skeleton avoids a hydration mismatch
            (and a flash of "your cart is empty"). */}
        {!hydrated ? (
          <div className="cart-layout">
            <div className="cart-list">
              {[0, 1].map((i) => (
                <div className="cart-row cart-row-skeleton" key={i} aria-hidden="true" />
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag className="cart-empty-icon" aria-hidden="true" />
            <p className="cart-empty-title">Your cart is empty</p>
            <p className="cart-empty-sub">
              Browse the marketplace and add something you like — you don&apos;t need an account
              to start a cart.
            </p>
            <Link href="/browse" className="cart-empty-cta">
              Start browsing
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-list">
              {items.map((item) => (
                <div className="cart-row" key={item.product}>
                  <Link href={`/listing/${item.slug}`} className="cart-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.title} />
                  </Link>

                  <div className="cart-row-body">
                    <Link href={`/listing/${item.slug}`} className="cart-row-title">
                      {item.title}
                    </Link>
                    <p className="cart-row-meta">
                      {item.sellerName ? `${item.sellerName} · ` : ''}
                      {item.location || 'Canada'}
                    </p>
                    <p className="cart-row-unit">{money(item.price)} each</p>
                  </div>

                  <div className="cart-row-controls">
                    <div className="qty-stepper">
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            setQuantity({ product: item.product, quantity: item.quantity - 1 })
                          )
                        }
                        aria-label={`Decrease quantity of ${item.title}`}
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={item.quantity}
                        onChange={(e) =>
                          dispatch(
                            setQuantity({
                              product: item.product,
                              quantity: Number(e.target.value) || 0,
                            })
                          )
                        }
                        aria-label={`Quantity of ${item.title}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            setQuantity({ product: item.product, quantity: item.quantity + 1 })
                          )
                        }
                        aria-label={`Increase quantity of ${item.title}`}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <span className="cart-row-total">{money(item.price * item.quantity)}</span>

                    <button
                      type="button"
                      className="cart-row-remove"
                      onClick={() => dispatch(removeItem(item.product))}
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="cart-summary">
              <h2>Order summary</h2>

              {awayFromFreeShipping > 0 && (
                <p className="cart-shipping-nudge">
                  <Truck className="h-4 w-4" aria-hidden="true" />
                  Add {money(awayFromFreeShipping)} more for free shipping
                </p>
              )}

              <dl className="cart-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(totals.subtotal)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{totals.shipping === 0 ? 'Free' : money(totals.shipping)}</dd>
                </div>
                <div>
                  <dt>Estimated tax</dt>
                  <dd>{money(totals.tax)}</dd>
                </div>
                <div className="cart-totals-grand">
                  <dt>Total</dt>
                  <dd>{money(totals.total)}</dd>
                </div>
              </dl>

              <Link href="/checkout" className="cart-checkout-btn">
                Proceed to checkout
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <div className="cart-payment-marks">
                <span>Secure payment with</span>
                <StripeMark className="h-6 w-6" />
                <PaypalMark className="h-6 w-6" />
              </div>

              <Link href="/browse" className="cart-continue">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  )
}
