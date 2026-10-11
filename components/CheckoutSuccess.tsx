'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  Truck,
} from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { orderTokenKey } from '@/lib/order-token'
import { useAppDispatch } from '@/store/hooks'
import { clearCart } from '@/store/cartSlice'
import { useConfirmCheckoutMutation } from '@/store/ordersApi'
import { money, orderStatusLabel, paymentProviderLabel, type Order } from '@/store/types'

export default function CheckoutSuccess({
  orderId,
  stripeSessionId,
  paypalOrderId,
}: {
  orderId: string
  stripeSessionId: string
  paypalOrderId: string
}) {
  const dispatch = useAppDispatch()
  const [confirm] = useConfirmCheckoutMutation()

  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settling, setSettling] = useState(true)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (!orderId) {
      setError('This confirmation link is missing its order reference.')
      setSettling(false)
      return
    }

    // The guest's proof of ownership, parked by the checkout page before the
    // redirect to the gateway. Signed-in members don't need it.
    let accessToken = ''
    try {
      accessToken = window.sessionStorage.getItem(orderTokenKey(orderId)) ?? ''
    } catch {
      /* storage blocked — the member session still authorises the request */
    }

    confirm({
      orderId,
      accessToken: accessToken || undefined,
      session_id: stripeSessionId || undefined,
      paypalOrderId: paypalOrderId || undefined,
    })
      .unwrap()
      .then((res) => {
        setOrder(res.order)
        // Only now is it safe to empty the basket — if the gateway had refused,
        // the customer would still want their cart intact.
        dispatch(clearCart())
        // NB: the access token is deliberately *kept* in sessionStorage. It is
        // this guest's only proof that the order is theirs, so deleting it here
        // would 403 anyone who refreshes the page, hits Back, or reopens the
        // confirmation from their history. It is scoped to the tab and dies
        // with it, so leaving it in place costs nothing.
      })
      .catch((err) => {
        setError(
          (err as { data?: { error?: string } })?.data?.error ??
            'We could not confirm this payment.'
        )
      })
      .finally(() => setSettling(false))
  }, [orderId, stripeSessionId, paypalOrderId, confirm, dispatch])

  /* ---------------------------------------------------------------- */

  const shell = (children: React.ReactNode) => (
    <main className="site-shell">
      <SiteHeader />
      <div className="content-shell">{children}</div>
      <SiteFooter />
    </main>
  )

  if (settling) {
    return shell(
      <div className="checkout-loading">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Confirming your payment…
      </div>
    )
  }

  if (error || !order) {
    return shell(
      <div className="confirm-card">
        <div className="confirm-icon confirm-icon-warn">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1>We couldn&apos;t confirm this order</h1>
        <p className="confirm-sub">{error ?? 'The order could not be found.'}</p>
        <p className="confirm-hint">
          If you were charged, nothing is lost — quote your order reference to{' '}
          <a href="mailto:poorprice@yahoo.com">poorprice@yahoo.com</a> and we&apos;ll sort it out.
        </p>
        <div className="confirm-actions">
          <Link href="/cart" className="cart-checkout-btn confirm-btn-inline">
            Back to cart
          </Link>
          <Link href="/browse" className="confirm-secondary">
            Keep browsing
          </Link>
        </div>
      </div>
    )
  }

  const paid = order.payment.status === 'paid'

  return shell(
    <div className="confirm-card">
      <div className={`confirm-icon ${paid ? 'confirm-icon-ok' : 'confirm-icon-warn'}`}>
        {paid ? (
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        ) : (
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        )}
      </div>

      <h1>{paid ? 'Thank you — your order is confirmed' : 'Order received'}</h1>
      <p className="confirm-sub">
        Order <strong>{order.orderNumber}</strong> · {orderStatusLabel(order.status)}
      </p>

      {paid && order.shippingAddress.email && (
        <p className="confirm-hint">
          A confirmation was sent to <strong>{order.shippingAddress.email}</strong>.
        </p>
      )}

      <div className="confirm-body">
        <section className="confirm-block">
          <h2>
            <Package className="h-4 w-4" aria-hidden="true" />
            Items
          </h2>
          <ul className="confirm-items">
            {order.items.map((i) => (
              <li key={`${i.product}-${i.title}`}>
                {i.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image} alt="" aria-hidden="true" />
                )}
                <span className="confirm-item-text">
                  <span className="confirm-item-title">{i.title}</span>
                  <span className="confirm-item-qty">Qty {i.quantity}</span>
                </span>
                <span className="confirm-item-price">{money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="cart-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{order.shipping === 0 ? 'Free' : money(order.shipping)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{money(order.tax)}</dd>
            </div>
            <div className="cart-totals-grand">
              <dt>Total</dt>
              <dd>{money(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="confirm-block">
          <h2>
            <Truck className="h-4 w-4" aria-hidden="true" />
            Payment &amp; delivery
          </h2>
          <dl className="confirm-meta">
            <div>
              <dt>Paid with</dt>
              <dd>{paymentProviderLabel(order.payment.provider)}</dd>
            </div>
            <div>
              <dt>Payment status</dt>
              <dd className="confirm-capitalise">{order.payment.status}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd className="confirm-mono">{order.payment.reference || '—'}</dd>
            </div>
          </dl>

          <p className="confirm-address">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>
              {order.shippingAddress.name}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? (
                <>
                  <br />
                  {order.shippingAddress.line2}
                </>
              ) : null}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.province}{' '}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </span>
          </p>
        </section>
      </div>

      <div className="confirm-actions">
        <Link href="/account#orders" className="cart-checkout-btn confirm-btn-inline">
          View my orders
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link href="/browse" className="confirm-secondary">
          Continue shopping
        </Link>
      </div>

      <p className="confirm-hint confirm-hint-foot">
        Questions about this order? Email <a href="mailto:poorprice@yahoo.com">poorprice@yahoo.com</a>{' '}
        quoting <strong>{order.orderNumber}</strong>.
      </p>
    </div>
  )
}
