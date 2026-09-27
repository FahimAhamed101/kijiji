'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGetCategoriesQuery } from '@/store/categoriesApi'
import CategoryPicker, { type CategorySelection } from '@/components/CategoryPicker'
import { LogoLockup } from '@/components/Logo'

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4.35-4.35" strokeLinecap="round" />
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
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" strokeLinecap="round" />
    </svg>
  )
}

/** Build the /browse URL for the current search + category selection. */
function browseHref(query: string, selection: CategorySelection): string {
  const sp = new URLSearchParams()
  const q = query.trim()
  if (q) sp.set('q', q)
  if (selection.type === 'category') sp.set('category', selection.slug)
  if (selection.type === 'group') sp.set('group', selection.group)
  const qs = sp.toString()
  return qs ? `/browse?${qs}` : '/browse'
}

/** Shared marketplace header: brand, search, category nav. */
export default function SiteHeader({
  initialQuery = '',
  initialCategory = '',
  initialGroup = '',
  category,
  onCategoryChange,
}: {
  initialQuery?: string
  /** Category slug to preselect. Used when the picker is uncontrolled. */
  initialCategory?: string
  /** Category group to preselect. Used when the picker is uncontrolled. */
  initialGroup?: string
  /** Controlled selection — pass this plus `onCategoryChange` to bind the picker. */
  category?: CategorySelection
  onCategoryChange?: (next: CategorySelection) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [internalSelection, setInternalSelection] = useState<CategorySelection>(() =>
    initialCategory
      ? { type: 'category', slug: initialCategory }
      : initialGroup
        ? { type: 'group', group: initialGroup }
        : { type: 'all' }
  )
  const { data } = useGetCategoriesQuery({ featured: 'true' })

  const isControlled = category !== undefined
  const selection = isControlled ? category : internalSelection

  // Keep the box in step with the page's query (e.g. the browse sidebar).
  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  // Uncontrolled pickers follow the URL-derived props.
  useEffect(() => {
    if (isControlled) return
    setInternalSelection(
      initialCategory
        ? { type: 'category', slug: initialCategory }
        : initialGroup
          ? { type: 'group', group: initialGroup }
          : { type: 'all' }
    )
  }, [initialCategory, initialGroup, isControlled])

  function handleCategoryChange(next: CategorySelection) {
    if (isControlled) {
      onCategoryChange?.(next)
      return
    }
    // No results view to update on this page — apply the filter right away.
    setInternalSelection(next)
    router.push(browseHref(query, next))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    router.push(browseHref(query, selection))
  }

  return (
    <header className="site-header">
      <div className="top-bar">
        <Link href="/" className="brand" aria-label="Poorprice.com home">
          <LogoLockup tone="on-light" height={40} alt="Poorprice.com" />
        </Link>

        <form className="search-area" onSubmit={submit} role="search">
          <label className="search-input">
            <SearchIcon />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              aria-label="Search listings"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>

          <CategoryPicker value={selection} onChange={handleCategoryChange} />

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
          <Link href="/admin">
            <UserIcon /> Register or Sign In
          </Link>
          <Link href="/admin/products/new" className="post-button">
            Post ad
          </Link>
        </div>
      </div>

      <nav className="category-nav" aria-label="Main category navigation">
        <div className="nav-links">
          {(data?.items ?? []).map((cat) => (
            <Link href={`/browse?group=${encodeURIComponent(cat.group)}`} key={cat._id}>
              {cat.name}
            </Link>
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
  )
}
