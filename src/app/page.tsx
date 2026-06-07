'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Flame, ChevronRight, Star, Play } from 'lucide-react'
import Navbar from '@/components/Navbar'
import MovieGrid from '@/components/MovieGrid'
import IntroScreen from '@/components/IntroScreen'
import SignupPrompt from '@/components/SignupPrompt'
import { buildMovieHref, getHomepage, getTrending, type MovieItem } from '@/lib/api'

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(true)
  const [sections, setSections] = useState<{ title: string; items: MovieItem[] }[]>([])
  const [banner, setBanner] = useState<MovieItem[]>([])
  const [trending, setTrending] = useState<MovieItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hero, setHero] = useState<MovieItem | null>(null)

  useEffect(() => {
    async function load() {
      const [home, trend] = await Promise.all([getHomepage(), getTrending()])

      // getHomepage now returns { banner, sections } — not a flat MovieItem[]
      setBanner(home.banner)
      setSections(home.sections)
      setTrending(trend)

      // Pick a random hero from banner first, fall back to trending
      const heroPool = [...home.banner, ...trend].filter(m => m.poster)
      if (heroPool.length) setHero(heroPool[Math.floor(Math.random() * Math.min(5, heroPool.length))])

      setLoading(false)
    }
    load()
  }, [])

  if (showIntro) {
    return <IntroScreen onComplete={() => setShowIntro(false)} />
  }

  // Flatten all sections into one list for the FEATURED block
  const allHomeMovies = sections.flatMap(s => s.items)

  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />

      {/* HERO */}
      <section className="relative flex min-h-[560px] items-end overflow-hidden sm:h-[70vh] sm:min-h-[500px]">
        {/* Background */}
        {hero?.poster ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.poster}
              alt={hero.title}
              className="absolute inset-0 w-full h-full object-cover opacity-30 scale-105"
              style={{ filter: 'blur(2px)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cx-black via-cx-black/60 to-cx-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-cx-black/80 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(201,168,76,0.13)_0%,transparent_62%)]" />
        )}

        {/* Film texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 46px, rgba(237,232,220,0.18) 47px, transparent 48px)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 sm:pb-12">
          {hero && (
            <div className="max-w-lg animate-fade-up">
              <div className="flex items-center gap-2 mb-3">
                <span className="editorial-label">Featured</span>
                {hero.rating && hero.rating > 0 && (
                  <span className="flex items-center gap-1 text-xs text-yellow-400">
                    <Star size={10} className="fill-yellow-400" />
                    {typeof hero.rating === 'number' ? hero.rating.toFixed(1) : hero.rating}
                  </span>
                )}
              </div>
              <h1 className="mb-4 break-words font-display text-4xl leading-tight text-white glow-text sm:text-5xl md:text-7xl md:leading-none">
                {hero.title}
              </h1>
              {hero.description && (
                <p className="text-white/60 font-body text-sm leading-relaxed mb-6 line-clamp-3">
                  {hero.description}
                </p>
              )}
              <div className="flex flex-col gap-3 min-[420px]:flex-row">
                <Link
                  href={buildMovieHref(hero)}
                  className="flex items-center justify-center gap-2 bg-cx-accent hover:bg-cx-bright px-6 py-3 rounded-lg text-cx-black font-body font-semibold text-sm transition-all duration-200"
                >
                  <Play size={15} className="fill-cx-black" />
                  Watch Now
                </Link>
                <Link
                  href={buildMovieHref(hero)}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-6 py-3 rounded-lg text-white font-body font-semibold text-sm transition-all duration-200 backdrop-blur-sm"
                >
                  More Info
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TRENDING */}
      <section className="content-band py-9 sm:py-11">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <Flame size={20} className="shrink-0 text-cx-accent" />
              <h2 className="break-words font-display text-xl text-white sm:text-2xl">Trending Now</h2>
            </div>
            <Link
              href="/trending"
              className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-cx-accent transition-colors hover:text-cx-ice"
            >
              See all <ChevronRight size={15} />
            </Link>
          </div>
          <MovieGrid
            movies={trending.slice(0, 12)}
            loading={loading}
            emptyMessage="Couldn't load trending content."
            skeletonCount={12}
          />
        </div>
      </section>

      {/* HOMEPAGE SECTIONS — render each named section separately */}
      {!loading && sections.map((section, i) => (
        <section key={i} className="content-band py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <TrendingUp size={20} className="shrink-0 text-cx-accent" />
                <h2 className="break-words font-display text-xl text-white sm:text-2xl">
                  {section.title}
                </h2>
              </div>
            </div>
            <MovieGrid movies={section.items.slice(0, 18)} emptyMessage="No content." />
          </div>
        </section>
      ))}

      {/* Fallback FEATURED block — shown if sections is empty but allHomeMovies has data */}
      {!loading && sections.length === 0 && allHomeMovies.length > 0 && (
        <section className="content-band py-8 pb-16 sm:py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="shrink-0 text-cx-accent" />
                <h2 className="font-display text-xl text-white sm:text-2xl">Featured</h2>
              </div>
            </div>
            <MovieGrid movies={allHomeMovies.slice(0, 18)} emptyMessage="No featured content." />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-cx-muted/30 py-8 pb-16 text-center">
        <p className="text-white/30 font-body text-xs">
          CINEMAX 2026
        </p>
      </footer>

      <SignupPrompt enabled={!showIntro} />
    </div>
  )
}
