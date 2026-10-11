import CheckoutSuccess from '@/components/CheckoutSuccess'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Order confirmation.
 *
 * A thin server component purely so `searchParams` can be read without
 * `useSearchParams()` — which would force a Suspense boundary on a page that
 * has nothing worth prerendering anyway. The work happens in the client
 * component, which settles the order and then shows the receipt.
 */
export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

  return (
    <CheckoutSuccess
      orderId={first(searchParams.order) ?? ''}
      // Stripe appends this to the success URL.
      stripeSessionId={first(searchParams.session_id) ?? ''}
      // PayPal appends the PayPal order id as `token` — not to be confused with
      // our own access token, which is read from sessionStorage instead.
      paypalOrderId={first(searchParams.token) ?? ''}
    />
  )
}
