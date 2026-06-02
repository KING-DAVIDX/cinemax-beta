'use client'
import { useState, useEffect, useCallback } from 'react'

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

// ---- Watch History ----
export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('cx_watch_history')
    if (saved) {
      try { setHistory(JSON.parse(saved)) } catch {}
    }
  }, [])

  const addToHistory = useCallback((item: Omit<WatchHistoryItem, 'watchedAt'>) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.id === item.id && h.season === item.season && h.episode === item.episode))
      const newHistory = [{ ...item, watchedAt: Date.now() }, ...filtered].slice(0, 100)
      localStorage.setItem('cx_watch_history', JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  const removeFromHistory = useCallback((id: string, season?: number, episode?: number) => {
    setHistory(prev => {
      const newHistory = prev.filter(h => !(h.id === id && h.season === season && h.episode === episode))
      localStorage.setItem('cx_watch_history', JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  const clearHistory = useCallback(() => {
    localStorage.removeItem('cx_watch_history')
    setHistory([])
  }, [])

  return { history, addToHistory, removeFromHistory, clearHistory }
}

// ---- Download History ----
export function useDownloadHistory() {
  const [downloads, setDownloads] = useState<DownloadHistoryItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('cx_download_history')
    if (saved) {
      try { setDownloads(JSON.parse(saved)) } catch {}
    }
  }, [])

  const addDownload = useCallback((item: Omit<DownloadHistoryItem, 'downloadedAt'>) => {
    setDownloads(prev => {
      const newDownloads = [{ ...item, downloadedAt: Date.now() }, ...prev].slice(0, 200)
      localStorage.setItem('cx_download_history', JSON.stringify(newDownloads))
      return newDownloads
    })
  }, [])

  const removeDownload = useCallback((downloadedAt: number) => {
    setDownloads(prev => {
      const newDownloads = prev.filter(d => d.downloadedAt !== downloadedAt)
      localStorage.setItem('cx_download_history', JSON.stringify(newDownloads))
      return newDownloads
    })
  }, [])

  const clearDownloads = useCallback(() => {
    localStorage.removeItem('cx_download_history')
    setDownloads([])
  }, [])

  return { downloads, addDownload, removeDownload, clearDownloads }
}
