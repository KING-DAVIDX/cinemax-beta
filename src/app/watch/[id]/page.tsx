'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Captions, Download, ExternalLink, Film, Play, Tv } from 'lucide-react'
import Navbar from '@/components/Navbar'
import {
  buildMovieHref,
  getMovieSourceResult,
  getSeriesInfo,
  type Caption,
  type MovieItem,
  type Source,
} from '@/lib/api'
import { useWatchHistory } from '@/hooks/useHistory'

export default function WatchPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const detailPath = searchParams.get('detailPath') || undefined
  const title = searchParams.get('title') || undefined
  const type = searchParams.get('type') as MovieItem['type'] | null
  const season = Number(searchParams.get('season') || 0) || undefined
  const episode = Number(searchParams.get('episode') || 0) || undefined

  const [movie, setMovie] = useState<MovieItem | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [captions, setCaptions] = useState<Caption[]>([])
  const [selectedQuality, setSelectedQuality] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addToHistory } = useWatchHistory()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      const info = await getSeriesInfo(id, detailPath, title)
      const resolvedMovie = info?.movieInfo || {
        id,
        title: title || 'Untitled',
        type: type || 'movie',
        detailPath,
      }

      const isSeries = resolvedMovie.type === 'series' || type === 'series'
      const result = await getMovieSourceResult(
        id,
        isSeries ? season : undefined,
        isSeries ? episode : undefined,
        detailPath || resolvedMovie.detailPath,
        resolvedMovie.title
      )

      if (cancelled) return

      setMovie(resolvedMovie)
      setSources(result.sources)
      setCaptions(result.captions)
      setSelectedQuality(result.sources[0]?.quality || '')
      setError(result.sources.length ? '' : 'No stream sources were found for this title.')

      addToHistory({
        id,
        title: resolvedMovie.title,
        poster: resolvedMovie.poster || '',
        type: resolvedMovie.type || 'movie',
        season: isSeries ? season : undefined,
        episode: isSeries ? episode : undefined,
        year: resolvedMovie.year,
        rating: resolvedMovie.rating,
        detailPath: detailPath || resolvedMovie.detailPath,
      })

      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [addToHistory, detailPath, episode, id, season, title, type])

  const selectedSource = useMemo(
    () => sources.find((source) => source.quality === selectedQuality) || sources[0],
    [selectedQuality, sources]
  )

  const backHref = movie ? buildMovieHref({ ...movie, detailPath: detailPath || movie.detailPath }) : '/'
  const streamUrl = selectedSource?.streamUrl || selectedSource?.downloadUrl || selectedSource?.url

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
                  key={streamUrl}
                  src={streamUrl}
                  poster={movie?.poster}
                  controls
                  playsInline
                  className="h-full w-full bg-black"
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
                  {movie?.type === 'series' && season && episode ? `S${season}E${episode}` : movie?.type || 'movie'}
                </p>
              </div>
            </div>

            <div className="space-y-5">
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
