'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Guest {
  id: string
  name: string
  confirmed_at: string | null
  created_at: string
}

interface GroupData {
  room: {
    id: string
    link_token: string
    reservations: {
      date: string
      time_slot: string
      party_size: number
      venues: { name: string; address: string } | null
      tables: { label: string } | null
      users: { name: string } | null
    }
  }
  guests: Guest[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

const AVATAR_COLORS = ['#FF4757', '#2ED8A8', '#FFB800', '#4E8EFF', '#9B59FF', '#FF8C42']

export default function GrupoPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<GroupData | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [myGuestId, setMyGuestId] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof createClient>['channel'] | null>(null)
  const supabase = createClient()

  // Fetch inicial
  useEffect(() => {
    fetch(`/api/grupo/${params.token}`)
      .then(r => r.json())
      .then((d: GroupData) => {
        setData(d)
        setGuests(d.guests)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.token])

  // Realtime: escuchar nuevos guests
  useEffect(() => {
    if (!data?.room?.id) return

    const channel = supabase
      .channel(`group_guests:${data.room.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_guests',
        filter: `room_id=eq.${data.room.id}`,
      }, payload => {
        setGuests(prev => {
          if (prev.some(g => g.id === payload.new.id)) return prev
          return [...prev, payload.new as Guest]
        })
      })
      .subscribe()

    channelRef.current = channel as unknown as ReturnType<typeof createClient>['channel']
    return () => { supabase.removeChannel(channel) }
  }, [data?.room?.id, supabase])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setJoining(true)
    try {
      const res = await fetch(`/api/grupo/${params.token}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const guest = await res.json() as Guest
      setMyGuestId(guest.id)
      setJoined(true)
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)' }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-c2 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
        style={{ background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)' }}>
        <p className="font-display text-[22px] font-bold text-white">Grupo no encontrado</p>
        <p className="text-white/40 text-[14px] mt-2">El link puede haber expirado.</p>
      </div>
    )
  }

  const res = data.room.reservations
  const spotsLeft = Math.max(0, res.party_size - guests.length)
  const isFull = spotsLeft === 0

  return (
    <div className="min-h-screen pb-10"
      style={{ background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)' }}>

      {/* Header del evento */}
      <div className="px-5 pt-14 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                        bg-c1/15 border border-c1/25 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-c1 inline-block animate-pulse" />
          <span className="text-c1 text-[11px] font-bold uppercase tracking-wider">
            Grupo activo
          </span>
        </div>
        <h1 className="font-display text-[28px] font-bold text-white leading-tight">
          {res.venues?.name}
        </h1>
        <p className="text-white/50 text-[14px] mt-1 capitalize">{formatDate(res.date)}</p>
        <p className="text-white/50 text-[14px]">{res.time_slot} hs · Mesa {res.tables?.label}</p>
      </div>

      {/* Info del organizador */}
      <div className="mx-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 mb-5
                      flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-c1 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-[13px]">
            {res.users?.name?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
        <div>
          <p className="text-white/40 text-[11px]">Organizador</p>
          <p className="text-white font-semibold text-[14px]">{res.users?.name ?? 'Anónimo'}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-white/40 text-[11px]">Capacidad</p>
          <p className="text-white font-bold text-[14px]">{guests.length} / {res.party_size}</p>
        </div>
      </div>

      {/* Lista de confirmados */}
      <div className="px-5 mb-5">
        <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
          Se confirmaron ({guests.length})
        </p>

        {guests.length === 0 ? (
          <p className="text-white/25 text-[13px] italic">Sé el primero en sumarte</p>
        ) : (
          <div className="space-y-2">
            {guests.map((g, i) => (
              <div key={g.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3
                            border transition-all duration-300
                            ${g.id === myGuestId
                              ? 'bg-c2/15 border-c2/30'
                              : 'bg-white/5 border-white/10'
                            }`}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-[13px]"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {g.name[0].toUpperCase()}
                </div>
                <span className={`font-semibold text-[14px] ${g.id === myGuestId ? 'text-c2' : 'text-white'}`}>
                  {g.name}
                  {g.id === myGuestId && ' (vos)'}
                </span>
                <svg className="ml-auto" width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke={g.id === myGuestId ? 'var(--c2)' : 'rgba(255,255,255,0.3)'}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lugares disponibles */}
      {!isFull && !joined && (
        <div className="mx-5 mb-1">
          <div className="flex gap-1 mb-4">
            {Array.from({ length: res.party_size }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full"
                style={{
                  background: i < guests.length ? 'var(--c2)' : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
          <p className="text-white/40 text-[12px] text-center mb-5">
            {spotsLeft} lugar{spotsLeft !== 1 ? 'es' : ''} disponible{spotsLeft !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Formulario de join */}
      <div className="px-5">
        {joined ? (
          <div className="bg-c2/15 border border-c2/30 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-c2 flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="white"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-display text-[20px] font-bold text-white mb-1">
              ¡Ya estás confirmado/a!
            </p>
            <p className="text-white/50 text-[13px]">
              El {formatDate(res.date)} a las {res.time_slot} hs en {res.venues?.name}
            </p>
            <p className="text-white/30 text-[12px] mt-3">
              No necesitás hacer nada más. El organizador tiene todos los datos.
            </p>
          </div>
        ) : isFull ? (
          <div className="bg-c1/15 border border-c1/30 rounded-2xl p-5 text-center">
            <p className="font-display text-[20px] font-bold text-white mb-1">
              Grupo completo
            </p>
            <p className="text-white/50 text-[13px]">
              Ya se alcanzó el máximo de {res.party_size} personas.
            </p>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="space-y-3">
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider">
              Sumarte al grupo
            </p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="given-name"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-4
                         text-[15px] text-white placeholder-white/30 outline-none
                         focus:border-c2/50 focus:ring-2 focus:ring-c2/20 transition-all"
            />
            <button
              type="submit"
              disabled={!name.trim() || joining}
              className="w-full py-4 rounded-xl bg-c1 text-white font-bold text-[15px]
                         shadow-[0_4px_20px_rgba(255,71,87,0.3)] disabled:opacity-50
                         active:scale-[0.97] transition-all duration-[180ms]"
            >
              {joining ? 'Confirmando…' : 'Me apunto →'}
            </button>
            <p className="text-center text-white/25 text-[11px]">
              No necesitás crear una cuenta
            </p>
          </form>
        )}
      </div>

    </div>
  )
}
