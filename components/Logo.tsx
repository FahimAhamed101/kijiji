import Image from 'next/image'

/**
 * Poorprice brand marks.
 *
 * The supplied master artwork is a white-on-black lockup, so a single file can't
 * serve every surface: on the site's white chrome the white "P" stem, the cart
 * and the wordmark all disappear. Two tone variants are therefore shipped —
 * pick by the surface the mark sits on, not by how the mark looks:
 *
 *   tone="on-light"  dark artwork  -> for white/light surfaces (site header, admin)
 *   tone="on-dark"   light artwork -> for dark surfaces (footer, dark hero)
 */
export type LogoTone = 'on-light' | 'on-dark'

const MARK: Record<LogoTone, { src: string; w: number; h: number }> = {
  'on-light': { src: '/brand/poorprice-mark-dark.webp', w: 400, h: 235 },
  'on-dark': { src: '/brand/poorprice-mark.webp', w: 400, h: 235 },
}

const LOCKUP: Record<LogoTone, { src: string; w: number; h: number }> = {
  'on-light': { src: '/brand/poorprice-horizontal-dark.webp', w: 900, h: 192 },
  'on-dark': { src: '/brand/poorprice-horizontal.webp', w: 900, h: 192 },
}

/** The emblem alone — the shopping-cart "P". Use where space is tight. */
export function LogoMark({
  tone = 'on-light',
  height = 32,
  className = '',
  alt = '',
}: {
  tone?: LogoTone
  /** Rendered height in px; width follows the artwork's aspect ratio. */
  height?: number
  className?: string
  alt?: string
}) {
  const art = MARK[tone]
  // The mark is ~1.67:1, so height * 1.67 is the CSS width. Without `sizes`
  // next/image assumes full-viewport width and generates a 3840px candidate —
  // an upscale of the source, which is slow and pointless for a small mark.
  const cssWidth = Math.round(height * (art.w / art.h))
  return (
    <Image
      src={art.src}
      alt={alt}
      width={art.w}
      height={art.h}
      sizes={`${cssWidth}px`}
      style={{ height, width: 'auto' }}
      className={className}
      priority={alt !== ''}
      aria-hidden={alt === '' ? true : undefined}
    />
  )
}

/** Emblem + wordmark, side by side. The default for headers and sign-in screens. */
export function LogoLockup({
  tone = 'on-light',
  height = 36,
  className = '',
  alt = 'Poorprice.com',
}: {
  tone?: LogoTone
  height?: number
  className?: string
  alt?: string
}) {
  const art = LOCKUP[tone]
  const cssWidth = Math.round(height * (art.w / art.h))
  return (
    <Image
      src={art.src}
      alt={alt}
      width={art.w}
      height={art.h}
      sizes={`${cssWidth}px`}
      style={{ height, width: 'auto' }}
      className={className}
      priority
    />
  )
}
