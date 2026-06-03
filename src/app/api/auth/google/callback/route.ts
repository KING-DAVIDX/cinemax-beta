import { NextRequest, NextResponse } from 'next/server'
import {
  attachSessionCookie,
  createUser,
  findUserByEmail,
  sanitizeName,
  updateUser,
} from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

export const runtime = 'nodejs'

const GOOGLE_STATE_COOKIE = 'cinemax_google_state'

type GoogleProfile = {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
  picture?: string
}

function redirectUri(request: NextRequest) {
  return process.env.GOOGLE_REDIRECT_URI || new URL('/api/auth/google/callback', request.url).toString()
}

function authError(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(error)}`, request.url))
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!code || !state || !storedState || state !== storedState) {
    return authError(request, 'google-state')
  }

  if (!clientId || !clientSecret) {
    return authError(request, 'google-env')
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri(request),
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      return authError(request, 'google-token')
    }

    const tokenPayload = await tokenResponse.json()
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    })

    if (!profileResponse.ok) {
      return authError(request, 'google-profile')
    }

    const profile = (await profileResponse.json()) as GoogleProfile
    if (!profile.email || profile.email_verified === false) {
      return authError(request, 'google-email')
    }

    const existingUser = await findUserByEmail(profile.email)
    const name = sanitizeName(profile.name || '', profile.email)
    const user =
      existingUser
        ? await updateUser(existingUser.id, {
            provider: 'google',
            googleId: profile.sub,
            name,
            avatarUrl: profile.picture,
          })
        : await createUser({
            email: profile.email,
            name,
            provider: 'google',
            googleId: profile.sub,
            avatarUrl: profile.picture,
          })

    if (!user) {
      return authError(request, 'google-user')
    }

    if (!existingUser) {
      try {
        await sendWelcomeEmail({ email: user.email, name: user.name })
      } catch (emailError) {
        console.error('Unable to send welcome email:', emailError)
      }
    }

    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set(GOOGLE_STATE_COOKIE, '', { path: '/', maxAge: 0 })
    return attachSessionCookie(response, user.id)
  } catch {
    return authError(request, 'google-server')
  }
}
