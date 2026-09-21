import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

/**
 * Single RTK Query API instance for the whole app.
 *
 * Endpoints are contributed by the slices in this folder via `injectEndpoints`,
 * which keeps each domain (products, categories, users, ...) in its own file
 * while sharing one cache and one set of tags.
 *
 * `credentials: 'include'` is important: the admin session lives in an
 * httpOnly cookie, so every request must send it.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include',
  }),
  tagTypes: ['Product', 'Category', 'User', 'Message', 'Report', 'Stats', 'Me'],
  endpoints: () => ({}),
  refetchOnMountOrArgChange: 30,
})

export default api
