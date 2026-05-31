const API_BASE = 'https://xer-movie-api.vercel.app'

export interface MovieItem {
  id: string
  title: string
  poster?: string
  year?: number
  rating?: number
  type?: 'movie' | 'series'
  description?: string
  genres?: string[]
  duration?: number
  cast?: string[]
}

export interface SeasonInfo {
  season: number
  episodeCount: number
  resolutions: { resolution: number; epNum: number }[]
}

export interface Source {
  quality: string
  url: string
  /** Always use this for downloads — direct CDN links require the proxy */
  proxyUrl: string
  size?: string
  format?: string
}

export interface SeriesInfo {
  movieInfo: MovieItem
  seasons: SeasonInfo[]
  totalSeasons: number
  totalEpisodes: number
  detailPath?: string
}

export interface ApiResponse<T> {
  status: string
  data: T
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildProxyUrl(directUrl: string): string {
  if (!directUrl) return ''
  return `${API_BASE}/api/download-proxy/${encodeURIComponent(directUrl)}`
}

// ─── Search ─────────────────────────────────────────────────────────────────

export async function searchMovies(query: string): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/search/${encodeURIComponent(query)}`, {
      cache: 'no-store',
    })
    const json: ApiResponse<{ items: any[] }> = await res.json()
    if (json.status !== 'success') return []
    return (json.data?.items || []).map(normalizeMovie)
  } catch {
    return []
  }
}

// ─── Info (basic metadata only, no season data) ─────────────────────────────

export async function getMovieInfo(id: string): Promise<MovieItem | null> {
  try {
    const res = await fetch(`${API_BASE}/api/info/${id}`, {
      cache: 'no-store',
    })
    const json: ApiResponse<{ items: any[] }> = await res.json()
    if (json.status !== 'success') return null
    const items: any[] = json.data?.items || []
    if (!items.length) return null
    const subject = items.find(i => String(i.subjectId) === String(id)) ?? items[0]
    return normalizeMovie(subject)
  } catch {
    return null
  }
}

// ─── Series info: accurate seasons + episode counts via /sources ─────────────

/**
 * Fetches season/episode structure from the sources endpoint.
 * Uses data.movieInfo.resource.seasons[] for accurate counts.
 * Falls back to getMovieInfo() for movies or on failure.
 */
export async function getSeriesInfo(id: string): Promise<SeriesInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/sources/${id}`, { cache: 'no-store' })
    const json: ApiResponse<{ movieInfo: any; sources: any[] }> = await res.json()
    if (json.status !== 'success') return null

    const raw = json.data?.movieInfo
    const subject = raw?.subject ?? raw
    const resource = raw?.resource

    const seasons: SeasonInfo[] = (resource?.seasons || []).map((s: any) => ({
      season: s.se,
      episodeCount: s.maxEp,
      resolutions: s.resolutions || [],
    }))

    const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodeCount, 0)

    return {
      movieInfo: normalizeMovie(subject),
      seasons,
      totalSeasons: seasons.length,
      totalEpisodes,
      detailPath: subject?.detailPath,
    }
  } catch {
    return null
  }
}

// ─── Sources (streams/downloads) for a specific episode ─────────────────────

/**
 * Returns sources for a movie, or a specific season+episode of a series.
 * proxyUrl is always set — use it instead of url for downloads/playback.
 */
export async function getMovieSources(
  id: string,
  season?: number,
  episode?: number,
  detailPath?: string
): Promise<Source[]> {
  try {
    let url = `${API_BASE}/api/sources/${id}`
    const params = new URLSearchParams()
    if (season !== undefined && episode !== undefined) {
      params.set('season', String(season))
      params.set('episode', String(episode))
    }
    if (detailPath) params.set('detailPath', detailPath)
    const qs = params.toString()
    if (qs) url += `?${qs}`

    const res = await fetch(url, { cache: 'no-store' })
    const json: ApiResponse<{ sources: any[] }> = await res.json()
    if (json.status !== 'success') return []

    return (json.data?.sources || []).map((s: any) => {
      const directUrl: string = s.directUrl || s.url || ''
      return {
        quality: s.quality || 'HD',
        url: directUrl,
        // Direct CDN links 403 without the proxy — always use proxyUrl
        proxyUrl: buildProxyUrl(directUrl),
        size: s.size || '',
        format: s.format || 'mp4',
      }
    })
  } catch {
    return []
  }
}

/**
 * Convenience: builds a direct download URL via the proxy endpoint.
 * Use this anywhere you need a one-shot download link.
 *
 * Example: <a href={getDownloadUrl(directUrl)}>Download</a>
 */
export function getDownloadUrl(directUrl: string): string {
  return buildProxyUrl(directUrl)
}

/**
 * Convenience: builds a download link for a whole episode via /api/download.
 * The server will resolve the best quality and stream it through.
 */
export function getEpisodeDownloadUrl(
  id: string,
  season?: number,
  episode?: number,
  detailPath?: string
): string {
  let url = `${API_BASE}/api/download/${id}`
  const params = new URLSearchParams()
  if (season !== undefined) params.set('season', String(season))
  if (episode !== undefined) params.set('episode', String(episode))
  if (detailPath) params.set('detailPath', detailPath)
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

// ─── Homepage & Trending ─────────────────────────────────────────────────────

export async function getHomepage(): Promise<{
  banner: MovieItem[]
  sections: { title: string; items: MovieItem[] }[]
}> {
  try {
    const res = await fetch(`${API_BASE}/api/homepage`, { cache: 'no-store' })
    const json: ApiResponse<{ operatingList: any[] }> = await res.json()
    if (json.status !== 'success') return { banner: [], sections: [] }

    const operatingList: any[] = json.data?.operatingList || []

    const bannerSection = operatingList.find((s: any) => s.type === 'BANNER')
    const banner: MovieItem[] = (bannerSection?.banner?.items || [])
      .map((item: any) => normalizeMovie(item.subject || item))

    const sections = operatingList
      .filter((s: any) => s.type === 'SUBJECTS_MOVIE' && s.subjects?.length > 0)
      .map((s: any) => ({
        title: s.title || '',
        items: s.subjects.map(normalizeMovie),
      }))

    return { banner, sections }
  } catch {
    return { banner: [], sections: [] }
  }
}

export async function getTrending(): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/trending`, { cache: 'no-store' })
    const json: ApiResponse<any> = await res.json()
    if (json.status !== 'success') return []
    const items = json.data?.subjectList || json.data?.subjects || json.data?.items || json.data || []
    return Array.isArray(items) ? items.map(normalizeMovie) : []
  } catch {
    return []
  }
}

// ─── Normalizer ──────────────────────────────────────────────────────────────

function normalizeMovie(item: any): MovieItem {
  if (!item) return { id: '', title: 'Unknown' }

  const rawId = item.subjectId || item.subject_id
  const id = rawId
    ? String(rawId)
    : item.id && item.id !== 0 && item.id !== '0'
      ? String(item.id)
      : ''

  return {
    id,
    title: item.title || item.name || item.originalTitle || 'Untitled',
    poster:
      item.cover?.url ||
      item.poster ||
      item.coverVerticalUrl ||
      item.image ||
      item.thumbnail ||
      '',
    year:
      item.year ||
      item.releaseYear ||
      (item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined),
    rating:
      parseFloat(item.imdbRatingValue) ||
      item.rating ||
      item.score ||
      item.imdbScore ||
      0,
    type:
      item.subjectType === 2 || item.type === 'series' || item.episodeCount
        ? 'series'
        : 'movie',
    description: item.description || item.plot || item.introduction || '',
    genres: item.genre
      ? String(item.genre)
          .split(',')
          .map((g: string) => g.trim())
          .filter(Boolean)
      : Array.isArray(item.genres)
        ? item.genres.map((g: any) => g.name || g)
        : [],
    duration: item.duration ? Math.round(item.duration / 60) : item.runtime || 0,
    cast: Array.isArray(item.staffList)
      ? item.staffList.map((a: any) => a.name || a)
      : Array.isArray(item.actors)
        ? item.actors.map((a: any) => a.name || a)
        : [],
  }
}
