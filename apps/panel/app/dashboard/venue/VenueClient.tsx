'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'

type Tab = 'fotos' | 'eventos' | 'promos'

const TAB_LABELS: Record<Tab, string> = {
  fotos: 'Fotos',
  eventos: 'Eventos',
  promos: 'Promos',
}

interface VenueImage {
  id: string
  url: string
  caption?: string
}

type EventType = 'show' | 'dj' | 'karaoke' | 'teatro' | 'gastronomia' | 'otro'

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  show: 'Show en vivo',
  dj: 'DJ',
  karaoke: 'Karaoke',
  teatro: 'Teatro',
  gastronomia: 'Gastronómico',
  otro: 'Otro',
}

interface VenueEvent {
  id: string
  title: string
  description: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  type: EventType
  coverCharge: number | null
}

interface VenuePromo {
  id: string
  title: string
  description: string
  discountPct: number | null
  discountAmount: number | null
  validFrom: string
  validUntil: string
  days: number[] // 0=Dom..6=Sab
  isActive: boolean
}

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const NAVY = '#0F3460'

const MOCK_IMAGES: VenueImage[] = [
  { id: 'i1', url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',  caption: 'Salón principal' },
  { id: 'i2', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', caption: 'Terraza al atardecer' },
  { id: 'i3', url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800', caption: 'Bife de chorizo' },
  { id: 'i4', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', caption: 'Barra' },
]

const MOCK_EVENTS: VenueEvent[] = [
  {
    id: 'e1',
    title: 'Jazz en vivo con Trío Martín',
    description: 'Noche de jazz standards y bossa nova. Cover $3.500 con consumición.',
    date: '2026-04-27',
    time: '22:00',
    type: 'show',
    coverCharge: 3500,
  },
  {
    id: 'e2',
    title: 'DJ Set — Noche de tapas',
    description: 'Selección de vinilos de los 80s acompañando una carta de tapas especiales.',
    date: '2026-05-02',
    time: '23:00',
    type: 'dj',
    coverCharge: null,
  },
]

const MOCK_PROMOS: VenuePromo[] = [
  {
    id: 'p1',
    title: 'Happy Hour — 2x1 en tragos',
    description: 'De 19 a 21 hs, todos los tragos de autor al 2x1.',
    discountPct: null,
    discountAmount: null,
    validFrom: '2026-04-15',
    validUntil: '2026-05-31',
    days: [1, 2, 3, 4], // Lun a Jue
    isActive: true,
  },
  {
    id: 'p2',
    title: 'Menú ejecutivo 20% OFF',
    description: 'Entrada + principal + bebida los mediodías de semana.',
    discountPct: 20,
    discountAmount: null,
    validFrom: '2026-04-20',
    validUntil: '2026-06-30',
    days: [1, 2, 3, 4, 5],
    isActive: true,
  },
]

// ── Estilos base ─────────────────────────────────────────────────────────────

const inputCls = `w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-white
                  px-4 py-3 text-[14px] text-tx placeholder-tx3 outline-none
                  focus:border-[#0F3460] focus:ring-2 focus:ring-[#0F3460]/15
                  transition-colors duration-[160ms]`

const btnPrimary = `w-full py-3 rounded-md bg-[#0F3460] text-white font-semibold text-[14px]
                    disabled:opacity-60 hover:bg-[#0A2548]
                    transition-colors duration-[160ms]`

const btnGhost = `px-3 py-2 rounded-md bg-sf border border-[rgba(0,0,0,0.08)]
                  text-tx2 text-[12px] font-semibold
                  hover:bg-sf2 hover:text-tx transition-colors duration-[160ms]`

export function VenueClient() {
  const [tab, setTab] = useState<Tab>('fotos')

  return (
    <div className="min-h-screen bg-sf pb-20">
      <PageHeader
        title="Tu local"
        subtitle="Cómo te ven los clientes en la app"
        venueName="La Cantina de Martín"
      />

      {/* Tabs */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.07)]">
        <nav className="max-w-3xl mx-auto px-5 flex gap-1 -mb-[1px]" aria-label="Secciones">
          {(['fotos', 'eventos', 'promos'] as Tab[]).map(t => {
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-[13px] font-semibold border-b-2
                            transition-colors duration-[160ms]
                            ${active
                              ? 'text-[#0F3460] border-[#0F3460]'
                              : 'text-tx2 border-transparent hover:text-tx'
                            }`}
              >
                {TAB_LABELS[t]}
              </button>
            )
          })}
        </nav>
      </div>

      <main className="max-w-3xl mx-auto px-5 pt-6">
        {tab === 'fotos'   && <FotosTab />}
        {tab === 'eventos' && <EventosTab />}
        {tab === 'promos'  && <PromosTab />}
      </main>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// FOTOS
// ══════════════════════════════════════════════════════════════════════════════

function FotosTab() {
  const [images, setImages] = useState<VenueImage[]>(MOCK_IMAGES)

  function removeImage(id: string) {
    setImages(prev => prev.filter(i => i.id !== id))
  }

  function addImage() {
    const random = `https://images.unsplash.com/photo-${1530213786676 + images.length * 1000}-41ad9f7736f6?w=800`
    setImages(prev => [
      ...prev,
      { id: `i${Date.now()}`, url: random, caption: 'Nueva foto' },
    ])
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-sans-black text-[20px] text-tx leading-none">Galería</p>
          <p className="text-tx2 text-[13px] mt-1">
            La primera foto aparece como portada en la app.
          </p>
        </div>
        <span className="text-tx3 text-[12px] font-semibold">
          {images.length} foto{images.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Upload zone */}
      <label className="block rounded-md border border-dashed border-[#0F3460]/25 bg-white
                        hover:border-[#0F3460]/50 hover:bg-[#0F3460]/[0.02]
                        transition-colors duration-[160ms] cursor-pointer">
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-10 h-10 rounded-full bg-[#0F3460]/[0.08] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#0F3460" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-tx font-semibold text-[14px]">Subir fotos</p>
          <p className="text-tx3 text-[12px] text-center max-w-[260px]">
            Arrastrá imágenes o hacé clic. JPG/PNG hasta 5MB c/u.
          </p>
        </div>
        <input type="file" accept="image/*" multiple className="hidden" onChange={addImage} />
      </label>

      {/* Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="group relative rounded-md overflow-hidden border border-[rgba(0,0,0,0.07)] bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption ?? ''}
                className="w-full h-36 object-cover"
              />
              {idx === 0 && (
                <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider
                                 bg-[#C5602A] text-white px-2 py-0.5 rounded-full">
                  Portada
                </span>
              )}
              <button
                onClick={() => removeImage(img.id)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-[rgba(0,0,0,0.08)]
                           text-tx2 hover:text-[#D63646] hover:border-[#D63646]/30
                           flex items-center justify-center transition-colors"
                aria-label="Eliminar foto"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
              {img.caption && (
                <p className="text-tx2 text-[12px] px-3 py-2 truncate">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin fotos"
          body="Agregá al menos una foto para que tu restaurante destaque en la app."
        />
      )}
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENTOS
// ══════════════════════════════════════════════════════════════════════════════

function EventosTab() {
  const [events, setEvents] = useState<VenueEvent[]>(MOCK_EVENTS)
  const [editing, setEditing] = useState<VenueEvent | 'new' | null>(null)

  function handleSave(ev: VenueEvent) {
    setEvents(prev => {
      const exists = prev.some(e => e.id === ev.id)
      return exists ? prev.map(e => e.id === ev.id ? ev : e) : [...prev, ev]
    })
    setEditing(null)
  }

  function handleDelete(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id))
    setEditing(null)
  }

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-sans-black text-[20px] text-tx leading-none">Eventos especiales</p>
          <p className="text-tx2 text-[13px] mt-1">
            Shows, DJ sets, noches temáticas. Aparecen destacados en la app.
          </p>
        </div>
        <button onClick={() => setEditing('new')} className={btnGhost}>
          + Nuevo
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="Sin eventos programados"
          body="Creá un evento y aparecerá en el home de los clientes."
          actionLabel="Crear primer evento"
          onAction={() => setEditing('new')}
        />
      ) : (
        <div className="space-y-2">
          {sorted.map(ev => <EventRow key={ev.id} event={ev} onClick={() => setEditing(ev)} />)}
        </div>
      )}

      {editing && (
        <EventSheet
          event={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </section>
  )
}

function EventRow({ event, onClick }: { event: VenueEvent; onClick: () => void }) {
  const [y, m, d] = event.date.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dateLabel = date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-md border border-[rgba(0,0,0,0.07)] p-4
                 text-left hover:border-[#0F3460]/30 transition-colors duration-[160ms]"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 flex-shrink-0 rounded-md bg-[#C5602A]/[0.06] border border-[#C5602A]/20 p-2 text-center">
          <p className="text-[10px] text-[#C5602A] font-semibold uppercase">
            {dateLabel.split(' ')[2]?.replace('.', '')}
          </p>
          <p className="font-sans-black text-[20px] text-[#C5602A] leading-none tabular-nums mt-0.5">
            {dateLabel.split(' ')[1]}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C5602A]/[0.08] text-[#C5602A] border border-[#C5602A]/15">
              {EVENT_TYPE_LABELS[event.type]}
            </span>
            <span className="text-tx2 text-[12px] font-mono tabular-nums">{event.time} hs</span>
          </div>
          <p className="text-tx font-semibold text-[14px] mt-1.5 truncate">{event.title}</p>
          <p className="text-tx2 text-[12px] mt-0.5 line-clamp-2">{event.description}</p>
          {event.coverCharge !== null && (
            <p className="text-tx font-mono tabular-nums text-[12px] mt-1.5">
              Cover ${event.coverCharge.toLocaleString('es-AR')}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

function EventSheet({
  event,
  onClose,
  onSave,
  onDelete,
}: {
  event: VenueEvent | null
  onClose: () => void
  onSave: (e: VenueEvent) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [date, setDate] = useState(event?.date ?? '')
  const [time, setTime] = useState(event?.time ?? '22:00')
  const [type, setType] = useState<EventType>(event?.type ?? 'show')
  const [coverCharge, setCoverCharge] = useState<string>(event?.coverCharge?.toString() ?? '')

  function save() {
    if (!title.trim() || !date) return
    onSave({
      id: event?.id ?? `e${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      type,
      coverCharge: coverCharge ? Number(coverCharge) : null,
    })
  }

  return (
    <Sheet onClose={onClose}>
      <h2 className="font-sans-black text-[20px] text-tx leading-none">
        {event ? 'Editar evento' : 'Nuevo evento'}
      </h2>

      <Field label="Título">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ej: Jazz en vivo con Trío Martín"
          className={inputCls}
          autoFocus
        />
      </Field>

      <Field label="Descripción">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="¿De qué se trata? Qué puede esperar el cliente."
          rows={2}
          className={`${inputCls} resize-none leading-relaxed`}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`${inputCls} font-mono`} />
        </Field>
        <Field label="Hora">
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={`${inputCls} font-mono`} />
        </Field>
      </div>

      <Field label="Tipo">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`py-2 rounded-md text-[12px] font-semibold border transition-colors duration-[160ms]
                          ${type === t
                            ? 'bg-[#0F3460] border-[#0F3460] text-white'
                            : 'bg-white border-[rgba(0,0,0,0.1)] text-tx2 hover:border-[#0F3460]/40 hover:text-tx'
                          }`}
            >
              {EVENT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Cover / entrada ($) — opcional">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tx2 text-[14px] font-mono">$</span>
          <input
            type="number"
            value={coverCharge}
            onChange={e => setCoverCharge(e.target.value)}
            placeholder="Sin cargo"
            className={`${inputCls} pl-7 font-mono tabular-nums`}
          />
        </div>
      </Field>

      <div className="flex gap-2 pt-1">
        {event && (
          <button
            onClick={() => onDelete(event.id)}
            className="px-4 py-3 rounded-md bg-c1l border border-[#D63646]/20 text-[#D63646] font-semibold text-[13px]
                       hover:bg-[#D63646]/10 transition-colors duration-[160ms]"
          >
            Eliminar
          </button>
        )}
        <button onClick={save} disabled={!title.trim() || !date} className={btnPrimary}>
          Guardar
        </button>
      </div>
    </Sheet>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMOS
// ══════════════════════════════════════════════════════════════════════════════

function PromosTab() {
  const [promos, setPromos] = useState<VenuePromo[]>(MOCK_PROMOS)
  const [editing, setEditing] = useState<VenuePromo | 'new' | null>(null)

  function handleSave(p: VenuePromo) {
    setPromos(prev => {
      const exists = prev.some(x => x.id === p.id)
      return exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]
    })
    setEditing(null)
  }

  function handleDelete(id: string) {
    setPromos(prev => prev.filter(x => x.id !== id))
    setEditing(null)
  }

  function toggleActive(id: string) {
    setPromos(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p))
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-sans-black text-[20px] text-tx leading-none">Promos y descuentos</p>
          <p className="text-tx2 text-[13px] mt-1">
            Ofertas que aparecen en la app. Pausalas cuando quieras.
          </p>
        </div>
        <button onClick={() => setEditing('new')} className={btnGhost}>
          + Nueva
        </button>
      </div>

      {promos.length === 0 ? (
        <EmptyState
          title="Sin promos activas"
          body="Creá una promoción para atraer clientes en días de baja ocupación."
          actionLabel="Crear primera promo"
          onAction={() => setEditing('new')}
        />
      ) : (
        <div className="space-y-2">
          {promos.map(p => (
            <PromoRow
              key={p.id}
              promo={p}
              onEdit={() => setEditing(p)}
              onToggle={() => toggleActive(p.id)}
            />
          ))}
        </div>
      )}

      {editing && (
        <PromoSheet
          promo={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </section>
  )
}

function PromoRow({
  promo,
  onEdit,
  onToggle,
}: {
  promo: VenuePromo
  onEdit: () => void
  onToggle: () => void
}) {
  const discountLabel = promo.discountPct
    ? `-${promo.discountPct}%`
    : promo.discountAmount
      ? `-$${promo.discountAmount.toLocaleString('es-AR')}`
      : 'Especial'

  const daysLabel = promo.days.length === 7
    ? 'Todos los días'
    : promo.days.length === 0
      ? 'Sin días'
      : promo.days.map(d => DAYS_SHORT[d]).join(' · ')

  return (
    <div
      className={`bg-white rounded-md border p-4 transition-colors
                  ${promo.isActive
                    ? 'border-[rgba(0,0,0,0.07)]'
                    : 'border-[rgba(0,0,0,0.07)] opacity-60'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-16 rounded-md bg-[#C5602A]/[0.06] border border-[#C5602A]/20 py-2 text-center">
          <p className="font-sans-black text-[15px] text-[#C5602A] leading-none tabular-nums">
            {discountLabel}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-tx font-semibold text-[14px] truncate">{promo.title}</p>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0
                          ${promo.isActive
                            ? 'bg-c2l text-[#15A67A] border-[#15A67A]/20'
                            : 'bg-sf2 text-tx3 border-[rgba(0,0,0,0.08)]'}`}
            >
              {promo.isActive ? 'Activa' : 'Pausada'}
            </span>
          </div>
          <p className="text-tx2 text-[12px] mt-0.5 line-clamp-2">{promo.description}</p>
          <p className="text-tx3 text-[11px] mt-1.5">
            {daysLabel} · Hasta {formatDate(promo.validUntil)}
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={onEdit}
              className="text-[12px] text-[#0F3460] font-semibold hover:underline"
            >
              Editar
            </button>
            <button
              onClick={onToggle}
              className="text-[12px] text-tx2 font-semibold hover:text-tx hover:underline"
            >
              {promo.isActive ? 'Pausar' : 'Activar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PromoSheet({
  promo,
  onClose,
  onSave,
  onDelete,
}: {
  promo: VenuePromo | null
  onClose: () => void
  onSave: (p: VenuePromo) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState(promo?.title ?? '')
  const [description, setDescription] = useState(promo?.description ?? '')
  const [discountType, setDiscountType] = useState<'pct' | 'amount' | 'none'>(
    promo?.discountPct ? 'pct' : promo?.discountAmount ? 'amount' : 'none'
  )
  const [discountValue, setDiscountValue] = useState<string>(
    promo?.discountPct?.toString() ?? promo?.discountAmount?.toString() ?? ''
  )
  const [validFrom, setValidFrom] = useState(promo?.validFrom ?? new Date().toISOString().slice(0, 10))
  const [validUntil, setValidUntil] = useState(promo?.validUntil ?? '')
  const [days, setDays] = useState<number[]>(promo?.days ?? [1, 2, 3, 4, 5])

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  function save() {
    if (!title.trim() || !validFrom || !validUntil) return
    const val = discountValue ? Number(discountValue) : null
    onSave({
      id: promo?.id ?? `p${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      discountPct: discountType === 'pct' ? val : null,
      discountAmount: discountType === 'amount' ? val : null,
      validFrom,
      validUntil,
      days,
      isActive: promo?.isActive ?? true,
    })
  }

  return (
    <Sheet onClose={onClose}>
      <h2 className="font-sans-black text-[20px] text-tx leading-none">
        {promo ? 'Editar promo' : 'Nueva promo'}
      </h2>

      <Field label="Título">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ej: Happy Hour 2x1"
          className={inputCls}
          autoFocus
        />
      </Field>

      <Field label="Descripción">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Qué incluye y cuándo aplica."
          rows={2}
          className={`${inputCls} resize-none leading-relaxed`}
        />
      </Field>

      <Field label="Tipo de descuento">
        <div className="grid grid-cols-3 gap-2">
          {(['pct', 'amount', 'none'] as const).map(t => (
            <button
              key={t}
              onClick={() => setDiscountType(t)}
              className={`py-2 rounded-md text-[12px] font-semibold border transition-colors duration-[160ms]
                          ${discountType === t
                            ? 'bg-[#0F3460] border-[#0F3460] text-white'
                            : 'bg-white border-[rgba(0,0,0,0.1)] text-tx2 hover:border-[#0F3460]/40 hover:text-tx'
                          }`}
            >
              {t === 'pct' ? '%' : t === 'amount' ? '$ fijo' : 'Sin monto'}
            </button>
          ))}
        </div>
      </Field>

      {discountType !== 'none' && (
        <Field label={discountType === 'pct' ? 'Porcentaje (%)' : 'Monto ($)'}>
          <input
            type="number"
            value={discountValue}
            onChange={e => setDiscountValue(e.target.value)}
            placeholder="0"
            className={`${inputCls} font-mono tabular-nums`}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Desde">
          <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className={`${inputCls} font-mono`} />
        </Field>
        <Field label="Hasta">
          <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={`${inputCls} font-mono`} />
        </Field>
      </div>

      <Field label="Días aplicables">
        <div className="flex gap-1.5 flex-wrap">
          {DAYS_SHORT.map((d, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={`w-10 h-10 rounded-md text-[12px] font-semibold border transition-colors duration-[160ms]
                          ${days.includes(i)
                            ? 'bg-[#0F3460] border-[#0F3460] text-white'
                            : 'bg-white border-[rgba(0,0,0,0.1)] text-tx2 hover:border-[#0F3460]/40 hover:text-tx'
                          }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex gap-2 pt-1">
        {promo && (
          <button
            onClick={() => onDelete(promo.id)}
            className="px-4 py-3 rounded-md bg-c1l border border-[#D63646]/20 text-[#D63646] font-semibold text-[13px]
                       hover:bg-[#D63646]/10 transition-colors duration-[160ms]"
          >
            Eliminar
          </button>
        )}
        <button
          onClick={save}
          disabled={!title.trim() || !validFrom || !validUntil}
          className={btnPrimary}
        >
          Guardar
        </button>
      </div>
    </Sheet>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

function Sheet({
  onClose,
  children,
}: {
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-tx/40" onClick={onClose} />
      <div className="relative rounded-t-2xl bg-white border-t border-[rgba(0,0,0,0.08)] p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-[rgba(0,0,0,0.1)] mx-auto mb-2" />
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-tx2 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="text-center py-12">
      <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="#ABABBA" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-display text-[18px] text-tx">{title}</p>
      <p className="text-tx2 text-[13px] mt-1 max-w-[280px] mx-auto leading-relaxed">{body}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 text-[#0F3460] font-semibold text-[14px] hover:underline"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}
