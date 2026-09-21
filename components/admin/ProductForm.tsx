'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useGetCategoriesQuery } from '@/store/categoriesApi'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/admin/ui'
import type { Product } from '@/store/types'

export type ProductFormValues = {
  title: string
  description: string
  price: number
  priceOnRequest: boolean
  category: string | null
  location: string
  images: string[]
  brand: string
  condition: string
  status: string
  featured: boolean
  urgent: boolean
  tags: string[]
  seller: {
    name: string
    phone: string
    email: string
    location: string
    verified: boolean
  }
}

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like new' },
  { value: 'used', label: 'Used' },
  { value: 'for-parts', label: 'For parts' },
]

const STATUSES = [
  { value: 'active', label: 'Active (visible on the site)' },
  { value: 'draft', label: 'Draft (hidden)' },
  { value: 'sold', label: 'Sold' },
  { value: 'archived', label: 'Archived' },
]

export function emptyProduct(): ProductFormValues {
  return {
    title: '',
    description: '',
    price: 0,
    priceOnRequest: false,
    category: null,
    location: 'Canada',
    images: [],
    brand: '',
    condition: 'used',
    status: 'active',
    featured: false,
    urgent: false,
    tags: [],
    seller: { name: '', phone: '', email: '', location: '', verified: false },
  }
}

export function toFormValues(product: Product): ProductFormValues {
  return {
    title: product.title,
    description: product.description ?? '',
    price: product.price ?? 0,
    priceOnRequest: product.priceOnRequest ?? false,
    category:
      product.category && typeof product.category === 'object' ? product.category._id : null,
    location: product.location ?? 'Canada',
    images: product.images ?? [],
    brand: product.brand ?? '',
    condition: product.condition ?? 'used',
    status: product.status ?? 'active',
    featured: product.featured ?? false,
    urgent: product.urgent ?? false,
    tags: product.tags ?? [],
    seller: {
      name: product.seller?.name ?? '',
      phone: product.seller?.phone ?? '',
      email: product.seller?.email ?? '',
      location: product.seller?.location ?? '',
      verified: product.seller?.verified ?? false,
    },
  }
}

export default function ProductForm({
  initial,
  submitting,
  error,
  submitLabel = 'Save listing',
  onSubmit,
  onCancel,
}: {
  initial: ProductFormValues
  submitting?: boolean
  error?: string | null
  submitLabel?: string
  onSubmit: (values: ProductFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<ProductFormValues>(initial)
  const [tagInput, setTagInput] = useState('')
  const [imageInput, setImageInput] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const { data: categoriesData } = useGetCategoriesQuery()

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function setSeller<K extends keyof ProductFormValues['seller']>(
    key: K,
    value: ProductFormValues['seller'][K]
  ) {
    setValues((prev) => ({ ...prev, seller: { ...prev.seller, [key]: value } }))
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (!tag || values.tags.includes(tag)) return setTagInput('')
    set('tags', [...values.tags, tag])
    setTagInput('')
  }

  function addImage() {
    const url = imageInput.trim()
    if (!url || values.images.includes(url)) return setImageInput('')
    set('images', [...values.images, url])
    setImageInput('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (values.title.trim().length < 3) {
      setLocalError('Title must be at least 3 characters.')
      return
    }
    setLocalError(null)
    onSubmit({
      ...values,
      title: values.title.trim(),
      price: Number(values.price) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      {/* Main column */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-ink">Listing details</h2>
          <div className="space-y-4">
            <Field label="Title" required>
              <Input
                value={values.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Grey fabric sectional sofa with chaise"
                maxLength={140}
                required
              />
            </Field>

            <Field label="Description" hint="Plain text. Line breaks are preserved.">
              <Textarea
                rows={6}
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Condition, dimensions, pickup details…"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select
                  value={values.category ?? ''}
                  onChange={(e) => set('category', e.target.value || null)}
                >
                  <option value="">— No category —</option>
                  {categoriesData?.items.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.group} › {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Location">
                <Input
                  value={values.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="Toronto, ON"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (CAD)" hint="Ignored when “price on request” is on.">
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={values.price}
                  disabled={values.priceOnRequest}
                  onChange={(e) => set('price', Number(e.target.value))}
                />
              </Field>

              <Field label="Brand">
                <Input
                  value={values.brand}
                  onChange={(e) => set('brand', e.target.value)}
                  placeholder="Apple, Samsung…"
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-5 pt-1">
              <Checkbox
                label="Price on request (show “Please Contact”)"
                checked={values.priceOnRequest}
                onChange={(e) => set('priceOnRequest', e.target.checked)}
              />
            </div>

            <Field label="Condition">
              <Select
                value={values.condition}
                onChange={(e) => set('condition', e.target.value)}
                className="max-w-xs"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-ink">Images</h2>
          <div className="flex gap-2">
            <Input
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addImage()
                }
              }}
              placeholder="https://images.example.com/photo.jpg"
            />
            <Button type="button" variant="secondary" onClick={addImage}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            The first image is used as the thumbnail on listing cards.
          </p>

          {values.images.length > 0 && (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {values.images.map((url, i) => (
                <li key={url} className="group relative overflow-hidden rounded-lg border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-24 w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => set('images', values.images.filter((u) => u !== url))}
                    className="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1 text-red-600 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-ink">Seller / contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={values.seller.name}
                onChange={(e) => setSeller('name', e.target.value)}
                placeholder="Kijiji Member"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={values.seller.phone}
                onChange={(e) => setSeller('phone', e.target.value)}
                placeholder="+1 416 555 0100"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={values.seller.email}
                onChange={(e) => setSeller('email', e.target.value)}
                placeholder="seller@example.com"
              />
            </Field>
            <Field label="Seller location">
              <Input
                value={values.seller.location}
                onChange={(e) => setSeller('location', e.target.value)}
                placeholder="Toronto, ON"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Checkbox
              label="Verified seller"
              checked={values.seller.verified}
              onChange={(e) => setSeller('verified', e.target.checked)}
            />
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-ink">Publishing</h2>
          <div className="space-y-4">
            <Field label="Status">
              <Select value={values.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="space-y-2.5">
              <Checkbox
                label="Featured on the homepage"
                checked={values.featured}
                onChange={(e) => set('featured', e.target.checked)}
              />
              <Checkbox
                label="Mark as urgent"
                checked={values.urgent}
                onChange={(e) => set('urgent', e.target.checked)}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-ink">Tags</h2>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="winter, tires…"
            />
            <Button type="button" variant="secondary" onClick={addTag}>
              Add
            </Button>
          </div>
          {values.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {values.tags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => set('tags', values.tags.filter((t) => t !== tag))}
                    className="text-ink-muted hover:text-red-600"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {(localError || error) && <Alert tone="danger">{localError || error}</Alert>}

        <div className="flex items-center gap-2">
          <Button type="submit" loading={submitting} className="flex-1">
            {submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  )
}
