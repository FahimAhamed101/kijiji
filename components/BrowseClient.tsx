'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, X } from 'lucide-react'
import { useGetProductsQuery } from '@/store/productsApi'
import { useGetCategoriesQuery } from '@/store/categoriesApi'
import SiteHeader from '@/components/SiteHeader'
import type { CategorySelection } from '@/components/CategoryPicker'
import SiteFooter from '@/components/SiteFooter'
import { priceLabel, primaryImage, timeAgo, type Product } from '@/store/types'

export type BrowseFilters = {
  q: string
  category: string
  group: string
  featured: string
  sort: string
  page: number
}

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'popular', label: 'Most viewed' },
  { value: 'title', label: 'Title A–Z' },
]

export default function BrowseClient({ initial }: { initial: BrowseFilters }) {
  const [filters, setFilters] = useState<BrowseFilters>(initial)
  const [search, setSearch] = useState(initial.q)
  const [showFilters, setShowFilters] = useState(false)

  const { data: categoriesData } = useGetCategoriesQuery()
  const categories = categoriesData?.items ?? []

  // `filters` is seeded from the URL, but a search submitted from the header
  // navigates and re-renders the server component — so adopt the new params
  // rather than keeping stale state.
  const { q: iq, category: ic, group: ig, featured: if_, sort: is, page: ip } = initial
  useEffect(() => {
    setFilters({ q: iq, category: ic, group: ig, featured: if_, sort: is, page: ip })
    setSearch(iq)
  }, [iq, ic, ig, if_, is, ip])

  // Debounce the free-text box.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === search ? f : { ...f, q: search, page: 1 }))
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  // Keep the URL in sync so results are shareable / bookmarkable.
  useEffect(() => {
    const sp = new URLSearchParams()
    if (filters.q) sp.set('q', filters.q)
    if (filters.category !== 'all') sp.set('category', filters.category)
    if (filters.group !== 'all') sp.set('group', filters.group)
    if (filters.featured !== 'all') sp.set('featured', filters.featured)
    if (filters.sort !== 'newest') sp.set('sort', filters.sort)
    if (filters.page > 1) sp.set('page', String(filters.page))
    const qs = sp.toString()
    window.history.replaceState(null, '', qs ? `/browse?${qs}` : '/browse')
  }, [filters])

  const query = useMemo(
    () => ({
      q: filters.q || undefined,
      category: filters.category === 'all' ? undefined : filters.category,
      group: filters.group === 'all' ? undefined : filters.group,
      featured: filters.featured === 'all' ? undefined : filters.featured,
      sort: filters.sort,
      page: filters.page,
      limit: 24,
    }),
    [filters]
  )

  const { data, isLoading, isFetching, isError } = useGetProductsQuery(query)

  const items = data?.items ?? []
  const activeFilters =
    (filters.q ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.group !== 'all' ? 1 : 0) +
    (filters.featured !== 'all' ? 1 : 0)

  const activeCategory = categories.find((c) => c.slug === filters.category)

  function patch(next: Partial<BrowseFilters>) {
    setFilters((f) => ({ ...f, ...next, page: next.page ?? 1 }))
  }

  function reset() {
    setSearch('')
    setFilters({ q: '', category: 'all', group: 'all', featured: 'all', sort: 'newest', page: 1 })
  }

  const groups = Array.from(new Set(categories.map((c) => c.group)))
  const groupedCategories = groups
    .map((g) => ({ group: g, items: categories.filter((c) => c.group === g) }))
    .filter((g) => g.items.length > 0)

  // The header's category picker is controlled here so picking a category
  // filters in place, and sidebar changes reflect back into the picker.
  const pickerSelection: CategorySelection =
    filters.category !== 'all'
      ? { type: 'category', slug: filters.category }
      : filters.group !== 'all'
        ? { type: 'group', group: filters.group }
        : { type: 'all' }

  function applyPickerSelection(next: CategorySelection) {
    if (next.type === 'category') patch({ category: next.slug, group: 'all' })
    else if (next.type === 'group') patch({ category: 'all', group: next.group })
    else patch({ category: 'all', group: 'all' })
  }

  return (
    <main className="site-shell">
      <SiteHeader
        initialQuery={filters.q}
        category={pickerSelection}
        onCategoryChange={applyPickerSelection}
      />

      <nav className="detail-breadcrumb-bar" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="crumb-sep">&gt;</span>
        {activeCategory ? (
          <>
            <Link href={`/browse?group=${encodeURIComponent(activeCategory.group)}`}>
              {activeCategory.group}
            </Link>
            <span className="crumb-sep">&gt;</span>
            <span>{activeCategory.name}</span>
          </>
        ) : (
          <span>All listings</span>
        )}
      </nav>

      <div className="mx-auto w-full max-w-shell px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink">
              {filters.q
                ? `Results for “${filters.q}”`
                : activeCategory
                  ? activeCategory.name
                  : filters.group !== 'all'
                    ? filters.group
                    : 'All listings'}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {isLoading ? 'Searching…' : `${data?.total ?? 0} listing${data?.total === 1 ? '' : 's'} found`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 text-sm font-medium text-ink hover:bg-surface lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <span className="rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">
                  {activeFilters}
                </span>
              )}
            </button>

            <select
              value={filters.sort}
              onChange={(e) => patch({ sort: e.target.value })}
              aria-label="Sort results"
              className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink focus:border-brand focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters sidebar */}
          <aside
            className={`${showFilters ? 'block' : 'hidden'} shrink-0 lg:block lg:w-64`}
            aria-label="Filters"
          >
            <div className="space-y-5 rounded-card border border-line bg-canvas p-4 shadow-card">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Keyword
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search listings…"
                  className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Show
                </p>
                <div className="space-y-1.5">
                  <FilterRadio
                    label="All listings"
                    checked={filters.category === 'all' && filters.group === 'all' && filters.featured === 'all'}
                    onChange={() => patch({ category: 'all', group: 'all', featured: 'all' })}
                  />
                  <FilterRadio
                    label="Featured only"
                    checked={filters.featured === 'true'}
                    onChange={() => patch({ featured: 'true', category: 'all', group: 'all' })}
                  />
                </div>
              </div>

              {groupedCategories.map(({ group, items: cats }) => (
                <div key={group}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {group}
                  </p>
                  <div className="space-y-1.5">
                    <FilterRadio
                      label={`All in ${group}`}
                      checked={filters.group === group && filters.category === 'all'}
                      onChange={() => patch({ group, category: 'all', featured: 'all' })}
                    />
                    {cats.map((c) => (
                      <FilterRadio
                        key={c._id}
                        label={c.name}
                        count={c.productCount}
                        checked={filters.category === c.slug}
                        onChange={() => patch({ category: c.slug, group: 'all', featured: 'all' })}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  <X className="h-3 w-3" />
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0 flex-1">
            {isError ? (
              <div className="rounded-card border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-800">
                Couldn&apos;t load listings. Check the database connection and try again.
              </div>
            ) : isLoading ? (
              <ProductGridSkeleton />
            ) : items.length === 0 ? (
              <div className="rounded-card border border-dashed border-line bg-surface/60 px-6 py-16 text-center">
                <p className="text-sm font-medium text-ink">No listings match your search</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Try a different keyword or clear the filters.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
                  <div className="similar-grid !grid-cols-2 sm:!grid-cols-3 xl:!grid-cols-4" role="list">
                    {items.map((p) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                </div>

                {data && data.pages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={data.page <= 1}
                      onClick={() => patch({ page: data.page - 1 })}
                      className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm font-medium text-ink hover:bg-surface disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-ink-muted">
                      Page {data.page} of {data.pages}
                    </span>
                    <button
                      type="button"
                      disabled={data.page >= data.pages}
                      onClick={() => patch({ page: data.page + 1 })}
                      className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm font-medium text-ink hover:bg-surface disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  )
}

function FilterRadio({
  label,
  count,
  checked,
  onChange,
}: {
  label: string
  count?: number
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 border-line text-brand focus:ring-brand/30"
      />
      <span className={checked ? 'font-medium text-ink' : 'text-ink-soft'}>{label}</span>
      {typeof count === 'number' && <span className="text-xs text-ink-muted">({count})</span>}
    </label>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="similar-card" role="listitem">
      <Link href={`/listing/${product.slug}`} className="block">
        <div className="card-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={primaryImage(product)} alt={product.title} loading="lazy" />
        </div>
        <div className="similar-card-body">
          <p title={product.title}>{product.title}</p>
          <small>{product.location}</small>
          <div className="similar-card-footer">
            <strong>{priceLabel(product)}</strong>
            <span className="text-[11px] text-ink-muted">{timeAgo(product.createdAt)}</span>
          </div>
        </div>
      </Link>
    </article>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="similar-grid !grid-cols-2 sm:!grid-cols-3 xl:!grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="similar-card" key={i}>
          <div className="card-thumb" style={{ background: '#EFEDF3' }} />
          <div className="similar-card-body">
            <p style={{ background: '#EFEDF3', color: 'transparent', borderRadius: 4 }}>
              Loading
            </p>
            <small style={{ background: '#EFEDF3', color: 'transparent', borderRadius: 4 }}>
              Loading
            </small>
          </div>
        </div>
      ))}
    </div>
  )
}
