'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import AuthShell from '@/components/AuthShell'
import { useMemberLoginMutation } from '@/store/accountApi'

/** Only same-site paths — `//evil.com` is protocol-relative and must be refused. */
function safeRedirect(fallback = '/account') {
  if (typeof window === 'undefined') return fallback
  const target = new URLSearchParams(window.location.search).get('redirect')
  if (!target) return fallback
  return target.startsWith('/') && !target.startsWith('//') ? target : fallback
}

export default function SignInPage() {
  const router = useRouter()
  const [login, { isLoading }] = useMemberLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // `useAdminSignIn` is set by the API when the credentials are valid but belong
  // to a staff account, so we can offer the right link instead of a dead end.
  const [error, setError] = useState<{ message: string; useAdminSignIn?: boolean } | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isLoading) return
    setError(null)
    try {
      await login({ email, password }).unwrap()
      // `refresh` re-runs the server components so the header picks up the
      // new session cookie instead of rendering the signed-out state.
      router.push(safeRedirect())
      router.refresh()
    } catch (err) {
      const data = (err as { data?: { error?: string; useAdminSignIn?: boolean } })?.data
      setError({
        message: data?.error ?? 'Could not sign you in.',
        useAdminSignIn: data?.useAdminSignIn,
      })
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Track your orders and check out faster."
      altAction={{ prompt: 'New to Poorprice.com?', label: 'Create an account', href: '/signup' }}
    >
      <form onSubmit={onSubmit} className="auth-form">
        {error && (
          <div role="alert" className="auth-alert">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {error.message}
              {error.useAdminSignIn && (
                <>
                  {' '}
                  <Link href="/admin/login" className="auth-alert-link">
                    Go to admin sign-in
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <label className="auth-field">
          <span className="auth-label">Email address</span>
          <span className="auth-input-wrap">
            <Mail className="auth-input-icon" aria-hidden="true" />
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </span>
        </label>

        <label className="auth-field">
          <span className="auth-label">Password</span>
          <span className="auth-input-wrap">
            <Lock className="auth-input-icon" aria-hidden="true" />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="auth-input-action"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        <button type="submit" className="auth-submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="auth-fineprint">
        Just browsing? <Link href="/browse">Continue without an account</Link> — you can add
        items to your cart as a guest.
      </p>

      <p className="auth-fineprint auth-staff-note">
        Staff member? <Link href="/admin/login">Sign in to the admin panel</Link>
      </p>
    </AuthShell>
  )
}
