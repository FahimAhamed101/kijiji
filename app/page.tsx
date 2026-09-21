'use client'

import Link from 'next/link'
import { useGetProductsQuery } from '@/store/productsApi'
import { useGetCategoriesQuery } from '@/store/categoriesApi'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { priceLabel, primaryImage, type Category, type Product } from '@/store/types'

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
        {showInfo && (
          <span className="info-icon" title="Gallery Info">
            i
          </span>
        )}
      </div>
      <div className="section-heading-link">
        {showYourAd && (
          <>
            <a href="#" className="your-ad">
              Your Ad here
            </a>
            <span className="dot-divider">·</span>
          </>
        )}
        {linkText && <Link href={linkHref}>{linkText}</Link>}
      </div>
    </div>
  )
}

function ListingRow({ products }: { products: Product[] }) {
  if (products.length === 0) return null
  return (
    <div className="listing-row-container">
      <div className="listing-row" role="list">
        {products.map((item) => (
          <Link
            href={`/listing/${item.slug}`}
            className="listing-card"
            key={item._id}
            role="listitem"
          >
            <div className="image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={primaryImage(item)} alt={item.title} loading="lazy" />
            </div>
            <div className="listing-copy">
              <p title={item.title}>{item.title}</p>
              <small>{item.location}</small>
              <strong>{priceLabel(item)}</strong>
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

function CategoryTiles({
  categories,
  className = 'category-tiles-wide',
}: {
  categories: Category[]
  className?: string
}) {
  if (categories.length === 0) return null
  return (
    <div className={className}>
      {categories.map((tile) => (
        <Link href={`/browse?category=${tile.slug}`} className="category-tile" key={tile._id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tile.image} alt={tile.name} loading="lazy" />
          <span className="tile-badge">{tile.name}</span>
        </Link>
      ))}
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

function RowSkeleton() {
  const bar = { background: '#EFEDF3', color: 'transparent', borderRadius: 4 }
  return (
    <div className="listing-row-container">
      <div className="listing-row" role="list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="listing-card" key={i} role="listitem" aria-hidden="true">
            <div className="image-wrap" style={{ background: '#EFEDF3' }} />
            <div className="listing-copy">
              <p style={bar}>Loading</p>
              <small style={bar}>Loading</small>
              <strong style={bar}>$000</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Page() {
  // Everything below is served from MongoDB through RTK Query.
  const { data: allCategories } = useGetCategoriesQuery()

  const gallery = useGetProductsQuery({ featured: 'true', limit: 5, sort: 'newest' })
  const recent = useGetProductsQuery({ sort: 'newest', limit: 5 })
  const autos = useGetProductsQuery({ group: 'Cars & Vehicles', sort: 'popular', limit: 5 })
  const realEstate = useGetProductsQuery({ group: 'Real Estate', sort: 'popular', limit: 5 })
  const buySell = useGetProductsQuery({ group: 'Buy & Sell', sort: 'popular', limit: 5 })

  const loading = gallery.isLoading || recent.isLoading
  const dbUnreachable = gallery.isError && recent.isError

  const byGroup = (group: string) =>
    (allCategories?.items ?? []).filter((c) => c.group === group && c.image)

  return (
    <main className="site-shell">
      <SiteHeader />
      <LeaderboardAd />

      <div className="content-shell">
        <div className="intro-row">
          <h1 className="eyebrow">Canada&apos;s most trusted and loved marketplace</h1>
          <a className="ad-choice" href="#">
            AdChoices ▷
          </a>
        </div>

        {dbUnreachable && (
          <div
            style={{
              margin: '12px 0',
              padding: '10px 14px',
              borderRadius: 8,
              background: '#FDECEC',
              color: '#8A1F1F',
              fontSize: 13,
            }}
          >
            Couldn&apos;t reach the listings database. Make sure MongoDB is reachable, then reload.
          </div>
        )}

        <SectionHeading
          title="Homepage Gallery"
          linkText="See All"
          linkHref="/browse?featured=true"
          showInfo
          showYourAd
        />
        {loading ? <RowSkeleton /> : <ListingRow products={gallery.data?.items ?? []} />}

        <SectionHeading
          title="Recently added near you"
          linkText="See All"
          linkHref="/browse?sort=newest"
        />
        {loading ? <RowSkeleton /> : <ListingRow products={recent.data?.items ?? []} />}

        <section className="popular-section">
          <SectionHeading title="Popular near you" />
          <div className="pill-grid">
            {popularSearches.map((term) => (
              <Link href={`/browse?q=${encodeURIComponent(term)}`} key={term}>
                {term}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading
            title="Autos in Canada"
            linkText="Browse All Autos"
            linkHref="/browse?group=Cars%20%26%20Vehicles"
          />
          <CategoryTiles
            categories={byGroup('Cars & Vehicles').slice(0, 8)}
            className="category-tiles-autos"
          />
          <SectionHeading
            title="Popular listings in Autos"
            linkText="See All"
            linkHref="/browse?group=Cars%20%26%20Vehicles"
          />
          <ListingRow products={autos.data?.items ?? []} />
        </section>

        <section style={{ marginTop: '32px' }}>
          <SectionHeading
            title="Real Estate in Canada"
            linkText="Browse All Real Estate"
            linkHref="/browse?group=Real%20Estate"
          />
          <CategoryTiles categories={byGroup('Real Estate').slice(0, 3)} />
          <SectionHeading
            title="Popular listings in Real Estate"
            linkText="See All"
            linkHref="/browse?group=Real%20Estate"
          />
          <ListingRow products={realEstate.data?.items ?? []} />
        </section>

        <div className="member-banner">
          <h2>Kijiji&apos;s better when you&apos;re a member</h2>
          <p>
            See more relevant listings, find the things you&apos;re looking for quicker, and more!
          </p>
          <Link href="/admin/login">
            <button type="button">Sign In</button>
          </Link>
        </div>

        <section>
          <SectionHeading
            title="Buy and Sell in Canada"
            linkText="Browse All Buy and Sell"
            linkHref="/browse?group=Buy%20%26%20Sell"
          />
          <CategoryTiles categories={byGroup('Buy & Sell').slice(0, 3)} />
          <SectionHeading
            title="Popular listings in Buy and Sell"
            linkText="See All"
            linkHref="/browse?group=Buy%20%26%20Sell"
          />
          <ListingRow products={buySell.data?.items ?? []} />
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}
