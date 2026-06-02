const API_BASE = (process.env.NEXT_PUBLIC_XER_MOVIE_API_BASE || 'https://xer-movie-api.vercel.app').replace(/\/$/, '')

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
  detailPath?: string
}

export interface SeasonInfo {
  season: number
  episodeCount: number
  resolutions: { resolution: number; epNum: number }[]
}

export interface Source {
  quality: string
  url: string
  downloadUrl: string
  streamUrl?: string
  directUrl?: string
  proxyUrl?: string
  size?: string
  format?: string
  filename?: string
}

export interface Caption {
  language: string
  url: string
  format?: string
}

export interface SourceResult {
  sources: Source[]
  captions: Caption[]
  limited: boolean
  hasResource: boolean
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
  message?: string
  error?: string
}

type ApiParam = string | number | boolean | undefined | null

export interface BrowseFilters {
  channelId?: number
  classify?: string
  country?: string
  genre?: string
  page?: number
  perPage?: number
  sort?: string
  year?: string
}

export const BROWSE_GENRES = [
  'All',
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
]

export const BROWSE_YEARS = ['All', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2010s', '2000s']

export const BROWSE_SORTS = [
  { label: 'For You', value: 'ForYou' },
  { label: 'Latest', value: 'Latest' },
  { label: 'Popular', value: 'Popular' },
]

function apiUrl(path: string, params?: Record<string, ApiParam>): string {
  const url = new URL(`${API_BASE}${path}`)

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

async function fetchApi<T>(url: string): Promise<ApiResponse<T> | null> {
  const res = await fetch(url, { cache: 'no-store' })
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null

  if (!res.ok || json?.status !== 'success') return null
  return json
}

export function buildMovieHref(movie: Pick<MovieItem, 'id' | 'title' | 'detailPath'>): string {
  const params = new URLSearchParams()

  if (movie.detailPath) params.set('detailPath', movie.detailPath)
  if (movie.title) params.set('title', movie.title)

  const qs = params.toString()
  return qs ? `/movie/${encodeURIComponent(movie.id)}?${qs}` : `/movie/${encodeURIComponent(movie.id)}`
}

export function buildWatchHref(
  movie: Pick<MovieItem, 'id' | 'title' | 'detailPath' | 'type'>,
  season?: number,
  episode?: number
): string {
  const params = new URLSearchParams()

  if (movie.detailPath) params.set('detailPath', movie.detailPath)
  if (movie.title) params.set('title', movie.title)
  if (movie.type) params.set('type', movie.type)
  if (season !== undefined) params.set('season', String(season))
  if (episode !== undefined) params.set('episode', String(episode))

  const qs = params.toString()
  return qs ? `/watch/${encodeURIComponent(movie.id)}?${qs}` : `/watch/${encodeURIComponent(movie.id)}`
}

export async function searchMovies(query: string): Promise<MovieItem[]> {
  try {
    const json = await fetchApi<{ items?: any[] }>(
      apiUrl(`/api/search/${encodeURIComponent(query)}`)
    )

    return (json?.data?.items || []).map(normalizeMovie).filter(hasMovieId)
  } catch {
    return []
  }
}

export async function getMovieInfo(
  id: string,
  detailPath?: string,
  title?: string
): Promise<MovieItem | null> {
  try {
    const json = await fetchApi<any>(
      apiUrl(`/api/info/${encodeURIComponent(id)}`, { detailPath, title })
    )

    if (!json?.data) return null
    return normalizeDetailPayload(json.data, detailPath)
  } catch {
    return null
  }
}

export async function getSeriesInfo(
  id: string,
  detailPath?: string,
  title?: string
): Promise<SeriesInfo | null> {
  try {
    const json = await fetchApi<any>(
      apiUrl(`/api/info/${encodeURIComponent(id)}`, { detailPath, title })
    )

    if (!json?.data) return null

    const raw = json.data
    const subject = raw?.subject ?? raw
    const resource = raw?.resource ?? subject?.resource
    const movieInfo = normalizeDetailPayload(raw, detailPath)
    const seasons: SeasonInfo[] = (resource?.seasons || [])
      .map((seasonItem: any) => ({
        season: Number(seasonItem.se ?? seasonItem.season ?? 0),
        episodeCount: Number(seasonItem.maxEp ?? seasonItem.episodeCount ?? seasonItem.epNum ?? 0),
        resolutions: seasonItem.resolutions || [],
      }))
      .filter((seasonItem: SeasonInfo) => seasonItem.season > 0 && seasonItem.episodeCount > 0)

    const totalEpisodes = seasons.reduce((sum, seasonItem) => sum + seasonItem.episodeCount, 0)

    return {
      movieInfo,
      seasons,
      totalSeasons: seasons.length,
      totalEpisodes,
      detailPath: movieInfo.detailPath || subject?.detailPath || raw?.detailPath || detailPath,
    }
  } catch {
    return null
  }
}

export async function getMovieSources(
  id: string,
  season?: number,
  episode?: number,
  detailPath?: string,
  title?: string
): Promise<Source[]> {
  const result = await getMovieSourceResult(id, season, episode, detailPath, title)
  return result.sources
}

export async function getMovieSourceResult(
  id: string,
  season?: number,
  episode?: number,
  detailPath?: string,
  title?: string
): Promise<SourceResult> {
  try {
    const json = await fetchApi<{
      sources?: any[]
      processedSources?: any[]
      captions?: any[]
      limited?: boolean
      hasResource?: boolean
    }>(
      apiUrl(`/api/sources/${encodeURIComponent(id)}`, {
        season,
        episode,
        detailPath,
        title,
      })
    )

    const sources = json?.data?.sources || json?.data?.processedSources || []
    const normalizedSources = sources
      .map((source: any) => normalizeSource(source, { id, season, episode, detailPath, title }))
      .filter((source: Source) => Boolean(source.downloadUrl || source.url))

    return {
      sources: normalizedSources,
      captions: (json?.data?.captions || []).map(normalizeCaption).filter((caption) => caption.url),
      limited: Boolean(json?.data?.limited),
      hasResource: Boolean(json?.data?.hasResource ?? normalizedSources.length),
    }
  } catch {
    return { sources: [], captions: [], limited: false, hasResource: false }
  }
}

export function getDownloadUrl(source: Source | string): string {
  if (typeof source === 'string') return source
  return source.downloadUrl || source.streamUrl || source.url || source.directUrl || ''
}

export function getEpisodeDownloadUrl(
  id: string,
  season?: number,
  episode?: number,
  detailPath?: string,
  title?: string,
  quality?: string
): string {
  return apiUrl(`/api/download/${encodeURIComponent(id)}`, {
    season,
    episode,
    detailPath,
    title,
    quality,
  })
}

export async function getHomepage(): Promise<{
  banner: MovieItem[]
  sections: { title: string; items: MovieItem[] }[]
}> {
  try {
    const json = await fetchApi<{ operatingList?: any[] }>(apiUrl('/api/homepage'))
    const operatingList = json?.data?.operatingList || []

    const bannerSection = operatingList.find((section: any) => section.type === 'BANNER')
    const banner = (bannerSection?.banner?.items || [])
      .map((item: any) => normalizeMovie(item.subject || item))
      .filter(hasMovieId)

    const sections = operatingList
      .filter((section: any) => section.type === 'SUBJECTS_MOVIE' && section.subjects?.length > 0)
      .map((section: any) => ({
        title: section.title || '',
        items: section.subjects.map(normalizeMovie).filter(hasMovieId),
      }))
      .filter((section: { title: string; items: MovieItem[] }) => section.items.length > 0)

    return { banner, sections }
  } catch {
    return { banner: [], sections: [] }
  }
}

export async function getTrending(): Promise<MovieItem[]> {
  try {
    const json = await fetchApi<any>(apiUrl('/api/trending'))
    const items = json?.data?.subjectList || json?.data?.subjects || json?.data?.items || json?.data || []
    return Array.isArray(items) ? items.map(normalizeMovie).filter(hasMovieId) : []
  } catch {
    return []
  }
}

export async function browseMovies(filters: BrowseFilters = {}): Promise<MovieItem[]> {
  try {
    const json = await fetchApi<{ items?: any[]; subjects?: any[] }>(
      apiUrl('/api/browse', {
        channelId: filters.channelId ?? 1,
        classify: filters.classify || 'All',
        country: filters.country || 'All',
        genre: filters.genre || 'All',
        page: filters.page ?? 1,
        perPage: filters.perPage ?? 24,
        sort: filters.sort || 'ForYou',
        year: filters.year || 'All',
      })
    )

    const items = json?.data?.items || json?.data?.subjects || []
    return items.map(normalizeMovie).filter(hasMovieId)
  } catch {
    return []
  }
}

export async function getRecommendations(
  id: string,
  page = 1,
  perPage = 12
): Promise<MovieItem[]> {
  try {
    const json = await fetchApi<{ items?: any[] }>(
      apiUrl(`/api/recommendations/${encodeURIComponent(id)}`, { page, perPage })
    )

    return (json?.data?.items || []).map(normalizeMovie).filter(hasMovieId)
  } catch {
    return []
  }
}

function normalizeDetailPayload(payload: any, fallbackDetailPath?: string): MovieItem {
  const subject = payload?.subject ?? payload
  return normalizeMovie({
    ...subject,
    resource: payload?.resource ?? subject?.resource,
    detailPath: subject?.detailPath || payload?.detailPath || fallbackDetailPath,
  })
}

function normalizeSource(
  source: any,
  context: {
    id: string
    season?: number
    episode?: number
    detailPath?: string
    title?: string
  }
): Source {
  const quality = String(source.quality || source.resolution || 'HD')
  const directUrl = source.directUrl || source.url || ''
  const downloadUrl =
    source.downloadUrl ||
    source.streamUrl ||
    getEpisodeDownloadUrl(
      context.id,
      context.season,
      context.episode,
      context.detailPath,
      context.title,
      quality
    )

  return {
    quality,
    url: downloadUrl,
    downloadUrl,
    streamUrl: source.streamUrl || downloadUrl,
    directUrl,
    proxyUrl: downloadUrl,
    size: source.size || '',
    format: source.format || 'MP4',
    filename: source.filename,
  }
}

function normalizeCaption(caption: any): Caption {
  const language =
    caption.language ||
    caption.lang ||
    caption.lanName ||
    caption.label ||
    caption.name ||
    'Subtitle'

  return {
    language,
    url: caption.url || caption.file || caption.src || caption.downloadUrl || '',
    format: caption.format || caption.type || 'srt',
  }
}

function hasMovieId(movie: MovieItem): boolean {
  return Boolean(movie.id)
}

function normalizeMovie(item: any): MovieItem {
  if (!item) return { id: '', title: 'Unknown' }

  const subject = item.subject ?? item
  const rawId = subject.subjectId ?? subject.subject_id ?? subject.id
  const rating = parseNumber(
    subject.imdbRatingValue ?? subject.rating ?? subject.score ?? subject.imdbScore
  )
  const year = normalizeYear(subject.year ?? subject.releaseYear ?? subject.releaseDate)
  const duration = normalizeDuration(subject.duration ?? subject.runtime)
  const genres = normalizeGenres(subject.genre ?? subject.genres ?? subject.genreList)
  const type = inferType(subject)

  return {
    id: rawId ? String(rawId) : '',
    title: subject.title || subject.name || subject.originalTitle || 'Untitled',
    poster:
      imageUrl(subject.cover) ||
      subject.poster ||
      subject.coverVerticalUrl ||
      subject.thumbnail ||
      imageUrl(subject.stills) ||
      subject.image ||
      '',
    year,
    rating,
    type,
    description: subject.description || subject.plot || subject.introduction || '',
    genres,
    duration,
    cast: normalizeCast(subject.staffList ?? subject.actors ?? subject.cast),
    detailPath: subject.detailPath || subject.detail_path || item.detailPath || item.detail_path,
  }
}

function imageUrl(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.url || value.src || ''
}

function parseNumber(value: any): number {
  const parsed = Number.parseFloat(String(value ?? ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeYear(value: any): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(String(value).slice(0, 4), 10)
  return Number.isFinite(parsed) && parsed > 1800 ? parsed : undefined
}

function normalizeDuration(value: any): number {
  const parsed = parseNumber(value)
  if (!parsed) return 0
  return parsed > 300 ? Math.round(parsed / 60) : Math.round(parsed)
}

function normalizeGenres(value: any): string[] {
  if (!value) return []

  if (typeof value === 'string') {
    return value.split(',').map((genre) => genre.trim()).filter(Boolean)
  }

  if (Array.isArray(value)) {
    return value
      .map((genre) => (typeof genre === 'string' ? genre : genre?.name || genre?.title || ''))
      .filter(Boolean)
  }

  return []
}

function normalizeCast(value: any): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((person) => (typeof person === 'string' ? person : person?.name || person?.character || ''))
    .filter(Boolean)
}

function inferType(item: any): 'movie' | 'series' {
  const seasons = item.resource?.seasons || []
  const hasSeriesSeason = seasons.some((season: any) => {
    const seasonNumber = Number(season.se ?? season.season ?? 0)
    const episodeCount = Number(season.maxEp ?? season.episodeCount ?? season.epNum ?? 0)
    return seasonNumber > 0 && episodeCount > 0
  })

  if (
    item.subjectType === 2 ||
    item.type === 'series' ||
    item.type === 'tv' ||
    item.episodeCount ||
    hasSeriesSeason
  ) {
    return 'series'
  }

  return 'movie'
}
