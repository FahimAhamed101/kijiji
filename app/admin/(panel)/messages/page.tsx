'use client'

import { useEffect, useState } from 'react'
import { Mail, Search, Trash2, MailOpen, Archive, Reply } from 'lucide-react'
import {
  useGetMessagesQuery,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
} from '@/store/inboxApi'
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
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
import { timeAgo, type ContactMessage } from '@/store/types'

const STATUSES = ['all', 'unread', 'read', 'replied', 'archived']

export default function AdminMessagesPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<ContactMessage | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError, error, refetch } = useGetMessagesQuery({
    status: status === 'all' ? undefined : status,
    q: debounced || undefined,
    page,
    limit: 15,
  })

  const [updateMessage] = useUpdateMessageMutation()
  const [deleteMessage, { isLoading: deleting }] = useDeleteMessageMutation()

  const items = data?.items ?? []

  async function setStatusFor(message: ContactMessage, next: string) {
    try {
      await updateMessage({ id: message._id, status: next }).unwrap()
      if (open?._id === message._id) setOpen({ ...message, status: next as ContactMessage['status'] })
    } catch {
      setNotice('Could not update that message.')
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteMessage(pendingDelete._id).unwrap()
      setNotice('Message deleted.')
    } catch {
      setNotice('Could not delete that message.')
    }
    setPendingDelete(null)
    setOpen(null)
  }

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Enquiries sent from listing pages."
      />

      {notice && (
        <Alert tone="success" className="mb-4 flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-medium underline">
            Dismiss
          </button>
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-line bg-canvas p-4 shadow-card">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or message…"
            className="pl-9"
            aria-label="Search messages"
          />
        </div>
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
      </div>

      {isError ? (
        <ErrorState
          message={
            (error as { data?: { error?: string } })?.data?.error ?? 'Could not load messages.'
          }
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center text-ink-muted">
          <Spinner className="h-6 w-6" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Inbox is empty"
          description="Enquiries submitted through a listing page will appear here."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>From</Th>
                <Th>Listing</Th>
                <Th>Message</Th>
                <Th>Status</Th>
                <Th>Received</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr
                  key={m._id}
                  className={`cursor-pointer hover:bg-surface/60 ${
                    m.status === 'unread' ? 'font-medium' : ''
                  }`}
                  onClick={() => {
                    setOpen(m)
                    if (m.status === 'unread') setStatusFor(m, 'read')
                  }}
                >
                  <Td>
                    <p className="text-ink">{m.name}</p>
                    <p className="text-xs text-ink-muted">{m.email}</p>
                  </Td>
                  <Td>
                    <span className="line-clamp-1 max-w-[200px] text-xs">
                      {m.productTitle || '—'}
                    </span>
                  </Td>
                  <Td>
                    <span className="line-clamp-1 max-w-[280px] text-xs">{m.body}</span>
                  </Td>
                  <Td>
                    <StatusBadge value={m.status} />
                  </Td>
                  <Td>
                    <span className="text-xs text-ink-muted">{timeAgo(m.createdAt)}</span>
                  </Td>
                  <Td className="text-right">
                    <div
                      className="inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        title="Mark unread"
                        onClick={() => setStatusFor(m, 'unread')}
                        className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-brand"
                      >
                        <MailOpen className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Archive"
                        onClick={() => setStatusFor(m, 'archived')}
                        className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-brand"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => setPendingDelete(m)}
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

      {/* Message detail */}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title="Message"
        width="max-w-2xl"
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
              <Button variant="secondary" onClick={() => setStatusFor(open, 'archived')}>
                <Archive className="h-4 w-4" />
                Archive
              </Button>
              <a
                href={`mailto:${open.email}?subject=${encodeURIComponent(
                  `Re: ${open.productTitle || 'your enquiry'}`
                )}`}
                onClick={() => setStatusFor(open, 'replied')}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
              >
                <Reply className="h-4 w-4" />
                Reply by email
              </a>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Mail className="h-4 w-4" />
              </span>
              <div>
                <p className="font-medium text-ink">{open.name}</p>
                <p className="text-xs text-ink-muted">
                  {open.email}
                  {open.phone ? ` · ${open.phone}` : ''}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <StatusBadge value={open.status} />
                <span className="text-xs text-ink-muted">{timeAgo(open.createdAt)}</span>
              </div>
            </div>

            {open.productTitle && (
              <div className="rounded-lg bg-surface px-3 py-2 text-xs text-ink-soft">
                Regarding: <span className="font-medium text-ink">{open.productTitle}</span>
              </div>
            )}

            <div className="whitespace-pre-wrap rounded-lg border border-line bg-canvas p-4 text-sm leading-relaxed text-ink-soft">
              {open.body}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete message"
        message="This message will be permanently removed."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
