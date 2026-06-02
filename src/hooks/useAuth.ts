'use client'

import { useCallback, useEffect, useState } from 'react'

export type CurrentUser = {
  id: string
  email: string
  name: string
  provider: 'password' | 'google'
  avatarUrl?: string
  createdAt: string
}

export function userInitial(user?: CurrentUser | null) {
  const source = user?.name || user?.email || 'U'
  return source.trim().charAt(0).toUpperCase() || 'U'
}

export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        setUser(null)
        return
      }

      const payload = await response.json()
      setUser(payload.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { user, loading, refresh, setUser }
}
