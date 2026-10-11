'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import AuthShell from '@/components/AuthShell'
import { useSignupMutation } from '@/store/accountApi'

export default function SignUpPage() {
  const router = useRouter()
  const [signup, { isLoading }] = useSignupMutation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isLoading) return
    setError(null)

    // Checked here rather than server-side: the server never sees `confirm`,
    // and this is a typo guard, not a security control.
    if (password !== confirm) {
      setError('Those passwords don’t match.')
      return
    }

    try {
      await signup({ name, email, password }).unwrap()
      router.push('/account')
      router.refresh()
    } catch (err) {
      setError(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not create your account.'
      )
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Buy, sell and track your orders in one place."
      altAction={{ prompt: 'Already have an account?', label: 'Sign in', href: '/signin' }}
    >
      <form onSubmit={onSubmit} className="auth-form">
        {error && (
          <div role="alert" className="auth-alert">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <label className="auth-field">
          <span className="auth-label">Full name</span>
          <span className="auth-input-wrap">
            <User className="auth-input-icon" aria-hidden="true" />
            <input
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </span>
        </label>

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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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

        <label className="auth-field">
          <span className="auth-label">Confirm password</span>
          <span className="auth-input-wrap">
            <Lock className="auth-input-icon" aria-hidden="true" />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
            />
          </span>
        </label>

        <button type="submit" className="auth-submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="auth-fineprint">
        Your details are used to process orders and are never sold on. Questions? Email{' '}
        <a href="mailto:poorprice@yahoo.com">poorprice@yahoo.com</a>.
      </p>
    </AuthShell>
  )
}
