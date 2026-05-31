'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MovieGrid from '@/components/MovieGrid'
import { searchMovies, type MovieItem } from '@/lib/api'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const router = useRouter()
  const [query, setQuery] = useState(q)
  const [results, setResults] = useState<MovieItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) return
    setLoading(true)
    setSearched(true)
    const res = await searchMovies(term)
    setResults(res)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (q) {
      setQuery(q)
      doSearch(q)
    }
  }, [q, doSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4">
        {/* Search bar */}
        <div className="mb-10">
          <h1 className="font-display text-4xl text-white tracking-widest mb-6">
            SEARCH
          </h1>
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-cx-ice/40"
                size={18}
              />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search for movies, TV series..."
                className="w-full bg-cx-navy border border-cx-muted/60 text-white placeholder-white/30 rounded-xl pl-12 pr-4 py-4 font-body text-sm focus:border-cx-accent/60 focus:bg-cx-navy transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="bg-cx-accent hover:bg-cx-bright px-6 py-4 rounded-xl text-white font-body font-semibold text-sm tracking-wider transition-all hover:shadow-[0_0_20px_rgba(41,121,255,0.4)] flex items-center gap-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && !loading && (
          <div className="mb-4">
            <p className="text-white/40 font-body text-sm">
              {results.length > 0
                ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`
                : `No results for "${q}"`}
            </p>
          </div>
        )}

        <MovieGrid
          movies={results}
          loading={loading}
          emptyMessage={searched ? `No results found for "${q}". Try a different search.` : 'Search for movies and TV series above.'}
          skeletonCount={12}
        />
      </div>
    </div>
  )
}
