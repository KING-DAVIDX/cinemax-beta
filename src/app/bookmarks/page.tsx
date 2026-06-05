'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bookmark,
  Clock,
  Film,
  Play,
  Trash2,
  Tv,
  User,
  X,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { buildMovieHref, buildWatchHref, type MovieItem } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

type BookmarkItem = {
  id: string
  movieId: string
  title: string
  poster: string
  type: 'movie' | 'series'
  season?: number
  episode?: number
  progressSeconds: number
  durationSeconds: number
  detailPath?: string
  year?: number
  rating?: number
  updatedAt: string
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'

  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatRelativeTime(value: string) {
  const ts = new Date(value).getTime()
  if (!Number.isFinite(ts)) return 'Recently'

  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

function bookmarkMovie(item: BookmarkItem): MovieItem {
  return {
    id: item.movieId,
    title: item.title,
    poster: item.poster,
    type: item.type,
    detailPath: item.detailPath,
    year: item.year,
    rating: item.rating,
  }
}

function bookmarkWatchHref(item: BookmarkItem) {
  const href = buildWatchHref(
    bookmarkMovie(item),
    item.type === 'series' ? item.season : undefined,
    item.type === 'series' ? item.episode : undefined
  )
  const separator = href.includes('?') ? '&' : '?'
  return `${href}${separator}t=${Math.max(0, Math.floor(item.progressSeconds || 0))}`
}

function BookmarkCard({
  item,
  onRemove,
}: {
  item: BookmarkItem
  onRemove: () => void
}) {
  const detailHref = buildMovieHref(bookmarkMovie(item))
  const watchHref = bookmarkWatchHref(item)
  const progressPercent = item.durationSeconds > 0
    ? Math.min((item.progressSeconds / item.durationSeconds) * 100, 100)
    : 0

  return (
    <div className="group flex gap-3 rounded-lg border border-cx-muted/30 bg-cx-navy/60 p-3 transition-all hover:border-cx-muted/60 hover:bg-cx-navy sm:gap-4 sm:p-4">
      <Link href={detailHref} className="shrink-0">
        <div className="h-24 w-16 overflow-hidden rounded-lg bg-cx-muted/30">
          {item.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.poster} alt={item.title} className="h-full w-full object-cover transition-transform hover:scale-110" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film size={24} className="text-cx-muted" />
            </div>
          )}
        </div>
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={detailHref}>
          <h3 className="truncate text-sm font-semibold text-white transition-colors hover:text-cx-accent">
            {item.title}
          </h3>
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-white/40">
            {item.type === 'series' ? <Tv size={10} /> : <Film size={10} />}
            {item.type === 'series' ? 'Series' : 'Movie'}
          </span>
          {item.type === 'series' && item.season && item.episode && (
            <span className="text-xs text-cx-ice/50">S{item.season}E{item.episode}</span>
          )}
          {item.year && <span className="text-xs text-white/30">{item.year}</span>}
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-cx-accent">
              {formatTime(item.progressSeconds)} / {formatTime(item.durationSeconds)}
            </span>
            <span className="flex items-center gap-1 text-white/30">
              <Clock size={10} />
              {formatRelativeTime(item.updatedAt)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-cx-accent" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="mt-3">
          <Link
            href={watchHref}
            className="inline-flex items-center gap-1 rounded-lg border border-cx-accent/20 bg-cx-accent/10 px-3 py-1.5 text-xs font-semibold text-cx-accent transition-all hover:border-cx-accent hover:bg-cx-accent hover:text-white"
          >
            <Play size={11} className="fill-current" />
            Resume
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.title}`}
        className="self-start rounded-lg p-1.5 text-white/40 opacity-0 transition-all hover:bg-white/10 hover:text-white/80 group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  async function loadBookmarks() {
    if (!user) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/bookmarks', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to load bookmarks.')
      setBookmarks(payload.bookmarks || [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load bookmarks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    void loadBookmarks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id])

  async function removeBookmark(id: string) {
    setBookmarks((current) => current.filter((item) => item.id !== id))
    await fetch(`/api/bookmarks/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  async function clearAll() {
    await fetch('/api/bookmarks', { method: 'DELETE' })
    setBookmarks([])
    setConfirmClear(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-cx-black">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 pt-24">
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
            <p className="mb-6 text-sm text-white/45">Bookmarks are saved to your account after you sign in.</p>
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
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <Bookmark size={24} className="text-cx-accent" />
              <h1 className="font-display text-3xl text-white sm:text-4xl">Bookmarks</h1>
            </div>
            <p className="text-sm text-white/40">
              {bookmarks.length} saved position{bookmarks.length !== 1 ? 's' : ''}
            </p>
          </div>

          {bookmarks.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/50">Clear all?</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs text-red-400 transition-all hover:border-red-500 hover:bg-red-500 hover:text-white"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-all hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                  Clear Bookmarks
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mb-8 h-px w-24 bg-gradient-to-r from-cx-accent to-transparent" />

        {error && (
          <p className="mb-6 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bookmark size={48} className="mb-4 text-cx-muted" />
            <h3 className="mb-2 font-display text-2xl text-white/60">No Bookmarks Yet</h3>
            <p className="mb-6 text-sm text-white/30">
              Start streaming while signed in and your exact stop time will appear here.
            </p>
            <Link
              href="/"
              className="rounded-lg border border-cx-accent/30 bg-cx-accent/10 px-6 py-3 text-sm font-semibold text-cx-accent transition-all hover:border-cx-accent hover:bg-cx-accent hover:text-white"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((item) => (
              <BookmarkCard
                key={item.id}
                item={item}
                onRemove={() => removeBookmark(item.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
