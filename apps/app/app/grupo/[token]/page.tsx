'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Tipos ─────────────────────────────────────────────────────────────────

type MenuStatus = 'pending' | 'ordered' | 'skipped'

interface SelectedItem {
  item_id: string
  name: string
  price: number
  qty: number
}

interface Guest {
  id: string
  name: string
  confirmed_at: string | null
  created_at: string
  menu_status?: MenuStatus
  menu_items?: SelectedItem[]
  menu_decided_at?: string | null
}

interface MenuCategory {
  name: string
  items: Array<{ id: string; name: string; price: number; description: string | null }>
}

interface GroupData {
  room: {
    id: string
    link_token: string
    reservations: {
      user_id: string
      date: string
      time_slot: string
      party_size: number
      venues: { name: string; address: string } | null
      tables: { label: string } | null
      users: { name: string } | null
    }
  }
  guests: Guest[]
  menu: MenuCategory[]
  isOrganizer: boolean
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function itemsTotal(items: SelectedItem[]): number {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0)
}

const AVATAR_COLORS = ['#FF4757', '#2ED8A8', '#FFB800', '#4E8EFF', '#9B59FF', '#FF8C42']

// ─── Componente principal ──────────────────────────────────────────────────

export default function GrupoPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<GroupData | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [myGuestId, setMyGuestId] = useState<string | null>(null)

  // Menu picker state
  const [menuOpen, setMenuOpen] = useState(false)
  const [selections, setSelections] = useState<Record<string, number>>({}) // item_id → qty
  const [submitting, setSubmitting] = useState(false)

  const channelRef = useRef<ReturnType<typeof createClient>['channel'] | null>(null)
  const supabase = createClient()

  // Fetch inicial
  useEffect(() => {
    fetch(`/api/grupo/${params.token}`)
      .then(r => r.json())
      .then((d: Partial<GroupData> & { error?: string }) => {
        // Respuesta 404 o malformada → tratar como grupo no encontrado
        if (!d || d.error || !d.room) {
          setData(null)
          return
        }
        setData(d as GroupData)
        setGuests(d.guests ?? [])
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [params.token])

  // Realtime: INSERT + UPDATE de guests
  useEffect(() => {
    if (!data?.room?.id) return
    const channel = supabase
      .channel(`group_guests:${data.room.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'group_guests',
        filter: `room_id=eq.${data.room.id}`,
      }, payload => {
        setGuests(prev => prev.some(g => g.id === payload.new.id) ? prev : [...prev, payload.new as Guest])
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'group_guests',
        filter: `room_id=eq.${data.room.id}`,
      }, payload => {
        setGuests(prev => prev.map(g => g.id === payload.new.id ? payload.new as Guest : g))
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

  async function handleSubmitMenu(status: 'ordered' | 'skipped') {
    if (!myGuestId) return
    setSubmitting(true)
    try {
      const items: SelectedItem[] = status === 'ordered'
        ? Object.entries(selections)
            .filter(([, qty]) => qty > 0)
            .map(([item_id, qty]) => {
              const i = allItems.find(x => x.id === item_id)!
              return { item_id, name: i.name, price: i.price, qty }
            })
        : []
      const res = await fetch(`/api/grupo/${params.token}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: myGuestId, status, items }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error ?? 'No pudimos guardar tu elección')
        return
      }
      // Optimistic update
      setGuests(prev => prev.map(g =>
        g.id === myGuestId
          ? { ...g, menu_status: status, menu_items: items, menu_decided_at: new Date().toISOString() }
          : g
      ))
      setMenuOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Derivados ───────────────────────────────────────────────────────────

  const allItems = useMemo(
    () => (data?.menu ?? []).flatMap(c => c.items),
    [data?.menu],
  )

  const myGuest = guests.find(g => g.id === myGuestId) ?? null
  const myStatus: MenuStatus = myGuest?.menu_status ?? 'pending'
  const selectedItems: SelectedItem[] = Object.entries(selections)
    .filter(([, qty]) => qty > 0)
    .map(([item_id, qty]) => {
      const i = allItems.find(x => x.id === item_id)
      return i ? { item_id, name: i.name, price: i.price, qty } : null
    })
    .filter((x): x is SelectedItem => !!x)
  const selectedTotal = itemsTotal(selectedItems)

  // Cuando abro el picker, prellenar con lo ya pedido (si modificando)
  useEffect(() => {
    if (menuOpen && myGuest?.menu_items) {
      const map: Record<string, number> = {}
      myGuest.menu_items.forEach(it => { map[it.item_id] = it.qty })
      setSelections(map)
    } else if (menuOpen) {
      setSelections({})
    }
  }, [menuOpen, myGuest])

  // ── Render ──────────────────────────────────────────────────────────────

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
  const menuAvailable = data.menu.length > 0

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

      {/* Lista de confirmados — con badge de menu status */}
      <div className="px-5 mb-5">
        <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
          En el grupo ({guests.length})
        </p>
        {guests.length === 0 ? (
          <p className="text-white/25 text-[13px] italic">Sé el primero en sumarte</p>
        ) : (
          <div className="space-y-2">
            {guests.map((g, i) => {
              const isMe = g.id === myGuestId
              const status: MenuStatus = g.menu_status ?? 'pending'
              return (
                <div key={g.id}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3
                              border transition-all duration-300
                              ${isMe ? 'bg-c2/15 border-c2/30' : 'bg-white/5 border-white/10'}`}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-[13px]"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {g.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`font-semibold text-[14px] ${isMe ? 'text-c2' : 'text-white'}`}>
                      {g.name}{isMe && ' (vos)'}
                    </span>
                    <p className="text-white/35 text-[11px] mt-0.5">
                      {status === 'ordered'   && `Pidió ${g.menu_items?.length ?? 0} ítem${(g.menu_items?.length ?? 0) === 1 ? '' : 's'}`}
                      {status === 'skipped'   && 'No va a pedir'}
                      {status === 'pending'   && 'Todavía no eligió menú'}
                    </p>
                  </div>
                  <MenuStatusDot status={status} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Progress bar lugares */}
      {!isFull && !joined && (
        <div className="mx-5 mb-1">
          <div className="flex gap-1 mb-4">
            {Array.from({ length: res.party_size }).map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full"
                style={{
                  background: i < guests.length ? 'var(--c2)' : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.3s',
                }} />
            ))}
          </div>
          <p className="text-white/40 text-[12px] text-center mb-5">
            {spotsLeft} lugar{spotsLeft !== 1 ? 'es' : ''} disponible{spotsLeft !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Formulario de join / menú / full */}
      <div className="px-5">
        {joined && myStatus === 'pending' ? (
          // ─── YA JOINEADO, AÚN NO DECIDIÓ MENÚ ────────────────────────────
          <div className="bg-c2/15 border border-c2/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-c2 flex items-center justify-center">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="font-display text-[17px] font-bold text-white">¡Estás confirmado/a!</p>
                <p className="text-white/50 text-[12px]">{res.venues?.name} · {res.time_slot} hs</p>
              </div>
            </div>
            <p className="text-white/60 text-[13px] mb-3">
              ¿Querés ir eligiendo lo que vas a pedir? El organizador paga la seña y junta todo.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMenuOpen(true)}
                disabled={!menuAvailable}
                className="py-3 rounded-xl bg-c1 text-white font-bold text-[14px]
                           active:scale-[0.97] transition-transform disabled:opacity-40"
              >
                {menuAvailable ? 'Ver menú' : 'Menú no disponible'}
              </button>
              <button
                onClick={() => handleSubmitMenu('skipped')}
                disabled={submitting}
                className="py-3 rounded-xl bg-white/10 text-white font-semibold text-[14px]
                           border border-white/15 active:scale-[0.97] transition-transform
                           disabled:opacity-50"
              >
                No voy a pedir
              </button>
            </div>
          </div>
        ) : joined && myStatus === 'ordered' ? (
          // ─── YA PIDIÓ ───────────────────────────────────────────────────
          <div className="bg-c2/15 border border-c2/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-c2 flex items-center justify-center">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-display text-[16px] font-bold text-white">Tu pedido está listo</p>
            </div>
            <ul className="space-y-1.5 mb-3">
              {myGuest?.menu_items?.map((it) => (
                <li key={it.item_id} className="flex justify-between text-[13px] text-white/80">
                  <span>{it.qty}× {it.name}</span>
                  <span className="font-mono tabular-nums">${(it.price * it.qty).toLocaleString('es-AR')}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between pt-2 border-t border-white/10 text-[13px] mb-3">
              <span className="text-white/60">Total</span>
              <span className="text-white font-bold font-mono tabular-nums">
                ${itemsTotal(myGuest?.menu_items ?? []).toLocaleString('es-AR')}
              </span>
            </div>
            <button
              onClick={() => setMenuOpen(true)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-semibold text-[13px]
                         border border-white/15 active:scale-[0.98] transition-transform"
            >
              Modificar mi pedido
            </button>
            <p className="text-white/35 text-[11px] text-center mt-3">
              El organizador paga la seña · Tu consumo se abona al llegar
            </p>
          </div>
        ) : joined && myStatus === 'skipped' ? (
          // ─── DIJO NO ────────────────────────────────────────────────────
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="font-display text-[16px] font-bold text-white mb-1">
              Listo, no vas a pedir menú
            </p>
            <p className="text-white/40 text-[12px] mb-3">
              El organizador tiene los datos del grupo.
            </p>
            <button
              onClick={() => setMenuOpen(true)}
              className="text-c2 text-[13px] font-bold underline"
            >
              Cambié de idea, quiero elegir
            </button>
          </div>
        ) : isFull ? (
          <div className="bg-c1/15 border border-c1/30 rounded-2xl p-5 text-center">
            <p className="font-display text-[20px] font-bold text-white mb-1">Grupo completo</p>
            <p className="text-white/50 text-[13px]">
              Ya se alcanzó el máximo de {res.party_size} personas.
            </p>
          </div>
        ) : (
          // ─── FORM DE JOIN ───────────────────────────────────────────────
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

      {/* Menu picker sheet */}
      {menuOpen && (
        <MenuPickerSheet
          menu={data.menu}
          selections={selections}
          onChange={setSelections}
          total={selectedTotal}
          submitting={submitting}
          onClose={() => setMenuOpen(false)}
          onConfirm={() => handleSubmitMenu('ordered')}
        />
      )}
    </div>
  )
}

// ─── Subcomponentes ────────────────────────────────────────────────────────

function MenuStatusDot({ status }: { status: MenuStatus }) {
  const label =
    status === 'ordered' ? '✓' :
    status === 'skipped' ? '—' : '…'
  const cls =
    status === 'ordered' ? 'bg-c2/20 text-c2' :
    status === 'skipped' ? 'bg-white/10 text-white/40' :
    'bg-c3/20 text-c3 animate-pulse'
  return (
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${cls}`}>
      {label}
    </span>
  )
}

function MenuPickerSheet({
  menu, selections, onChange, total, submitting, onClose, onConfirm,
}: {
  menu: MenuCategory[]
  selections: Record<string, number>
  onChange: (next: Record<string, number>) => void
  total: number
  submitting: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const hasAny = Object.values(selections).some(q => q > 0)

  function setQty(id: string, qty: number) {
    onChange({ ...selections, [id]: Math.max(0, qty) })
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button aria-label="Cerrar" onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-bg rounded-t-3xl max-h-[90vh] flex flex-col
                      shadow-[0_-8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-tx3/40" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--br)]">
          <h2 className="font-display text-[18px] font-bold text-tx">Elegí tu menú</h2>
          <button onClick={onClose} className="text-tx2 p-1" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {menu.map((cat) => (
            <div key={cat.name} className="px-5 py-4 border-b border-[var(--br)]">
              <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-3">
                {cat.name}
              </p>
              <ul className="space-y-3">
                {cat.items.map((it) => {
                  const qty = selections[it.id] ?? 0
                  return (
                    <li key={it.id} className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-tx">{it.name}</p>
                        {it.description && (
                          <p className="text-[12px] text-tx3 mt-0.5 leading-snug line-clamp-2">
                            {it.description}
                          </p>
                        )}
                        <p className="text-[13px] font-bold text-c1 font-mono tabular-nums mt-0.5">
                          ${it.price.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setQty(it.id, qty - 1)}
                          disabled={qty === 0}
                          aria-label="Restar"
                          className="w-8 h-8 rounded-full bg-sf border border-[var(--br)]
                                     text-tx font-bold disabled:opacity-30 active:scale-90 transition-transform"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-[14px] font-bold tabular-nums">{qty}</span>
                        <button
                          onClick={() => setQty(it.id, qty + 1)}
                          aria-label="Sumar"
                          className="w-8 h-8 rounded-full bg-c1 text-white font-bold
                                     active:scale-90 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer sticky */}
        <div className="border-t border-[var(--br)] px-5 py-4 bg-bg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-tx3 font-semibold uppercase tracking-wider">
              Tu total
            </span>
            <span className="font-display text-[22px] font-bold text-tx font-mono tabular-nums">
              ${total.toLocaleString('es-AR')}
            </span>
          </div>
          <button
            onClick={onConfirm}
            disabled={!hasAny || submitting}
            className="w-full py-4 rounded-full bg-c1 text-white font-bold text-[15px]
                       shadow-[0_8px_24px_rgba(255,71,87,0.3)] active:scale-[0.98]
                       transition-transform duration-[180ms] disabled:opacity-40 disabled:shadow-none"
          >
            {submitting ? 'Guardando…' : hasAny ? 'Confirmar mi pedido →' : 'Elegí al menos un ítem'}
          </button>
          <p className="text-[11px] text-tx3 text-center mt-2">
            Se paga al llegar · El organizador confirma todos los pedidos juntos
          </p>
        </div>
      </div>
    </div>
  )
}
