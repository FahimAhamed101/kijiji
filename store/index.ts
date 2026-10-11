import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from './api'
import cartReducer, { saveCart } from './cartSlice'
import wishlistReducer, { saveWishlist } from './wishlistSlice'

// Importing the endpoint modules registers them on the shared `api` instance.
// They must be imported before the store is created.
import './productsApi'
import './categoriesApi'
import './usersApi'
import './inboxApi'
import './authApi'
import './accountApi'
import './ordersApi'

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      cart: cartReducer,
      wishlist: wishlistReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  })

  // Mirror the cart and wishlist into localStorage so a refresh doesn't lose
  // them. Guarded because the server render has no storage, and the reference
  // check keeps this off the hot path for every unrelated action.
  if (typeof window !== 'undefined') {
    let prevCart = store.getState().cart.items
    let prevWishlist = store.getState().wishlist.items

    store.subscribe(() => {
      const { cart, wishlist } = store.getState()

      if (cart.items !== prevCart) {
        prevCart = cart.items
        saveCart(cart.items)
      }
      if (wishlist.items !== prevWishlist) {
        prevWishlist = wishlist.items
        saveWishlist(wishlist.items)
      }
    })
  }

  return store
}

export const store = makeStore()

// Enables refetchOnFocus / refetchOnReconnect behaviours.
setupListeners(store.dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
