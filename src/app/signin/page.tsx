import Navbar from '@/components/Navbar'
import AuthForm from '@/components/AuthForm'

export default function SigninPage() {
  return (
    <div className="min-h-screen bg-cx-black">
      <Navbar />
      <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 pb-14 pt-24">
        <AuthForm initialMode="signin" />
      </main>
    </div>
  )
}
