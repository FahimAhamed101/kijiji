'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  Mail,
  Flag,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react'
import { useGetMeQuery, useLogoutMutation, useGetStatsQuery } from '@/store/authApi'
import { Spinner } from './ui'
import type { SessionUser } from '@/store/types'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  exact?: boolean
  /** Roles allowed to see this item. Omitted = everyone. */
  roles?: SessionUser['role'][]
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const { data: me } = useGetMeQuery()
  const { data: stats } = useGetStatsQuery()
  const [logout, { isLoading: loggingOut }] = useLogoutMutation()

  const user: SessionUser | null = me?.user ?? null

  const navItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/products', label: 'Listings', icon: Package, badge: stats?.products.total },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree, badge: stats?.categories.total },
    { href: '/admin/messages', label: 'Messages', icon: Mail, badge: stats?.messages.unread },
    { href: '/admin/reports', label: 'Reports', icon: Flag, badge: stats?.reports.open },
    {
      href: '/admin/users',
      label: 'Staff',
      icon: Users,
      badge: stats?.users.total,
      roles: ['admin'],
    },
  ]

  // Hide items the signed-in role can't use. While the session is still loading
  // we keep everything visible to avoid a nav that pops in.
  const nav = navItems.filter((item) => !item.roles || !user || item.roles.includes(user.role))

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  async function handleLogout() {
    await logout().unwrap().catch(() => {})
    window.location.replace('/admin/login')
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <BrandMark />
          Admin
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          className="rounded-md p-2 text-ink-soft hover:bg-surface"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-line bg-canvas transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="hidden items-center gap-2 border-b border-line px-5 py-4 lg:flex">
              <BrandMark />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink">Kijiji Admin</p>
                <p className="text-[11px] text-ink-muted">Marketplace control panel</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {nav.map((item) => {
                const Icon = item.icon
                const active = isActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand text-white'
                        : 'text-ink-soft hover:bg-surface hover:text-ink'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          active ? 'bg-white/20 text-white' : 'bg-surface text-ink-muted'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-line p-3">
              <Link
                href="/"
                target="_blank"
                className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-surface hover:text-ink"
              >
                <ExternalLink className="h-4 w-4" />
                View site
              </Link>

              <div className="rounded-lg bg-surface p-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: user?.role === 'admin' ? '#373373' : '#7c3aed' }}
                  >
                    {user?.name?.slice(0, 1).toUpperCase() ?? '?'}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-xs font-semibold text-ink">
                      {user?.name ?? 'Loading…'}
                    </p>
                    <p className="truncate text-[11px] capitalize text-ink-muted">
                      {user?.role ?? ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-line bg-canvas px-2 py-1.5 text-xs font-medium text-ink-soft hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                >
                  {loggingOut ? <Spinner className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {open && (
          <div
            className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

function BrandMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
      K
    </span>
  )
}
