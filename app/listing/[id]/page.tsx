'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useGetProductQuery, useGetProductsQuery } from '@/store/productsApi'
import { useCreateMessageMutation, useCreateReportMutation } from '@/store/inboxApi'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { Modal, Button, Field, Input, Textarea, Alert } from '@/components/admin/ui'
import {
  categoryName,
  categorySlug,
  priceLabel,
  primaryImage,
  timeAgo,
  type Product,
} from '@/store/types'

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'fraud', label: 'Fraud or scam' },
  { value: 'prohibited-item', label: 'Prohibited item' },
  { value: 'wrong-category', label: 'Wrong category' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'other', label: 'Something else' },
]

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  'like-new': 'Like new',
  used: 'Used',
  'for-parts': 'For parts',
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const { data: product, isLoading, isError } = useGetProductQuery(id)

  const { data: similarData } = useGetProductsQuery(
    { category: categorySlug(product ?? { category: null }) ?? undefined, limit: 5 },
    { skip: !product }
  )

  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [showMoreDesc, setShowMoreDesc] = useState(false)
  const [saved, setSaved] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [sent, setSent] = useState(false)

  const [createMessage, { isLoading: sending }] = useCreateMessageMutation()
  const [createReport, { isLoading: reporting }] = useCreateReportMutation()

  if (isLoading) {
    return (
      <main className="site-shell">
        <SiteHeader />
        <div className="content-shell" style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ color: '#78747C' }}>Loading listing…</p>
        </div>
        <SiteFooter />
      </main>
    )
  }

  if (isError || !product) {
    return (
      <main className="site-shell">
        <SiteHeader />
        <div className="content-shell" style={{ padding: '64px 0', textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Listing not found</h1>
          <p style={{ color: '#78747C', marginBottom: 20 }}>
            This ad may have been removed or sold.
          </p>
          <Link href="/browse" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
            Browse all listings →
          </Link>
        </div>
        <SiteFooter />
      </main>
    )
  }

  const images = product.images?.length ? product.images : [primaryImage(product)]
  const sellerName = product.seller?.name || 'Poorprice Member'
  const similar = (similarData?.items ?? []).filter((p) => p._id !== product._id)

  return (
    <main className="listing-detail-page">
      <SiteHeader />

      {/* BREADCRUMB */}
      <nav className="detail-breadcrumb-bar" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="crumb-sep">&gt;</span>
        <Link href="/browse">{categoryName(product)}</Link>
        {product.category && typeof product.category === 'object' && (
          <>
            <span className="crumb-sep">&gt;</span>
            <Link href={`/browse?category=${product.category.slug}`}>{product.category.name}</Link>
          </>
        )}
        <span className="crumb-sep">&gt;</span>
        <span className="ad-id">Ad ID {product._id.slice(-8).toUpperCase()}</span>
      </nav>

      <div className="detail-main-layout">
        {/* LEFT COLUMN */}
        <div className="detail-left-col">
          <div className="detail-hero-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0]} alt="" className="hero-backdrop" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0]} alt={product.title} className="hero-foreground" />
          </div>

          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #E4E1E8',
                  }}
                />
              ))}
            </div>
          )}

          <div className="detail-title-section">
            <h1>{product.title}</h1>
            <div className="detail-price-row">
              <span className="price-tag">{priceLabel(product)}</span>
              {product.urgent && <span className="urgent-badge">URGENT</span>}
            </div>
            <p className="detail-posted-ago">Posted {timeAgo(product.createdAt)}</p>
          </div>

          <div className="detail-action-bar">
            <button
              type="button"
              className="action-outline-btn"
              onClick={() => setSaved(!saved)}
              style={saved ? { borderColor: '#e53935', color: '#e53935' } : {}}
            >
              <svg
                viewBox="0 0 24 24"
                fill={saved ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              {saved ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="action-outline-btn" onClick={() => setReportOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              Report listing
            </button>
          </div>

          {/* SPECS */}
          <div className="detail-specs-grid">
            <div className="spec-item">
              <div className="spec-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <div className="spec-meta">
                <span className="spec-label">Category</span>
                <span className="spec-value">{categoryName(product)}</span>
              </div>
            </div>

            <div className="spec-item">
              <div className="spec-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="m12 1 2.5 7.5L22 11l-7.5 2.5L12 21l-2.5-7.5L2 11l7.5-2.5z" />
                </svg>
              </div>
              <div className="spec-meta">
                <span className="spec-label">Condition</span>
                <span className="spec-value">
                  {CONDITION_LABEL[product.condition] ?? product.condition}
                </span>
              </div>
            </div>

            <div className="spec-item">
              <div className="spec-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="2.8" />
                </svg>
              </div>
              <div className="spec-meta">
                <span className="spec-label">Location</span>
                <span className="spec-value">{product.location}</span>
              </div>
            </div>

            {product.brand && (
              <div className="spec-item">
                <div className="spec-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
                    <circle cx="7" cy="7" r="1.5" />
                  </svg>
                </div>
                <div className="spec-meta">
                  <span className="spec-label">Brand</span>
                  <span className="spec-value">{product.brand}</span>
                </div>
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <section className="detail-desc-block">
            <h2>Description</h2>
            <div className="desc-text">
              {(product.description || 'No description provided.').split('\n').map((line, i) => (
                <p key={i} style={{ margin: '0 0 8px' }}>
                  {line}
                </p>
              ))}
              {showMoreDesc && product.tags.length > 0 && (
                <p style={{ margin: '8px 0 0', color: '#656379' }}>
                  Tags: {product.tags.join(', ')}
                </p>
              )}
            </div>
            <button
              type="button"
              className="show-more-btn"
              onClick={() => setShowMoreDesc(!showMoreDesc)}
            >
              {showMoreDesc ? 'Show Less' : 'Show More'}
            </button>
          </section>

          {/* TRANSACTION OPTIONS */}
          <section className="detail-transaction-block">
            <h2>Transaction options</h2>
            <p className="transaction-sub">
              Please reach out to the seller for more info as there may be additional costs.
            </p>
            <div className="cash-accepted-pill">
              <span className="cash-icon">$</span>
              <span>Cash accepted</span>
            </div>
          </section>

          {/* LISTED BY */}
          <section className="detail-listed-by">
            <h2>Listed By</h2>
            <div className="seller-profile-row">
              <div className="seller-avatar-circle">{sellerName.slice(0, 1).toUpperCase()}</div>
              <div className="seller-info-col">
                <span className="seller-name">
                  {sellerName}
                  {product.seller?.verified && (
                    <span style={{ color: '#2e7d32', marginLeft: 6, fontSize: 12 }}>✓ Verified</span>
                  )}
                </span>
                <span className="seller-role">Owner</span>
              </div>
            </div>

            <div className="seller-action-links">
              {product.seller?.phone ? (
                <a
                  href="#reveal"
                  onClick={(e) => {
                    e.preventDefault()
                    setPhoneRevealed(true)
                  }}
                >
                  📞 {phoneRevealed ? product.seller.phone : 'Reveal phone number'}
                </a>
              ) : (
                <span className="seller-loc">📞 Phone not provided</span>
              )}
              <Link href={`/browse?category=${categorySlug(product) ?? ''}`}>
                🗂 View all listings in this category
              </Link>
              <span className="seller-loc">📍 {product.seller?.location || product.location}</span>
            </div>

            <div className="seller-stats-grid">
              <div className="seller-stat-cell">
                <strong>&lt; 1 day</strong>
                <span>avg reply</span>
              </div>
              <div className="seller-stat-cell">
                <strong>95%</strong>
                <span>reply rate</span>
              </div>
              <div className="seller-stat-cell">
                <strong>{product.seller?.verified ? '5 yrs' : 'New'}</strong>
                <span>on Poorprice.com</span>
              </div>
            </div>

            <div className="detail-views-row">
              <span>👁 {product.views ?? 0} views</span>
              <button
                type="button"
                className="report-link"
                onClick={() => setReportOpen(true)}
                style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
              >
                ⚐ Report listing
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="detail-right-col">
          <div className="detail-sidebar-card">
            <div className="sidebar-seller-header">
              <div className="seller-avatar-circle">{sellerName.slice(0, 1).toUpperCase()}</div>
              <div className="sidebar-seller-meta">
                <h3>{sellerName}</h3>
                <p>Listed {timeAgo(product.createdAt)}</p>
              </div>
            </div>

            <span className="sidebar-location-link">📍 {product.seller?.location || product.location}</span>

            {product.seller?.phone && (
              <div className="reveal-phone-box">
                <span className="phone-mask">
                  📞 {phoneRevealed ? product.seller.phone : '+1-XXX-XXX-XXXX'}
                </span>
                {!phoneRevealed ? (
                  <button
                    type="button"
                    className="reveal-action"
                    onClick={() => setPhoneRevealed(true)}
                  >
                    Reveal
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: '#2e7d32', fontWeight: 600 }}>Active</span>
                )}
              </div>
            )}

            <button type="button" className="send-message-btn" onClick={() => setMessageOpen(true)}>
              Send message
            </button>

            <p className="sidebar-disclaimer">
              To deter and identify potential fraud, spam or suspicious behaviour, we reserve the
              right to monitor conversations. By sending the message you agree to our{' '}
              <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a>.
            </p>
          </div>
        </aside>
      </div>

      {/* SIMILAR LISTINGS */}
      {similar.length > 0 && (
        <section className="similar-section-wrapper">
          <h2>Similar listings</h2>
          <div className="similar-grid" role="list">
            {similar.map((item) => (
              <SimilarCard key={item._id} product={item} />
            ))}
          </div>
        </section>
      )}

      <div className="safety-tips-row">
        Take steps to make your Poorprice.com transactions as secure as possible by following our suggested
        safety tips. <a href="#">Read our Safety Tips</a>
      </div>

      <SiteFooter />

      {/* SEND MESSAGE MODAL */}
      <Modal
        open={messageOpen}
        onClose={() => {
          setMessageOpen(false)
          setSent(false)
        }}
        title="Send a message"
        footer={
          sent ? (
            <Button
              onClick={() => {
                setMessageOpen(false)
                setSent(false)
              }}
            >
              Done
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setMessageOpen(false)} disabled={sending}>
                Cancel
              </Button>
              <Button type="submit" form="contact-form" loading={sending}>
                Send message
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <Alert tone="success">
            Your message has been sent to the seller. They&apos;ll see it in their inbox.
          </Alert>
        ) : (
          <ContactForm
            product={product}
            loading={sending}
            onDone={() => setSent(true)}
            submit={createMessage}
          />
        )}
      </Modal>

      {/* REPORT MODAL */}
      <Modal
        open={reportOpen}
        onClose={() => {
          setReportOpen(false)
          setSent(false)
        }}
        title="Report this listing"
        footer={
          sent ? (
            <Button
              onClick={() => {
                setReportOpen(false)
                setSent(false)
              }}
            >
              Done
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setReportOpen(false)} disabled={reporting}>
                Cancel
              </Button>
              <Button type="submit" form="report-form" variant="danger" loading={reporting}>
                Submit report
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <Alert tone="success">
            Thanks — our moderation team will review this listing.
          </Alert>
        ) : (
          <ReportForm
            product={product}
            loading={reporting}
            onDone={() => setSent(true)}
            submit={createReport}
          />
        )}
      </Modal>
    </main>
  )
}

/* ------------------------------------------------------------------ */

function SimilarCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false)
  return (
    <article className="similar-card" role="listitem">
      <Link href={`/listing/${product.slug}`}>
        <div className="card-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={primaryImage(product)} alt={product.title} loading="lazy" />
        </div>
      </Link>
      <div className="similar-card-body">
        <Link href={`/listing/${product.slug}`}>
          <p title={product.title}>{product.title}</p>
        </Link>
        <small>{product.location}</small>
        <div className="similar-card-footer">
          <strong>{priceLabel(product)}</strong>
          <button
            type="button"
            className="heart-btn"
            onClick={() => setLiked((v) => !v)}
            aria-label="Save listing"
            style={liked ? { color: '#e53935' } : {}}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}

function ContactForm({
  product,
  loading,
  onDone,
  submit,
}: {
  product: Product
  loading: boolean
  onDone: () => void
  submit: (body: {
    product?: string | null
    productTitle?: string
    name: string
    email: string
    phone?: string
    body: string
  }) => { unwrap: () => Promise<unknown> }
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [body, setBody] = useState(
    `Hi, is “${product.title}” still available? I'm interested.`
  )
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await submit({
        product: product._id,
        productTitle: product.title,
        name,
        email,
        phone,
        body,
      }).unwrap()
      onDone()
    } catch (err) {
      setError(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not send your message.'
      )
    }
  }

  return (
    <form id="contact-form" onSubmit={onSubmit} className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}

      <Field label="Your name" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </Field>

      <Field label="Email" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Phone" hint="Optional — shown to the seller only.">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>

      <Field label="Message" required>
        <Textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={5}
        />
      </Field>

      <p className="text-xs text-ink-muted">
        {loading ? 'Sending…' : 'The seller receives this in their Poorprice.com inbox.'}
      </p>
    </form>
  )
}

function ReportForm({
  product,
  loading,
  onDone,
  submit,
}: {
  product: Product
  loading: boolean
  onDone: () => void
  submit: (body: {
    product?: string | null
    productTitle?: string
    reason?: string
    details?: string
    reporterEmail?: string
  }) => { unwrap: () => Promise<unknown> }
}) {
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await submit({
        product: product._id,
        productTitle: product.title,
        reason,
        details,
        reporterEmail: email,
      }).unwrap()
      onDone()
    } catch (err) {
      setError(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not submit your report.'
      )
    }
  }

  return (
    <form id="report-form" onSubmit={onSubmit} className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}

      <Field label="Reason" required>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          {REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Details" hint="Tell us what's wrong with this listing.">
        <Textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} />
      </Field>

      <Field label="Your email" hint="Optional — only if you'd like a follow-up.">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>

      <p className="text-xs text-ink-muted">
        {loading ? 'Submitting…' : `Reporting: ${product.title}`}
      </p>
    </form>
  )
}
