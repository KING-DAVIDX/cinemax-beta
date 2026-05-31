# 🎬 Cinemax

A sleek, production-ready movie streaming and download site built with **Next.js 14**, styled with a blue & black cinema aesthetic.

## Features

- 🏠 **Home** — Hero banner, trending, and featured movies
- 🔍 **Search** — Real-time movie & TV series search
- 🔥 **Trending** — Live trending content from MovieBox
- 🎬 **Movie Detail** — Full info, cast, download sources (multiple qualities)
- 📺 **TV Series Support** — Season/episode selector for series
- 🕘 **Watch History** — Tracks every title you browse/watch (localStorage)
- 📥 **Download History** — Logs every download with quality and timestamp
- ✨ **Intro Animation** — Cinematic splash screen on first visit per session

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) for icons
- [xer-movie-api](https://xer-movie-api.vercel.app) as the backend

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Deploy — no environment variables needed

## API Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /api/homepage` | Featured movies |
| `GET /api/trending` | Trending content |
| `GET /api/search/:query` | Search results |
| `GET /api/info/:id` | Movie/series details |
| `GET /api/sources/:id` | Download links |
| `GET /api/sources/:id?season=N&episode=N` | Episode links |

## Pages

| Route | Page |
|---|---|
| `/` | Home (hero + trending + featured) |
| `/search?q=...` | Search results |
| `/trending` | Trending movies & series |
| `/movie/[id]` | Movie detail + download |
| `/history` | Watch history |
| `/downloads` | Download history |
