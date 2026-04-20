'use client'

import { useEffect, useState, useCallback } from 'react'

const KEY = 'reservaya-favorites'

function readFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeFavorites(list: string[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('reservaya-favorites-changed'))
  } catch {
    /* silent */
  }
}

/**
 * Hook para gestionar favoritos persistidos en localStorage.
 * Sincroniza entre pestañas y componentes.
 */
export function useFavorites(): {
  favorites: string[]
  isFavorite: (id: string) => boolean
  toggle: (id: string) => void
  clear: () => void
} {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    setFavorites(readFavorites())
    function handler() { setFavorites(readFavorites()) }
    window.addEventListener('storage', handler)
    window.addEventListener('reservaya-favorites-changed', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('reservaya-favorites-changed', handler)
    }
  }, [])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  const toggle = useCallback((id: string) => {
    const current = readFavorites()
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    writeFavorites(next)
    setFavorites(next)
  }, [])

  const clear = useCallback(() => {
    writeFavorites([])
    setFavorites([])
  }, [])

  return { favorites, isFavorite, toggle, clear }
}
