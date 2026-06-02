'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  Download,
  Film,
  KeyRound,
  LogOut,
  Shield,
  Trash2,
  Tv,
  User,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { buildMovieHref } from '@/lib/api'
import { userInitial, useAuth } from '@/hooks/useAuth'
import { useDownloadHistory, useWatchHistory } from '@/hooks/useHistory'

function formatDate(value: string | number) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(ts)
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, setUser } = useAuth()
  const { history, clearHistory } = useWatchHistory()
  const { downloads, clearDownloads } = useDownloadHistory()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/signin')
    router.refresh()
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage('')
    setPasswordError('')

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to change password.')

      setCurrentPassword('')
      setNewPassword('')
      setPasswordMessage('Password updated.')
      if (payload.user) setUser(payload.user)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Unable to change password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function deleteAccount() {
    setDeleteError('')
    try {
      const response = await fetch('/api/auth/delete-account', { method: 'DELETE' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to delete account.')

      clearHistory()
      clearDownloads()
      setUser(null)
      router.push('/signup')
      router.refresh()
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Unable to delete account.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cx-black">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 pt-24">
          <div className="h-40 rounded-lg skeleton" />
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cx-black">
        <Navbar />
        <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 pt-24 text-center">
          <div>
            <User size={48} className="mx-auto mb-4 text-cx-muted" />
            <h1 className="mb-3 font-display text-3xl text-white">Sign In Required</h1>
            <p className="mb-6 text-sm text-white/45">Your profile is available after you sign in.</p>
            <Link
              href="/signin"
              className="inline-flex rounded-lg bg-cx-accent px-5 py-3 text-sm font-bold text-cx-black transition-all hover:bg-cx-bright"
            >
              Sign In
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24">
        <section className="mb-8 rounded-lg border border-cx-muted/45 bg-cx-navy/82 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-cx-accent/35 bg-cx-accent text-2xl font-bold text-cx-black">
                {userInitial(user)}
              </div>
              <div>
                <p className="editorial-label mb-1">Profile</p>
                <h1 className="font-display text-3xl text-white">{user.name}</h1>
                <p className="text-sm text-white/45">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/62 transition-all hover:border-cx-accent/35 hover:text-cx-accent"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-cx-muted/45 bg-cx-navy/78 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-xl text-white">
                  <Clock size={18} className="text-cx-accent" />
                  Watch History
                </h2>
                <Link href="/history" className="text-sm font-semibold text-cx-accent hover:text-cx-ice">
                  View all
                </Link>
              </div>
              {history.length === 0 ? (
                <p className="rounded-lg border border-cx-muted/35 bg-cx-dark/70 px-4 py-5 text-sm text-white/42">
                  Streamed videos will appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 5).map((item) => (
                    <Link
                      key={`${item.id}-${item.season}-${item.episode}-${item.watchedAt}`}
                      href={buildMovieHref(item)}
                      className="flex items-center gap-3 rounded-lg border border-cx-muted/35 bg-cx-dark/70 p-3 transition-all hover:border-cx-accent/35"
                    >
                      <div className="grid h-14 w-10 shrink-0 place-items-center overflow-hidden rounded bg-cx-muted/25">
                        {item.poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.poster} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <Film size={16} className="text-cx-muted" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 flex items-center gap-2 text-xs text-white/35">
                          {item.type === 'series' ? <Tv size={11} /> : <Film size={11} />}
                          {item.type === 'series' && item.season && item.episode
                            ? `S${item.season}E${item.episode}`
                            : item.type}
                          <span>{formatRelativeTime(item.watchedAt)}</span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-cx-muted/45 bg-cx-navy/78 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-xl text-white">
                  <Download size={18} className="text-cx-accent" />
                  Download History
                </h2>
                <Link href="/downloads" className="text-sm font-semibold text-cx-accent hover:text-cx-ice">
                  View all
                </Link>
              </div>
              {downloads.length === 0 ? (
                <p className="rounded-lg border border-cx-muted/35 bg-cx-dark/70 px-4 py-5 text-sm text-white/42">
                  Downloaded videos will appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  {downloads.slice(0, 5).map((item) => (
                    <Link
                      key={item.downloadedAt}
                      href={buildMovieHref(item)}
                      className="flex items-center gap-3 rounded-lg border border-cx-muted/35 bg-cx-dark/70 p-3 transition-all hover:border-cx-accent/35"
                    >
                      <div className="grid h-14 w-10 shrink-0 place-items-center overflow-hidden rounded bg-cx-muted/25">
                        {item.poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.poster} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <Film size={16} className="text-cx-muted" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-white">{item.title}</h3>
                        <p className="mt-1 flex items-center gap-2 text-xs text-white/35">
                          <span className="text-cx-accent">{item.quality}</span>
                          <span>{formatRelativeTime(item.downloadedAt)}</span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-cx-muted/45 bg-cx-navy/78 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-white">
                <Shield size={18} className="text-cx-accent" />
                Account Info
              </h2>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-cx-muted/35 bg-cx-dark/70 p-3">
                  <p className="mb-1 text-xs uppercase text-white/30">Provider</p>
                  <p className="capitalize text-white/72">{user.provider}</p>
                </div>
                <div className="rounded-lg border border-cx-muted/35 bg-cx-dark/70 p-3">
                  <p className="mb-1 flex items-center gap-1 text-xs uppercase text-white/30">
                    <Calendar size={11} />
                    Joined
                  </p>
                  <p className="text-white/72">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-cx-muted/45 bg-cx-navy/78 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-white">
                <KeyRound size={18} className="text-cx-accent" />
                Change Password
              </h2>
              <form onSubmit={changePassword} className="space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder={user.provider === 'google' ? 'Current password if set' : 'Current password'}
                  className="w-full rounded-lg border border-cx-muted/55 bg-cx-dark px-3 py-2.5 text-sm text-white placeholder-white/28 transition-all focus:border-cx-accent/65"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-cx-muted/55 bg-cx-dark px-3 py-2.5 text-sm text-white placeholder-white/28 transition-all focus:border-cx-accent/65"
                />
                {passwordMessage && <p className="text-sm text-green-300">{passwordMessage}</p>}
                {passwordError && <p className="text-sm text-red-300">{passwordError}</p>}
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full rounded-lg bg-cx-accent px-4 py-2.5 text-sm font-bold text-cx-black transition-all hover:bg-cx-bright disabled:opacity-60"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </section>

            <section className="rounded-lg border border-red-500/25 bg-red-500/10 p-5">
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl text-white">
                <Trash2 size={18} className="text-red-300" />
                Delete Account
              </h2>
              <p className="mb-4 text-sm leading-6 text-white/45">
                This removes your account record from SparkDB and signs you out.
              </p>
              {deleteConfirm ? (
                <div className="space-y-2">
                  <button
                    onClick={deleteAccount}
                    className="w-full rounded-lg border border-red-500/45 bg-red-500/20 px-4 py-2.5 text-sm font-bold text-red-200 transition-all hover:bg-red-500 hover:text-white"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/60 transition-all hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-300 transition-all hover:bg-red-500 hover:text-white"
                >
                  Delete Account
                </button>
              )}
              {deleteError && <p className="mt-3 text-sm text-red-300">{deleteError}</p>}
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
