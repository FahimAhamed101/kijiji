'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  Package,
  Save,
  ShoppingBag,
  User,
} from 'lucide-react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import {
  useGetMemberQuery,
  useGetMyOrdersQuery,
  useMemberLogoutMutation,
  useUpdateProfileMutation,
} from '@/store/accountApi'
import { formatDate, money, orderStatusLabel, orderStatusTone } from '@/store/types'

export default function AccountPage() {
  const router = useRouter()
  const { data, isLoading } = useGetMemberQuery()
  const member = data?.member ?? null

  const { data: ordersData, isLoading: ordersLoading } = useGetMyOrdersQuery(undefined, {
    skip: !member,
  })
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation()
  const [logout] = useMemberLogoutMutation()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  // Seed the form once the member arrives.
  useEffect(() => {
    if (!member) return
    setName(member.name)
    setPhone(member.phone)
    setLocation(member.location)
  }, [member])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setNotice(null)
    try {
      await updateProfile({
        name,
        phone,
        location,
        // Only send password fields when the customer actually typed one.
        ...(newPassword ? { newPassword, currentPassword } : {}),
      }).unwrap()
      setCurrentPassword('')
      setNewPassword('')
      setNotice({ tone: 'ok', text: 'Your details have been saved.' })
    } catch (err) {
      setNotice({
        tone: 'err',
        text:
          (err as { data?: { error?: string } })?.data?.error ?? 'Could not save your changes.',
      })
    }
  }

  async function signOut() {
    await logout().unwrap().catch(() => {})
    router.push('/')
    router.refresh()
  }

  /* ---------------------------------------------------------------- */

  const shell = (children: React.ReactNode) => (
    <main className="site-shell">
      <SiteHeader />
      <div className="content-shell">{children}</div>
      <SiteFooter />
    </main>
  )

  if (isLoading) {
    return shell(
      <div className="checkout-loading">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Loading your account…
      </div>
    )
  }

  if (!member) {
    return shell(
      <div className="cart-empty">
        <User className="cart-empty-icon" aria-hidden="true" />
        <p className="cart-empty-title">You&apos;re not signed in</p>
        <p className="cart-empty-sub">
          Sign in to see your orders and manage your details.
        </p>
        <Link href="/signin?redirect=/account" className="cart-empty-cta">
          Sign in
        </Link>
      </div>
    )
  }

  const orders = ordersData?.items ?? []
  const paidTotal = orders
    .filter((o) => o.payment.status === 'paid')
    .reduce((n, o) => n + o.total, 0)

  return shell(
    <>
      <div className="account-head">
        <span className="account-head-avatar" style={{ background: member.avatarColor }}>
          {member.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="account-head-text">
          <h1>{member.name}</h1>
          <p>{member.email}</p>
        </div>
        <button type="button" className="account-signout-btn" onClick={signOut}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>

      <div className="account-stats">
        <div className="account-stat">
          <span className="account-stat-value">{orders.length}</span>
          <span className="account-stat-label">Orders</span>
        </div>
        <div className="account-stat">
          <span className="account-stat-value">{money(paidTotal)}</span>
          <span className="account-stat-label">Total spent</span>
        </div>
        <div className="account-stat">
          <span className="account-stat-value">
            {orders.reduce((n, o) => n + o.itemCount, 0)}
          </span>
          <span className="account-stat-label">Items bought</span>
        </div>
      </div>

      <div className="account-layout">
        {/* ORDERS */}
        <section className="account-card" id="orders">
          <h2>
            <Package className="h-4 w-4" aria-hidden="true" />
            My orders
          </h2>

          {ordersLoading ? (
            <p className="account-muted">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="account-empty">
              <ShoppingBag className="h-6 w-6" aria-hidden="true" />
              <p>No orders yet.</p>
              <Link href="/browse">Find something you like →</Link>
            </div>
          ) : (
            <ul className="order-list">
              {orders.map((order) => (
                <li className="order-row" key={order.id}>
                  <div className="order-row-head">
                    <span className="order-number">{order.orderNumber}</span>
                    <span className={`order-pill ${orderStatusTone(order.status)}`}>
                      {orderStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="order-row-body">
                    <div className="order-thumbs">
                      {order.items.slice(0, 4).map((i, idx) =>
                        i.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={`${i.product}-${idx}`} src={i.image} alt="" aria-hidden="true" />
                        ) : null
                      )}
                    </div>
                    <div className="order-row-meta">
                      <p>
                        {order.itemCount} item{order.itemCount === 1 ? '' : 's'} ·{' '}
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="order-row-titles">
                        {order.items.map((i) => i.title).join(', ')}
                      </p>
                    </div>
                    <span className="order-row-total">{money(order.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* PROFILE */}
        <section className="account-card">
          <h2>
            <User className="h-4 w-4" aria-hidden="true" />
            Account details
          </h2>

          <form className="account-form" onSubmit={save}>
            {notice && (
              <div
                role="alert"
                className={notice.tone === 'ok' ? 'account-notice-ok' : 'auth-alert'}
              >
                {notice.tone === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>{notice.text}</span>
              </div>
            )}

            <label className="auth-field">
              <span className="auth-label">Full name</span>
              <input
                className="checkout-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">Email</span>
              <input className="checkout-input checkout-input-static" value={member.email} readOnly />
            </label>

            <label className="auth-field">
              <span className="auth-label">Phone</span>
              <input
                className="checkout-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">Location</span>
              <input
                className="checkout-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Province"
              />
            </label>

            <div className="account-divider">
              <span>Change password</span>
            </div>

            <label className="auth-field">
              <span className="auth-label">Current password</span>
              <input
                type="password"
                autoComplete="current-password"
                className="checkout-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Only needed to set a new password"
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">New password</span>
              <input
                type="password"
                autoComplete="new-password"
                className="checkout-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                placeholder="At least 8 characters"
              />
            </label>

            <button type="submit" className="account-save-btn" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save changes
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </>,
  )
}
