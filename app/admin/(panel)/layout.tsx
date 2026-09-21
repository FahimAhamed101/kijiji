import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminShell from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

/**
 * Auth guard for every /admin route except /admin/login.
 *
 * The session lives in an httpOnly cookie, so it is verified on the server
 * before any panel HTML is streamed - no client-side flash of protected UI.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/admin/login')
  }

  return <AdminShell>{children}</AdminShell>
}
