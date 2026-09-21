'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Pencil, Plus, Search, Trash2, Star, Eye, Copy } from 'lucide-react'
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useUpdateProductMutation,
  useCreateProductMutation,
} from '@/store/productsApi'
import { useGetCategoriesQuery } from '@/store/categoriesApi'
import { useGetMeQuery } from '@/store/authApi'
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  Select,
  Spinner,
  StatusBadge,
  TableShell,
  Td,
  Th,
} from '@/components/admin/ui'
import { priceLabel, primaryImage, timeAgo, type Product } from '@/store/types'

const STATUSES = ['all', 'active', 'draft', 'sold', 'archived'] as const
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'popular', label: 'Most viewed' },
  { value: 'title', label: 'Title A–Z' },
]

export default function AdminProductsPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [category, setCategory] = useState('all')
  const [featured, setFeatured] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const { data: me } = useGetMeQuery()
  const isAdmin = me?.user?.role === 'admin'

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const query = useMemo(
    () => ({
      q: debounced || undefined,
      status: status === 'all' ? undefined : status,
      category: category === 'all' ? undefined : category,
      featured: featured === 'all' ? undefined : featured,
      sort,
      page,
      limit: 12,
      all: 'true', // admins see drafts + archived
    }),
    [debounced, status, category, featured, sort, page]
  )

  const { data, isLoading, isFetching, isError, error, refetch } = useGetProductsQuery(query)
  const { data: categoriesData } = useGetCategoriesQuery({ withCounts: 'true' })

  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation()
  const [updateProduct] = useUpdateProductMutation()
  const [createProduct] = useCreateProductMutation()

  const items = data?.items ?? []
  const selectedIds = Object.keys(selected).filter((id) => selected[id])

  function toggleAll(checked: boolean) {
    if (!checked) return setSelected({})
    setSelected(Object.fromEntries(items.map((p) => [p._id, true])))
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteProduct(pendingDelete._id).unwrap()
      setNotice(`Deleted “${pendingDelete.title}”.`)
      setPendingDelete(null)
    } catch (err) {
      setNotice((err as { data?: { error?: string } })?.data?.error ?? 'Delete failed.')
      setPendingDelete(null)
    }
  }

  async function bulkStatus(next: 'active' | 'draft' | 'sold' | 'archived') {
    await Promise.all(
      selectedIds.map((id) => updateProduct({ id, status: next }).unwrap().catch(() => null))
    )
    setNotice(`Updated ${selectedIds.length} listing(s) to “${next}”.`)
    setSelected({})
  }

  async function bulkDelete() {
    const results = await Promise.allSettled(
      selectedIds.map((id) => deleteProduct(id).unwrap())
    )
    const ok = results.filter((r) => r.status === 'fulfilled').length
    setNotice(`Deleted ${ok} of ${selectedIds.length} listing(s).`)
    setBulkDeleteOpen(false)
    setSelected({})
  }

  async function duplicate(product: Product) {
    const catId =
      product.category && typeof product.category === 'object' ? product.category._id : null
    try {
      await createProduct({
        title: `${product.title} (copy)`,
        description: product.description,
        price: product.price,
        priceOnRequest: product.priceOnRequest,
        category: catId,
        location: product.location,
        images: product.images,
        brand: product.brand,
        condition: product.condition,
        status: 'draft',
        featured: false,
        urgent: false,
        tags: product.tags,
        seller: product.seller,
      }).unwrap()
      setNotice(`Duplicated “${product.title}” as a draft.`)
    } catch (err) {
      setNotice(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not duplicate that listing.'
      )
    }
  }

  return (
    <>
      <PageHeader
        title="Listings"
        subtitle="Create, edit and moderate every ad on the marketplace."
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            New listing
          </Link>
        }
      />

      {notice && (
        <Alert tone="success" className="mb-4 flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-medium underline"
          >
            Dismiss
          </button>
        </Alert>
      )}

      {/* Filters */}
      <div className="mb-4 grid gap-3 rounded-card border border-line bg-canvas p-4 shadow-card sm:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, description, tags…"
            className="pl-9"
            aria-label="Search listings"
          />
        </div>

        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s}
            </option>
          ))}
        </Select>

        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categoriesData?.items.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort listings"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Select
          value={featured}
          onChange={(e) => {
            setFeatured(e.target.value)
            setPage(1)
          }}
          className="!w-auto"
          aria-label="Filter featured"
        >
          <option value="all">Featured: any</option>
          <option value="true">Featured only</option>
          <option value="false">Not featured</option>
        </Select>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2">
            <span className="text-xs font-medium text-brand">
              {selectedIds.length} selected
            </span>
            <Button size="sm" variant="secondary" onClick={() => bulkStatus('active')}>
              Publish
            </Button>
            <Button size="sm" variant="secondary" onClick={() => bulkStatus('draft')}>
              Draft
            </Button>
            <Button size="sm" variant="secondary" onClick={() => bulkStatus('sold')}>
              Mark sold
            </Button>
            {isAdmin && (
              <Button size="sm" variant="danger" onClick={() => setBulkDeleteOpen(true)}>
                Delete
              </Button>
            )}
            <button
              type="button"
              onClick={() => setSelected({})}
              className="text-xs text-ink-muted underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {isError ? (
        <ErrorState
          message={
            (error as { data?: { error?: string } })?.data?.error ?? 'Could not load listings.'
          }
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center text-ink-muted">
          <Spinner className="h-6 w-6" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No listings match these filters"
          description="Try clearing the search or filters, or create a new listing."
          action={
            <Link
              href="/admin/products/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-white hover:bg-brand-dark"
            >
              <Plus className="h-4 w-4" />
              New listing
            </Link>
          }
        />
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <TableShell>
              <thead>
                <tr>
                  <Th className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      className="h-4 w-4 rounded border-line text-brand"
                      checked={selectedIds.length === items.length && items.length > 0}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </Th>
                  <Th>Listing</Th>
                  <Th>Category</Th>
                  <Th>Price</Th>
                  <Th>Status</Th>
                  <Th>Views</Th>
                  <Th>Added</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} className="hover:bg-surface/60">
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.title}`}
                        className="h-4 w-4 rounded border-line text-brand"
                        checked={!!selected[p._id]}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [p._id]: e.target.checked }))
                        }
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={primaryImage(p)}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-md border border-line object-cover"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${p._id}`}
                            className="line-clamp-1 max-w-[280px] font-medium text-ink hover:text-brand hover:underline"
                          >
                            {p.title}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-2">
                            {p.featured && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600">
                                <Star className="h-3 w-3 fill-current" /> Featured
                              </span>
                            )}
                            {p.urgent && (
                              <span className="text-[11px] font-medium text-red-600">Urgent</span>
                            )}
                            <span className="text-[11px] text-ink-muted capitalize">
                              {p.condition}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-xs">
                        {p.category && typeof p.category === 'object'
                          ? p.category.name
                          : '—'}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-medium text-ink">{priceLabel(p)}</span>
                    </Td>
                    <Td>
                      <StatusBadge value={p.status} />
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                        <Eye className="h-3 w-3" />
                        {p.views ?? 0}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-xs text-ink-muted">{timeAgo(p.createdAt)}</span>
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/admin/products/${p._id}`}
                          title="Edit"
                          className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-brand"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          title="Duplicate as draft"
                          onClick={() => duplicate(p)}
                          className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-brand"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setPendingDelete(p)}
                            className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>

          {data && (
            <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          )}
        </>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete listing"
        message={`“${pendingDelete?.title ?? ''}” will be permanently removed. This cannot be undone.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete selected listings"
        message={`${selectedIds.length} listing(s) will be permanently removed. This cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.length}`}
        onConfirm={bulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </>
  )
}
