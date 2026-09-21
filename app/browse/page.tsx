import type { Metadata } from 'next'
import BrowseClient from '@/components/BrowseClient'

export const metadata: Metadata = {
  title: 'Browse listings — Kijiji',
  description: 'Search and filter every listing on the marketplace.',
}

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/**
 * Server wrapper: reads the query string on the server and hands plain props to
 * the client component, which keeps the RTK Query cache client-side.
 */
export default function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <BrowseClient
      initial={{
        q: first(searchParams.q) ?? '',
        category: first(searchParams.category) ?? 'all',
        group: first(searchParams.group) ?? 'all',
        featured: first(searchParams.featured) ?? 'all',
        sort: first(searchParams.sort) ?? 'newest',
        page: Number(first(searchParams.page) ?? 1) || 1,
      }}
    />
  )
}
