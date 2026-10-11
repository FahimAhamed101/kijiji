/* Shared types for the marketplace API. */

export type Category = {
  _id: string
  name: string
  slug: string
  group: string
  description: string
  image: string
  order: number
  featured: boolean
  active: boolean
  productCount?: number
  createdAt: string
  updatedAt: string
}

export type ProductSeller = {
  name: string
  phone: string
  email: string
  location: string
  verified: boolean
}

export type Product = {
  _id: string
  title: string
  slug: string
  description: string
  price: number
  priceOnRequest: boolean
  category: Pick<Category, '_id' | 'name' | 'slug' | 'group'> | string | null
  location: string
  images: string[]
  brand: string
  condition: 'new' | 'like-new' | 'used' | 'for-parts'
  status: 'draft' | 'active' | 'sold' | 'archived'
  featured: boolean
  urgent: boolean
  tags: string[]
  views: number
  seller: ProductSeller
  createdAt: string
  updatedAt: string
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'moderator'
  active: boolean
  avatarColor: string
  lastLoginAt: string | null
  createdAt: string
}

export type SessionUser = {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'moderator'
}

export type ContactMessage = {
  _id: string
  product: string | null
  productTitle: string
  name: string
  email: string
  phone: string
  body: string
  status: 'unread' | 'read' | 'replied' | 'archived'
  createdAt: string
}

export type AbuseReport = {
  _id: string
  product: string | null
  productTitle: string
  reason: string
  details: string
  reporterEmail: string
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  createdAt: string
}

export type DashboardStats = {
  products: {
    total: number
    active: number
    draft: number
    sold: number
    archived: number
    featured: number
  }
  categories: { total: number; active: number }
  users: { total: number }
  members: { total: number }
  orders: { total: number; paid: number; pending: number; revenue: number }
  messages: { total: number; unread: number }
  reports: { open: number }
  views: { total: number }
  recentProducts: Product[]
  recentOrders: Order[]
  categoriesBreakdown: { name: string; count: number }[]
}

/* ------------------------------------------------------------------ */
/* Storefront accounts, cart and orders                                */
/* ------------------------------------------------------------------ */

export type Member = {
  id: string
  name: string
  email: string
  phone: string
  location: string
  avatarColor: string
  createdAt: string
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentProvider = 'stripe' | 'paypal' | 'demo'

export type OrderItem = {
  product: string | null
  title: string
  slug: string
  price: number
  quantity: number
  image: string
  sellerName: string
}

export type OrderAddress = {
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

export type OrderPayment = {
  provider: PaymentProvider
  status: 'unpaid' | 'paid' | 'failed' | 'refunded'
  reference: string
  amount: number
  paidAt: string | null
}

export type Order = {
  id: string
  orderNumber: string
  status: OrderStatus
  note: string
  items: OrderItem[]
  itemCount: number
  subtotal: number
  shipping: number
  tax: number
  total: number
  currency: string
  shippingAddress: OrderAddress
  payment: OrderPayment
  customerName: string
  customerEmail: string
  member: string | null
  createdAt: string | null
  updatedAt: string | null
}

/** One option in the checkout payment-method list. */
export type PaymentProviderInfo = {
  id: PaymentProvider
  label: string
  enabled: boolean
  mode: 'live' | 'sandbox' | 'demo'
  note: string
}

/** Why a gateway is listed but cannot take money. */
export type UnavailableReason = 'not-configured' | 'rejected'

/**
 * A gateway checkout still lists as an option, with the reason it can't be used.
 * "No keys on the server" and "the gateway refused the keys" need different
 * fixes, so they must not look alike. See `lib/payments.ts`.
 */
export type UnavailableProviderInfo = {
  id: PaymentProvider
  label: string
  reason: UnavailableReason
  /** Alias for `reason === 'rejected'`. */
  rejected: boolean
  /** Short state, safe to show. */
  note: string
  /** The gateway's own message, redacted server-side. */
  detail?: string
  /** Env vars to set in `.env.local`. */
  envVars: string[]
}

export type PaymentsConfig = {
  providers: PaymentProviderInfo[]
  anyLive: boolean
  unavailable?: UnavailableProviderInfo[]
  currency: string
  shippingFlat: number
  freeShippingOver: number
  taxRate: number
}

/**
 * A payment option as checkout renders it: either a method that can take money,
 * or one that is listed but broken. `problem` carries the reason for the latter.
 */
export type CheckoutPayOption = {
  id: PaymentProvider
  label: string
  note: string
  mode: 'live' | 'sandbox' | 'demo'
  /** `null` when this method can take money; otherwise why it can't. */
  problem: {
    reason: UnavailableReason
    rejected: boolean
    detail?: string
    envVars: string[]
  } | null
}

export type ProductQuery = {
  q?: string
  status?: string
  category?: string
  group?: string
  featured?: string
  urgent?: string
  location?: string
  sort?: string
  page?: number
  limit?: number
  all?: string
}

/* ------------------------------------------------------------------ */
/* Presentation helpers                                                */
/* ------------------------------------------------------------------ */

/** "$1,850", "Please Contact", or "Free". */
export function priceLabel(product: Pick<Product, 'price' | 'priceOnRequest'>): string {
  if (product.priceOnRequest) return 'Please Contact'
  if (!product.price || product.price <= 0) return 'Free'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(product.price)
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=500&q=80'

export function primaryImage(product: Pick<Product, 'images' | 'title'>): string {
  return product.images?.[0] || FALLBACK_IMAGE
}

export function categoryName(product: Pick<Product, 'category'>): string {
  if (!product.category) return 'Uncategorised'
  if (typeof product.category === 'string') return 'Uncategorised'
  return product.category.name
}

export function categorySlug(product: Pick<Product, 'category'>): string | undefined {
  if (!product.category || typeof product.category === 'string') return undefined
  return product.category.slug
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function timeAgo(value?: string | null): string {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(value)
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status
}

const PROVIDER_LABEL: Record<string, string> = {
  stripe: 'Card (Stripe)',
  paypal: 'PayPal',
  demo: 'Demo payment',
}

export function paymentProviderLabel(provider: string): string {
  return PROVIDER_LABEL[provider] ?? provider
}

/** Tailwind classes for an order-status pill, in the light admin palette. */
export function orderStatusTone(status: string): string {
  switch (status) {
    case 'paid':
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'processing':
    case 'shipped':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'cancelled':
    case 'refunded':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

/** "$1,234.56" — matches the server's formatting so totals never look off by a cent. */
export function money(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
