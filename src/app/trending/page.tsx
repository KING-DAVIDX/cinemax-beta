'use client'
import { useState, useEffect } from 'react'
import { Flame } from 'lucide-react'
import Navbar from '@/components/Navbar'
import MovieGrid from '@/components/MovieGrid'
import { getTrending, type MovieItem } from '@/lib/api'

export default function TrendingPage() {
  const [movies, setMovies] = useState<MovieItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrending().then(data => {
      setMovies(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Flame size={28} className="text-cx-accent" />
            <h1 className="font-display text-4xl text-white sm:text-5xl">Trending</h1>
          </div>
          <p className="text-white/40 font-body text-sm">
            What everyone&apos;s watching right now
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-cx-accent to-transparent mt-4" />
        </div>

        <MovieGrid
          movies={movies}
          loading={loading}
          emptyMessage="Couldn't load trending content. Try again later."
          skeletonCount={18}
        />
      </div>

      <footer className="border-t border-cx-muted/30 py-8 text-center">
        <p className="text-white/30 font-body text-xs">CINEMAX 2026</p>
      </footer>
    </div>
  )
}
