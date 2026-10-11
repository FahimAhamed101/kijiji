import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { primaryImage, type Product } from './types'

/**
 * Saved items ("favourites").
 *
 * Mirrors the cart's approach: kept in Redux and mirrored into `localStorage`,
 * so a **guest can save a listing without an account** and it survives a
 * refresh. There is no server-side wishlist yet — when one is added, this slice
 * becomes the optimistic cache in front of it and the storage key gets a bump.
 *
 * Only a snapshot is stored (title, price, photo). The listing page re-reads the
 * live record, so a saved item whose price changed shows the new price once
 * opened rather than a stale copy.
 */

export type WishlistItem = {
  /** Product ObjectId. */
  product: string
  slug: string
  title: string
  price: number
  priceOnRequest: boolean
  /**
   * Snapshot of the listing status, used to hide "Add to cart" on something
   * already sold. Only a hint — `POST /api/checkout` re-checks the live record
   * and is the only thing that decides whether an order can be placed.
   */
  status: string
  image: string
  location: string
  sellerName: string
  /** Epoch ms — newest first on the wishlist page. */
  addedAt: number
}

export type WishlistState = {
  items: WishlistItem[]
  /**
   * False until `localStorage` has been read. Anything rendering a count or a
   * filled heart must wait for this: the server has no storage and would render
   * "not saved", which the first client render would contradict. The header
   * hides the badge and the heart stays neutral until this flips.
   */
  hydrated: boolean
}

const initialState: WishlistState = { items: [], hydrated: false }

/** One wishlist per browser. Versioned so a shape change can't crash a load. */
const STORAGE_KEY = 'poorprice.wishlist.v1'
/** Generous, but bounded — this is a person's shortlist, not a database. */
const MAX_ITEMS = 200

function isWishlistItem(value: unknown): value is WishlistItem {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.product === 'string' &&
    typeof v.title === 'string' &&
    typeof v.price === 'number' &&
    typeof v.slug === 'string'
  )
}

export function loadWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isWishlistItem).slice(0, MAX_ITEMS)
  } catch {
    // Corrupt or unavailable storage (private mode, quota) — start empty rather
    // than taking the whole page down.
    return []
  }
}

export function saveWishlist(items: WishlistItem[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* storage full or blocked — the wishlist still works for this session */
  }
}

/** Snapshot a listing into the shape the wishlist stores. */
export function toWishlistItem(product: Product): WishlistItem {
  return {
    product: product._id,
    slug: product.slug,
    title: product.title,
    price: product.price,
    priceOnRequest: product.priceOnRequest,
    status: product.status,
    image: primaryImage(product),
    location: product.location,
    sellerName: product.seller?.name ?? '',
    addedAt: Date.now(),
  }
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    /** Replace the wishlist with what was on disk. Runs once, on mount. */
    hydrateWishlist(state, action: PayloadAction<WishlistItem[]>) {
      state.items = action.payload
      state.hydrated = true
    },

    /**
     * Save if absent, remove if present — one reducer so the heart and the
     * wishlist page can't disagree about what a click means.
     */
    toggleWishlist(state, action: PayloadAction<WishlistItem>) {
      const incoming = action.payload
      const index = state.items.findIndex((i) => i.product === incoming.product)
      if (index >= 0) {
        state.items.splice(index, 1)
        return
      }
      state.items.unshift({ ...incoming, addedAt: Date.now() })
      if (state.items.length > MAX_ITEMS) state.items.length = MAX_ITEMS
    },

    removeWishlistItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.product !== action.payload)
    },

    clearWishlist(state) {
      state.items = []
    },
  },
})

export const { hydrateWishlist, toggleWishlist, removeWishlistItem, clearWishlist } =
  wishlistSlice.actions
export default wishlistSlice.reducer

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

type WithWishlist = { wishlist: WishlistState }

export const selectWishlistItems = (state: WithWishlist) => state.wishlist.items
export const selectWishlistHydrated = (state: WithWishlist) => state.wishlist.hydrated
export const selectWishlistCount = (state: WithWishlist) => state.wishlist.items.length

/** `true` only once storage has been read — never during SSR. */
export const selectIsWishlisted = (productId: string) => (state: WithWishlist) =>
  state.wishlist.hydrated && state.wishlist.items.some((i) => i.product === productId)
