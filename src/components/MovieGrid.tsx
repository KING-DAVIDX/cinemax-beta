import MovieCard, { MovieCardSkeleton } from './MovieCard'
import type { MovieItem } from '@/lib/api'

interface MovieGridProps {
  movies: MovieItem[]
  loading?: boolean
  emptyMessage?: string
  skeletonCount?: number
}

const gridClassName =
  'grid grid-cols-[repeat(auto-fill,minmax(142px,1fr))] gap-3 min-[420px]:grid-cols-[repeat(auto-fill,minmax(158px,1fr))] min-[420px]:gap-4 lg:grid-cols-[repeat(auto-fill,minmax(172px,1fr))]'

export default function MovieGrid({
  movies,
  loading = false,
  emptyMessage = 'No results found.',
  skeletonCount = 12,
}: MovieGridProps) {
  if (loading) {
    return (
      <div className={gridClassName}>
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
    <div className={gridClassName}>
      {movies.map((movie, i) => (
        <MovieCard key={`${movie.id}-${i}`} movie={movie} index={i} />
      ))}
    </div>
  )
}
