'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Chrome, Lock, Mail, User } from 'lucide-react'

type AuthMode = 'signup' | 'signin'

type AuthFormProps = {
  initialMode: AuthMode
}

const googleErrors: Record<string, string> = {
  'google-env': 'Google sign in needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the local env file.',
  'google-state': 'Google sign in expired. Try again.',
  'google-token': 'Google did not return a valid token.',
  'google-profile': 'Google profile could not be loaded.',
  'google-email': 'Google did not return a verified email address.',
  'google-user': 'Google account could not be saved.',
  'google-server': 'Google sign in failed. Try again.',
}

export default function AuthForm({ initialMode }: AuthFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorCode = params.get('error')
    const emailParam = params.get('email')

    if (errorCode) setError(googleErrors[errorCode] || 'Authentication failed. Try again.')
    if (emailParam) setEmail(emailParam)
  }, [])

  const title = useMemo(() => (mode === 'signup' ? 'Create Account' : 'Sign In'), [mode])
  const actionLabel = mode === 'signup' ? 'Create Account' : 'Sign In'

  async function submitManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin'

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Authentication failed.')
      }

      if (mode === 'signup') {
        setMode('signin')
        setPassword('')
        setMessage('Account created. Sign in to continue.')
        return
      }

      router.push('/')
      router.refresh()
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  function startGoogleAuth() {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-cx-muted/45 bg-cx-navy/86 p-6 shadow-2xl shadow-black/35 backdrop-blur">
      <div className="mb-6">
        <p className="editorial-label mb-2">Cinemax Account</p>
        <h1 className="font-display text-3xl text-white">{title}</h1>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-lg border border-cx-muted/40 bg-cx-dark p-1">
        <button
          type="button"
          onClick={() => {
            setMode('signup')
            setError('')
            setMessage('')
          }}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition-all ${
            mode === 'signup' ? 'bg-cx-accent text-cx-black' : 'text-white/52 hover:text-white'
          }`}
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signin')
            setError('')
            setMessage('')
          }}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition-all ${
            mode === 'signin' ? 'bg-cx-accent text-cx-black' : 'text-white/52 hover:text-white'
          }`}
        >
          Sign In
        </button>
      </div>

      <button
        type="button"
        onClick={startGoogleAuth}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/75 transition-all hover:border-cx-accent/35 hover:text-cx-accent"
      >
        <Chrome size={16} />
        Continue with Google
      </button>

      <div className="mb-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-cx-muted/45" />
        <span className="text-xs uppercase text-white/30">Manual</span>
        <span className="h-px flex-1 bg-cx-muted/45" />
      </div>

      <form onSubmit={submitManual} className="space-y-4">
        {mode === 'signup' && (
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase text-white/38">Name</span>
            <span className="relative block">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/32" size={16} />
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-cx-muted/55 bg-cx-dark py-3 pl-10 pr-4 text-sm text-white placeholder-white/28 transition-all focus:border-cx-accent/65"
              />
            </span>
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase text-white/38">Email</span>
          <span className="relative block">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/32" size={16} />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              required
              className="w-full rounded-lg border border-cx-muted/55 bg-cx-dark py-3 pl-10 pr-4 text-sm text-white placeholder-white/28 transition-all focus:border-cx-accent/65"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase text-white/38">Password</span>
          <span className="relative block">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/32" size={16} />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8 characters minimum"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-cx-muted/55 bg-cx-dark py-3 pl-10 pr-4 text-sm text-white placeholder-white/28 transition-all focus:border-cx-accent/65"
            />
          </span>
        </label>

        {message && (
          <div className="rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-300">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cx-accent px-4 py-3 text-sm font-bold text-cx-black transition-all hover:bg-cx-bright disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Working...' : actionLabel}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>
    </div>
  )
}
