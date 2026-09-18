'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ListingDetailPage() {
  const [query, setQuery] = useState('')
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [showMoreDesc, setShowMoreDesc] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likedItems, setLikedItems] = useState<Record<number, boolean>>({})

  const toggleLike = (index: number) => {
    setLikedItems((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const similarListings = [
    {
      title: 'Buying iPhone 16 & 17 - Bell / Telus / Fido ... CASH ON THE...',
      location: 'City of Montreal',
      price: '$950',
      image: '/images/iphone_cash_hero.jpg',
      hasAiBadge: true,
    },
    {
      title: 'iPhone 14 Pro Max - 128GB',
      location: 'Laval / North Shore',
      price: '$820',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: 'Achat de téléphone cellulaire intelligent, Meilleur prix',
      location: 'City of Montreal',
      price: 'Please Contact',
      image: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: "J'achete les telephones, ⚡⚡⚡⚡CASH⚡⚡⚡⚡",
      location: 'City of Montreal',
      price: '$1,234',
      image: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: "J'achète les cellulaire utilisés",
      location: 'City of Montreal',
      price: 'Please Contact',
      image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=500&q=80',
    },
  ]

  return (
    <main className="listing-detail-page">
      {/* 1. TOP HEADER & SEARCH */}
      <header className="site-header">
        <div className="top-bar">
          <Link href="/" className="brand" aria-label="Kijiji home">
            <span className="brand-dots">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            kijiji
          </Link>

          <form className="search-area" onSubmit={(e) => e.preventDefault()}>
            <label className="search-input">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for?"
                aria-label="Search listings"
              />
            </label>

            <button type="button" className="category-picker">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <div className="picker-text">
                <small>Categories</small>
                <span>All categories</span>
              </div>
              <b className="chevron">▾</b>
            </button>

            <button type="submit" className="search-button">
              Search
            </button>
          </form>

          <div className="account-actions">
            <button className="location-btn" type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="2.8" />
              </svg>
              Canada ▾
            </button>
            <span className="divider" />
            <a href="#">FR</a>
            <a href="#">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="7" r="4" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" strokeLinecap="round" />
              </svg>
              Register or Sign In
            </a>
            <button className="post-button" type="button">
              Post
            </button>
          </div>
        </div>
      </header>

      {/* 2. BREADCRUMB */}
      <nav className="detail-breadcrumb-bar" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="crumb-sep">&gt;</span>
        <a href="#">Buy &amp; Sell</a>
        <span className="crumb-sep">&gt;</span>
        <a href="#">Phones</a>
        <span className="crumb-sep">&gt;</span>
        <a href="#">Cell Phones for City of Montreal</a>
        <span className="crumb-sep">&gt;</span>
        <span className="ad-id">Ad ID 1740373245</span>
      </nav>

      {/* 3. MAIN PRODUCT LAYOUT */}
      <div className="detail-main-layout">
        {/* LEFT COLUMN */}
        <div className="detail-left-col">
          {/* Hero Image Box */}
          <div className="detail-hero-box">
            <img
              src="/images/iphone_cash_hero.jpg"
              alt="Backdrop blur"
              className="hero-backdrop"
              aria-hidden="true"
            />
            <img
              src="/images/iphone_cash_hero.jpg"
              alt="Wanted: NOUS ACHETONS TOUS LES IPHONE APPLE AU COMPTANT!"
              className="hero-foreground"
            />
          </div>

          {/* Title & Price Section */}
          <div className="detail-title-section">
            <h1>Wanted: NOUS ACHETONS TOUS LES IPHONE APPLE AU COMPTANT!</h1>
            <div className="detail-price-row">
              <span className="price-tag">$950</span>
              <span className="urgent-badge">URGENT</span>
            </div>
            <p className="detail-posted-ago">Posted 6 days ago</p>
          </div>

          {/* Save & Share Action Bar */}
          <div className="detail-action-bar">
            <button
              type="button"
              className="action-outline-btn"
              onClick={() => setSaved(!saved)}
              style={saved ? { borderColor: '#e53935', color: '#e53935' } : {}}
            >
              <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              {saved ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="action-outline-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share
            </button>
          </div>

          {/* Key Attributes / Specs Grid */}
          <div className="detail-specs-grid">
            <div className="spec-item">
              <div className="spec-icon">
                {/* Brand Phone Icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="spec-meta">
                <span className="spec-label">Brand</span>
                <span className="spec-value">Apple</span>
              </div>
            </div>

            <div className="spec-item">
              <div className="spec-icon">
                {/* ✦ 4-point Sparkle Icon */}
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="m12 1 2.5 7.5L22 11l-7.5 2.5L12 21l-2.5-7.5L2 11l7.5-2.5z" />
                </svg>
              </div>
              <div className="spec-meta">
                <span className="spec-label">Condition</span>
                <span className="spec-value">New</span>
              </div>
            </div>

            <div className="spec-item">
              <div className="spec-icon">
                {/* Carrier Antenna Icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                  <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M12 14v8" />
                </svg>
              </div>
              <div className="spec-meta">
                <span className="spec-label">Carrier</span>
                <span className="spec-value">Unlocked</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <section className="detail-desc-block">
            <h2>Description</h2>
            <div className="desc-text">
              <p style={{ margin: '0 0 8px' }}>Appelez ou textez-nous pour obtenir notre meilleur prix :</p>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '15px' }}>438 520 4368</p>
              <p style={{ margin: '0 0 8px' }}>Instagram: Cash For Phones Montreal</p>
              {showMoreDesc && (
                <p style={{ margin: '8px 0 0', color: '#656379' }}>
                  Paiement instantané en argent comptant. Nous achetons tous les modèles neufs ou usagés scellés dans leur boîte d&apos;origine. Rencontre rapide et sécuritaire partout dans la région métropolitaine de Montréal.
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

          {/* Transaction options Section */}
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

          {/* Listed By Section */}
          <section className="detail-listed-by">
            <h2>Listed By</h2>
            <div className="seller-profile-row">
              <div className="seller-avatar-circle">A</div>
              <div className="seller-info-col">
                <span className="seller-name">Alex</span>
                <span className="seller-role">Owner</span>
              </div>
            </div>

            <div className="seller-action-links">
              <a
                href="#reveal"
                onClick={(e) => {
                  e.preventDefault()
                  setPhoneRevealed(true)
                }}
              >
                📞 {phoneRevealed ? '+1 (438) 520-4368' : 'Reveal phone number'}
              </a>
              <a href="#">🗂 View all listings (2)</a>
              <span className="seller-loc">📍 Montreal, QC H3C 1E7</span>
            </div>

            {/* 3-stat block */}
            <div className="seller-stats-grid">
              <div className="seller-stat-cell">
                <strong>1 day +</strong>
                <span>avg reply</span>
              </div>
              <div className="seller-stat-cell">
                <strong>&lt; 75%</strong>
                <span>reply rate</span>
              </div>
              <div className="seller-stat-cell">
                <strong>3 yrs</strong>
                <span>on Kijiji</span>
              </div>
            </div>

            {/* Views and Report */}
            <div className="detail-views-row">
              <span>👁 137 views</span>
              <a href="#" className="report-link">
                ⚐ Report listing
              </a>
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR COLUMN */}
        <aside className="detail-right-col">
          <div className="detail-sidebar-card">
            <div className="sidebar-seller-header">
              <div className="seller-avatar-circle">A</div>
              <div className="sidebar-seller-meta">
                <h3>Alex</h3>
                <p>On Kijiji since December 2018</p>
              </div>
            </div>

            <a href="#" className="sidebar-location-link">
              📍 Montreal, QC H3C 1E7
            </a>

            {/* Reveal Phone Box */}
            <div className="reveal-phone-box">
              <span className="phone-mask">
                📞 {phoneRevealed ? '+1 (438) 520-4368' : '+1-XXX-XXX-XXXX'}
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
                <span style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>Active</span>
              )}
            </div>

            {/* Send Message Button */}
            <button type="button" className="send-message-btn">
              Send message
            </button>

            <p className="sidebar-disclaimer">
              To deter and identify potential fraud, spam or suspicious behaviour, we reserve the right to monitor conversations. By sending the message you agree to our <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a>.
            </p>
          </div>
        </aside>
      </div>

      {/* 4. SIMILAR LISTINGS */}
      <section className="similar-section-wrapper">
        <h2>Similar listings</h2>
        <div className="similar-grid" role="list">
          {similarListings.map((item, idx) => (
            <article className="similar-card" key={idx} role="listitem">
              <div className="card-thumb">
                <img src={item.image} alt={item.title} loading="lazy" />
                {item.hasAiBadge && (
                  <div className="ai-badge">
                    <span>AI</span>
                    <span className="five-g">5G+</span>
                  </div>
                )}
              </div>
              <div className="similar-card-body">
                <p title={item.title}>{item.title}</p>
                <small>{item.location}</small>
                <div className="similar-card-footer">
                  <strong>{item.price}</strong>
                  <button
                    type="button"
                    className="heart-btn"
                    onClick={() => toggleLike(idx)}
                    aria-label="Save listing"
                    style={likedItems[idx] ? { color: '#e53935' } : {}}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill={likedItems[idx] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
          <button className="carousel-next-btn" type="button" aria-label="Next similar listings">
            ›
          </button>
        </div>
      </section>

      {/* 5. SAFETY TIPS */}
      <div className="safety-tips-row">
        Take steps to make your Kijiji transactions as secure as possible by following our suggested safety tips.{' '}
        <a href="#">Read our Safety Tips</a>
      </div>

      {/* 6. FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-links">
            <div className="footer-column">
              <h2>KIJIJI</h2>
              <a href="#">About</a>
              <a href="#">Join Us</a>
              <a href="#">Member Benefits</a>
              <a href="#">Advertise on Kijiji</a>
            </div>
            <div className="footer-column">
              <h2>EXPLORE</h2>
              <a href="#">Tools to promote ads</a>
            </div>
            <div className="footer-column">
              <h2>INFO</h2>
              <a href="#">Verification</a>
              <a href="#">Terms of Use</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Posting Policy</a>
              <a href="#">Security</a>
              <a href="#">AdChoices</a>
            </div>
            <div className="footer-column">
              <h2>SUPPORT</h2>
              <a href="#">Community Connect</a>
              <a href="#">Kijiji en Français</a>
              <a href="#">Accessibility</a>
            </div>
          </div>

          <div className="footer-lower">
            <div className="app-badges">
              <a className="app-badge" href="#" aria-label="Download on App Store">
                <svg viewBox="0 0 170 170" width="16" height="16" fill="currentColor">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.42-9.78-11.53-20.87-15.32-33.28-3.79-12.41-5.69-24.38-5.69-35.91 0-14.67 3.8-26.68 11.39-36.03 7.6-9.35 16.98-14.15 28.16-14.4 5.33 0 11.16 1.3 17.5 3.9 6.34 2.6 10.15 3.95 11.45 4.05 1.74-.22 5.76-1.63 12.06-4.22 6.3-2.6 11.75-3.79 16.36-3.56 12.18.65 22.06 5.11 29.62 13.38-10.65 6.52-15.86 15.42-15.65 26.71.22 8.91 3.59 16.4 10.11 22.48 6.52 6.08 14.12 9.67 22.81 10.75-2.39 7.18-5.43 14.67-9.12 22.46zM119.22 33.02c0-7.39 2.6-14.45 7.82-21.18 5.21-6.73 11.83-11.19 19.86-13.38.33 1.09.49 2.18.49 3.26 0 7.39-2.72 14.34-8.15 20.85-5.43 6.52-12.06 10.65-19.89 12.4-.13-.65-.13-1.31-.13-1.95z"/>
                </svg>
                <div className="badge-text">
                  <small>Download on the</small>
                  <span>App Store</span>
                </div>
              </a>
              <a className="app-badge" href="#" aria-label="Get it on Google Play">
                <svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 59.9zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                </svg>
                <div className="badge-text">
                  <small>GET IT ON</small>
                  <span>Google Play</span>
                </div>
              </a>
            </div>

            <div className="social-links" aria-label="Social media links">
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Instagram">◎</a>
              <a href="#" aria-label="X">𝕏</a>
              <a href="#" aria-label="YouTube">▶</a>
            </div>
          </div>

          <div className="footer-copyright">
            <p>©2005–2026 Marktplaats BV.</p>
            <p>All rights reserved. Google Play and YouTube are trademarks of Google LLC.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
