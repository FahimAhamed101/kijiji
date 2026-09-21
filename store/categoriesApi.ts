import { api } from './api'
import type { Category } from './types'

export type CategoryQuery = {
  group?: string
  active?: string
  featured?: string
  withCounts?: string
}

export type CategoryInput = {
  name: string
  group?: string
  description?: string
  image?: string
  order?: number
  featured?: boolean
  active?: boolean
}

function toSearchParams(query: CategoryQuery): string {
  const sp = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    sp.set(key, String(value))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const categoriesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<{ items: Category[] }, CategoryQuery | void>({
      query: (args) => `/categories${toSearchParams((args ?? {}) as CategoryQuery)}`,
      providesTags: (result) =>
        result
          ? [
              { type: 'Category' as const, id: 'LIST' },
              ...result.items.map((c) => ({ type: 'Category' as const, id: c._id })),
            ]
          : [{ type: 'Category' as const, id: 'LIST' }],
    }),

    getCategory: build.query<Category, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Category', id }],
    }),

    createCategory: build.mutation<Category, CategoryInput>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }, 'Stats'],
    }),

    updateCategory: build.mutation<Category, { id: string } & Partial<CategoryInput>>({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
        'Stats',
      ],
    }),

    deleteCategory: build.mutation<{ ok: boolean; id: string }, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }, 'Stats'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi
