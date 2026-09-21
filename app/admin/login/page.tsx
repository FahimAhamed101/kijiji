'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGetMeQuery, useLoginMutation } from '@/store/authApi'
import { Alert, Button, Field, Input } from '@/components/admin/ui'

export default function AdminLoginPage() {
  const router = useRouter()
  const { data: me } = useGetMeQuery()
  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Already signed in? Skip the form.
  useEffect(() => {
    if (me?.user) router.replace('/admin')
  }, [me, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login({ email, password }).unwrap()
      router.replace('/admin')
      router.refresh()
    } catch (err) {
      const message =
        (err as { data?: { error?: string } })?.data?.error ?? 'Unable to sign in. Try again.'
      setError(message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            K
          </span>
          <h1 className="text-xl font-semibold text-ink">Admin sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage listings, categories and staff.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-card border border-line bg-canvas p-5 shadow-card"
        >
          {error && <Alert tone="danger">{error}</Alert>}

          <Field label="Email" required>
            <Input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kijiji.local"
            />
          </Field>

          <Field label="Password" required>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Button type="submit" className="w-full" loading={isLoading}>
            Sign in
          </Button>

          <div className="rounded-lg bg-surface p-3 text-xs text-ink-muted">
            <p className="font-medium text-ink-soft">Seeded accounts</p>
            <p className="mt-1">
              admin@kijiji.local / <span className="font-mono">admin123</span> (full access)
            </p>
            <p>
              editor@kijiji.local / <span className="font-mono">editor123</span> (content only)
            </p>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-ink-muted">
          <Link href="/" className="hover:text-ink">
            ← Back to marketplace
          </Link>
        </p>
      </div>
    </div>
  )
}
