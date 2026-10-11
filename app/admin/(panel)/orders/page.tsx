'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Mail, MapPin, Package, Search, Truck } from 'lucide-react'
import {
  useGetAdminOrdersQuery,
  useUpdateOrderMutation,
} from '@/store/ordersApi'
import {
  Alert,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  Spinner,
  TableShell,
  Td,
  Th,
} from '@/components/admin/ui'
import {
  money,
  orderStatusLabel,
  orderStatusTone,
  paymentProviderLabel,
  timeAgo,
  type Order,
} from '@/store/types'

const STATUSES = [
  'all',
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

/** The transitions a fulfilment team actually makes, in order. */
const NEXT_ACTIONS: Record<string, { label: string; status: string }[]> = {
  paid: [{ label: 'Start processing', status: 'processing' }],
  processing: [{ label: 'Mark shipped', status: 'shipped' }],
  shipped: [{ label: 'Mark delivered', status: 'delivered' }],
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<Order | null>(null)
  const [note, setNote] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError, error, refetch } = useGetAdminOrdersQuery({
    status: status === 'all' ? undefined : status,
    q: debounced || undefined,
    page,
    limit: 15,
  })

  const [updateOrder, { isLoading: saving }] = useUpdateOrderMutation()

  const items = data?.items ?? []

  function openOrder(order: Order) {
    setOpen(order)
    setNote(order.note)
    setNotice(null)
  }

  async function apply(order: Order, patch: { status?: string; note?: string }) {
    try {
      const res = await updateOrder({ id: order.id, ...patch }).unwrap()
      setOpen(res.order)
      setNotice('Order updated.')
    } catch (err) {
      setNotice(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not update that order.'
      )
    }
  }

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Paid and pending orders placed through the storefront."
      />

      {notice && (
        <Alert tone="success" className="mb-4 flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-medium underline"
          >
            Dismiss
          </button>
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-line bg-canvas p-4 shadow-card">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number, name or email…"
            className="pl-9"
            aria-label="Search orders"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="!w-auto"
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : orderStatusLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      {isError ? (
        <ErrorState
          message={
            (error as { data?: { error?: string } })?.data?.error ?? 'Could not load orders.'
          }
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center text-ink-muted">
          <Spinner className="h-6 w-6" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders placed at checkout will appear here as soon as a customer checks out."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer hover:bg-surface/60"
                  onClick={() => openOrder(o)}
                >
                  <Td>
                    <p className="font-medium text-ink">{o.orderNumber}</p>
                    <p className="text-xs text-ink-muted">{money(o.total, o.currency)}</p>
                  </Td>
                  <Td>
                    <p className="text-ink">{o.customerName || '—'}</p>
                    <p className="text-xs text-ink-muted">{o.customerEmail}</p>
                  </Td>
                  <Td>
                    <span className="text-xs text-ink-soft">
                      {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
                    </span>
                  </Td>
                  <Td>
                    <p className="text-xs text-ink-soft">{paymentProviderLabel(o.payment.provider)}</p>
                    <p className="text-xs text-ink-muted capitalize">{o.payment.status}</p>
                  </Td>
                  <Td>
                    <span className={`order-pill ${orderStatusTone(o.status)}`}>
                      {orderStatusLabel(o.status)}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-ink-muted">{timeAgo(o.createdAt)}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>

          {data && (
            <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          )}
        </>
      )}

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `Order ${open.orderNumber}` : 'Order'}
        width="max-w-3xl"
        footer={
          open && (
            <>
              <Button variant="secondary" onClick={() => setOpen(null)}>
                Close
              </Button>
              {open.status === 'pending' && (
                <Button
                  variant="danger"
                  loading={saving}
                  onClick={() => apply(open, { status: 'cancelled' })}
                >
                  Cancel order
                </Button>
              )}
              {(NEXT_ACTIONS[open.status] ?? []).map((action) => (
                <Button
                  key={action.status}
                  loading={saving}
                  onClick={() => apply(open, { status: action.status })}
                >
                  {action.label}
                </Button>
              ))}
            </>
          )
        }
      >
        {open && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`order-pill ${orderStatusTone(open.status)}`}>
                {orderStatusLabel(open.status)}
              </span>
              <span className="text-xs text-ink-muted">
                Placed {timeAgo(open.createdAt)} · {money(open.total, open.currency)}
              </span>
            </div>

            {/* Items */}
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <Package className="h-3.5 w-3.5" />
                Items
              </h3>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {open.items.map((i, idx) => (
                  <li key={`${i.product}-${idx}`} className="flex items-center gap-3 p-3">
                    {i.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={i.image}
                        alt=""
                        aria-hidden="true"
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{i.title}</p>
                      <p className="text-xs text-ink-muted">
                        Qty {i.quantity} × {money(i.price, open.currency)}
                        {i.sellerName ? ` · ${i.sellerName}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-ink">
                      {money(i.price * i.quantity, open.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Totals */}
            <dl className="space-y-1 rounded-lg bg-surface p-3 text-sm">
              <Row label="Subtotal" value={money(open.subtotal, open.currency)} />
              <Row
                label="Shipping"
                value={open.shipping === 0 ? 'Free' : money(open.shipping, open.currency)}
              />
              <Row label="Tax" value={money(open.tax, open.currency)} />
              <div className="flex items-center justify-between border-t border-line pt-1.5 font-semibold text-ink">
                <dt>Total</dt>
                <dd>{money(open.total, open.currency)}</dd>
              </div>
            </dl>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Customer / delivery */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  Deliver to
                </h3>
                <p className="text-sm leading-relaxed text-ink-soft">
                  {open.shippingAddress.name}
                  <br />
                  {open.shippingAddress.line1}
                  {open.shippingAddress.line2 ? (
                    <>
                      <br />
                      {open.shippingAddress.line2}
                    </>
                  ) : null}
                  <br />
                  {open.shippingAddress.city}, {open.shippingAddress.province}{' '}
                  {open.shippingAddress.postalCode}
                  <br />
                  {open.shippingAddress.country}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Mail className="h-3.5 w-3.5" />
                  <a href={`mailto:${open.shippingAddress.email}`} className="hover:underline">
                    {open.shippingAddress.email}
                  </a>
                </p>
                {open.shippingAddress.phone && (
                  <p className="text-xs text-ink-muted">{open.shippingAddress.phone}</p>
                )}
              </div>

              {/* Payment */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <CreditCard className="h-3.5 w-3.5" />
                  Payment
                </h3>
                <dl className="space-y-1 text-sm text-ink-soft">
                  <Row label="Provider" value={paymentProviderLabel(open.payment.provider)} />
                  <Row label="Status" value={open.payment.status} />
                  <Row label="Amount" value={money(open.payment.amount, open.currency)} />
                  <Row label="Reference" value={open.payment.reference || '—'} mono />
                  <Row
                    label="Paid"
                    value={open.payment.paidAt ? timeAgo(open.payment.paidAt) : '—'}
                  />
                </dl>
              </div>
            </div>

            {open.note && (
              <div className="rounded-lg border border-line bg-canvas p-3 text-sm text-ink-soft">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Customer note
                </p>
                {open.note}
              </div>
            )}

            {/* Fulfilment */}
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <Truck className="h-3.5 w-3.5" />
                Fulfilment
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[180px] flex-1">
                  <span className="mb-1 block text-xs text-ink-muted">Order status</span>
                  <Select
                    value={open.status}
                    onChange={(e) => apply(open, { status: e.target.value })}
                    disabled={saving}
                  >
                    {STATUSES.filter((s) => s !== 'all').map((s) => (
                      <option key={s} value={s}>
                        {orderStatusLabel(s)}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="min-w-[220px] flex-[2]">
                  <span className="mb-1 block text-xs text-ink-muted">Internal note</span>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Tracking number, courier, packing notes…"
                  />
                </label>

                <Button
                  variant="secondary"
                  loading={saving}
                  onClick={() => apply(open, { note })}
                  disabled={note === open.note}
                >
                  Save note
                </Button>
              </div>
              {open.payment.status !== 'paid' && (
                <p className="mt-2 text-xs text-amber-700">
                  This order has not been paid, so it can only stay pending or be cancelled.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={`text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}
