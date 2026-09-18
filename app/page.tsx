'use client'

import { useState } from 'react'
import Link from 'next/link'

// ==========================================
// DATA & ASSETS MATCHING KIJIJI HOMEPAGE
// ==========================================

const categories = [
  'Buy & Sell',
  'Cars & Vehicles',
  'Real Estate',
  'Jobs',
  'Services',
  'Pets',
  'Community',
  'Vacation Rentals',
]

const popularSearches = [
  'Free Stuff',
  'Swap / Trade',
  'Wanted Ads',
  '1 Bedroom Apartment',
  'Apartment',
  'Apartment For Rent',
  'House For Rent',
  'Iphone',
  'Massage',
  'Private Room For Rent',
]

const galleryListings = [
  {
    title: 'J&L Interlocking Landscaping Grass...',
    location: 'Canada',
    price: 'Please Contact',
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Semidetached home for Rent - Town...',
    location: 'Canada',
    price: '$2,850',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Unit 107 - Lonsdale - Step-In Tub Home...',
    location: 'Canada',
    price: '$1,715',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Aussiedoodles miniature...',
    location: 'Canada',
    price: '$1,800',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'ASUS ROG gaming computer...',
    location: 'Canada',
    price: '$9,700',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=500&q=80',
  },
]

const recentListings = [
  {
    title: 'Apple iPhone 12 Pro Max 512GB -Black...',
    location: 'Canada',
    price: 'Please Contact',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff025a5?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Decorative Candlesticks...',
    location: 'Canada',
    price: '$40',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'The Ultimate Guide to Harry Potter an...',
    location: 'Canada',
    price: '$5',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: '23’ Faux Silk Scarf Wrap Shawl...',
    location: 'Canada',
    price: '$6',
    image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Grey Fabric Sectional Sofa wit...',
    location: 'Canada',
    price: '$899',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=500&q=80',
  },
]

const autosTiles = [
  { label: 'Cars & Trucks', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80' },
  { label: 'Classic Cars', image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=600&q=80' },
  { label: "RV's, Campers & Trailers", image: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Boats & Watercraft', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Motorcycles', image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80' },
  { label: 'Vehicle Parts, Tires, & Accessories', image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Heavy Equipment', image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80' },
  { label: 'ATVs & Snowmobiles', image: 'https://images.unsplash.com/photo-1517055729445-fa7d27394b48?auto=format&fit=crop&w=600&q=80' },
]

const autosListings = [
  {
    title: '225 65 17 winter rims .',
    location: 'Canada',
    price: '$25',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Looking for 225/65 R17 Winter tires',
    location: 'Canada',
    price: 'Please Contact',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Suzuki Motorcycle owners manual',
    location: 'Canada',
    price: '$10',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: '2004 Toyota Corolla owner’s manuals',
    location: 'Canada',
    price: '$10',
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'razor 200 side by side',
    location: 'Canada',
    price: '$5,000',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=80',
  },
]

const realEstateTiles = [
  { label: 'Apartments & Condos for Rent', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' },
  { label: 'Houses for Rent', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Houses for Sale', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80' },
]

const realEstateListings = [
  {
    title: '1 bedroom apartment',
    location: 'Canada',
    price: '$1,895',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Bright 1 or 2 Bedroom...',
    location: 'Canada',
    price: '$1,290',
    image: 'https://images.unsplash.com/photo-1502005229762-ee152d9a5e3a?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: '2 bedroom and 2 bathroom...',
    location: 'Canada',
    price: '$500',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: '2 bedrooms apartment for rent',
    location: 'Canada',
    price: '$2,000',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Spruceland Apartment For Ren...',
    location: 'Canada',
    price: '$1,400',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=500&q=80',
  },
]

const buySellTiles = [
  { label: 'Furniture', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80' },
  { label: 'Home - Outdoor & Garden', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
  { label: 'Tools', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80' },
]

const buySellListings = [
  {
    title: 'Acoustic guitar',
    location: 'Canada',
    price: '$50',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Epiphone Acoustic Guitar',
    location: 'Canada',
    price: '$150',
    image: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Rossignol 205cm waxless cross...',
    location: 'Canada',
    price: '$150',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Ski cross country',
    location: 'Canada',
    price: '$40',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'GAMING PC – FOR SALE OR TRADE...',
    location: 'Canada',
    price: '$2,000',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=500&q=80',
  },
]

// ==========================================
// SVG ICONS
// ==========================================

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.8" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" strokeLinecap="round" />
    </svg>
  )
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 170 170" width="16" height="16" fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.42-9.78-11.53-20.87-15.32-33.28-3.79-12.41-5.69-24.38-5.69-35.91 0-14.67 3.8-26.68 11.39-36.03 7.6-9.35 16.98-14.15 28.16-14.4 5.33 0 11.16 1.3 17.5 3.9 6.34 2.6 10.15 3.95 11.45 4.05 1.74-.22 5.76-1.63 12.06-4.22 6.3-2.6 11.75-3.79 16.36-3.56 12.18.65 22.06 5.11 29.62 13.38-10.65 6.52-15.86 15.42-15.65 26.71.22 8.91 3.59 16.4 10.11 22.48 6.52 6.08 14.12 9.67 22.81 10.75-2.39 7.18-5.43 14.67-9.12 22.46zM119.22 33.02c0-7.39 2.6-14.45 7.82-21.18 5.21-6.73 11.83-11.19 19.86-13.38.33 1.09.49 2.18.49 3.26 0 7.39-2.72 14.34-8.15 20.85-5.43 6.52-12.06 10.65-19.89 12.4-.13-.65-.13-1.31-.13-1.95z"/>
    </svg>
  )
}

function PlayLogo() {
  return (
    <svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor">
      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 59.9zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
    </svg>
  )
}

// ==========================================
// SUBCOMPONENTS
// ==========================================

function SectionHeading({
  title,
  linkText,
  linkHref = '#',
  showInfo = false,
  showYourAd = false,
}: {
  title: string
  linkText?: string
  linkHref?: string
  showInfo?: boolean
  showYourAd?: boolean
}) {
  return (
    <div className="section-heading">
      <div className="section-heading-title">
        <h2>{title}</h2>
        {showInfo && <span className="info-icon" title="Gallery Info">i</span>}
      </div>
      <div className="section-heading-link">
        {showYourAd && (
          <>
            <a href="#" className="your-ad">Your Ad here</a>
            <span className="dot-divider">·</span>
          </>
        )}
        {linkText && <a href={linkHref}>{linkText}</a>}
      </div>
    </div>
  )
}

function ListingRow({
  listings,
}: {
  listings: Array<{ title: string; location: string; price: string; image: string }>
}) {
  return (
    <div className="listing-row-container">
      <div className="listing-row" role="list">
        {listings.map((item, index) => (
          <Link href="/listing/1" className="listing-card" key={`${item.title}-${index}`} role="listitem">
            <div className="image-wrap">
              <img src={item.image} alt={item.title} loading="lazy" />
            </div>
            <div className="listing-copy">
              <p title={item.title}>{item.title}</p>
              <small>{item.location}</small>
              <strong>{item.price}</strong>
            </div>
          </Link>
        ))}
      </div>
      <button className="carousel-next-btn" type="button" aria-label="Next listings">
        ›
      </button>
    </div>
  )
}

function LeaderboardAd() {
  return (
    <div className="ad-banner-section">
      <div className="leaderboard-banner" role="region" aria-label="Advertisement">
        <div className="ad-left">
          <div className="product-can">
            <span>SPRAY</span>
          </div>
          <div className="ad-text">
            <h3>BIZLI POWER DEAL</h3>
            <p>INSTANT FRESHNESS &bull; LONG LASTING CLEAN</p>
          </div>
        </div>
        <div className="ad-badge">
          <span className="discount-pill">UP TO 50% OFF</span>
          <span className="brand-mark">BIZLI</span>
        </div>
        <div className="skyline-decor" />
      </div>
    </div>
  )
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function Page() {
  const [query, setQuery] = useState('')

  return (
    <main className="site-shell">
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
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for?"
                aria-label="Search listings"
              />
            </label>

            <button type="button" className="category-picker">
              <GridIcon />
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
              <PinIcon /> Canada ▾
            </button>
            <span className="divider" />
            <a href="#">FR</a>
            <a href="#">
              <UserIcon /> Register or Sign In
            </a>
            <button className="post-button" type="button">
              Post ad
            </button>
          </div>
        </div>

        {/* 2. CATEGORY SUB-NAV */}
        <nav className="category-nav" aria-label="Main category navigation">
          <div className="nav-links">
            {categories.map((cat) => (
              <a href="#" key={cat}>
                {cat}
              </a>
            ))}
          </div>
          <a href="#" className="newcomers-pill">
            Newcomers
          </a>
          <div className="trending-pill">
            <span className="trending-badge">Trending</span>
            <span>Tires &amp; Rims</span>
          </div>
        </nav>
      </header>

      {/* 3. LEADERBOARD AD BANNER */}
      <LeaderboardAd />

      {/* 4. MAIN CONTENT AREA */}
      <div className="content-shell">
        {/* Intro Row */}
        <div className="intro-row">
          <h1 className="eyebrow">Canada&apos;s most trusted and loved marketplace</h1>
          <a className="ad-choice" href="#">
            AdChoices ▷
          </a>
        </div>

        {/* SECTION 1: Homepage Gallery */}
        <SectionHeading
          title="Homepage Gallery"
          linkText="See All"
          showInfo={true}
          showYourAd={true}
        />
        <ListingRow listings={galleryListings} />

        {/* SECTION 2: Recently added near you */}
        <SectionHeading title="Recently added near you" linkText="See All" />
        <ListingRow listings={recentListings} />

        {/* SECTION 3: Popular near you */}
        <section className="popular-section">
          <SectionHeading title="Popular near you" />
          <div className="pill-grid">
            {popularSearches.map((term) => (
              <a href="#" key={term}>
                {term}
              </a>
            ))}
          </div>
        </section>

        {/* SECTION 4: Autos in Canada */}
        <section>
          <SectionHeading title="Autos in Canada" linkText="Browse All Autos" />
          <div className="category-tiles-autos">
            {autosTiles.map((tile) => (
              <a href="#" className="category-tile" key={tile.label}>
                <img src={tile.image} alt={tile.label} loading="lazy" />
                <span className="tile-badge">{tile.label}</span>
              </a>
            ))}
          </div>

          <SectionHeading title="Popular listings in Autos" linkText="See All" />
          <ListingRow listings={autosListings} />
        </section>

        {/* SECTION 5: Real Estate in Canada */}
        <section style={{ marginTop: '32px' }}>
          <SectionHeading title="Real Estate in Canada" linkText="Browse All Real Estate" />
          <div className="category-tiles-wide">
            {realEstateTiles.map((tile) => (
              <a href="#" className="category-tile" key={tile.label}>
                <img src={tile.image} alt={tile.label} loading="lazy" />
                <span className="tile-badge">{tile.label}</span>
              </a>
            ))}
          </div>

          <SectionHeading title="Popular listings in Real Estate" linkText="See All" />
          <ListingRow listings={realEstateListings} />
        </section>

        {/* MEMBERSHIP BANNER */}
        <div className="member-banner">
          <h2>Kijiji&apos;s better when you&apos;re a member</h2>
          <p>
            See more relevant listings, find the things you&apos;re looking for quicker, and more!
          </p>
          <button type="button">Sign In</button>
        </div>

        {/* SECTION 6: Buy and Sell in Canada */}
        <section>
          <SectionHeading title="Buy and Sell in Canada" linkText="Browse All Buy and Sell" />
          <div className="category-tiles-wide">
            {buySellTiles.map((tile) => (
              <a href="#" className="category-tile" key={tile.label}>
                <img src={tile.image} alt={tile.label} loading="lazy" />
                <span className="tile-badge">{tile.label}</span>
              </a>
            ))}
          </div>

          <SectionHeading title="Popular listings in Buy and Sell" linkText="See All" />
          <ListingRow listings={buySellListings} />
        </section>
      </div>

      {/* 5. FOOTER */}
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
                <AppleLogo />
                <div className="badge-text">
                  <small>Download on the</small>
                  <span>App Store</span>
                </div>
              </a>
              <a className="app-badge" href="#" aria-label="Get it on Google Play">
                <PlayLogo />
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
