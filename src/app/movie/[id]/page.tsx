'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Captions,
  Check,
  Clock,
  Download,
  ExternalLink,
  Film,
  Languages,
  Play,
  Star,
  Tv,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import MovieGrid from '@/components/MovieGrid'
import {
  buildWatchHref,
  getMovieInfo,
  getMovieSourceResult,
  getRecommendations,
  getSeriesInfo,
  type Caption,
  type MovieItem,
  type SeasonInfo,
  type Source,
} from '@/lib/api'
import { useDownloadHistory, useWatchHistory } from '@/hooks/useHistory'

export default function MoviePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const initialDetailPath = searchParams.get('detailPath') || undefined
  const titleHint = searchParams.get('title') || undefined

  const [movie, setMovie] = useState<MovieItem | null>(null)
  const [seasons, setSeasons] = useState<SeasonInfo[]>([])
  const [detailPath, setDetailPath] = useState<string | undefined>()
  const [sources, setSources] = useState<Source[]>([])
  const [captions, setCaptions] = useState<Caption[]>([])
  const [recommendations, setRecommendations] = useState<MovieItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [showSources, setShowSources] = useState(false)
  const [downloadedAt, setDownloadedAt] = useState<number | null>(null)

  const { addToHistory } = useWatchHistory()
  const { addDownload } = useDownloadHistory()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setSources([])
      setCaptions([])
      setShowSources(false)

      const seriesInfo = await getSeriesInfo(id, initialDetailPath, titleHint)
      if (cancelled) return

      if (seriesInfo) {
        setMovie(seriesInfo.movieInfo)
        setSeasons(seriesInfo.seasons)
        setDetailPath(seriesInfo.detailPath || seriesInfo.movieInfo.detailPath || initialDetailPath)
      } else {
        const info = await getMovieInfo(id, initialDetailPath, titleHint)
        if (cancelled) return
        setMovie(info)
        setSeasons([])
        setDetailPath(info?.detailPath || initialDetailPath)
      }

      const recs = await getRecommendations(id)
      if (!cancelled) {
        setRecommendations(recs)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, initialDetailPath, titleHint])

  function handleSeasonChange(nextSeason: number) {
    setSeason(nextSeason)
    setEpisode(1)
    setShowSources(false)
  }

  const currentSeasonInfo = seasons.find((item) => item.season === season)
  const episodeCount = currentSeasonInfo?.episodeCount ?? 1
  const resolvedDetailPath = detailPath || movie?.detailPath
  const watchHref = movie
    ? buildWatchHref(
        { ...movie, detailPath: resolvedDetailPath },
        movie.type === 'series' ? season : undefined,
        movie.type === 'series' ? episode : undefined
      )
    : '#'

  async function loadSources() {
    if (!movie) return

    setSourcesLoading(true)
    setShowSources(true)

    const result = await getMovieSourceResult(
      id,
      movie.type === 'series' ? season : undefined,
      movie.type === 'series' ? episode : undefined,
      resolvedDetailPath,
      movie.title
    )

    setSources(result.sources)
    setCaptions(result.captions)
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
      detailPath: resolvedDetailPath,
    })
  }

  function recordDownload(source: Source) {
    if (!movie) return

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
      detailPath: resolvedDetailPath,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cx-black">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 pt-24">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 rounded-lg skeleton" />
            <div className="flex gap-8">
              <div className="w-64 shrink-0 rounded-lg skeleton aspect-[2/3]" />
              <div className="flex-1 space-y-4 pt-4">
                <div className="h-10 w-3/4 rounded-lg skeleton" />
                <div className="h-4 w-1/2 rounded-lg skeleton" />
                <div className="h-4 w-full rounded-lg skeleton" />
                <div className="h-4 w-5/6 rounded-lg skeleton" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cx-black">
        <Navbar />
        <div className="text-center">
          <Film size={54} className="mx-auto mb-4 text-cx-muted" />
          <p className="font-body text-xl text-white/55">Title not found.</p>
          <Link href="/" className="mt-4 inline-block text-cx-accent hover:underline">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />

      {movie.poster && (
        <div className="pointer-events-none fixed inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={movie.poster} alt="" className="h-full w-full scale-110 object-cover opacity-10 blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-cx-black/55 via-cx-black/86 to-cx-black" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-20">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="mb-10 flex flex-col gap-8 md:flex-row">
          <div className="mx-auto w-48 shrink-0 md:mx-0 md:w-64">
            <div className="overflow-hidden rounded-lg border border-cx-muted/45 shadow-2xl shadow-black/35">
              {movie.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={movie.poster} alt={movie.title} className="w-full object-cover aspect-[2/3]" />
              ) : (
                <div className="flex w-full items-center justify-center bg-cx-navy aspect-[2/3]">
                  <Film size={48} className="text-cx-muted" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 animate-fade-up">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded border border-cx-accent/25 bg-cx-accent/10 px-2 py-1 text-xs text-cx-accent">
                {movie.type === 'series' ? <Tv size={11} /> : <Film size={11} />}
                {movie.type === 'series' ? 'Series' : 'Movie'}
              </span>
              {seasons.length > 0 && (
                <span className="rounded border border-cx-muted/35 bg-cx-navy px-2 py-1 text-xs text-white/45">
                  {seasons.length} Season{seasons.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <h1 className="mb-4 max-w-4xl break-words font-display text-3xl leading-tight text-white sm:text-4xl md:text-6xl">
              {movie.title}
            </h1>

            <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-white/55">
              {movie.rating && movie.rating > 0 && (
                <span className="flex items-center gap-1 text-cx-accent">
                  <Star size={14} className="fill-cx-accent" />
                  {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
                </span>
              )}
              {movie.year && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {movie.year}
                </span>
              )}
              {movie.duration && movie.duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {movie.duration} min
                </span>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded border border-cx-muted/45 bg-cx-navy px-3 py-1 text-xs text-white/60"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {movie.description && (
              <p className="mb-6 max-w-2xl text-sm leading-7 text-white/62">{movie.description}</p>
            )}

            {movie.cast && movie.cast.length > 0 && (
              <p className="mb-6 text-xs text-white/42">
                <span className="text-white/62">Cast: </span>
                {movie.cast.slice(0, 6).join(', ')}
              </p>
            )}

            {movie.type === 'series' && seasons.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-cx-muted/50 bg-cx-navy px-3 py-2">
                  <span className="text-xs text-white/50">Season</span>
                  <select
                    value={season}
                    onChange={(event) => handleSeasonChange(Number(event.target.value))}
                    className="bg-transparent text-sm text-white focus:outline-none"
                  >
                    {seasons.map((item) => (
                      <option key={item.season} value={item.season} className="bg-cx-dark">
                        {item.season}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-cx-muted/50 bg-cx-navy px-3 py-2">
                  <span className="text-xs text-white/50">Episode</span>
                  <select
                    value={episode}
                    onChange={(event) => {
                      setEpisode(Number(event.target.value))
                      setShowSources(false)
                    }}
                    className="bg-transparent text-sm text-white focus:outline-none"
                  >
                    {Array.from({ length: episodeCount }, (_, index) => index + 1).map((item) => (
                      <option key={item} value={item} className="bg-cx-dark">
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                href={watchHref}
                className="flex items-center gap-2 rounded-lg bg-cx-accent px-6 py-3 text-sm font-semibold text-cx-black transition-all hover:bg-cx-bright"
              >
                <Play size={15} className="fill-cx-black" />
                Stream
              </Link>
              <button
                onClick={loadSources}
                className="flex items-center gap-2 rounded-lg border border-cx-accent/35 bg-cx-accent/10 px-6 py-3 text-sm font-semibold text-cx-accent transition-all hover:bg-cx-accent hover:text-cx-black"
              >
                <Download size={15} />
                Downloads
              </button>
            </div>
          </div>
        </div>

        {showSources && (
          <div className="mb-8 rounded-lg border border-cx-muted/45 bg-cx-navy/82 p-6 backdrop-blur animate-fade-up">
            <h3 className="mb-4 flex items-center gap-2 font-display text-xl text-white">
              <Download size={18} className="text-cx-accent" />
              {movie.type === 'series' ? `S${season}E${episode} - ` : ''}Download Links
            </h3>

            {sourcesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-14 rounded-lg skeleton" />
                ))}
              </div>
            ) : sources.length === 0 ? (
              <p className="text-sm text-white/42">No download sources found for this title.</p>
            ) : (
              <div className="space-y-3">
                {sources.map((source, index) => (
                  <div
                    key={`${source.quality}-${index}`}
                    className="flex flex-col gap-3 rounded-lg border border-cx-muted/35 bg-cx-dark/70 px-4 py-3 transition-all hover:border-cx-accent/35 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="font-display text-lg text-cx-accent">{source.quality}</span>
                      {source.size && <span className="text-xs text-white/42">{source.size}</span>}
                      {source.format && <span className="text-xs uppercase text-white/35">{source.format}</span>}
                      {source.filename && <span className="max-w-full break-all text-xs text-white/35 sm:max-w-sm sm:truncate">{source.filename}</span>}
                    </div>
                    <div className="flex flex-col gap-2 min-[420px]:flex-row">
                      <Link
                        href={watchHref}
                        className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition-all hover:border-cx-accent/35 hover:text-cx-accent"
                      >
                        <Play size={13} />
                        Stream
                      </Link>
                      <a
                        href={source.downloadUrl || source.streamUrl || source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={source.filename || undefined}
                        onClick={() => recordDownload(source)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-cx-accent/30 bg-cx-accent/10 px-4 py-2 text-sm font-semibold text-cx-accent transition-all hover:bg-cx-accent hover:text-cx-black"
                      >
                        <Download size={13} />
                        Download
                      </a>
                    </div>
                  </div>
                ))}

                {downloadedAt && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                    <Check size={13} />
                    Saved to download history
                  </div>
                )}
              </div>
            )}

            {!sourcesLoading && captions.length > 0 && (
              <div className="mt-6 border-t border-cx-muted/40 pt-5">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
                  <Languages size={15} className="text-cx-accent" />
                  Subtitles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {captions.map((caption, index) => (
                    <a
                      key={`${caption.language}-${index}`}
                      href={caption.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-cx-muted/45 bg-cx-dark px-3 py-2 text-xs text-white/62 transition-colors hover:border-cx-accent/40 hover:text-cx-accent"
                    >
                      <Captions size={13} />
                      {caption.language}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {recommendations.length > 0 && (
          <section className="pt-4">
            <div className="mb-6 flex items-center gap-2">
              <Film size={18} className="text-cx-accent" />
              <h2 className="font-display text-2xl text-white">More Like This</h2>
            </div>
            <MovieGrid movies={recommendations} emptyMessage="No recommendations found." />
          </section>
        )}
      </div>
    </div>
  )
}
