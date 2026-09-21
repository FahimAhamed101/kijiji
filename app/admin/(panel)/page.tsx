'use client'

import Link from 'next/link'
import {
  Package,
  FolderTree,
  Mail,
  Flag,
  Eye,
  Star,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { useGetStatsQuery } from '@/store/authApi'
import { Card, ErrorState, PageHeader, Spinner, StatusBadge } from '@/components/admin/ui'
import { priceLabel, primaryImage, timeAgo } from '@/store/types'

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isError, error, refetch } = useGetStatsQuery()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-muted">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorState
          message={
            (error as { data?: { error?: string } })?.data?.error ??
            'Could not load dashboard statistics.'
          }
          onRetry={refetch}
        />
      </>
    )
  }

  const maxCategory = Math.max(1, ...stats.categoriesBreakdown.map((c) => c.count))

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Everything happening across the marketplace."
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            New listing
          </Link>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Listings"
          value={stats.products.total}
          hint={`${stats.products.active} active · ${stats.products.draft} draft`}
          icon={<Package className="h-4 w-4" />}
          href="/admin/products"
        />
        <KpiCard
          label="Categories"
          value={stats.categories.total}
          hint={`${stats.categories.active} visible`}
          icon={<FolderTree className="h-4 w-4" />}
          href="/admin/categories"
        />
        <KpiCard
          label="Messages"
          value={stats.messages.total}
          hint={`${stats.messages.unread} unread`}
          icon={<Mail className="h-4 w-4" />}
          href="/admin/messages"
          tone={stats.messages.unread > 0 ? 'alert' : 'default'}
        />
        <KpiCard
          label="Open reports"
          value={stats.reports.open}
          hint="Awaiting review"
          icon={<Flag className="h-4 w-4" />}
          href="/admin/reports"
          tone={stats.reports.open > 0 ? 'alert' : 'default'}
        />
      </div>

      {/* Secondary stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Sold" value={stats.products.sold} />
        <MiniStat label="Archived" value={stats.products.archived} />
        <MiniStat
          label="Featured"
          value={stats.products.featured}
          icon={<Star className="h-3.5 w-3.5" />}
        />
        <MiniStat
          label="Total views"
          value={stats.views.total.toLocaleString('en-CA')}
          icon={<Eye className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Recent listings */}
        <Card className="lg:col-span-3" padded={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="text-sm font-semibold text-ink">Recently added</h2>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              All listings <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {stats.recentProducts.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-ink-muted">
                No listings yet. Seed the database or create one.
              </li>
            )}
            {stats.recentProducts.map((p) => (
              <li key={p._id}>
                <Link
                  href={`/admin/products/${p._id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-surface"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryImage(p)}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-md border border-line object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                    <p className="text-xs text-ink-muted">
                      {priceLabel(p)} · {timeAgo(p.createdAt)}
                    </p>
                  </div>
                  <StatusBadge value={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* Category breakdown */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink">Listings by category</h2>
          {stats.categoriesBreakdown.length === 0 ? (
            <p className="text-sm text-ink-muted">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.categoriesBreakdown.map((c) => (
                <li key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate text-ink-soft">{c.name}</span>
                    <span className="font-medium text-ink">{c.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.round((c.count / maxCategory) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = 'default',
}: {
  label: string
  value: number
  hint: string
  icon: React.ReactNode
  href: string
  tone?: 'default' | 'alert'
}) {
  return (
    <Link
      href={href}
      className="group rounded-card border border-line bg-canvas p-5 shadow-card transition-colors hover:border-brand/40"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-md ${
            tone === 'alert' ? 'bg-red-50 text-red-600' : 'bg-brand/10 text-brand'
          }`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink">{value.toLocaleString('en-CA')}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>
    </Link>
  )
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string
  value: number | string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-card border border-line bg-canvas px-4 py-3 shadow-card">
      <span className="flex items-center gap-1.5 text-xs text-ink-muted">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  )
}
