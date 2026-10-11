/**
 * Canonical JSON shape for an order.
 *
 * Every route that returns an order funnels through here so the cart, checkout,
 * confirmation page and admin panel all read the same field names. It also
 * guarantees `accessToken` never leaves the server — that value is handed to the
 * client exactly once, at order creation, and never echoed back afterwards.
 */

export type OrderItemView = {
  product: string | null
  title: string
  slug: string
  price: number
  quantity: number
  image: string
  sellerName: string
}

export type OrderAddressView = {
  name: string
  email: string
  phone: string
  line1: string
  line2: string
  city: string
  province: string
  postalCode: string
  country: string
}

export type OrderPaymentView = {
  provider: string
  status: string
  reference: string
  amount: number
  paidAt: string | null
}

export type OrderView = {
  id: string
  orderNumber: string
  status: string
  note: string
  items: OrderItemView[]
  itemCount: number
  subtotal: number
  shipping: number
  tax: number
  total: number
  currency: string
  shippingAddress: OrderAddressView
  payment: OrderPaymentView
  customerName: string
  customerEmail: string
  member: string | null
  createdAt: string | null
  updatedAt: string | null
}

/** Structural input — matches both a hydrated document and a `.lean()` result. */
export type RawOrder = {
  _id: unknown
  orderNumber?: string
  status?: string
  note?: string
  items?: Partial<OrderItemView>[]
  subtotal?: number
  shipping?: number
  tax?: number
  total?: number
  currency?: string
  shippingAddress?: Partial<OrderAddressView>
  payment?: Partial<Omit<OrderPaymentView, 'paidAt'>> & { paidAt?: Date | string | null }
  customerName?: string
  customerEmail?: string
  member?: unknown
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function str(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value)
}

export function orderView(doc: RawOrder): OrderView {
  const items: OrderItemView[] = (doc.items ?? []).map((i) => ({
    product: i.product ? String(i.product) : null,
    title: str(i.title),
    slug: str(i.slug),
    price: Number(i.price ?? 0),
    quantity: Number(i.quantity ?? 1),
    image: str(i.image),
    sellerName: str(i.sellerName),
  }))

  return {
    id: String(doc._id),
    orderNumber: str(doc.orderNumber),
    status: str(doc.status, 'pending'),
    note: str(doc.note),
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: Number(doc.subtotal ?? 0),
    shipping: Number(doc.shipping ?? 0),
    tax: Number(doc.tax ?? 0),
    total: Number(doc.total ?? 0),
    currency: str(doc.currency, 'CAD'),
    shippingAddress: {
      name: str(doc.shippingAddress?.name),
      email: str(doc.shippingAddress?.email),
      phone: str(doc.shippingAddress?.phone),
      line1: str(doc.shippingAddress?.line1),
      line2: str(doc.shippingAddress?.line2),
      city: str(doc.shippingAddress?.city),
      province: str(doc.shippingAddress?.province),
      postalCode: str(doc.shippingAddress?.postalCode),
      country: str(doc.shippingAddress?.country, 'Canada'),
    },
    payment: {
      provider: str(doc.payment?.provider, 'demo'),
      status: str(doc.payment?.status, 'unpaid'),
      reference: str(doc.payment?.reference),
      amount: Number(doc.payment?.amount ?? 0),
      paidAt: iso(doc.payment?.paidAt),
    },
    customerName: str(doc.customerName),
    customerEmail: str(doc.customerEmail),
    member: doc.member ? String(doc.member) : null,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  }
}
