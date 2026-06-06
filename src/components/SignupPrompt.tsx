'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Chrome, Clock, Download, ShieldCheck, UserPlus, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const DISMISS_KEY = 'cx_signup_prompt_dismissed'

export default function SignupPrompt({ enabled }: { enabled: boolean }) {
  const { user, loading } = useAuth()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled || loading || user) {
      setVisible(false)
      return
    }

    if (localStorage.getItem(DISMISS_KEY)) return

    const timer = window.setTimeout(() => setVisible(true), 450)
    return () => window.clearTimeout(timer)
  }, [enabled, loading, user])

  useEffect(() => {
    if (!visible) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setVisible(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible])

  function dismissPermanently() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-prompt-title"
        className="relative w-full max-w-lg overflow-hidden rounded-lg border border-cx-muted/55 bg-cx-dark shadow-2xl shadow-black/60 animate-fade-up"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-cx-accent" />
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Close signup prompt"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/55 transition-colors hover:border-cx-accent/35 hover:text-white"
        >
          <X size={17} />
        </button>

        <div className="p-6 pr-14 sm:p-7 sm:pr-16">
          <p className="editorial-label mb-3">Cinemax Account</p>
          <h2 id="signup-prompt-title" className="font-display text-2xl leading-tight text-white sm:text-3xl">
            Keep your movies with you
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/58">
            Sign up with Google or email and password to save watch progress, bookmarks, and download history across your devices.
          </p>
        </div>

        <div className="grid gap-3 border-y border-cx-muted/45 bg-cx-navy/70 p-4 sm:grid-cols-3">
          <div className="rounded-lg border border-cx-muted/40 bg-cx-dark/70 p-3">
            <Clock size={18} className="mb-2 text-cx-accent" />
            <p className="text-sm font-semibold text-white">Resume faster</p>
            <p className="mt-1 text-xs leading-5 text-white/44">Continue from your saved watch progress.</p>
          </div>
          <div className="rounded-lg border border-cx-muted/40 bg-cx-dark/70 p-3">
            <Bookmark size={18} className="mb-2 text-cx-accent" />
            <p className="text-sm font-semibold text-white">Save picks</p>
            <p className="mt-1 text-xs leading-5 text-white/44">Keep a private list of movies and series.</p>
          </div>
          <div className="rounded-lg border border-cx-muted/40 bg-cx-dark/70 p-3">
            <Download size={18} className="mb-2 text-cx-accent" />
            <p className="text-sm font-semibold text-white">Track downloads</p>
            <p className="mt-1 text-xs leading-5 text-white/44">Find previous download choices easily.</p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-5 flex gap-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-red-200" />
            <p className="text-xs leading-5 text-red-100/78">
              Without an account, your history stays only on this browser. Clearing site data or switching phones can remove your progress, bookmarks, and download records.
            </p>
          </div>

          <div className="flex flex-col gap-3 min-[440px]:flex-row">
            <a
              href="/api/auth/google"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cx-accent px-4 py-3 text-sm font-bold text-cx-black transition-colors hover:bg-cx-bright"
            >
              <Chrome size={16} />
              Continue with Google
            </a>
            <Link
              href="/signup"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-cx-accent/30 bg-cx-accent/10 px-4 py-3 text-sm font-bold text-cx-accent transition-colors hover:bg-cx-accent hover:text-cx-black"
            >
              <UserPlus size={16} />
              Use Email
            </Link>
          </div>

          <button
            type="button"
            onClick={dismissPermanently}
            className="mt-4 w-full text-center text-xs font-semibold text-white/40 transition-colors hover:text-white/70"
          >
            Do not show this again
          </button>
        </div>
      </div>
    </div>
  )
}
