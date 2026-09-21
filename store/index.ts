import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from './api'

// Importing the endpoint modules registers them on the shared `api` instance.
// They must be imported before the store is created.
import './productsApi'
import './categoriesApi'
import './usersApi'
import './inboxApi'
import './authApi'

export const makeStore = () =>
  configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  })

export const store = makeStore()

// Enables refetchOnFocus / refetchOnReconnect behaviours.
setupListeners(store.dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
