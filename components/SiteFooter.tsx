import Link from 'next/link'

function AppleLogo() {
  return (
    <svg viewBox="0 0 170 170" width="16" height="16" fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.42-9.78-11.53-20.87-15.32-33.28-3.79-12.41-5.69-24.38-5.69-35.91 0-14.67 3.8-26.68 11.39-36.03 7.6-9.35 16.98-14.15 28.16-14.4 5.33 0 11.16 1.3 17.5 3.9 6.34 2.6 10.15 3.95 11.45 4.05 1.74-.22 5.76-1.63 12.06-4.22 6.3-2.6 11.75-3.79 16.36-3.56 12.18.65 22.06 5.11 29.62 13.38-10.65 6.52-15.86 15.42-15.65 26.71.22 8.91 3.59 16.4 10.11 22.48 6.52 6.08 14.12 9.67 22.81 10.75-2.39 7.18-5.43 14.67-9.12 22.46zM119.22 33.02c0-7.39 2.6-14.45 7.82-21.18 5.21-6.73 11.83-11.19 19.86-13.38.33 1.09.49 2.18.49 3.26 0 7.39-2.72 14.34-8.15 20.85-5.43 6.52-12.06 10.65-19.89 12.4-.13-.65-.13-1.31-.13-1.95z" />
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

/** Shared marketplace footer. */
export default function SiteFooter() {
  return (
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
            <Link href="/browse">Browse all listings</Link>
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
            <h2>ADMIN</h2>
            <Link href="/admin">Admin panel</Link>
            <Link href="/admin/login">Staff sign in</Link>
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
  )
}
