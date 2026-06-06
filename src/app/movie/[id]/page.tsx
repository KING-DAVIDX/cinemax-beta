import type { Metadata } from 'next'
import MoviePageClient from './MoviePageClient'
import { getMovieInfo } from '@/lib/api'

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  || 'https://cinemax-beta.vercel.app'
).replace(/\/$/, '')

const fallbackTitle = 'Cinemax | Stream and Download Movies'
const fallbackDescription = 'Discover, stream, and download movies and series on Cinemax.'
const fallbackImageUrl = new URL('/cinemax-preview.jpg', siteUrl).toString()

type MoviePageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    detailPath?: string
    title?: string
  }>
}

function cleanDescription(description?: string) {
  const value = description?.replace(/\s+/g, ' ').trim()
  if (!value) return fallbackDescription
  return value.length > 180 ? `${value.slice(0, 177).trim()}...` : value
}

function movieTitle(title?: string, type?: string, year?: number) {
  const label = title?.trim() || fallbackTitle
  const parts = [label]

  if (year) parts.push(String(year))
  if (type === 'series') parts.push('Series')
  if (type === 'movie') parts.push('Movie')

  return parts.join(' | ')
}

function absoluteUrl(value?: string) {
  if (!value) return fallbackImageUrl

  try {
    return new URL(value, siteUrl).toString()
  } catch {
    return fallbackImageUrl
  }
}

export async function generateMetadata({ params, searchParams }: MoviePageProps): Promise<Metadata> {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const decodedId = decodeURIComponent(id)
  const detailPath = query.detailPath
  const titleHint = query.title
  const movie = await getMovieInfo(decodedId, detailPath, titleHint)
  const title = movieTitle(movie?.title || titleHint, movie?.type, movie?.year)
  const description = cleanDescription(movie?.description)
  const imageUrl = absoluteUrl(movie?.poster)
  const pageUrl = new URL(`/movie/${encodeURIComponent(decodedId)}`, siteUrl)

  if (detailPath) pageUrl.searchParams.set('detailPath', detailPath)
  if (movie?.title || titleHint) pageUrl.searchParams.set('title', movie?.title || titleHint || '')

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl.toString(),
    },
    openGraph: {
      title,
      description,
      url: pageUrl.toString(),
      siteName: 'Cinemax',
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          alt: movie?.title ? `${movie.title} poster` : 'Cinemax movie streaming preview',
        },
      ],
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default function MoviePage() {
  return <MoviePageClient />
}
