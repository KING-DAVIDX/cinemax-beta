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

export interface Source {
  quality: string
  url: string
  proxyUrl: string
  size?: string
  format?: string
}

export interface ApiResponse<T> {
  status: string
  data: T
}

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

export async function getMovieSources(
  id: string,
  season?: number,
  episode?: number
): Promise<Source[]> {
  try {
    let url = `${API_BASE}/api/sources/${id}`
    if (season !== undefined && episode !== undefined) {
      url += `?season=${season}&episode=${episode}`
    }
    const res = await fetch(url, { cache: 'no-store' })
    const json: ApiResponse<{ sources: any[] }> = await res.json()
    if (json.status !== 'success') return []
    return (json.data?.sources || []).map((s: any) => ({
      quality: s.quality || 'HD',
      url: s.url || s.directUrl || '',
      proxyUrl: s.proxyUrl || s.url || '',
      size: s.size || '',
      format: s.format || 'mp4',
    }))
  } catch {
    return []
  }
}

export async function getHomepage(): Promise<{
  banner: MovieItem[]
  sections: { title: string; items: MovieItem[] }[]
}> {
  try {
    const res = await fetch(`${API_BASE}/api/homepage`, {
      cache: 'no-store',
    })
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
    const res = await fetch(`${API_BASE}/api/trending`, {
      cache: 'no-store',
    })
    const json: ApiResponse<any> = await res.json()
    if (json.status !== 'success') return []
    const items = json.data?.subjectList || json.data?.subjects || json.data?.items || json.data || []
    return Array.isArray(items) ? items.map(normalizeMovie) : []
  } catch {
    return []
  }
}

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
