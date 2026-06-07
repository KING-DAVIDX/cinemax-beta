'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { WHATSAPP_CHANNEL_URL } from '@/lib/site'

const STORAGE_KEY = 'cx_wa_reminder'
const MAX_PER_DAY = 2
// Minimum gap between the two daily appearances so they land at different times.
const MIN_GAP_MS = 3 * 60 * 60 * 1000 // 3 hours
const FIRST_DELAY_MS = 25 * 1000 // let the page settle before nudging

type ReminderState = {
  day: string
  shows: number[] // epoch ms of each appearance today
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function readState(): ReminderState {
  if (typeof window === 'undefined') return { day: today(), shows: [] }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ReminderState
      if (parsed && parsed.day === today() && Array.isArray(parsed.shows)) {
        return parsed
      }
    }
  } catch {
    // ignore malformed state
  }

  return { day: today(), shows: [] }
}

function writeState(state: ReminderState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable; reminder just won't be rate-limited this session
  }
}

/**
 * How long until the reminder is allowed to appear again, in ms.
 * Returns 0 when it can show now, or Infinity when the daily cap is reached.
 */
function msUntilNextShow(state: ReminderState) {
  if (state.shows.length >= MAX_PER_DAY) return Number.POSITIVE_INFINITY

  if (state.shows.length === 0) return FIRST_DELAY_MS

  const last = state.shows[state.shows.length - 1]
  const elapsed = Date.now() - last
  return elapsed >= MIN_GAP_MS ? 0 : MIN_GAP_MS - elapsed
}

export default function WhatsappReminder() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const state = readState()
    const wait = msUntilNextShow(state)
    if (!Number.isFinite(wait)) return

    const timer = window.setTimeout(() => {
      const fresh = readState()
      if (msUntilNextShow(fresh) > 0) return // another tab/page already used a slot

      fresh.shows.push(Date.now())
      writeState(fresh)
      setVisible(true)
    }, Math.max(wait, 0))

    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-4 sm:justify-end sm:px-6">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-lg border border-emerald-400/30 bg-cx-dark/95 shadow-2xl shadow-black/50 backdrop-blur animate-fade-up"
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400" />
        <div className="flex items-start gap-3 p-4 pl-5">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
            <MessageCircle size={18} />
          </span>

          <div className="min-w-0 flex-1 pr-6">
            <p className="text-sm font-semibold text-white">Join the Cinemax channel</p>
            <p className="mt-1 text-xs leading-5 text-white/55">
              Get new releases, updates, and drops on our WhatsApp channel.
            </p>
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setVisible(false)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-cx-black transition-colors hover:bg-emerald-400"
            >
              <MessageCircle size={14} />
              Join channel
            </a>
          </div>

          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss reminder"
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-white/25 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
