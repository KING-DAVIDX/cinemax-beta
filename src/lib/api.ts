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
      next: { revalidate: 300 }
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
      next: { revalidate: 600 }
    })
    const json: ApiResponse<{ subject: any }> = await res.json()
    if (json.status !== 'success') return null
    return normalizeMovie(json.data?.subject)
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
    const res = await fetch(url)
    const json: ApiResponse<{ processedSources: any[] }> = await res.json()
    if (json.status !== 'success') return []
    return (json.data?.processedSources || []).map((s: any) => ({
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

export async function getHomepage(): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/homepage`, {
      next: { revalidate: 300 }
    })
    const json: ApiResponse<any> = await res.json()
    if (json.status !== 'success') return []
    const items = json.data?.items || json.data?.featured || json.data || []
    return Array.isArray(items) ? items.map(normalizeMovie) : []
  } catch {
    return []
  }
}

export async function getTrending(): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/trending`, {
      next: { revalidate: 300 }
    })
    const json: ApiResponse<any> = await res.json()
    if (json.status !== 'success') return []
    const items = json.data?.items || json.data || []
    return Array.isArray(items) ? items.map(normalizeMovie) : []
  } catch {
    return []
  }
}

function normalizeMovie(item: any): MovieItem {
  if (!item) return { id: '', title: 'Unknown' }
  return {
    id: String(item.id || item.movieId || item._id || ''),
    title: item.title || item.name || item.originalTitle || 'Untitled',
    poster: item.poster || item.coverVerticalUrl || item.image || item.thumbnail || '',
    year: item.year || item.releaseYear || (item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined),
    rating: item.rating || item.score || item.imdbScore || 0,
    type: item.type === 1 || item.type === 'series' || item.episodeCount ? 'series' : 'movie',
    description: item.description || item.plot || item.introduction || '',
    genres: Array.isArray(item.genres) ? item.genres.map((g: any) => g.name || g) : [],
    duration: item.duration || item.runtime || 0,
    cast: Array.isArray(item.actors) ? item.actors.map((a: any) => a.name || a) : [],
  }
}
