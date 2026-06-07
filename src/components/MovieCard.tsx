'use client'
import Link from 'next/link'
import { Star, Tv, Film, Play } from 'lucide-react'
import { buildMovieHref, type MovieItem } from '@/lib/api'

export default function MovieCard({ movie, index = 0 }: { movie: MovieItem; index?: number }) {
  const delay = Math.min(index * 50, 400)

  return (
    <Link
      href={buildMovieHref(movie)}
      prefetch={false}
      aria-label={`View ${movie.title}`}
      className="movie-card group relative block h-full overflow-hidden rounded-lg border border-cx-muted/35 bg-cx-navy cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cx-accent"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-cx-muted/30">
        {movie.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster}
            alt={movie.title}
            className="movie-card__poster h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={40} className="text-cx-muted" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="movie-card__overlay pointer-events-none absolute inset-0 bg-gradient-to-t from-cx-black/88 via-cx-black/10 to-transparent" />

        {/* Type badge */}
        <div className="pointer-events-none absolute left-2 top-2">
          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-body font-semibold ${
              movie.type === 'series'
                ? 'bg-cx-accent/20 text-cx-accent border border-cx-accent/25'
                : 'bg-black/65 text-white/75 border border-white/10'
            }`}
          >
            {movie.type === 'series' ? <Tv size={10} /> : <Film size={10} />}
            {movie.type === 'series' ? 'SERIES' : 'MOVIE'}
          </span>
        </div>

        {/* Rating */}
        {movie.rating && movie.rating > 0 && (
          <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white font-body font-semibold">
              {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
            </span>
          </div>
        )}

        {/* Hover play hint */}
        <div className="movie-card__play pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-cx-accent/92 text-cx-black shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
            <Play size={19} className="fill-cx-black" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex min-h-[86px] flex-col p-3 sm:p-3.5">
        <h3 className="line-clamp-2 break-words text-sm font-semibold leading-snug text-white transition-colors">
          {movie.title}
        </h3>
        <div className="mt-auto flex min-w-0 items-center gap-2 pt-2">
          {movie.year && (
            <span className="text-white/40 text-xs font-body">{movie.year}</span>
          )}
          {movie.genres && movie.genres.length > 0 && (
            <span className="min-w-0 truncate text-xs text-cx-ice/40">
              {movie.genres[0]}
            </span>
          )}
        </div>
      </div>

      {/* Bottom glow on hover */}
      <div className="movie-card__accent pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cx-accent to-transparent" />
    </Link>
  )
}

// Skeleton loader
export function MovieCardSkeleton() {
  return (
    <div className="h-full overflow-hidden rounded-lg border border-cx-muted/30 bg-cx-navy">
      <div className="aspect-[2/3] skeleton" />
      <div className="min-h-[86px] space-y-2 p-3 sm:p-3.5">
        <div className="h-4 skeleton rounded w-4/5" />
        <div className="h-3 skeleton rounded w-1/3" />
      </div>
    </div>
  )
}
