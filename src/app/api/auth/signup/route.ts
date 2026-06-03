import { NextResponse } from 'next/server'
import {
  createUser,
  findUserByEmail,
  hashPassword,
  normalizeEmail,
  sanitizeName,
  toPublicUser,
} from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = normalizeEmail(String(body.email || ''))
    const password = String(body.password || '')
    const name = sanitizeName(String(body.name || ''), email)

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const existingUser = await findUserByEmail(email)
    if (existingUser?.passwordHash) {
      return NextResponse.json({ error: 'An account already exists for this email.' }, { status: 409 })
    }

    if (existingUser && !existingUser.passwordHash) {
      return NextResponse.json(
        { error: 'This email already uses Google sign in. Use Google or change password from your profile.' },
        { status: 409 }
      )
    }

    const user = await createUser({
      email,
      name,
      provider: 'password',
      passwordHash: hashPassword(password),
    })

    try {
      await sendWelcomeEmail({ email: user.email, name: user.name })
    } catch (emailError) {
      console.error('Unable to send welcome email:', emailError)
    }

    return NextResponse.json(
      {
        message: 'Account created. Sign in to continue.',
        user: toPublicUser(user),
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create account.' },
      { status: 500 }
    )
  }
}
