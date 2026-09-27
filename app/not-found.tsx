import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Page not found — Poorprice.com',
}

export default function NotFound() {
  return (
    <main className="site-shell">
      <SiteHeader />

      <div className="content-shell">
        <div
          style={{
            padding: '72px 0 88px',
            textAlign: 'center',
            maxWidth: 520,
            margin: '0 auto',
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#78747C',
            }}
          >
            Error 404
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: '10px 0 8px' }}>
            We couldn&apos;t find that page
          </h1>
          <p style={{ color: '#78747C', marginBottom: 28, lineHeight: 1.6 }}>
            The listing may have been sold or removed, or the link might be wrong.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/browse"
              style={{
                background: 'var(--brand-primary)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Browse all listings
            </Link>
            <Link
              href="/"
              style={{
                border: '1px solid #E4E1E8',
                padding: '10px 18px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                color: '#1C1B1F',
              }}
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}
