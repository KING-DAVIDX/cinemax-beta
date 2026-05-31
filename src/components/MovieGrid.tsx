import MovieCard, { MovieCardSkeleton } from './MovieCard'
import type { MovieItem } from '@/lib/api'

interface MovieGridProps {
  movies: MovieItem[]
  loading?: boolean
  emptyMessage?: string
  skeletonCount?: number
}

export default function MovieGrid({
  movies,
  loading = false,
  emptyMessage = 'No results found.',
  skeletonCount = 12,
}: MovieGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!movies.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <p className="text-white/40 font-body text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {movies.map((movie, i) => (
        <MovieCard key={`${movie.id}-${i}`} movie={movie} index={i} />
      ))}
    </div>
  )
}
