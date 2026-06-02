import { NextResponse } from 'next/server'
import { clearSessionCookie, deleteUser, getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in to delete your account.' }, { status: 401 })
    }

    await deleteUser(user.id)
    const response = NextResponse.json({ ok: true })
    return clearSessionCookie(response)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete account.' },
      { status: 500 }
    )
  }
}
