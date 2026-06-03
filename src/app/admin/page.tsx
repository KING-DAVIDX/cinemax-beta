import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getCurrentUser, isAdminUser } from '@/lib/auth'
import AdminClient from './AdminClient'

export const runtime = 'nodejs'

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin')
  }

  if (!isAdminUser(user)) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />
      <AdminClient />
    </div>
  )
}
