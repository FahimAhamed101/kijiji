'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react'
import {
  useGetProductQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '@/store/productsApi'
import { useGetMeQuery } from '@/store/authApi'
import ProductForm, { toFormValues, type ProductFormValues } from '@/components/admin/ProductForm'
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  PageHeader,
  Spinner,
} from '@/components/admin/ui'
import { formatDate, priceLabel } from '@/store/types'

export default function EditProductPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()

  const { data: product, isLoading, isError, error, refetch } = useGetProductQuery(id)
  const { data: me } = useGetMeQuery()
  const isAdmin = me?.user?.role === 'admin'

  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation()
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation()

  const [error_, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const initial = useMemo(() => (product ? toFormValues(product) : null), [product])

  async function handleSubmit(values: ProductFormValues) {
    setError(null)
    try {
      await updateProduct({ id, ...values }).unwrap()
      setNotice('Changes saved.')
    } catch (err) {
      setError((err as { data?: { error?: string } })?.data?.error ?? 'Could not save changes.')
    }
  }

  async function handleDelete() {
    try {
      await deleteProduct(id).unwrap()
      router.push('/admin/products')
    } catch (err) {
      setError((err as { data?: { error?: string } })?.data?.error ?? 'Delete failed.')
      setConfirmOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-muted">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (isError || !product || !initial) {
    return (
      <>
        <PageHeader title="Edit listing" />
        <ErrorState
          message={
            (error as { data?: { error?: string } })?.data?.error ?? 'Listing not found.'
          }
          onRetry={refetch}
        />
        <div className="mt-4">
          <Link href="/admin/products" className="text-sm text-brand hover:underline">
            ← Back to listings
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>

      <PageHeader
        title={product.title}
        subtitle={`${priceLabel(product)} · added ${formatDate(product.createdAt)}`}
        actions={
          <>
            <Link
              href={`/listing/${product.slug}`}
              target="_blank"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line bg-canvas px-4 text-sm font-medium text-ink hover:bg-surface"
            >
              <ExternalLink className="h-4 w-4" />
              View on site
            </Link>
            {isAdmin && (
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </>
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

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Views" value={product.views ?? 0} />
        <StatTile label="Status" value={product.status} capitalize />
        <StatTile label="Slug" value={product.slug} mono />
      </div>

      <ProductForm
        initial={initial}
        submitting={saving}
        error={error_}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/products')}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete listing"
        message={`“${product.title}” will be permanently removed. This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}

function StatTile({
  label,
  value,
  capitalize,
  mono,
}: {
  label: string
  value: string | number
  capitalize?: boolean
  mono?: boolean
}) {
  return (
    <Card className="!p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p
        className={`mt-1 truncate text-sm font-semibold text-ink ${capitalize ? 'capitalize' : ''} ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {value}
      </p>
    </Card>
  )
}
