'use client'
import Link from 'next/link'
import { Star, Tv, Film } from 'lucide-react'
import { buildMovieHref, type MovieItem } from '@/lib/api'

export default function MovieCard({ movie, index = 0 }: { movie: MovieItem; index?: number }) {
  const delay = Math.min(index * 50, 400)

  return (
    <Link
      href={buildMovieHref(movie)}
      className="movie-card group block relative rounded-lg overflow-hidden bg-cx-navy border border-cx-muted/35 cursor-pointer"
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
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
        <div className="absolute inset-0 bg-gradient-to-t from-cx-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Type badge */}
        <div className="absolute top-2 left-2">
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
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded text-xs">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white font-body font-semibold">
              {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
            </span>
          </div>
        )}

        {/* Hover play hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-cx-accent/90 flex items-center justify-center shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
            <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-t-transparent border-b-transparent border-l-white ml-1" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-white font-body font-semibold text-sm line-clamp-2 leading-snug group-hover:text-cx-ice transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          {movie.year && (
            <span className="text-white/40 text-xs font-body">{movie.year}</span>
          )}
          {movie.genres && movie.genres.length > 0 && (
            <span className="text-cx-ice/40 text-xs font-body truncate">
              {movie.genres[0]}
            </span>
          )}
        </div>
      </div>

      {/* Bottom glow on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cx-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  )
}

// Skeleton loader
export function MovieCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-cx-navy border border-cx-muted/30">
      <div className="aspect-[2/3] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-4/5" />
        <div className="h-3 skeleton rounded w-1/3" />
      </div>
    </div>
  )
}
