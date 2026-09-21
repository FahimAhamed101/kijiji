import { api } from './api'
import type { AbuseReport, ContactMessage, Paginated } from './types'

export type InboxQuery = { status?: string; q?: string; page?: number; limit?: number }

export type NewMessage = {
  product?: string | null
  productTitle?: string
  name: string
  email: string
  phone?: string
  body: string
}

export type NewReport = {
  product?: string | null
  productTitle?: string
  reason?: string
  details?: string
  reporterEmail?: string
}

function toSearchParams(query: InboxQuery): string {
  const sp = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    sp.set(key, String(value))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const inboxApi = api.injectEndpoints({
  endpoints: (build) => ({
    /* ---- public: submit an enquiry from a listing page ---- */
    createMessage: build.mutation<{ ok: boolean; id: string }, NewMessage>({
      query: (body) => ({ url: '/messages', method: 'POST', body }),
      invalidatesTags: [{ type: 'Message', id: 'LIST' }, 'Stats'],
    }),

    /* ---- public: report a listing ---- */
    createReport: build.mutation<{ ok: boolean; id: string }, NewReport>({
      query: (body) => ({ url: '/reports', method: 'POST', body }),
      invalidatesTags: [{ type: 'Report', id: 'LIST' }, 'Stats'],
    }),

    /* ---- contact messages ---- */
    getMessages: build.query<Paginated<ContactMessage>, InboxQuery | void>({
      query: (args) => `/messages${toSearchParams((args ?? {}) as InboxQuery)}`,
      providesTags: (result) =>
        result
          ? [
              { type: 'Message' as const, id: 'LIST' },
              ...result.items.map((m) => ({ type: 'Message' as const, id: m._id })),
            ]
          : [{ type: 'Message' as const, id: 'LIST' }],
    }),

    updateMessage: build.mutation<ContactMessage, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/messages/${id}`, method: 'PATCH', body: { status } }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Message', id },
        { type: 'Message', id: 'LIST' },
        'Stats',
      ],
    }),

    deleteMessage: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/messages/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Message', id: 'LIST' }, 'Stats'],
    }),

    /* ---- abuse reports ---- */
    getReports: build.query<Paginated<AbuseReport>, InboxQuery | void>({
      query: (args) => `/reports${toSearchParams((args ?? {}) as InboxQuery)}`,
      providesTags: (result) =>
        result
          ? [
              { type: 'Report' as const, id: 'LIST' },
              ...result.items.map((r) => ({ type: 'Report' as const, id: r._id })),
            ]
          : [{ type: 'Report' as const, id: 'LIST' }],
    }),

    updateReport: build.mutation<AbuseReport, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/reports/${id}`, method: 'PATCH', body: { status } }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Report', id },
        { type: 'Report', id: 'LIST' },
        'Stats',
      ],
    }),

    deleteReport: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/reports/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Report', id: 'LIST' }, 'Stats'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useCreateMessageMutation,
  useCreateReportMutation,
  useGetMessagesQuery,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  useGetReportsQuery,
  useUpdateReportMutation,
  useDeleteReportMutation,
} = inboxApi
