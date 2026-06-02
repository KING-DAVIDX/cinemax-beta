'use client'
import { useEffect, useState } from 'react'
import { Compass, Film, Loader2, SlidersHorizontal, Tv } from 'lucide-react'
import Navbar from '@/components/Navbar'
import MovieGrid from '@/components/MovieGrid'
import {
  BROWSE_GENRES,
  BROWSE_SORTS,
  BROWSE_YEARS,
  browseMovies,
  type MovieItem,
} from '@/lib/api'

type ContentMode = 'movies' | 'series'

export default function BrowsePage() {
  const [mode, setMode] = useState<ContentMode>('movies')
  const [genre, setGenre] = useState('All')
  const [year, setYear] = useState('All')
  const [sort, setSort] = useState('ForYou')
  const [page, setPage] = useState(1)
  const [movies, setMovies] = useState<MovieItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const results = await browseMovies({
        channelId: mode === 'movies' ? 1 : 2,
        genre,
        year,
        sort,
        page: 1,
        perPage: 24,
      })

      if (!cancelled) {
        setMovies(results)
        setPage(1)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [genre, mode, sort, year])

  async function loadMore() {
    setLoadingMore(true)
    const nextPage = page + 1
    const results = await browseMovies({
      channelId: mode === 'movies' ? 1 : 2,
      genre,
      year,
      sort,
      page: nextPage,
      perPage: 24,
    })

    setMovies((current) => [...current, ...results])
    setPage(nextPage)
    setLoadingMore(false)
  }

  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="editorial-label mb-3">Catalogue</p>
            <div className="flex items-center gap-3">
              <Compass size={26} className="text-cx-accent" />
              <h1 className="font-display text-4xl text-white md:text-5xl">Browse Cinemax</h1>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/52">
              Filter the library by format, genre, year, and editorial ordering.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-cx-muted/45 bg-cx-navy/80 p-4">
          <div className="grid gap-4 lg:grid-cols-[220px_repeat(3,minmax(0,1fr))]">
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/58">
                <SlidersHorizontal size={14} className="text-cx-accent" />
                Format
              </label>
              <div className="grid grid-cols-2 rounded-lg border border-cx-muted/45 bg-cx-dark p-1">
                {[
                  { value: 'movies' as const, label: 'Movies', icon: Film },
                  { value: 'series' as const, label: 'Series', icon: Tv },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setMode(value)}
                    className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-all ${
                      mode === value ? 'bg-cx-accent text-cx-black' : 'text-white/55 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <FilterSelect label="Genre" value={genre} onChange={setGenre} options={BROWSE_GENRES} />
            <FilterSelect label="Year" value={year} onChange={setYear} options={BROWSE_YEARS} />
            <FilterSelect
              label="Sort"
              value={sort}
              onChange={setSort}
              options={BROWSE_SORTS.map((item) => item.value)}
              labels={Object.fromEntries(BROWSE_SORTS.map((item) => [item.value, item.label]))}
            />
          </div>
        </div>

        <MovieGrid
          movies={movies}
          loading={loading}
          emptyMessage="No titles found for these filters."
          skeletonCount={18}
        />

        {!loading && movies.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 rounded-lg border border-cx-accent/35 bg-cx-accent/10 px-6 py-3 text-sm font-semibold text-cx-accent transition-all hover:bg-cx-accent hover:text-cx-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore && <Loader2 size={15} className="animate-spin" />}
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labels = {},
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  labels?: Record<string, string>
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-semibold text-white/58">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-cx-muted/45 bg-cx-dark px-3 py-2.5 text-sm text-white focus:border-cx-accent/50"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-cx-dark">
            {labels[option] || option}
          </option>
        ))}
      </select>
    </label>
  )
}
