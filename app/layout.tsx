import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Poorprice.com — Canada’s Marketplace',
  description:
    'Buy and sell locally on Poorprice.com — a responsive marketplace with a MongoDB-backed admin panel.',
  applicationName: 'Poorprice.com',
  openGraph: {
    title: 'Poorprice.com — Canada’s Marketplace',
    description: 'Buy and sell locally on Poorprice.com.',
    siteName: 'Poorprice.com',
    images: [{ url: '/brand/poorprice-lockup-dark.png', width: 900, height: 606 }],
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
