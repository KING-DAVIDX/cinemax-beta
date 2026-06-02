'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'

export interface WatchHistoryItem {
  id: string
  title: string
  poster: string
  type: 'movie' | 'series'
  season?: number
  episode?: number
  watchedAt: number
  progress?: number // percentage
  year?: number
  rating?: number
  detailPath?: string
}

export interface DownloadHistoryItem {
  id: string
  title: string
  poster: string
  quality: string
  type: 'movie' | 'series'
  season?: number
  episode?: number
  downloadedAt: number
  size?: string
  year?: number
  detailPath?: string
}

const WATCH_HISTORY_KEY = 'cx_watch_history'
const DOWNLOAD_HISTORY_KEY = 'cx_download_history'

function scopedHistoryKey(baseKey: string, userId?: string) {
  return `${baseKey}:${userId || 'guest'}`
}

function readHistory<T>(storageKey: string): T[] {
  const saved = localStorage.getItem(storageKey)
  if (!saved) return []

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHistory<T>(storageKey: string, items: T[]) {
  localStorage.setItem(storageKey, JSON.stringify(items))
}

// ---- Watch History ----
export function useWatchHistory() {
  const { user, loading } = useAuth()
  const [history, setHistory] = useState<WatchHistoryItem[]>([])
  const storageKey = useMemo(
    () => (loading ? null : scopedHistoryKey(WATCH_HISTORY_KEY, user?.id)),
    [loading, user?.id]
  )
  const storageKeyRef = useRef<string | null>(null)
  const pendingAddsRef = useRef<Omit<WatchHistoryItem, 'watchedAt'>[]>([])

  const addItem = useCallback((items: WatchHistoryItem[], item: Omit<WatchHistoryItem, 'watchedAt'>) => {
    const filtered = items.filter(h => !(h.id === item.id && h.season === item.season && h.episode === item.episode))
    return [{ ...item, watchedAt: Date.now() }, ...filtered].slice(0, 100)
  }, [])

  useEffect(() => {
    if (!storageKey) return

    storageKeyRef.current = storageKey
    let nextHistory = readHistory<WatchHistoryItem>(storageKey)

    if (storageKey.endsWith(':guest') && nextHistory.length === 0) {
      nextHistory = readHistory<WatchHistoryItem>(WATCH_HISTORY_KEY)
    }

    if (pendingAddsRef.current.length > 0) {
      pendingAddsRef.current.forEach(item => {
        nextHistory = addItem(nextHistory, item)
      })
      pendingAddsRef.current = []
    }

    setHistory(nextHistory)
    writeHistory(storageKey, nextHistory)
  }, [addItem, storageKey])

  const addToHistory = useCallback((item: Omit<WatchHistoryItem, 'watchedAt'>) => {
    const key = storageKeyRef.current

    if (!key) {
      pendingAddsRef.current = [...pendingAddsRef.current, item].slice(-10)
      return
    }

    setHistory(prev => {
      const newHistory = addItem(prev, item)
      writeHistory(key, newHistory)
      return newHistory
    })
  }, [addItem])

  const removeFromHistory = useCallback((id: string, season?: number, episode?: number) => {
    const key = storageKeyRef.current
    if (!key) return

    setHistory(prev => {
      const newHistory = prev.filter(h => !(h.id === id && h.season === season && h.episode === episode))
      writeHistory(key, newHistory)
      return newHistory
    })
  }, [])

  const clearHistory = useCallback(() => {
    const key = storageKeyRef.current
    if (key) localStorage.removeItem(key)
    setHistory([])
  }, [])

  return { history, addToHistory, removeFromHistory, clearHistory }
}

// ---- Download History ----
export function useDownloadHistory() {
  const { user, loading } = useAuth()
  const [downloads, setDownloads] = useState<DownloadHistoryItem[]>([])
  const storageKey = useMemo(
    () => (loading ? null : scopedHistoryKey(DOWNLOAD_HISTORY_KEY, user?.id)),
    [loading, user?.id]
  )
  const storageKeyRef = useRef<string | null>(null)
  const pendingAddsRef = useRef<Omit<DownloadHistoryItem, 'downloadedAt'>[]>([])

  const addItem = useCallback((items: DownloadHistoryItem[], item: Omit<DownloadHistoryItem, 'downloadedAt'>) => {
    return [{ ...item, downloadedAt: Date.now() }, ...items].slice(0, 200)
  }, [])

  useEffect(() => {
    if (!storageKey) return

    storageKeyRef.current = storageKey
    let nextDownloads = readHistory<DownloadHistoryItem>(storageKey)

    if (storageKey.endsWith(':guest') && nextDownloads.length === 0) {
      nextDownloads = readHistory<DownloadHistoryItem>(DOWNLOAD_HISTORY_KEY)
    }

    if (pendingAddsRef.current.length > 0) {
      pendingAddsRef.current.forEach(item => {
        nextDownloads = addItem(nextDownloads, item)
      })
      pendingAddsRef.current = []
    }

    setDownloads(nextDownloads)
    writeHistory(storageKey, nextDownloads)
  }, [addItem, storageKey])

  const addDownload = useCallback((item: Omit<DownloadHistoryItem, 'downloadedAt'>) => {
    const key = storageKeyRef.current

    if (!key) {
      pendingAddsRef.current = [...pendingAddsRef.current, item].slice(-10)
      return
    }

    setDownloads(prev => {
      const newDownloads = addItem(prev, item)
      writeHistory(key, newDownloads)
      return newDownloads
    })
  }, [addItem])

  const removeDownload = useCallback((downloadedAt: number) => {
    const key = storageKeyRef.current
    if (!key) return

    setDownloads(prev => {
      const newDownloads = prev.filter(d => d.downloadedAt !== downloadedAt)
      writeHistory(key, newDownloads)
      return newDownloads
    })
  }, [])

  const clearDownloads = useCallback(() => {
    const key = storageKeyRef.current
    if (key) localStorage.removeItem(key)
    setDownloads([])
  }, [])

  return { downloads, addDownload, removeDownload, clearDownloads }
}
