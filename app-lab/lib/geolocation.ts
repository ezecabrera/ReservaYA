'use client'

import { useEffect, useState } from 'react'

export interface UserLocation {
  lat: number
  lng: number
  accuracy: number
}

export type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error'

/**
 * Distancia en km entre dos puntos usando la fórmula haversine.
 */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const CACHE_KEY = 'reservaya-geo'
const CACHE_TTL = 10 * 60 * 1000 // 10 min

function readCache(): UserLocation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { loc, t } = JSON.parse(raw) as { loc: UserLocation; t: number }
    if (Date.now() - t > CACHE_TTL) return null
    return loc
  } catch {
    return null
  }
}

function writeCache(loc: UserLocation) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ loc, t: Date.now() }))
  } catch { /* silent */ }
}

/**
 * Hook para pedir la ubicación del usuario.
 * No pide permiso automáticamente — hay que llamar a request().
 */
export function useGeolocation(): {
  status: GeoStatus
  location: UserLocation | null
  error: string | null
  request: () => void
  clear: () => void
} {
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = readCache()
    if (cached) {
      setLocation(cached)
      setStatus('granted')
    }
  }, [])

  function request() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable')
      setError('Tu navegador no soporta geolocalización.')
      return
    }
    setStatus('requesting')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        writeCache(loc)
        setLocation(loc)
        setStatus('granted')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
          setError('Permiso denegado. Activalo desde el ícono de ubicación en la barra del navegador.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus('unavailable')
          setError('No pudimos determinar tu ubicación.')
        } else if (err.code === err.TIMEOUT) {
          setStatus('error')
          setError('La ubicación tardó demasiado. Probá de nuevo.')
        } else {
          setStatus('error')
          setError('No pudimos obtener tu ubicación.')
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    )
  }

  function clear() {
    try { sessionStorage.removeItem(CACHE_KEY) } catch { /* silent */ }
    setLocation(null)
    setStatus('idle')
    setError(null)
  }

  return { status, location, error, request, clear }
}
