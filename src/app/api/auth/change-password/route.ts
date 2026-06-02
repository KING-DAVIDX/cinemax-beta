import { NextResponse } from 'next/server'
import { getCurrentUser, hashPassword, toPublicUser, updateUser, verifyPassword } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in to change your password.' }, { status: 401 })
    }

    const body = await request.json()
    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }

    if (user.passwordHash && !verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    }

    const updatedUser = await updateUser(user.id, {
      passwordHash: hashPassword(newPassword),
      provider: 'password',
    })

    return NextResponse.json({ user: updatedUser ? toPublicUser(updatedUser) : toPublicUser(user) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to change password.' },
      { status: 500 }
    )
  }
}
