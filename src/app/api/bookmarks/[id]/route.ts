import { NextResponse } from 'next/server'
import { deleteBookmark } from '@/lib/bookmarks'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in to delete bookmarks.' }, { status: 401 })
    }

    const { id } = await params
    await deleteBookmark(user, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete bookmark.' },
      { status: 500 }
    )
  }
}
