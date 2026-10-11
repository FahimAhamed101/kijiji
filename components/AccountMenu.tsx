'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut, Package, User, UserPlus } from 'lucide-react'
import { useGetMemberQuery, useMemberLogoutMutation } from '@/store/accountApi'

/**
 * Header account entry point.
 *
 * Signed out it is a plain "Register or Sign In" link, which is what most
 * visitors are. Signed in it becomes a menu with the member's initial, their
 * orders and sign-out.
 */
export default function AccountMenu() {
  const router = useRouter()
  const { data, isLoading } = useGetMemberQuery()
  const [logout, { isLoading: loggingOut }] = useMemberLogoutMutation()

  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const member = data?.member ?? null

  // Close on outside click and on Escape — the two things a dropdown is
  // expected to do and the two things that are always forgotten.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function signOut() {
    setOpen(false)
    await logout().unwrap().catch(() => {})
    router.push('/')
    router.refresh()
  }

  // Don't flash the signed-out link while the session is still being read.
  if (isLoading) {
    return (
      <span className="account-menu-placeholder" aria-hidden="true">
        <User className="h-4 w-4" />
      </span>
    )
  }

  if (!member) {
    return (
      <Link href="/signin" className="account-signin-link">
        <User className="h-4 w-4" aria-hidden="true" />
        Register or Sign In
      </Link>
    )
  }

  return (
    <div className="account-menu" ref={wrapRef}>
      <button
        type="button"
        className="account-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="account-avatar" style={{ background: member.avatarColor }}>
          {member.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="account-menu-name">{member.name.split(' ')[0]}</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div className="account-menu-panel" role="menu">
          <div className="account-menu-header">
            <p className="account-menu-fullname">{member.name}</p>
            <p className="account-menu-email">{member.email}</p>
          </div>

          <Link href="/account" role="menuitem" onClick={() => setOpen(false)}>
            <User className="h-4 w-4" aria-hidden="true" />
            My account
          </Link>
          <Link href="/account#orders" role="menuitem" onClick={() => setOpen(false)}>
            <Package className="h-4 w-4" aria-hidden="true" />
            My orders
          </Link>
          <Link href="/admin/products/new" role="menuitem" onClick={() => setOpen(false)}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Post an ad
          </Link>

          <button
            type="button"
            role="menuitem"
            className="account-menu-signout"
            onClick={signOut}
            disabled={loggingOut}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
