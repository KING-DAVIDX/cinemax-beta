import crypto from 'crypto'
import { getDb, type StoredUser } from '@/lib/auth'

export const BOOKMARKS_COLLECTION = 'bookmarks'

export type StoredBookmark = {
  id: string
  userId: string
  key: string
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
  createdAt: string
  updatedAt: string
}

export type BookmarkInput = {
  movieId: string
  title: string
  poster?: string
  type: 'movie' | 'series'
  season?: number
  episode?: number
  progressSeconds: number
  durationSeconds: number
  detailPath?: string
  year?: number
  rating?: number
}

export function bookmarkKey(input: Pick<StoredBookmark, 'movieId' | 'season' | 'episode'>) {
  return [
    String(input.movieId),
    String(input.season || 0),
    String(input.episode || 0),
  ].join(':')
}

function cleanNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function cleanOptionalNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function cleanType(value: unknown): 'movie' | 'series' {
  return value === 'series' ? 'series' : 'movie'
}

export function normalizeBookmarkInput(input: Partial<BookmarkInput>): BookmarkInput {
  const movieId = String(input.movieId || '').trim()
  const title = String(input.title || '').trim()

  if (!movieId) throw new Error('movieId is required.')
  if (!title) throw new Error('title is required.')

  return {
    movieId,
    title: title.slice(0, 180),
    poster: String(input.poster || '').trim(),
    type: cleanType(input.type),
    season: cleanOptionalNumber(input.season),
    episode: cleanOptionalNumber(input.episode),
    progressSeconds: cleanNumber(input.progressSeconds),
    durationSeconds: cleanNumber(input.durationSeconds),
    detailPath: String(input.detailPath || '').trim() || undefined,
    year: cleanOptionalNumber(input.year),
    rating: cleanOptionalNumber(input.rating),
  }
}

export async function listBookmarks(user: StoredUser) {
  const bookmarks = await getDb()
    .from<StoredBookmark>(BOOKMARKS_COLLECTION)
    .where({ userId: user.id })
    .select()

  return bookmarks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export async function findBookmark(
  user: StoredUser,
  movieId: string,
  season?: number,
  episode?: number
) {
  const key = bookmarkKey({ movieId, season, episode })
  const keyedBookmarks = await getDb()
    .from<StoredBookmark>(BOOKMARKS_COLLECTION)
    .where({ userId: user.id, key })
    .limit(1)
    .select()

  if (keyedBookmarks[0]) return keyedBookmarks[0]

  const bookmarks = await getDb()
    .from<StoredBookmark>(BOOKMARKS_COLLECTION)
    .where({ userId: user.id, movieId: String(movieId) })
    .select()

  const normalizedSeason = season || undefined
  const normalizedEpisode = episode || undefined
  const legacy = bookmarks.find((bookmark) =>
    (bookmark.season || undefined) === normalizedSeason
    && (bookmark.episode || undefined) === normalizedEpisode
  )

  if (legacy && !legacy.key) {
    await getDb()
      .from<StoredBookmark>(BOOKMARKS_COLLECTION)
      .where({ id: legacy.id, userId: user.id })
      .update({ key })

    return { ...legacy, key }
  }

  return null
}

export async function upsertBookmark(user: StoredUser, rawInput: Partial<BookmarkInput>) {
  const input = normalizeBookmarkInput(rawInput)
  const now = new Date().toISOString()
  const existing = await findBookmark(user, input.movieId, input.season, input.episode)

  const values = {
    key: bookmarkKey(input),
    movieId: input.movieId,
    title: input.title,
    poster: input.poster || '',
    type: input.type,
    season: input.season,
    episode: input.episode,
    progressSeconds: Math.min(input.progressSeconds, input.durationSeconds || input.progressSeconds),
    durationSeconds: input.durationSeconds,
    detailPath: input.detailPath,
    year: input.year,
    rating: input.rating,
    updatedAt: now,
  }

  if (existing) {
    await getDb()
      .from<StoredBookmark>(BOOKMARKS_COLLECTION)
      .where({ id: existing.id, userId: user.id })
      .update(values)

    return { ...existing, ...values }
  }

  const bookmark: StoredBookmark = {
    id: crypto.randomUUID(),
    userId: user.id,
    ...values,
    createdAt: now,
  }

  await getDb().from<StoredBookmark>(BOOKMARKS_COLLECTION).insert(bookmark)
  return bookmark
}

export async function deleteBookmark(user: StoredUser, id: string) {
  await getDb().from<StoredBookmark>(BOOKMARKS_COLLECTION).where({ id, userId: user.id }).delete()
}

export async function clearBookmarks(user: StoredUser) {
  await getDb().from<StoredBookmark>(BOOKMARKS_COLLECTION).where({ userId: user.id }).delete()
}
