import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { clearBookmarks, findBookmark, listBookmarks, upsertBookmark } from '@/lib/bookmarks'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in to use bookmarks.' }, { status: 401 })
    }

    const url = new URL(request.url)
    const movieId = url.searchParams.get('movieId')
    if (movieId) {
      const season = Number(url.searchParams.get('season') || 0) || undefined
      const episode = Number(url.searchParams.get('episode') || 0) || undefined
      const bookmark = await findBookmark(user, movieId, season, episode)
      return NextResponse.json({ bookmark })
    }

    return NextResponse.json({ bookmarks: await listBookmarks(user) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load bookmarks.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in to save bookmarks.' }, { status: 401 })
    }

    const body = await request.json()
    const bookmark = await upsertBookmark(user, body)
    return NextResponse.json({ bookmark })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save bookmark.' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in to clear bookmarks.' }, { status: 401 })
    }

    await clearBookmarks(user)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to clear bookmarks.' },
      { status: 500 }
    )
  }
}
