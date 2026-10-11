import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

/**
 * Shopping cart.
 *
 * Lives in Redux (rather than server-side) so a **guest can fill a basket
 * without an account** — the single biggest drop-off point in a marketplace.
 * The whole thing is mirrored into `localStorage` so it survives a refresh, and
 * is reconciled into a real order only at checkout.
 *
 * Prices here are for *display* only. `POST /api/checkout` re-prices every line
 * from the database, so a stale or tampered price in this slice can't affect
 * what the customer is charged.
 */

export type CartItem = {
  /** Product ObjectId — the key used to find the real price server-side. */
  product: string
  slug: string
  title: string
  price: number
  image: string
  sellerName: string
  location: string
  quantity: number
}

export type CartState = {
  items: CartItem[]
  /**
   * False until `localStorage` has been read. Anything that renders a count or
   * a total must wait for this, or the server HTML (empty cart) and the first
   * client render (full cart) disagree and React reports a hydration mismatch.
   */
  hydrated: boolean
}

const initialState: CartState = { items: [], hydrated: false }

/** One cart per browser. Versioned so a future shape change can't crash a load. */
const STORAGE_KEY = 'poorprice.cart.v1'
const MAX_QUANTITY = 99

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.product === 'string' &&
    typeof v.title === 'string' &&
    typeof v.price === 'number' &&
    typeof v.quantity === 'number' &&
    v.quantity > 0
  )
}

export function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCartItem).slice(0, 50)
  } catch {
    // Corrupt or unavailable storage (private mode, quota) — start empty rather
    // than taking the whole page down.
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* storage full or blocked — the cart still works for this session */
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /** Replace the cart with what was on disk. Runs once, on mount. */
    hydrateCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload
      state.hydrated = true
    },

    addItem(state, action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>) {
      const incoming = action.payload
      const existing = state.items.find((i) => i.product === incoming.product)
      const qty = incoming.quantity ?? 1

      if (existing) {
        existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + qty)
        // Refresh the snapshot in case the listing's price or photo changed.
        existing.price = incoming.price
        existing.title = incoming.title
        existing.image = incoming.image
        existing.slug = incoming.slug
        return
      }

      state.items.push({ ...incoming, quantity: Math.min(MAX_QUANTITY, qty) })
    },

    setQuantity(state, action: PayloadAction<{ product: string; quantity: number }>) {
      const item = state.items.find((i) => i.product === action.payload.product)
      if (!item) return
      const q = Math.round(action.payload.quantity)
      if (q <= 0) {
        state.items = state.items.filter((i) => i.product !== action.payload.product)
        return
      }
      item.quantity = Math.min(MAX_QUANTITY, q)
    },

    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.product !== action.payload)
    },

    clearCart(state) {
      state.items = []
    },
  },
})

export const { hydrateCart, addItem, setQuantity, removeItem, clearCart } = cartSlice.actions
export default cartSlice.reducer

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

type WithCart = { cart: CartState }

export const selectCartItems = (state: WithCart) => state.cart.items
export const selectCartHydrated = (state: WithCart) => state.cart.hydrated

export const selectCartCount = (state: WithCart) =>
  state.cart.items.reduce((n, i) => n + i.quantity, 0)

export const selectCartSubtotal = (state: WithCart) =>
  Math.round(state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100

export const selectCartQuantityOf = (productId: string) => (state: WithCart) =>
  state.cart.items.find((i) => i.product === productId)?.quantity ?? 0
