'use client'

import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, Star, UploadCloud } from 'lucide-react'
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  type CategoryInput,
} from '@/store/categoriesApi'
import { useGetMeQuery } from '@/store/authApi'
import {
  Alert,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  TableShell,
  Td,
  Textarea,
  Th,
} from '@/components/admin/ui'
import type { Category } from '@/store/types'

const GROUPS = [
  'Buy & Sell',
  'Cars & Vehicles',
  'Real Estate',
  'Jobs',
  'Services',
  'Pets',
  'Community',
  'Vacation Rentals',
]

type Draft = CategoryInput & { _id?: string }

const EMPTY: Draft = {
  name: '',
  group: 'Buy & Sell',
  description: '',
  image: '',
  order: 0,
  featured: false,
  active: true,
}

export default function AdminCategoriesPage() {
  const [groupFilter, setGroupFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(true)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  async function handleCategoryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'kijiji_categories')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url && draft) {
        setDraft({ ...draft, image: data.url })
      }
    } catch {
      // ignore
    } finally {
      setUploadingImage(false)
    }
  }

  const { data: me } = useGetMeQuery()
  const isAdmin = me?.user?.role === 'admin'

  const { data, isLoading, isError, error, refetch } = useGetCategoriesQuery({
    withCounts: 'true',
  })

  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation()

  const items = useMemo(() => {
    let list = data?.items ?? []
    if (groupFilter !== 'all') list = list.filter((c) => c.group === groupFilter)
    if (!showInactive) list = list.filter((c) => c.active)
    return list
  }, [data, groupFilter, showInactive])

  async function save() {
    if (!draft) return
    if (draft.name.trim().length < 2) {
      setFormError('Name must be at least 2 characters.')
      return
    }
    setFormError(null)
    try {
      if (draft._id) {
        const { _id, ...body } = draft
        await updateCategory({ id: _id, ...body }).unwrap()
        setNotice(`Updated “${draft.name}”.`)
      } else {
        await createCategory(draft).unwrap()
        setNotice(`Created “${draft.name}”.`)
      }
      setDraft(null)
    } catch (err) {
      setFormError(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not save the category.'
      )
    }
  }

  async function toggle(category: Category, field: 'active' | 'featured') {
    try {
      await updateCategory({ id: category._id, [field]: !category[field] }).unwrap()
    } catch (err) {
      setNotice(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not update the category.'
      )
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteCategory(pendingDelete._id).unwrap()
      setNotice(`Deleted “${pendingDelete.name}”.`)
    } catch (err) {
      setNotice(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not delete the category.'
      )
    }
    setPendingDelete(null)
  }

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="The taxonomy that drives navigation, tiles and filters."
        actions={
          <Button
            onClick={() => {
              setDraft({ ...EMPTY })
              setFormError(null)
            }}
          >
            <Plus className="h-4 w-4" />
            New category
          </Button>
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

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-line bg-canvas p-4 shadow-card">
        <Select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="!w-auto"
          aria-label="Filter by group"
        >
          <option value="all">All groups</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>

        <Checkbox
          label="Show hidden categories"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
        />

        <span className="ml-auto text-xs text-ink-muted">
          {items.length} categor{items.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      {isError ? (
        <ErrorState
          message={
            (error as { data?: { error?: string } })?.data?.error ??
            'Could not load categories.'
          }
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center text-ink-muted">
          <Spinner className="h-6 w-6" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No categories here"
          description="Create a category to organise listings."
          action={
            <Button onClick={() => setDraft({ ...EMPTY })}>
              <Plus className="h-4 w-4" />
              New category
            </Button>
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Category</Th>
              <Th>Group</Th>
              <Th>Listings</Th>
              <Th>Order</Th>
              <Th>Featured</Th>
              <Th>Visible</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c._id} className="hover:bg-surface/60">
                <Td>
                  <div className="flex items-center gap-3">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.image}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-md border border-line object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-xs font-semibold text-ink-muted">
                        {c.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{c.name}</p>
                      <p className="font-mono text-[11px] text-ink-muted">/{c.slug}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className="text-xs">{c.group}</span>
                </Td>
                <Td>
                  <span className="text-sm font-medium text-ink">{c.productCount ?? 0}</span>
                </Td>
                <Td>
                  <span className="text-xs text-ink-muted">{c.order}</span>
                </Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => toggle(c, 'featured')}
                    title="Toggle featured"
                    className={`rounded-md p-1.5 ${
                      c.featured
                        ? 'text-amber-500 hover:bg-amber-50'
                        : 'text-ink-muted hover:bg-surface'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${c.featured ? 'fill-current' : ''}`} />
                  </button>
                </Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => toggle(c, 'active')}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      c.active ? 'bg-emerald-500' : 'bg-line'
                    }`}
                    aria-label={c.active ? 'Hide category' : 'Show category'}
                    aria-pressed={c.active}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        c.active ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </Td>
                <Td className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => {
                        setDraft({
                          _id: c._id,
                          name: c.name,
                          group: c.group,
                          description: c.description,
                          image: c.image,
                          order: c.order,
                          featured: c.featured,
                          active: c.active,
                        })
                        setFormError(null)
                      }}
                      className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-brand"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => setPendingDelete(c)}
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
      )}

      {/* Create / edit modal */}
      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?._id ? 'Edit category' : 'New category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)} disabled={creating || updating}>
              Cancel
            </Button>
            <Button onClick={save} loading={creating || updating}>
              {draft?._id ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            {formError && <Alert tone="danger">{formError}</Alert>}

            <Field label="Name" required>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Apartments & Condos for Rent"
                autoFocus
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Group">
                <Select
                  value={draft.group}
                  onChange={(e) => setDraft({ ...draft, group: e.target.value })}
                >
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Sort order" hint="Lower numbers appear first.">
                <Input
                  type="number"
                  value={draft.order ?? 0}
                  onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
                />
              </Field>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Tile image
                </span>
                {uploadingImage && (
                  <span className="text-xs text-brand animate-pulse">Uploading to Cloudinary…</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={draft.image ?? ''}
                  onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                  placeholder="https://res.cloudinary.com/… or https://images.unsplash.com/…"
                  className="flex-1"
                />
                <label className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-2 text-xs font-medium text-ink hover:bg-surface cursor-pointer shrink-0 transition-colors">
                  {uploadingImage ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <UploadCloud className="h-3.5 w-3.5 text-brand" />
                  )}
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              {draft.image && (
                <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.image} alt="Preview" className="h-10 w-10 rounded object-cover border border-line" />
                  <span className="truncate text-xs text-ink-muted font-mono">{draft.image}</span>
                </div>
              )}
            </div>

            <Field label="Description">
              <Textarea
                rows={3}
                value={draft.description ?? ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Shown on the category landing page."
              />
            </Field>

            <div className="flex flex-wrap gap-5">
              <Checkbox
                label="Show in navigation"
                checked={draft.active ?? true}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              <Checkbox
                label="Featured"
                checked={draft.featured ?? false}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete category"
        message={`“${pendingDelete?.name ?? ''}” will be permanently removed. Categories that still have listings cannot be deleted.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
