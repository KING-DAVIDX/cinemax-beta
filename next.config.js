/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['h5.aoneroom.com', 'valiw.hakunaymatata.com', 'image.tmdb.org', 'i.imgur.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
}

module.exports = nextConfig
