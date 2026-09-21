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
  messages: { total: number; unread: number }
  reports: { open: number }
  views: { total: number }
  recentProducts: Product[]
  categoriesBreakdown: { name: string; count: number }[]
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
