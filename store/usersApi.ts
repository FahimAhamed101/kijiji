import { api } from './api'
import type { AdminUser } from './types'

export type UserInput = {
  name: string
  email: string
  password?: string
  role?: 'admin' | 'editor' | 'moderator'
  active?: boolean
}

export const usersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<{ items: AdminUser[] }, { q?: string } | void>({
      query: (args) => {
        const q = (args as { q?: string } | undefined)?.q
        return q ? `/users?q=${encodeURIComponent(q)}` : '/users'
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'User' as const, id: 'LIST' },
              ...result.items.map((u) => ({ type: 'User' as const, id: u.id })),
            ]
          : [{ type: 'User' as const, id: 'LIST' }],
    }),

    createUser: build.mutation<AdminUser, UserInput>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, 'Stats'],
    }),

    updateUser: build.mutation<AdminUser, { id: string } & Partial<UserInput>>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        'Me',
      ],
    }),

    deleteUser: build.mutation<{ ok: boolean; id: string }, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, 'Stats'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi
