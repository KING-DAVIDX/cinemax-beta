'use client'
import { useEffect, useState } from 'react'

export default function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'exit'>('loading')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem('cx_intro_done')) {
      onComplete()
      return
    }

    const interval = setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          clearInterval(interval)
          return 100
        }
        return value + 2
      })
    }, 28)

    const revealTimer = setTimeout(() => setPhase('reveal'), 500)
    const exitTimer = setTimeout(() => setPhase('exit'), 2300)
    const doneTimer = setTimeout(() => {
      sessionStorage.setItem('cx_intro_done', '1')
      onComplete()
    }, 2850)

    return () => {
      clearInterval(interval)
      clearTimeout(revealTimer)
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[9999] grid place-items-center bg-cx-black px-6 transition-opacity duration-700 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.10),transparent_34%),linear-gradient(180deg,rgba(17,16,9,0.55),#111009)]" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cx-accent/35 to-transparent" />
        <div className="absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(90deg,transparent_0,transparent_22px,rgba(237,232,220,0.04)_23px,transparent_24px)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div
          className={`mb-7 h-14 w-14 border border-cx-accent/60 bg-cx-dark/80 text-cx-accent shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-all duration-700 ${
            phase === 'loading' ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <div className="grid h-full w-full place-items-center font-display text-3xl">C</div>
        </div>

        <div
          className={`transition-all duration-700 ${
            phase === 'loading' ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <p className="editorial-label mb-4">Private Cinema</p>
          <h1 className="font-display text-5xl text-white sm:text-6xl">Cinemax</h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/55">
            Curated movies, series, streams, and downloads in one quiet viewing room.
          </p>
        </div>

        <div className="mt-9 h-px w-full max-w-xs overflow-hidden bg-cx-muted/60">
          <div
            className="h-full bg-cx-accent transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
