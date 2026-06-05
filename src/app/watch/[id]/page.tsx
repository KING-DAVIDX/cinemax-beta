'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Bookmark,
  Captions,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Film,
  Play,
  Tv,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import {
  buildMovieHref,
  buildWatchHref,
  getMovieSourceResult,
  getSeriesInfo,
  type Caption,
  type MovieItem,
  type SeasonInfo,
  type Source,
} from '@/lib/api'
import { useWatchHistory } from '@/hooks/useHistory'
import { useAuth } from '@/hooks/useAuth'

type EpisodeRef = {
  season: number
  episode: number
}

type BookmarkResponse = {
  bookmark?: {
    progressSeconds?: number
    durationSeconds?: number
  } | null
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

function secondsFromParam(value: string | null) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const detailPath = searchParams.get('detailPath') || undefined
  const title = searchParams.get('title') || undefined
  const type = searchParams.get('type') as MovieItem['type'] | null
  const requestedSeason = Number(searchParams.get('season') || 0) || undefined
  const requestedEpisode = Number(searchParams.get('episode') || 0) || undefined
  const requestedTime = secondsFromParam(searchParams.get('t'))

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastSavedSecondRef = useRef(0)

  const [movie, setMovie] = useState<MovieItem | null>(null)
  const [seasons, setSeasons] = useState<SeasonInfo[]>([])
  const [activeSeason, setActiveSeason] = useState<number | undefined>()
  const [activeEpisode, setActiveEpisode] = useState<number | undefined>()
  const [resolvedDetailPath, setResolvedDetailPath] = useState<string | undefined>()
  const [sources, setSources] = useState<Source[]>([])
  const [captions, setCaptions] = useState<Caption[]>([])
  const [selectedQuality, setSelectedQuality] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resumeSeconds, setResumeSeconds] = useState(0)
  const [hasAppliedResume, setHasAppliedResume] = useState(false)
  const [progress, setProgress] = useState({ current: 0, duration: 0 })

  const { addToHistory } = useWatchHistory()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      setSources([])
      setCaptions([])
      setProgress({ current: 0, duration: 0 })
      setHasAppliedResume(false)
      lastSavedSecondRef.current = 0

      const info = await getSeriesInfo(id, detailPath, title)
      const resolvedMovie = info?.movieInfo || {
        id,
        title: title || 'Untitled',
        type: type || 'movie',
        detailPath,
      }
      const isSeries = resolvedMovie.type === 'series' || type === 'series' || Boolean(info?.seasons.length)
      const nextDetailPath = info?.detailPath || detailPath || resolvedMovie.detailPath
      const nextSeason = isSeries ? requestedSeason || info?.seasons[0]?.season || 1 : undefined
      const nextEpisode = isSeries ? requestedEpisode || 1 : undefined

      const result = await getMovieSourceResult(
        id,
        isSeries ? nextSeason : undefined,
        isSeries ? nextEpisode : undefined,
        nextDetailPath,
        resolvedMovie.title
      )

      if (cancelled) return

      const nextMovie: MovieItem = {
        ...resolvedMovie,
        type: isSeries ? 'series' : resolvedMovie.type || 'movie',
        detailPath: nextDetailPath,
      }

      setMovie(nextMovie)
      setSeasons(info?.seasons || [])
      setActiveSeason(nextSeason)
      setActiveEpisode(nextEpisode)
      setResolvedDetailPath(nextDetailPath)
      setSources(result.sources)
      setCaptions(result.captions)
      setSelectedQuality(result.sources[0]?.quality || '')
      setError(result.sources.length ? '' : 'No stream sources were found for this title.')

      addToHistory({
        id,
        title: nextMovie.title,
        poster: nextMovie.poster || '',
        type: nextMovie.type || 'movie',
        season: isSeries ? nextSeason : undefined,
        episode: isSeries ? nextEpisode : undefined,
        year: nextMovie.year,
        rating: nextMovie.rating,
        detailPath: nextDetailPath,
      })

      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [addToHistory, detailPath, id, requestedEpisode, requestedSeason, title, type])

  useEffect(() => {
    if (authLoading || !activeSeason && movie?.type === 'series') return

    let cancelled = false

    async function loadBookmark() {
      if (!user) {
        setResumeSeconds(0)
        return
      }

      if (requestedTime > 0) {
        setResumeSeconds(requestedTime)
        return
      }

      const params = new URLSearchParams({ movieId: id })
      if (movie?.type === 'series' && activeSeason && activeEpisode) {
        params.set('season', String(activeSeason))
        params.set('episode', String(activeEpisode))
      }

      try {
        const response = await fetch(`/api/bookmarks?${params.toString()}`, { cache: 'no-store' })
        if (!response.ok) {
          setResumeSeconds(0)
          return
        }

        const payload = (await response.json()) as BookmarkResponse
        if (!cancelled) {
          setResumeSeconds(payload.bookmark?.progressSeconds || 0)
        }
      } catch {
        if (!cancelled) setResumeSeconds(0)
      }
    }

    loadBookmark()
    return () => {
      cancelled = true
    }
  }, [activeEpisode, activeSeason, authLoading, id, movie?.type, requestedTime, user])

  useEffect(() => {
    setHasAppliedResume(false)
  }, [resumeSeconds, sources])

  const selectedSource = useMemo(
    () => sources.find((source) => source.quality === selectedQuality) || sources[0],
    [selectedQuality, sources]
  )

  const episodeList = useMemo<EpisodeRef[]>(() => {
    return seasons.flatMap((seasonItem) =>
      Array.from({ length: seasonItem.episodeCount }, (_, index) => ({
        season: seasonItem.season,
        episode: index + 1,
      }))
    )
  }, [seasons])

  const currentEpisodeIndex = useMemo(() => {
    if (movie?.type !== 'series' || !activeSeason || !activeEpisode) return -1
    return episodeList.findIndex(
      (item) => item.season === activeSeason && item.episode === activeEpisode
    )
  }, [activeEpisode, activeSeason, episodeList, movie?.type])

  const previousEpisode = currentEpisodeIndex > 0 ? episodeList[currentEpisodeIndex - 1] : null
  const nextEpisode =
    currentEpisodeIndex >= 0 && currentEpisodeIndex < episodeList.length - 1
      ? episodeList[currentEpisodeIndex + 1]
      : null

  const backHref = movie ? buildMovieHref({ ...movie, detailPath: resolvedDetailPath || movie.detailPath }) : '/'
  const streamUrl = selectedSource?.streamUrl || selectedSource?.downloadUrl || selectedSource?.url
  const progressPercent = progress.duration > 0 ? Math.min((progress.current / progress.duration) * 100, 100) : 0

  const buildEpisodeHref = useCallback(
    (target: EpisodeRef | null) => {
      if (!movie || !target) return '#'
      return buildWatchHref(
        { ...movie, detailPath: resolvedDetailPath || movie.detailPath },
        target.season,
        target.episode
      )
    },
    [movie, resolvedDetailPath]
  )

  const saveBookmark = useCallback(
    async (currentSeconds: number, durationSeconds: number, force = false) => {
      if (!user || !movie) return
      if (!Number.isFinite(currentSeconds) || currentSeconds <= 0) return
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return

      const roundedCurrent = Math.floor(currentSeconds)
      if (!force && Math.abs(roundedCurrent - lastSavedSecondRef.current) < 10) return
      lastSavedSecondRef.current = roundedCurrent

      try {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            movieId: id,
            title: movie.title,
            poster: movie.poster || '',
            type: movie.type || 'movie',
            season: movie.type === 'series' ? activeSeason : undefined,
            episode: movie.type === 'series' ? activeEpisode : undefined,
            progressSeconds: roundedCurrent,
            durationSeconds: Math.floor(durationSeconds),
            detailPath: resolvedDetailPath || movie.detailPath,
            year: movie.year,
            rating: movie.rating,
          }),
        })
      } catch {
        return
      }
    },
    [activeEpisode, activeSeason, id, movie, resolvedDetailPath, user]
  )

  function applyResume(video: HTMLVideoElement) {
    if (hasAppliedResume || resumeSeconds <= 0 || !Number.isFinite(video.duration)) return
    video.currentTime = Math.min(resumeSeconds, Math.max(video.duration - 1, 0))
    setHasAppliedResume(true)
  }

  function handleTimeUpdate(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    const duration = Number.isFinite(video.duration) ? video.duration : 0
    setProgress({ current: video.currentTime, duration })
    void saveBookmark(video.currentTime, duration)
  }

  function handleLoadedMetadata(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    setProgress({ current: video.currentTime, duration: Number.isFinite(video.duration) ? video.duration : 0 })
    applyResume(video)
  }

  function handlePause(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    const duration = Number.isFinite(video.duration) ? video.duration : 0
    void saveBookmark(video.currentTime, duration, true)
  }

  function handleEnded(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    const duration = Number.isFinite(video.duration) ? video.duration : 0
    void saveBookmark(duration || video.currentTime, duration || video.currentTime, true)

    if (nextEpisode) {
      router.push(buildEpisodeHref(nextEpisode))
    }
  }

  function navigateEpisode(target: EpisodeRef | null) {
    if (!target) return
    const video = videoRef.current
    if (video) {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      void saveBookmark(video.currentTime, duration, true)
    }
    router.push(buildEpisodeHref(target))
  }

  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-20">
        <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white">
          <ArrowLeft size={16} />
          Details
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-lg border border-cx-muted/45 bg-black shadow-2xl shadow-black/35">
            <div className="relative aspect-video bg-cx-dark">
              {loading ? (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-2 border-cx-muted border-t-cx-accent" />
                </div>
              ) : streamUrl ? (
                <video
                  ref={videoRef}
                  key={streamUrl}
                  src={streamUrl}
                  poster={movie?.poster}
                  controls
                  playsInline
                  className="h-full w-full bg-black"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPause={handlePause}
                  onEnded={handleEnded}
                >
                  {captions.map((caption, index) => (
                    <track
                      key={`${caption.language}-${index}`}
                      kind="subtitles"
                      src={caption.url}
                      label={caption.language}
                      srcLang={caption.language.slice(0, 2).toLowerCase()}
                    />
                  ))}
                </video>
              ) : (
                <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-white/50">
                  {error || 'This title is not available for streaming right now.'}
                </div>
              )}
            </div>

            <div className="border-t border-cx-muted/45 bg-cx-dark px-4 py-3">
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-cx-accent transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-white/45">
                  <Bookmark size={13} className={user ? 'text-cx-accent' : 'text-white/25'} />
                  <span>
                    {formatTime(progress.current)} / {formatTime(progress.duration)}
                  </span>
                </div>
                {movie?.type === 'series' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!previousEpisode}
                      onClick={() => navigateEpisode(previousEpisode)}
                      className="flex items-center gap-1 rounded-lg border border-cx-muted/45 bg-cx-navy px-3 py-2 text-xs font-semibold text-white/62 transition-all hover:border-cx-accent/35 hover:text-cx-accent disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-cx-muted/45 disabled:hover:text-white/62"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={!nextEpisode}
                      onClick={() => navigateEpisode(nextEpisode)}
                      className="flex items-center gap-1 rounded-lg border border-cx-accent/35 bg-cx-accent/10 px-3 py-2 text-xs font-semibold text-cx-accent transition-all hover:bg-cx-accent hover:text-cx-black disabled:cursor-not-allowed disabled:border-cx-muted/45 disabled:bg-cx-navy disabled:text-white/35"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="rounded-lg border border-cx-muted/45 bg-cx-navy/85 p-5">
            <div className="mb-5 flex items-start gap-4">
              <div className="hidden w-20 shrink-0 overflow-hidden rounded-lg bg-cx-muted/25 sm:block">
                {movie?.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover aspect-[2/3]" />
                ) : (
                  <div className="grid h-28 place-items-center">
                    <Film className="text-cx-muted" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="editorial-label mb-2">Now Streaming</p>
                <h1 className="font-display text-2xl leading-tight text-white">{movie?.title || title || 'Cinemax'}</h1>
                <p className="mt-2 flex items-center gap-2 text-xs text-white/45">
                  {movie?.type === 'series' ? <Tv size={13} /> : <Film size={13} />}
                  {movie?.type === 'series' && activeSeason && activeEpisode
                    ? `S${activeSeason}E${activeEpisode}`
                    : movie?.type || 'movie'}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {movie?.type === 'series' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!previousEpisode}
                    onClick={() => navigateEpisode(previousEpisode)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-cx-muted/45 bg-cx-dark px-3 py-2 text-sm font-semibold text-white/62 transition-all hover:border-cx-accent/45 hover:text-cx-accent disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!nextEpisode}
                    onClick={() => navigateEpisode(nextEpisode)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-cx-accent/35 bg-cx-accent/10 px-3 py-2 text-sm font-semibold text-cx-accent transition-all hover:bg-cx-accent hover:text-cx-black disabled:cursor-not-allowed disabled:border-cx-muted/45 disabled:bg-cx-dark disabled:text-white/35"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}

              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/78">
                  <Play size={15} className="text-cx-accent" />
                  Quality
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {sources.map((source) => (
                    <button
                      key={source.quality}
                      onClick={() => setSelectedQuality(source.quality)}
                      className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                        selectedSource?.quality === source.quality
                          ? 'border-cx-accent bg-cx-accent text-cx-black'
                          : 'border-cx-muted/45 bg-cx-dark text-white/62 hover:border-cx-accent/45 hover:text-cx-accent'
                      }`}
                    >
                      {source.quality}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSource && (
                <a
                  href={selectedSource.downloadUrl || selectedSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={selectedSource.filename || undefined}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-cx-accent/35 bg-cx-accent/10 px-4 py-3 text-sm font-semibold text-cx-accent transition-all hover:bg-cx-accent hover:text-cx-black"
                >
                  <Download size={15} />
                  Download Selected
                </a>
              )}

              {captions.length > 0 && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/78">
                    <Captions size={15} className="text-cx-accent" />
                    Subtitles
                  </h2>
                  <div className="space-y-2">
                    {captions.map((caption, index) => (
                      <a
                        key={`${caption.language}-${index}`}
                        href={caption.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-cx-muted/45 bg-cx-dark px-3 py-2 text-sm text-white/62 transition-colors hover:border-cx-accent/45 hover:text-cx-accent"
                      >
                        {caption.language}
                        <ExternalLink size={13} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
