'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { CardMark, PaypalMark, StripeMark } from '@/components/BrandIcons'
import { PROVINCES } from '@/components/LocationPicker'
import { useAppSelector } from '@/store/hooks'
import { selectCartHydrated, selectCartItems } from '@/store/cartSlice'
import { useGetMemberQuery } from '@/store/accountApi'
import { useCreateCheckoutMutation, useGetPaymentsConfigQuery } from '@/store/ordersApi'
import { orderTokenKey } from '@/lib/order-token'
import { money, type CheckoutPayOption, type PaymentProvider } from '@/store/types'

type AddressForm = {
  name: string
  email: string
  phone: string
  line1: string
  line2: string
  city: string
  province: string
  postalCode: string
}

const EMPTY_ADDRESS: AddressForm = {
  name: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  province: '',
  postalCode: '',
}

function ProviderMark({ id }: { id: PaymentProvider }) {
  if (id === 'stripe') return <StripeMark className="h-7 w-7" />
  if (id === 'paypal') return <PaypalMark className="h-7 w-7" />
  return <CardMark className="h-7 w-7" />
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useAppSelector(selectCartItems)
  const hydrated = useAppSelector(selectCartHydrated)

  const { data: cfg, isLoading: cfgLoading } = useGetPaymentsConfigQuery()
  const { data: memberData } = useGetMemberQuery()
  const [createCheckout, { isLoading: placing }] = useCreateCheckoutMutation()

  const member = memberData?.member ?? null

  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS)
  const [provider, setProvider] = useState<PaymentProvider | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [prefilled, setPrefilled] = useState(false)

  const providers = cfg?.providers ?? []
  const unavailable = cfg?.unavailable ?? []

  /*
   * One list, in a fixed order: Card (Stripe), PayPal, then Demo.
   *
   * A gateway that can't take money is still listed and still selectable. The
   * operator asked to be able to pick Stripe or PayPal directly and see what is
   * wrong with it — hiding it produced a checkout page that silently had no card
   * option and no explanation why.
   */
  const options = useMemo<CheckoutPayOption[]>(() => {
    const usable = new Map(providers.map((p) => [p.id, p]))
    const broken = new Map(unavailable.map((u) => [u.id, u]))
    const out: CheckoutPayOption[] = []

    for (const id of ['stripe', 'paypal'] as const) {
      const live = usable.get(id)
      if (live) {
        out.push({ id: live.id, label: live.label, note: live.note, mode: live.mode, problem: null })
        continue
      }
      const bad = broken.get(id)
      if (bad) {
        out.push({
          id: bad.id,
          label: bad.label,
          note: bad.note,
          mode: 'sandbox',
          problem: {
            reason: bad.reason,
            rejected: bad.rejected,
            detail: bad.detail,
            envVars: bad.envVars,
          },
        })
      }
    }

    const demo = usable.get('demo')
    if (demo) {
      out.push({ id: demo.id, label: demo.label, note: demo.note, mode: demo.mode, problem: null })
    }

    return out
  }, [providers, unavailable])

  const selected = options.find((o) => o.id === provider) ?? null
  // Placing an order through a method that cannot take money must be impossible.
  const blocked = provider !== null && (!selected || Boolean(selected.problem))

  // Preselect the first method that can actually be used — never a broken one.
  useEffect(() => {
    if (provider) return
    const first = options.find((o) => !o.problem)
    if (first) setProvider(first.id)
  }, [options, provider])

  // Prefill from the member record once, and only into fields the customer
  // hasn't already typed into — never clobber their edits.
  useEffect(() => {
    if (!member || prefilled) return
    setPrefilled(true)
    setAddress((prev) => ({
      ...prev,
      name: prev.name || member.name,
      email: prev.email || member.email,
      phone: prev.phone || member.phone,
      province: prev.province || member.location,
    }))
  }, [member, prefilled])

  const rules = {
    shippingFlat: cfg?.shippingFlat ?? 14.99,
    freeShippingOver: cfg?.freeShippingOver ?? 150,
    taxRate: cfg?.taxRate ?? 0.05,
  }

  const totals = useMemo(() => {
    const subtotal = Math.round(items.reduce((n, i) => n + i.price * i.quantity, 0) * 100) / 100
    const shipping =
      subtotal <= 0 ? 0 : subtotal >= rules.freeShippingOver ? 0 : rules.shippingFlat
    const tax = Math.round(subtotal * rules.taxRate * 100) / 100
    return { subtotal, shipping, tax, total: Math.round((subtotal + shipping + tax) * 100) / 100 }
  }, [items, rules.freeShippingOver, rules.shippingFlat, rules.taxRate])

  function patch(next: Partial<AddressForm>) {
    setAddress((prev) => ({ ...prev, ...next }))
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault()
    if (placing) return
    setError(null)

    if (!provider) {
      setError('Choose a payment method.')
      return
    }
    if (selected?.problem) {
      // The submit button is disabled in this state, but Enter inside a text
      // field still submits the form, so the guard has to live here too.
      setError(`${selected.label} cannot take a payment — ${selected.note}.`)
      return
    }
    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }

    try {
      const res = await createCheckout({
        // Only ids and quantities — the server prices the order itself.
        items: items.map((i) => ({ product: i.product, quantity: i.quantity })),
        provider,
        shippingAddress: { ...address, country: 'Canada' },
        note,
      }).unwrap()

      // Park the single-use token so the confirmation page can prove ownership.
      try {
        window.sessionStorage.setItem(orderTokenKey(res.orderId), res.accessToken)
      } catch {
        /* private mode — the member session still covers signed-in users */
      }

      if (res.mode === 'demo') {
        router.push(`/checkout/success?order=${res.orderId}`)
        return
      }

      // Full navigation, not router.push: the gateway is an external origin.
      window.location.assign(res.url)
    } catch (err) {
      setError(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not start your checkout.'
      )
    }
  }

  /* ---------------------------------------------------------------- */

  const shell = (children: React.ReactNode) => (
    <main className="site-shell">
      <SiteHeader />
      <div className="content-shell">{children}</div>
      <SiteFooter />
    </main>
  )

  if (!hydrated || cfgLoading) {
    return shell(
      <div className="checkout-loading">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Preparing checkout…
      </div>
    )
  }

  if (items.length === 0) {
    return shell(
      <div className="cart-empty">
        <p className="cart-empty-title">Your cart is empty</p>
        <p className="cart-empty-sub">Add a listing to your cart before checking out.</p>
        <Link href="/browse" className="cart-empty-cta">
          Browse listings
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  return shell(
    <>
      <Link href="/cart" className="checkout-back">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to cart
      </Link>

      <h1 className="checkout-title">Checkout</h1>

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="checkout-main">
          {!member && (
            <div className="checkout-signin-hint">
              <User className="h-4 w-4" aria-hidden="true" />
              <span>
                <Link href="/signin?redirect=/checkout">Sign in</Link> to save this order to your
                account — or keep going as a guest.
              </span>
            </div>
          )}

          {/* SHIPPING */}
          <section className="checkout-card">
            <h2>
              <span className="checkout-step">1</span>
              Shipping details
            </h2>

            <div className="checkout-grid">
              <label className="auth-field checkout-span-2">
                <span className="auth-label">Full name</span>
                <input
                  required
                  minLength={2}
                  autoComplete="name"
                  value={address.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  className="checkout-input"
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={address.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  className="checkout-input"
                  placeholder="you@example.com"
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">Phone (optional)</span>
                <input
                  autoComplete="tel"
                  value={address.phone}
                  onChange={(e) => patch({ phone: e.target.value })}
                  className="checkout-input"
                  placeholder="(555) 123-4567"
                />
              </label>

              <label className="auth-field checkout-span-2">
                <span className="auth-label">Street address</span>
                <input
                  required
                  minLength={3}
                  autoComplete="address-line1"
                  value={address.line1}
                  onChange={(e) => patch({ line1: e.target.value })}
                  className="checkout-input"
                  placeholder="123 Main Street"
                />
              </label>

              <label className="auth-field checkout-span-2">
                <span className="auth-label">Apartment, suite, etc. (optional)</span>
                <input
                  autoComplete="address-line2"
                  value={address.line2}
                  onChange={(e) => patch({ line2: e.target.value })}
                  className="checkout-input"
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">City</span>
                <input
                  required
                  minLength={2}
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={(e) => patch({ city: e.target.value })}
                  className="checkout-input"
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">Province / Territory</span>
                <select
                  required
                  value={address.province}
                  onChange={(e) => patch({ province: e.target.value })}
                  className="checkout-input"
                >
                  <option value="">Choose…</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label className="auth-field">
                <span className="auth-label">Postal code</span>
                <input
                  required
                  minLength={3}
                  autoComplete="postal-code"
                  value={address.postalCode}
                  onChange={(e) => patch({ postalCode: e.target.value.toUpperCase() })}
                  className="checkout-input"
                  placeholder="M5V 2T6"
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">Country</span>
                <input value="Canada" readOnly className="checkout-input checkout-input-static" />
              </label>
            </div>
          </section>

          {/* PAYMENT */}
          <section className="checkout-card">
            <h2>
              <span className="checkout-step">2</span>
              Payment method
            </h2>

            <div className="pay-methods" role="radiogroup" aria-label="Payment method">
              {options.map((o) => (
                <label
                  key={o.id}
                  className={`pay-method ${provider === o.id ? 'is-selected' : ''} ${
                    o.problem ? 'is-unavailable' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-provider"
                    value={o.id}
                    checked={provider === o.id}
                    onChange={() => setProvider(o.id)}
                  />
                  <ProviderMark id={o.id} />
                  <span className="pay-method-text">
                    <span className="pay-method-label">{o.label}</span>
                    <span className="pay-method-note">{o.note}</span>
                  </span>
                  {o.problem ? (
                    <span
                      className={`pay-method-chip ${o.problem.rejected ? 'is-error' : 'is-missing'}`}
                    >
                      {o.problem.rejected ? 'Keys rejected' : 'Keys missing'}
                    </span>
                  ) : o.mode === 'demo' ? (
                    <span className="pay-method-tag">Demo</span>
                  ) : o.mode === 'sandbox' ? (
                    <span className="pay-method-tag">Test</span>
                  ) : null}
                </label>
              ))}
            </div>

            {/* A gateway that can't take money still explains itself when picked. */}
            {selected?.problem ? (
              <div className="pay-problem" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <div>
                  <p className="pay-problem-title">
                    {selected.label} can&apos;t be used —{' '}
                    {selected.problem.rejected
                      ? 'the gateway rejected this server’s credentials'
                      : 'no credentials are configured on this server'}
                  </p>
                  <p>
                    {selected.problem.rejected ? (
                      <>
                        They were refused when the server checked them, so this method is
                        withheld rather than offered and failing. Replace{' '}
                        {selected.problem.envVars.map((v, i) => (
                          <span key={v}>
                            {i > 0 ? ' and ' : ''}
                            <code>{v}</code>
                          </span>
                        ))}{' '}
                        in <code>.env.local</code>, restart the server, then run{' '}
                        <code>npm run check:gateways</code> to confirm before trying again.
                      </>
                    ) : (
                      <>
                        Add{' '}
                        {selected.problem.envVars.map((v, i) => (
                          <span key={v}>
                            {i > 0 ? ' and ' : ''}
                            <code>{v}</code>
                          </span>
                        ))}{' '}
                        to <code>.env.local</code> and restart the server to offer this method.
                      </>
                    )}
                  </p>
                  {selected.problem.detail && (
                    <p>
                      Reported by the server: <code>{selected.problem.detail}</code>
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {selected && !selected.problem && selected.mode !== 'demo' ? (
              <p className="pay-method-explain">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                You&apos;ll be taken to {selected.id === 'stripe' ? 'Stripe' : 'PayPal'} to pay
                securely, then brought back here. We never see your card details.
              </p>
            ) : null}

            {selected && !selected.problem && selected.mode === 'demo' ? (
              <p className="pay-method-explain pay-method-explain-demo">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {unavailable.some((u) => u.rejected) ? (
                  <>
                    Your{' '}
                    {unavailable
                      .filter((u) => u.rejected)
                      .map((u) => (u.id === 'stripe' ? 'Stripe' : u.id === 'paypal' ? 'PayPal' : u.id))
                      .join(' and ')}{' '}
                    credentials were rejected by the gateway, so this is a simulated payment. The
                    order, confirmation email flow and admin record are all real — only the money
                    isn&apos;t. Check the keys in <code>.env.local</code> and restart the server;
                    the server log names the provider that refused them.
                  </>
                ) : (
                  <>
                    No gateway keys are configured on this server, so this is a simulated
                    payment. The order, confirmation email flow and admin record are all real —
                    only the money isn&apos;t. Add <code>STRIPE_SECRET_KEY</code> or PayPal
                    credentials to go live.
                  </>
                )}
              </p>
            ) : null}

            <label className="auth-field" style={{ marginTop: 16 }}>
              <span className="auth-label">Order note (optional)</span>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="checkout-input"
                placeholder="Anything the seller should know?"
              />
            </label>
          </section>
        </div>

        {/* SUMMARY */}
        <aside className="checkout-summary">
          <h2>Your order</h2>

          <ul className="checkout-items">
            {items.map((i) => (
              <li key={i.product}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.image} alt="" aria-hidden="true" />
                <span className="checkout-item-text">
                  <span className="checkout-item-title">{i.title}</span>
                  <span className="checkout-item-qty">Qty {i.quantity}</span>
                </span>
                <span className="checkout-item-price">{money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>

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
              <dt>Tax</dt>
              <dd>{money(totals.tax)}</dd>
            </div>
            <div className="cart-totals-grand">
              <dt>Total</dt>
              <dd>{money(totals.total)}</dd>
            </div>
          </dl>

          {error && (
            <div role="alert" className="auth-alert">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={`cart-checkout-btn ${blocked ? 'is-blocked' : ''}`}
            disabled={placing || blocked}
          >
            {placing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Placing order…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden="true" />
                Place order · {money(totals.total)}
              </>
            )}
          </button>

          {blocked && (
            <p className="checkout-blocked" role="status">
              {selected?.label ?? 'This method'} can&apos;t take a payment — choose another method
              above.
            </p>
          )}

          <p className="checkout-reassure">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Your payment is processed by the gateway. Poorprice.com never stores card numbers.
          </p>
        </aside>
      </form>
    </>,
  )
}
