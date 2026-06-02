import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cinemax | Stream and Download Movies',
  description: 'Discover, stream, and download movies and series on Cinemax.',
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
