import { NextResponse } from 'next/server'
import { getCurrentUser, toPublicUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user: toPublicUser(user) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load account.' },
      { status: 500 }
    )
  }
}
