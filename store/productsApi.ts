import { api } from './api'
import type { Paginated, Product, ProductQuery } from './types'

type ProductInput = {
  title: string
  description?: string
  price?: number
  priceOnRequest?: boolean
  category?: string | null
  location?: string
  images?: string[]
  brand?: string
  condition?: string
  status?: string
  featured?: boolean
  urgent?: boolean
  tags?: string[]
  seller?: {
    name?: string
    phone?: string
    email?: string
    location?: string
    verified?: boolean
  }
}

/** Drop empty values so the query string stays clean. */
function toSearchParams(query: ProductQuery): string {
  const sp = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    sp.set(key, String(value))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const productsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<Paginated<Product>, ProductQuery | void>({
      query: (args) => `/products${toSearchParams((args ?? {}) as ProductQuery)}`,
      providesTags: (result) =>
        result
          ? [
              { type: 'Product' as const, id: 'LIST' },
              ...result.items.map((p) => ({ type: 'Product' as const, id: p._id })),
            ]
          : [{ type: 'Product' as const, id: 'LIST' }],
    }),

    getProduct: build.query<Product, string>({
      // noview=1 keeps admin/editor previews from inflating the view counter.
      query: (id) => `/products/${id}?noview=1`,
      providesTags: (_result, _err, id) => [{ type: 'Product', id }],
    }),

    createProduct: build.mutation<Product, ProductInput>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, 'Stats'],
    }),

    updateProduct: build.mutation<Product, { id: string } & Partial<ProductInput>>({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
        'Stats',
      ],
    }),

    deleteProduct: build.mutation<{ ok: boolean; id: string }, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, 'Stats'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi
