'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useCreateProductMutation } from '@/store/productsApi'
import ProductForm, { emptyProduct, type ProductFormValues } from '@/components/admin/ProductForm'
import { PageHeader } from '@/components/admin/ui'

export default function NewProductPage() {
  const router = useRouter()
  const [createProduct, { isLoading }] = useCreateProductMutation()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: ProductFormValues) {
    setError(null)
    try {
      const created = await createProduct(values).unwrap()
      router.push(`/admin/products/${created._id}`)
    } catch (err) {
      setError(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not create the listing.'
      )
    }
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
        title="New listing"
        subtitle="Publish a new ad to the marketplace."
      />

      <ProductForm
        initial={emptyProduct()}
        submitting={isLoading}
        error={error}
        submitLabel="Create listing"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/products')}
      />
    </>
  )
}
