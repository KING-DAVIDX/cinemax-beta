import type { Metadata } from 'next'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://cinemax-beta.vercel.app')

const previewImage = {
  url: '/cinemax-preview.jpg',
  width: 1280,
  height: 672,
  alt: 'Cinemax',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Cinemax | Stream and Download Movies',
  description: 'Discover, stream, and download movies and series on Cinemax.',
  openGraph: {
    title: 'Cinemax | Stream and Download Movies',
    description: 'Discover, stream, and download movies and series on Cinemax.',
    url: '/',
    siteName: 'Cinemax',
    images: [previewImage],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cinemax | Stream and Download Movies',
    description: 'Discover, stream, and download movies and series on Cinemax.',
    images: [previewImage],
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23111009'/><text x='50' y='64' text-anchor='middle' font-size='48' font-family='serif' fill='%23C9A84C'>C</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="noise-bg">{children}</body>
    </html>
  )
}
