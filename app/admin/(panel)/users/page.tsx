'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react'
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '@/store/usersApi'
import { useGetMeQuery } from '@/store/authApi'
import {
  Alert,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
  TableShell,
  Td,
  Th,
} from '@/components/admin/ui'
import { formatDate, timeAgo, type AdminUser } from '@/store/types'

type Draft = {
  id?: string
  name: string
  email: string
  password: string
  role: 'admin' | 'editor' | 'moderator'
  active: boolean
}

const EMPTY: Draft = {
  name: '',
  email: '',
  password: '',
  role: 'editor',
  active: true,
}

const ROLE_HELP: Record<string, string> = {
  admin: 'Full access, including deleting listings, categories and staff.',
  editor: 'Can create and edit listings and categories. Cannot delete.',
  moderator: 'Can review messages and reports, and edit listings.',
}

export default function AdminUsersPage() {
  const { data: me } = useGetMeQuery()
  const isAdmin = me?.user?.role === 'admin'

  const { data, isLoading, isError, error, refetch } = useGetUsersQuery()
  const [createUser, { isLoading: creating }] = useCreateUserMutation()
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation()
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation()

  const [draft, setDraft] = useState<Draft | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  async function save() {
    if (!draft) return
    if (draft.name.trim().length < 2) return setFormError('Enter a name.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email)) {
      return setFormError('Enter a valid email address.')
    }
    if (!draft.id && draft.password.length < 6) {
      return setFormError('Password must be at least 6 characters.')
    }
    if (draft.id && draft.password && draft.password.length < 6) {
      return setFormError('New password must be at least 6 characters.')
    }
    setFormError(null)

    try {
      if (draft.id) {
        await updateUser({
          id: draft.id,
          name: draft.name,
          email: draft.email,
          role: draft.role,
          active: draft.active,
          ...(draft.password ? { password: draft.password } : {}),
        }).unwrap()
        setNotice(`Updated ${draft.name}.`)
      } else {
        await createUser({
          name: draft.name,
          email: draft.email,
          password: draft.password,
          role: draft.role,
          active: draft.active,
        }).unwrap()
        setNotice(`Created ${draft.name}.`)
      }
      setDraft(null)
    } catch (err) {
      setFormError(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not save the account.'
      )
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteUser(pendingDelete.id).unwrap()
      setNotice(`Deleted ${pendingDelete.name}.`)
    } catch (err) {
      setNotice(
        (err as { data?: { error?: string } })?.data?.error ?? 'Could not delete that account.'
      )
    }
    setPendingDelete(null)
  }

  return (
    <>
      <PageHeader
        title="Staff accounts"
        subtitle="Who can sign in to this panel, and what they are allowed to do."
        actions={
          isAdmin && (
            <Button
              onClick={() => {
                setDraft({ ...EMPTY })
                setFormError(null)
              }}
            >
              <Plus className="h-4 w-4" />
              New account
            </Button>
          )
        }
      />

      {!isAdmin && (
        <Alert tone="warning" className="mb-4">
          You are signed in as <strong>{me?.user?.role}</strong>. Only admins can manage staff
          accounts.
        </Alert>
      )}

      {notice && (
        <Alert tone="success" className="mb-4 flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-medium underline"
          >
            Dismiss
          </button>
        </Alert>
      )}

      {isError ? (
        <ErrorState
          message={
            (error as { data?: { error?: string } })?.data?.error ??
            'Could not load staff accounts.'
          }
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center text-ink-muted">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No staff accounts" description="Create the first account." />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Account</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Last sign-in</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.id} className="hover:bg-surface/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: u.avatarColor || '#373373' }}
                    >
                      {u.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-medium text-ink">
                        {u.name}
                        {u.id === me?.user?.id && (
                          <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                            you
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-ink-muted">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <StatusBadge value={u.role} />
                </Td>
                <Td>
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${
                      u.active ? 'text-emerald-600' : 'text-ink-muted'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {u.active ? 'Active' : 'Disabled'}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs text-ink-muted">
                    {u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs text-ink-muted">{formatDate(u.createdAt)}</span>
                </Td>
                <Td className="text-right">
                  {isAdmin && (
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => {
                          setDraft({
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            password: '',
                            role: u.role,
                            active: u.active,
                          })
                          setFormError(null)
                        }}
                        className="rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-brand"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={u.id === me?.user?.id}
                        onClick={() => setPendingDelete(u)}
                        className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit account' : 'New staff account'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)} disabled={creating || updating}>
              Cancel
            </Button>
            <Button onClick={save} loading={creating || updating}>
              {draft?.id ? 'Save changes' : 'Create account'}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            {formError && <Alert tone="danger">{formError}</Alert>}

            <Field label="Full name" required>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Jane Doe"
                autoFocus
              />
            </Field>

            <Field label="Email" required>
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="jane@kijiji.local"
              />
            </Field>

            <Field
              label={draft.id ? 'New password' : 'Password'}
              hint={draft.id ? 'Leave blank to keep the current password.' : 'Minimum 6 characters.'}
              required={!draft.id}
            >
              <Input
                type="password"
                value={draft.password}
                onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>

            <Field label="Role" hint={ROLE_HELP[draft.role]}>
              <Select
                value={draft.role}
                onChange={(e) =>
                  setDraft({ ...draft, role: e.target.value as Draft['role'] })
                }
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="moderator">Moderator</option>
              </Select>
            </Field>

            <Checkbox
              label="Account is active"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete account"
        message={`${pendingDelete?.name ?? ''} will lose access immediately. This cannot be undone.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
