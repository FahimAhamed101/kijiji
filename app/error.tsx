'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Route-level error boundary. Catches render/data errors below the root layout
 * so a single bad page doesn't blank the whole app.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface it in the browser console / your logging sink.
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-card border border-line bg-canvas p-6 text-center shadow-card">
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg font-bold text-red-600">
          !
        </span>
        <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          The page failed to load. This is usually temporary — try again, or head back to the
          marketplace.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-ink-muted">ref: {error.digest}</p>
        )}

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-line bg-canvas px-4 text-sm font-medium text-ink hover:bg-surface"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
