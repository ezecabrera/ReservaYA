'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/ui/BottomNav'

interface ProfileData {
  name: string
  phone: string
  email: string
  memberSince: string
  stats: {
    total: number
    checkedIn: number
    favoriteVenue: string | null
  }
}

// Paleta editorial para avatar personal — 6 tonos que matchean la
// identidad visual de la app sin competir con los tonos de estado.
const AVATAR_COLORS = [
  '#A13143', // wine
  '#4F8A5F', // olive
  '#C99130', // gold
  '#D66A3F', // terracotta
  '#7A5C8F', // plum
  '#8C4A5C', // burgundy soft
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function memberSinceLabel(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export default function PerfilPage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/perfil')
      .then(r => {
        if (r.status === 401) { router.replace('/login?redirect=/perfil'); return null }
        return r.json()
      })
      .then(d => { if (d) { setData(d); setNewName(d.name) } })
      .finally(() => setLoading(false))
  }, [router])

  async function handleSaveName() {
    if (!newName.trim() || newName === data?.name) { setEditing(false); return }
    setSaving(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const updated = await res.json() as { name: string }
      setData(prev => prev ? { ...prev, name: updated.name } : prev)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg pb-28">
        <div className="screen-x pt-14 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 skeleton rounded-lg" />
              <div className="h-4 w-24 skeleton rounded-lg" />
            </div>
          </div>
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-16 skeleton rounded-xl" />
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!data) return null

  const initial = data.name[0]?.toUpperCase() ?? '?'
  const color = avatarColor(data.name)

  return (
    <div className="min-h-screen bg-bg pb-28">

      {/* Header / Avatar */}
      <div className="screen-x pt-14 pb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}22`, border: `2.5px solid ${color}` }}
          >
            <span
              className="font-display font-bold text-[32px]"
              style={{ color }}
            >
              {initial}
            </span>
          </div>

          {/* Nombre + edición */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName() }}
                  className="flex-1 border-b-2 border-wine bg-transparent text-[18px]
                             font-bold text-tx outline-none pb-0.5"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="text-[13px] font-bold text-wine-soft"
                >
                  {saving ? '…' : 'Guardar'}
                </button>
                <button
                  onClick={() => { setEditing(false); setNewName(data.name) }}
                  className="text-[13px] text-tx3"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-display text-[22px] font-bold text-tx leading-tight truncate">
                  {data.name}
                </h1>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-shrink-0 active:scale-90 transition-transform"
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                      stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-tx3 text-[13px] mt-0.5">
              Desde {memberSinceLabel(data.memberSince)}
            </p>
          </div>
        </div>
      </div>

      <div className="screen-x space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3.5 text-center">
            <p className="font-display text-[26px] font-bold text-tx leading-none">
              {data.stats.total}
            </p>
            <p className="text-tx3 text-[11px] font-semibold mt-1">Reservas</p>
          </div>
          <div className="card p-3.5 text-center">
            <p className="font-display text-[26px] font-bold text-olive leading-none">
              {data.stats.checkedIn}
            </p>
            <p className="text-tx3 text-[11px] font-semibold mt-1">Asistidas</p>
          </div>
          <div className="card p-3.5 text-center">
            <p className="font-display text-[22px] font-bold text-tx leading-none">
              {data.stats.total > 0
                ? `${Math.round((data.stats.checkedIn / data.stats.total) * 100)}%`
                : '—'
              }
            </p>
            <p className="text-tx3 text-[11px] font-semibold mt-1">Asistencia</p>
          </div>
        </div>

        {/* Venue favorito */}
        {data.stats.favoriteVenue && (
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-wine/10 border border-wine/25 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="var(--c1)" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">
                Tu favorito
              </p>
              <p className="text-[14px] font-bold text-tx truncate">{data.stats.favoriteVenue}</p>
            </div>
          </div>
        )}

        {/* Datos de contacto */}
        <div className="card divide-y divide-[var(--br)]">
          {data.phone && (
            <div className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-[13px] text-tx2">Teléfono</span>
              <span className="text-[13px] font-semibold text-tx">{data.phone}</span>
            </div>
          )}
          {data.email && (
            <div className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-[13px] text-tx2">Email</span>
              <span className="text-[13px] font-semibold text-tx truncate max-w-[60%]">{data.email}</span>
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="card divide-y divide-[var(--br)]">
          <a href="/mis-reservas"
            className="px-4 py-3.5 flex items-center justify-between active:bg-sf transition-colors">
            <span className="text-[14px] font-semibold text-tx">Mis reservas</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </a>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-4 rounded-xl border-2 border-wine/25 text-wine-soft
                     font-bold text-[15px] hover:bg-wine/8
                     active:scale-[0.97] transition-all
                     disabled:opacity-50"
        >
          {signingOut ? 'Cerrando…' : 'Cerrar sesión'}
        </button>

        <p className="text-center text-tx3 text-[11px] pb-2">
          ReservaYA · v1.0
        </p>

      </div>

      <BottomNav />
    </div>
  )
}
