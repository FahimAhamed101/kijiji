import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { LogoMark } from '@/components/Logo'

/**
 * Shared chrome for the storefront account pages.
 *
 * Presentational only — no hooks — so both the sign-in and sign-up pages (which
 * are client components) can render it without duplicating the layout.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  altAction,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  altAction?: { prompt: string; label: string; href: string }
}) {
  return (
    <main className="site-shell">
      <SiteHeader />

      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <LogoMark tone="on-light" height={34} alt="Poorprice.com" />
          </div>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>

          {children}
        </div>

        {altAction && (
          <p className="auth-alt">
            {altAction.prompt}{' '}
            <Link href={altAction.href}>{altAction.label}</Link>
          </p>
        )}
      </div>

      <SiteFooter />
    </main>
  )
}
