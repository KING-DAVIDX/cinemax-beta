'use client'
import { useEffect, useState } from 'react'

export default function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'exit'>('loading')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Skip intro if already seen this session
    if (sessionStorage.getItem('cx_intro_done')) {
      onComplete()
      return
    }

    // Progress bar fill
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + 2
      })
    }, 30)

    const t1 = setTimeout(() => setPhase('reveal'), 800)
    const t2 = setTimeout(() => setPhase('exit'), 2800)
    const t3 = setTimeout(() => {
      sessionStorage.setItem('cx_intro_done', '1')
      onComplete()
    }, 3400)

    return () => {
      clearInterval(interval)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cx-black transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Grid lines background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(41,121,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(41,121,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, #020408 80%)',
          }}
        />
        {/* Scan line */}
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cx-accent to-transparent opacity-30 animate-scan"
          style={{ top: '0' }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div
          className={`transition-all duration-700 ${
            phase === 'loading' ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-16 bg-cx-accent rounded-full" />
            <h1
              className="text-7xl font-display tracking-widest glow-text"
              style={{ color: '#fff', letterSpacing: '0.15em' }}
            >
              CINEMAX
            </h1>
            <div className="w-1 h-16 bg-cx-accent rounded-full" />
          </div>
          <p
            className="text-cx-ice text-center text-sm tracking-[0.4em] uppercase font-body font-light"
            style={{ opacity: phase === 'loading' ? 0 : 0.7 }}
          >
            Stream. Download. Experience.
          </p>
        </div>

        {/* Welcome message */}
        <div
          className={`text-center transition-all duration-700 delay-300 ${
            phase === 'loading' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <p className="text-white/60 font-body text-lg tracking-widest">
            Welcome back.
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-px bg-cx-muted relative overflow-hidden rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-cx-blue to-cx-accent rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(41,121,255,0.8)' }}
          />
        </div>

        {/* Loading text */}
        <p className="text-cx-ice/40 text-xs tracking-[0.3em] uppercase font-body animate-pulse">
          Initializing Cinema...
        </p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-cx-accent/40" />
      <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-cx-accent/40" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-cx-accent/40" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-cx-accent/40" />
    </div>
  )
}
