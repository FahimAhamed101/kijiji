'use client'

import { useRef } from 'react'
import { Provider } from 'react-redux'
import { store, makeStore, type AppStore } from '@/store'

/**
 * Client-side providers for the app.
 *
 * A fresh store is created per browser session so server renders never share
 * mutable state, while the module-level `store` is used on the client.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null)

  if (!storeRef.current) {
    storeRef.current = typeof window === 'undefined' ? store : makeStore()
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
