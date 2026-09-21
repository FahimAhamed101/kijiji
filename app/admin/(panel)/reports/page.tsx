'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Flag, Trash2, CheckCircle2, Eye } from 'lucide-react'
import {
  useGetReportsQuery,
  useUpdateReportMutation,
  useDeleteReportMutation,
} from '@/store/inboxApi'
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  Pagination,
  Select,
  Spinner,
  StatusBadge,
  TableShell,
  Td,
  Th,
} from '@/components/admin/ui'
import { timeAgo, type AbuseReport } from '@/store/types'

const STATUSES = ['all', 'open', 'reviewing', 'resolved', 'dismissed']

export default function AdminReportsPage() {
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<AbuseReport | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AbuseReport | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useGetReportsQuery({
    status: status === 'all' ? undefined : status,
    page,
    limit: 15,
  })

  const [updateReport] = useUpdateReportMutation()
  const [deleteReport, { isLoading: deleting }] = useDeleteReportMutation()

  const items = data?.items ?? []

  async function setStatusFor(report: AbuseReport, next: string) {
    try {
      await updateReport({ id: report._id, status: next }).unwrap()
      if (open?._id === report._id) setOpen({ ...report, status: next as AbuseReport['status'] })
      setNotice(`Report marked as “${next}”.`)
    } catch {
      setNotice('Could not update that report.')
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteReport(pendingDelete._id).unwrap()
      setNotice('Report deleted.')
    } catch {
      setNotice('Could not delete that report.')
    }
    setPendingDelete(null)
    setOpen(null)
  }

  return (
    <>
      <PageHeader title="Reports" subtitle="Abuse reports filed against listings." />

      {notice && (
        <Alert tone="success" className="mb-4 flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-medium underline">
            Dismiss
          </button>
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-line bg-canvas p-4 shadow-card">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="!w-auto"
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s}
            </option>
          ))}
        </Select>
        <span className="ml-auto text-xs text-ink-muted">
          {data?.total ?? 0} report{data?.total === 1 ? '' : 's'}
        </span>
      </div>

      {isError ? (
        <ErrorState
          message={
            (error as { data?: { error?: string } })?.data?.error ?? 'Could not load reports.'
          }
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center text-ink-muted">
          <Spinner className="h-6 w-6" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No reports"
          description="Reports submitted from listing pages will show up here."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Reason</Th>
                <Th>Listing</Th>
                <Th>Details</Th>
                <Th>Status</Th>
                <Th>Filed</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr
                  key={r._id}
                  className="cursor-pointer hover:bg-surface/60"
                  onClick={() => setOpen(r)}
                >
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-ink">
                      <Flag className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs capitalize">{r.reason.replace(/-/g, ' ')}</span>
                    </span>
                  </Td>
                  <Td>
                    <span className="line-clamp-1 max-w-[220px] text-xs">
                      {r.productTitle || '—'}
                    </span>
                  </Td>
                  <Td>
                    <span className="line-clamp-1 max-w-[240px] text-xs">{r.details || '—'}</span>
                  </Td>
                  <Td>
                    <StatusBadge value={r.status} />
                  </Td>
                  <Td>
                    <span className="text-xs text-ink-muted">{timeAgo(r.createdAt)}</span>
                  </Td>
                  <Td className="text-right">
                    <div
                      className="inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {r.status !== 'resolved' && (
                        <button
                          type="button"
                          title="Mark resolved"
                          onClick={() => setStatusFor(r, 'resolved')}
                          className="rounded-md p-1.5 text-ink-muted hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => setPendingDelete(r)}
                        className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>

          {data && (
            <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
          )}
        </>
      )}

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title="Report details"
        footer={
          open && (
            <>
              <Button
                variant="danger"
                onClick={() => setPendingDelete(open)}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              {open.status !== 'reviewing' && (
                <Button variant="secondary" onClick={() => setStatusFor(open, 'reviewing')}>
                  <Eye className="h-4 w-4" />
                  Start reviewing
                </Button>
              )}
              {open.status !== 'dismissed' && (
                <Button variant="secondary" onClick={() => setStatusFor(open, 'dismissed')}>
                  Dismiss
                </Button>
              )}
              <Button onClick={() => setStatusFor(open, 'resolved')}>
                <CheckCircle2 className="h-4 w-4" />
                Resolve
              </Button>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="capitalize text-ink">{open.reason.replace(/-/g, ' ')}</span>
              <div className="flex items-center gap-2">
                <StatusBadge value={open.status} />
                <span className="text-xs text-ink-muted">{timeAgo(open.createdAt)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-surface px-3 py-2 text-xs">
              Listing: <span className="font-medium text-ink">{open.productTitle || '—'}</span>
              {open.product && (
                <Link
                  href={`/admin/products/${open.product}`}
                  className="ml-2 text-brand hover:underline"
                >
                  Open listing →
                </Link>
              )}
            </div>

            <div className="whitespace-pre-wrap rounded-lg border border-line p-4 leading-relaxed text-ink-soft">
              {open.details || 'No additional details provided.'}
            </div>

            {open.reporterEmail && (
              <p className="text-xs text-ink-muted">Reported by {open.reporterEmail}</p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete report"
        message="This report will be permanently removed."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
