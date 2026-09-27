'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { useGetMeQuery, useLoginMutation } from '@/store/authApi'
import { LogoMark } from '@/components/Logo'
import { Spinner } from '@/components/admin/ui'

export default function AdminLoginPage() {
  const { data: me, isLoading: isCheckingMe } = useGetMeQuery()
  const [login, { isLoading: isSubmitting }] = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Redirect target safely constrained to /admin
  function getSafeRedirectUrl() {
    if (typeof window === 'undefined') return '/admin'
    const sp = new URLSearchParams(window.location.search)
    const target = sp.get('redirect') || sp.get('from') || '/admin'
    return target.startsWith('/admin') ? target : '/admin'
  }

  // Already signed in? Skip form and redirect smoothly.
  useEffect(() => {
    if (me?.user && !isRedirecting) {
      setIsRedirecting(true)
      const target = getSafeRedirectUrl()
      window.location.replace(target)
    }
  }, [me, isRedirecting])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting || isRedirecting) return
    setError(null)

    try {
      await login({ email, password }).unwrap()
      setIsRedirecting(true)
      const target = getSafeRedirectUrl()
      // Brief pause to allow the user to see the success confirmation state
      setTimeout(() => {
        window.location.replace(target)
      }, 350)
    } catch (err) {
      const message =
        (err as { data?: { error?: string } })?.data?.error ??
        'Unable to sign in. Please verify your credentials and try again.'
      setError(message)
    }
  }

  function fillCredentials(fillEmail: string, fillPass: string) {
    setEmail(fillEmail)
    setPassword(fillPass)
    setError(null)
  }

  // If already authenticated and redirecting, show a smooth splash
  if (me?.user && isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
        <div className="w-full max-w-sm rounded-card border border-line bg-canvas p-6 text-center shadow-card animate-in fade-in duration-300">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-ink">Welcome back, {me.user.name}</h2>
          <p className="mt-1 text-sm text-ink-muted">Redirecting to admin panel...</p>
          <div className="mt-4 flex justify-center">
            <Spinner className="h-5 w-5 text-brand" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      {/* Background ambient accents */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-canvas shadow-md shadow-brand/20 transition-transform hover:scale-105">
            <LogoMark tone="on-light" height={38} alt="Poorprice.com" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Admin sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage marketplace listings, categories, and staff.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-card border border-line bg-canvas p-6 shadow-card transition-all">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 animate-in fade-in duration-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span className="flex-1 text-xs leading-relaxed">{error}</span>
              </div>
            )}

            {isRedirecting && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 animate-in fade-in duration-200"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-xs font-medium">Success! Redirecting to panel...</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-ink-muted"
              >
                Email address
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  disabled={isSubmitting || isRedirecting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kijiji.local"
                  className="w-full rounded-lg border border-line bg-canvas py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-surface disabled:opacity-75 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-ink-muted"
              >
                Password
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting || isRedirecting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-line bg-canvas py-2 pl-9 pr-10 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-surface disabled:opacity-75 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-muted hover:text-ink focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isRedirecting}
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-sm font-semibold text-white shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${
                isRedirecting
                  ? 'bg-emerald-600 focus-visible:outline-emerald-600'
                  : 'bg-brand hover:bg-brand-dark focus-visible:outline-brand disabled:opacity-70'
              }`}
            >
              {isRedirecting ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Redirecting...
                </>
              ) : isSubmitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 opacity-70" />
                </>
              )}
            </button>

            {/* Clickable Quick-fill Accounts */}
            <div className="rounded-lg border border-line/60 bg-surface/70 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                <span>Quick-fill demo accounts</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">
                Click any role below to prefill credentials:
              </p>
              <div className="mt-2.5 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@kijiji.local', 'admin123')}
                  className="flex items-center justify-between rounded-md border border-line bg-canvas px-2.5 py-1.5 text-left text-xs transition-colors hover:border-brand/40 hover:bg-brand/5 focus:outline-none"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">Super Admin</p>
                    <p className="font-mono text-[11px] text-ink-muted">admin@kijiji.local</p>
                  </div>
                  <span className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                    admin123
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('editor@kijiji.local', 'editor123')}
                  className="flex items-center justify-between rounded-md border border-line bg-canvas px-2.5 py-1.5 text-left text-xs transition-colors hover:border-brand/40 hover:bg-brand/5 focus:outline-none"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">Content Editor</p>
                    <p className="font-mono text-[11px] text-ink-muted">editor@kijiji.local</p>
                  </div>
                  <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                    editor123
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Back Link */}
        <p className="mt-4 text-center text-xs text-ink-muted">
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition-colors hover:text-ink hover:underline"
          >
            ← Back to marketplace
          </Link>
        </p>
      </div>
    </div>
  )
}
