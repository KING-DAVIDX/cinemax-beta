import { NextResponse } from 'next/server'
import {
  attachSessionCookie,
  findUserByEmail,
  normalizeEmail,
  toPublicUser,
  updateUser,
  verifyPassword,
} from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = normalizeEmail(String(body.email || ''))
    const password = String(body.password || '')

    const user = await findUserByEmail(email)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const updatedUser = (await updateUser(user.id, { provider: 'password' })) || user
    const response = NextResponse.json({ user: toPublicUser(updatedUser) })
    return attachSessionCookie(response, updatedUser.id)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to sign in.' },
      { status: 500 }
    )
  }
}
