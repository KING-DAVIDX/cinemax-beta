'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, Clock, Calendar, Download, Play, Tv,
  Film, Check
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import {
  getMovieInfo, getSeriesInfo, getMovieSources,
  type MovieItem, type Source, type SeasonInfo
} from '@/lib/api'
import { useWatchHistory, useDownloadHistory } from '@/hooks/useHistory'

export default function MoviePage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<MovieItem | null>(null)
  const [seasons, setSeasons] = useState<SeasonInfo[]>([])
  const [detailPath, setDetailPath] = useState<string | undefined>()
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [showSources, setShowSources] = useState(false)
  const [downloadedAt, setDownloadedAt] = useState<number | null>(null)

  const { addToHistory } = useWatchHistory()
  const { addDownload } = useDownloadHistory()

  useEffect(() => {
    async function load() {
      // For series, getSeriesInfo() hits /sources which returns accurate
      // season+episode counts AND movie metadata in one call.
      // Fall back to getMovieInfo() for movies or if series call fails.
      const seriesInfo = await getSeriesInfo(id)
      if (seriesInfo && seriesInfo.seasons.length > 0) {
        setMovie(seriesInfo.movieInfo)
        setSeasons(seriesInfo.seasons)
        setDetailPath(seriesInfo.detailPath)
      } else {
        const info = await getMovieInfo(id)
        setMovie(info)
      }
      setLoading(false)
    }
    load()
  }, [id])

  // When season changes, reset episode to 1 (avoid out-of-range episode)
  function handleSeasonChange(s: number) {
    setSeason(s)
    setEpisode(1)
    setShowSources(false)
  }

  // Episode count for the currently selected season
  const currentSeasonInfo = seasons.find(s => s.season === season)
  const episodeCount = currentSeasonInfo?.episodeCount ?? 1

  async function loadSources() {
    if (!movie) return
    setSourcesLoading(true)
    setShowSources(true)
    const s = await getMovieSources(
      id,
      movie.type === 'series' ? season : undefined,
      movie.type === 'series' ? episode : undefined,
      detailPath
    )
    setSources(s)
    setSourcesLoading(false)

    addToHistory({
      id,
      title: movie.title,
      poster: movie.poster || '',
      type: movie.type || 'movie',
      season: movie.type === 'series' ? season : undefined,
      episode: movie.type === 'series' ? episode : undefined,
      year: movie.year,
      rating: movie.rating,
    })
  }

  function handleDownload(source: Source) {
    if (!movie) return
    // Always use proxyUrl — direct CDN links 403 without it
    const url = source.proxyUrl || source.url
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()

    const ts = Date.now()
    setDownloadedAt(ts)
    addDownload({
      id,
      title: movie.title,
      poster: movie.poster || '',
      quality: source.quality,
      type: movie.type || 'movie',
      season: movie.type === 'series' ? season : undefined,
      episode: movie.type === 'series' ? episode : undefined,
      size: source.size,
      year: movie.year,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cx-black">
        <Navbar />
        <div className="pt-24 max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 skeleton rounded" />
            <div className="flex gap-8">
              <div className="w-64 aspect-[2/3] skeleton rounded-xl shrink-0" />
              <div className="flex-1 space-y-4 pt-4">
                <div className="h-10 skeleton rounded w-3/4" />
                <div className="h-4 skeleton rounded w-1/2" />
                <div className="h-4 skeleton rounded w-full" />
                <div className="h-4 skeleton rounded w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-cx-black flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <p className="text-6xl mb-4">🎬</p>
          <p className="text-white/50 font-body text-xl">Movie not found.</p>
          <Link href="/" className="text-cx-accent mt-4 inline-block hover:underline">Go Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />

      {/* Backdrop */}
      {movie.poster && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={movie.poster}
            alt=""
            className="w-full h-full object-cover opacity-10 blur-xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-cx-black/60 via-cx-black/80 to-cx-black" />
        </div>
      )}

      <div className="relative z-10 pt-20 pb-16 max-w-7xl mx-auto px-4">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white font-body text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {/* Poster */}
          <div className="shrink-0 w-48 md:w-64 mx-auto md:mx-0">
            <div className="rounded-xl overflow-hidden border border-cx-muted/40 shadow-2xl shadow-cx-accent/10 animate-glow-pulse">
              {movie.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={movie.poster} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
              ) : (
                <div className="w-full aspect-[2/3] bg-cx-navy flex items-center justify-center">
                  <Film size={48} className="text-cx-muted" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 animate-fade-up">
            {/* Type badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-cx-blue/20 border border-cx-blue/30 text-cx-ice text-xs font-body tracking-wider">
                {movie.type === 'series' ? <Tv size={11} /> : <Film size={11} />}
                {movie.type === 'series' ? 'TV SERIES' : 'MOVIE'}
              </span>
              {/* Season/episode summary badge */}
              {seasons.length > 0 && (
                <span className="px-2 py-1 rounded bg-cx-navy border border-cx-muted/30 text-white/40 text-xs font-body">
                  {seasons.length} Season{seasons.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl md:text-6xl text-white mb-4 leading-none">
              {movie.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-5 text-sm font-body text-white/50">
              {movie.rating && movie.rating > 0 && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star size={13} className="fill-yellow-400" />
                  {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
                </span>
              )}
              {movie.year && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {movie.year}
                </span>
              )}
              {movie.duration && movie.duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {movie.duration} min
                </span>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {movie.genres.map(g => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full bg-cx-navy border border-cx-muted/40 text-cx-ice/70 text-xs font-body"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {movie.description && (
              <p className="text-white/60 font-body text-sm leading-relaxed mb-6 max-w-2xl">
                {movie.description}
              </p>
            )}

            {/* Cast */}
            {movie.cast && movie.cast.length > 0 && (
              <p className="text-white/40 font-body text-xs mb-6">
                <span className="text-white/60">Cast: </span>
                {movie.cast.slice(0, 5).join(', ')}
              </p>
            )}

            {/* TV Controls — season/episode counts from API */}
            {movie.type === 'series' && seasons.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-2 bg-cx-navy border border-cx-muted/50 rounded-lg px-3 py-2">
                  <span className="text-white/50 text-xs font-body">Season</span>
                  <select
                    value={season}
                    onChange={e => handleSeasonChange(Number(e.target.value))}
                    className="bg-transparent text-white text-sm font-body focus:outline-none"
                  >
                    {seasons.map(s => (
                      <option key={s.season} value={s.season} className="bg-cx-dark">
                        {s.season}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-cx-navy border border-cx-muted/50 rounded-lg px-3 py-2">
                  <span className="text-white/50 text-xs font-body">Episode</span>
                  <select
                    value={episode}
                    onChange={e => { setEpisode(Number(e.target.value)); setShowSources(false) }}
                    className="bg-transparent text-white text-sm font-body focus:outline-none"
                  >
                    {Array.from({ length: episodeCount }, (_, i) => i + 1).map(ep => (
                      <option key={ep} value={ep} className="bg-cx-dark">{ep}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadSources}
                className="flex items-center gap-2 bg-cx-accent hover:bg-cx-bright px-6 py-3 rounded-lg text-white font-body font-semibold text-sm tracking-wider transition-all hover:shadow-[0_0_20px_rgba(41,121,255,0.5)]"
              >
                <Play size={15} className="fill-white" />
                {movie.type === 'series' ? `Get S${season}E${episode}` : 'Get Links'}
              </button>
            </div>
          </div>
        </div>

        {/* Sources Panel */}
        {showSources && (
          <div className="bg-cx-navy/80 backdrop-blur border border-cx-muted/40 rounded-xl p-6 mb-8 animate-fade-up">
            <h3 className="font-display text-xl text-white tracking-widest mb-4 flex items-center gap-2">
              <Download size={18} className="text-cx-accent" />
              {movie.type === 'series' ? `S${season}E${episode} — ` : ''}Download Links
            </h3>

            {sourcesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 skeleton rounded-lg" />
                ))}
              </div>
            ) : sources.length === 0 ? (
              <p className="text-white/40 font-body text-sm">
                No download sources found for this title.
              </p>
            ) : (
              <div className="space-y-3">
                {sources.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-cx-dark/60 border border-cx-muted/30 rounded-lg px-4 py-3 hover:border-cx-accent/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-display text-lg text-cx-accent tracking-widest">
                        {s.quality}
                      </span>
                      {s.size && (
                        <span className="text-white/40 text-xs font-body">{s.size}</span>
                      )}
                      {s.format && (
                        <span className="text-cx-ice/40 text-xs font-body uppercase">{s.format}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownload(s)}
                      className="flex items-center gap-2 bg-cx-accent/10 hover:bg-cx-accent border border-cx-accent/30 hover:border-cx-accent px-4 py-2 rounded-lg text-cx-accent hover:text-white font-body font-semibold text-sm transition-all"
                    >
                      <Download size={13} />
                      Download
                    </button>
                  </div>
                ))}
                {downloadedAt && (
                  <div className="flex items-center gap-2 text-green-400 text-xs font-body mt-2">
                    <Check size={13} />
                    Saved to download history
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
