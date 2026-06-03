import { NextResponse } from 'next/server'
import { getCurrentUser, isAdminUser, listUsers } from '@/lib/auth'
import { sendNewsletter } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!isAdminUser(currentUser)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
    }

    const body = await request.json()
    const content = String(body.content || '').trim()

    if (content.length < 3) {
      return NextResponse.json({ error: 'Enter newsletter content before sending.' }, { status: 400 })
    }

    const users = await listUsers()
    const recipients = Array.from(
      new Map(users.map((user) => [user.email, { email: user.email, name: user.name }])).values()
    )

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No users are available to receive the newsletter.' }, { status: 400 })
    }

    const result = await sendNewsletter(recipients, content)

    return NextResponse.json({
      ok: true,
      total: recipients.length,
      ...result,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send newsletter.' },
      { status: 500 }
    )
  }
}
