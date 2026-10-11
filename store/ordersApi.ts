import { api } from './api'
import type { Order, Paginated, PaymentsConfig } from './types'

/** What `POST /api/checkout` sends back. */
export type CheckoutResponse =
  | {
      mode: 'demo'
      orderId: string
      orderNumber: string
      accessToken: string
      order: Order
    }
  | {
      mode: 'redirect'
      url: string
      orderId: string
      orderNumber: string
      accessToken: string
    }

export type CheckoutRequest = {
  items: { product: string; quantity: number }[]
  provider: 'stripe' | 'paypal' | 'demo'
  shippingAddress: {
    name: string
    email: string
    phone?: string
    line1: string
    line2?: string
    city: string
    province: string
    postalCode: string
    country?: string
  }
  note?: string
}

export const ordersApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Which gateways this server can take money with, plus the pricing rules. */
    getPaymentsConfig: build.query<PaymentsConfig, void>({
      query: () => '/payments/config',
    }),

    createCheckout: build.mutation<CheckoutResponse, CheckoutRequest>({
      query: (body) => ({ url: '/checkout', method: 'POST', body }),
      invalidatesTags: ['Order', 'Stats'],
    }),

    /**
     * Settle an order. Called on the success page with whatever the gateway
     * handed back; the server decides from the gateway's own answer.
     */
    confirmCheckout: build.mutation<
      { order: Order; captureId?: string | null },
      { orderId: string; accessToken?: string; session_id?: string; paypalOrderId?: string }
    >({
      query: (body) => ({ url: '/checkout/confirm', method: 'POST', body }),
      invalidatesTags: ['Order', 'Stats'],
    }),

    getOrder: build.query<{ order: Order }, { id: string; token?: string }>({
      query: ({ id, token }) => ({
        url: `/orders/${id}`,
        params: token ? { token } : undefined,
      }),
      providesTags: ['Order'],
    }),

    getAdminOrders: build.query<
      Paginated<Order>,
      { q?: string; status?: string; provider?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: '/orders', params }),
      providesTags: ['Order'],
    }),

    updateOrder: build.mutation<
      { order: Order },
      { id: string; status?: string; note?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/orders/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Order', 'Stats'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPaymentsConfigQuery,
  useCreateCheckoutMutation,
  useConfirmCheckoutMutation,
  useGetOrderQuery,
  useGetAdminOrdersQuery,
  useUpdateOrderMutation,
} = ordersApi
