import { NextResponse } from 'next/server'
import { getCurrentUser, isAdminUser, listUsers, toPublicUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!isAdminUser(currentUser)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
    }

    const users = await listUsers()

    return NextResponse.json({
      count: users.length,
      users: users.map(toPublicUser),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load users.' },
      { status: 500 }
    )
  }
}
