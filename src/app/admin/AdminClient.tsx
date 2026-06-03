'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Mail, RefreshCw, Send, Shield, Users } from 'lucide-react'

type AdminUser = {
  id: string
  email: string
  name: string
  provider: 'password' | 'google'
  avatarUrl?: string
  createdAt: string
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminClient() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [userError, setUserError] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sendMessage, setSendMessage] = useState('')
  const [sendError, setSendError] = useState('')

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [users]
  )

  async function loadUsers() {
    setLoadingUsers(true)
    setUserError('')

    try {
      const response = await fetch('/api/admin/users')
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load users.')
      }

      setUsers(payload.users || [])
    } catch (error) {
      setUserError(error instanceof Error ? error.message : 'Unable to load users.')
    } finally {
      setLoadingUsers(false)
    }
  }

  async function sendNewsletter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSending(true)
    setSendMessage('')
    setSendError('')

    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send newsletter.')
      }

      setContent('')
      setSendMessage(`Newsletter sent to ${payload.sent} of ${payload.total} users.`)
      if (payload.failed) {
        setSendMessage(`Newsletter sent to ${payload.sent} users. ${payload.failed} failed.`)
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Unable to send newsletter.')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-24">
      <section className="mb-6 rounded-lg border border-cx-muted/45 bg-cx-navy/82 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="editorial-label mb-2">Admin Console</p>
            <h1 className="font-display text-3xl text-white md:text-4xl">Cinemax Updates</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
              Send newsletter updates and monitor signed-in Cinemax accounts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-80">
            <div className="rounded-lg border border-cx-muted/40 bg-cx-dark/74 p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-white/35">
                <Users size={13} />
                Users
              </p>
              <p className="font-display text-3xl text-white">{users.length}</p>
            </div>
            <div className="rounded-lg border border-cx-muted/40 bg-cx-dark/74 p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-white/35">
                <Shield size={13} />
                Access
              </p>
              <p className="text-sm font-semibold text-cx-accent">Admin</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="rounded-lg border border-cx-muted/45 bg-cx-navy/78 p-5">
          <div className="mb-5">
            <p className="editorial-label mb-2">Newsletter</p>
            <h2 className="font-display text-2xl text-white">Send Update</h2>
          </div>
          <form onSubmit={sendNewsletter} className="space-y-4">
            <div className="rounded-lg border border-cx-muted/40 bg-cx-dark/72 px-4 py-3">
              <p className="mb-1 text-xs font-semibold uppercase text-white/32">Subject</p>
              <p className="text-sm font-bold text-cx-accent">NEWSLETTER</p>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase text-white/38">Content</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={10}
                required
                placeholder="Write the update you want every Cinemax user to receive."
                className="min-h-56 w-full resize-y rounded-lg border border-cx-muted/55 bg-cx-dark px-4 py-3 text-sm leading-6 text-white placeholder-white/28 transition-all focus:border-cx-accent/65"
              />
            </label>
            {sendMessage && (
              <div className="rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                {sendMessage}
              </div>
            )}
            {sendError && (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {sendError}
              </div>
            )}
            <button
              type="submit"
              disabled={sending || content.trim().length < 3}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cx-accent px-4 py-3 text-sm font-bold text-cx-black transition-all hover:bg-cx-bright disabled:cursor-not-allowed disabled:opacity-55"
            >
              {sending ? 'Sending...' : 'Send Newsletter'}
              {!sending && <Send size={16} />}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-cx-muted/45 bg-cx-navy/78 p-5">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="editorial-label mb-2">Accounts</p>
              <h2 className="font-display text-2xl text-white">Signed-In Emails</h2>
            </div>
            <button
              type="button"
              onClick={loadUsers}
              disabled={loadingUsers}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/62 transition-all hover:border-cx-accent/35 hover:text-cx-accent disabled:opacity-50"
            >
              <RefreshCw size={15} className={loadingUsers ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {userError && (
            <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {userError}
            </div>
          )}

          {loadingUsers ? (
            <div className="space-y-3">
              <div className="h-16 rounded-lg skeleton" />
              <div className="h-16 rounded-lg skeleton" />
              <div className="h-16 rounded-lg skeleton" />
            </div>
          ) : sortedUsers.length === 0 ? (
            <p className="rounded-lg border border-cx-muted/35 bg-cx-dark/70 px-4 py-5 text-sm text-white/42">
              No users found yet.
            </p>
          ) : (
            <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
              {sortedUsers.map((user) => (
                <div key={user.id} className="rounded-lg border border-cx-muted/35 bg-cx-dark/72 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-white">{user.name}</h3>
                      <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-white/52">
                        <Mail size={13} className="shrink-0 text-cx-accent" />
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border border-cx-accent/25 bg-cx-accent/10 px-2 py-1 text-xs font-semibold capitalize text-cx-accent">
                      {user.provider}
                    </span>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-white/34">
                    <Calendar size={12} />
                    Joined {formatDate(user.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
