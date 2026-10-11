import { api } from './api'
import type { Member, Order } from './types'

/** Storefront account endpoints — signup, sign in, profile, order history. */
export const accountApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMember: build.query<{ member: Member | null }, void>({
      query: () => '/account/me',
      providesTags: ['Member'],
    }),

    signup: build.mutation<
      { member: Member },
      { name: string; email: string; password: string; phone?: string; location?: string }
    >({
      query: (body) => ({ url: '/account/signup', method: 'POST', body }),
      invalidatesTags: ['Member', 'Order'],
    }),

    memberLogin: build.mutation<{ member: Member }, { email: string; password: string }>({
      query: (body) => ({ url: '/account/login', method: 'POST', body }),
      invalidatesTags: ['Member', 'Order'],
    }),

    memberLogout: build.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/account/logout', method: 'POST' }),
      invalidatesTags: ['Member', 'Order'],
    }),

    updateProfile: build.mutation<
      { member: Member },
      {
        name?: string
        phone?: string
        location?: string
        newPassword?: string
        currentPassword?: string
      }
    >({
      query: (body) => ({ url: '/account/profile', method: 'PATCH', body }),
      invalidatesTags: ['Member'],
    }),

    getMyOrders: build.query<{ items: Order[] }, void>({
      query: () => '/account/orders',
      providesTags: ['Order'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetMemberQuery,
  useSignupMutation,
  useMemberLoginMutation,
  useMemberLogoutMutation,
  useUpdateProfileMutation,
  useGetMyOrdersQuery,
} = accountApi
