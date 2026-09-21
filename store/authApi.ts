import { api } from './api'
import type { DashboardStats, SessionUser } from './types'

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<{ user: SessionUser | null }, void>({
      query: () => '/auth/me',
      providesTags: ['Me'],
    }),

    login: build.mutation<{ user: SessionUser }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Me', 'Stats'],
    }),

    logout: build.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Me'],
    }),

    getStats: build.query<DashboardStats, void>({
      query: () => '/stats',
      providesTags: ['Stats'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useGetStatsQuery,
} = authApi
