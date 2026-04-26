'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { VenueImage, VenueImageBundle, VenueImageKind } from '@/lib/shared/types/venue-image'

/* ============================================================
   PhotosManager — Gestor de fotos del local (UnToque)
   Logo · Foto de portada · Galería (hasta 12, drag-and-drop).
   Estilo dark ink, paleta wine + pastels. Colores 100% opacos.
   ============================================================ */

const MAX_GALLERY = 12
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

interface Props {
  initialBundle: VenueImageBundle
}

type Toast = { id: number; tone: 'ok' | 'err'; text: string }

export function PhotosManager({ initialBundle }: Props) {
  const [bundle, setBundle] = useState<VenueImageBundle>(initialBundle)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)

  const pushToast = useCallback((tone: Toast['tone'], text: string) => {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, { id, tone, text }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/venue/images', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as VenueImageBundle
      setBundle({
        logo: data.logo ?? null,
        cover: data.cover ?? null,
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
      })
    } catch {
      /* noop */
    }
  }, [])

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: 'var(--ink)', color: 'var(--ink-text)' }}
    >
      {/* Header */}
      <div style={{ padding: '48px 20px 24px' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-text-3)',
            marginBottom: 6,
          }}
        >
          Configuración
        </p>
        <h1
          className="font-display"
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--ink-text)',
            lineHeight: 1.1,
          }}
        >
          Fotos del local
        </h1>
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-text-2)', maxWidth: 560 }}>
          Definí cómo se ve tu local en la ficha pública: logo, foto de portada y galería.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, padding: '0 20px' }}>
        <LogoSection bundle={bundle} onChange={refresh} pushToast={pushToast} />
        <CoverSection bundle={bundle} onChange={refresh} pushToast={pushToast} />
        <GallerySection bundle={bundle} onChange={refresh} setBundle={setBundle} pushToast={pushToast} />
      </div>

      {/* Toasts */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 80,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 'calc(100vw - 32px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              minWidth: 220,
              border: '1px solid',
              background: t.tone === 'ok' ? 'var(--surface-2)' : 'var(--wine-bg)',
              borderColor: t.tone === 'ok' ? 'var(--ink-line-2)' : 'var(--wine)',
              color: t.tone === 'ok' ? 'var(--ink-text)' : 'var(--wine-soft)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------ Logo ------------------------------ */

function LogoSection({
  bundle,
  onChange,
  pushToast,
}: {
  bundle: VenueImageBundle
  onChange: () => void
  pushToast: (tone: 'ok' | 'err', text: string) => void
}) {
  const logo = bundle.logo

  return (
    <SectionShell
      title="Logo del local"
      subtitle="Aparece en la ficha pública y notificaciones."
    >
      {logo ? (
        <ImageCard
          image={logo}
          shape="circle"
          thumbSize={96}
          onReplace={() => onChange()}
          onDelete={() => onChange()}
          pushToast={pushToast}
        />
      ) : (
        <Dropzone
          kind="logo"
          label="Arrastrá tu logo o hacé click — JPG/PNG/WebP, max 5MB, ideal 512×512"
          onUploaded={onChange}
          pushToast={pushToast}
        />
      )}
    </SectionShell>
  )
}

/* ------------------------------ Cover ------------------------------ */

function CoverSection({
  bundle,
  onChange,
  pushToast,
}: {
  bundle: VenueImageBundle
  onChange: () => void
  pushToast: (tone: 'ok' | 'err', text: string) => void
}) {
  const cover = bundle.cover

  return (
    <SectionShell
      title="Foto de portada"
      subtitle="Imagen hero que el comensal ve al abrir tu ficha. Recomendado 1200×630."
      badge={!cover ? 'Requerida para publicar' : undefined}
    >
      {cover ? (
        <ImageCard
          image={cover}
          shape="cover"
          onReplace={() => onChange()}
          onDelete={() => onChange()}
          pushToast={pushToast}
        />
      ) : (
        <Dropzone
          kind="cover"
          label="Arrastrá la foto principal — fija el tono visual del lugar"
          onUploaded={onChange}
          pushToast={pushToast}
        />
      )}
    </SectionShell>
  )
}

/* ------------------------------ Gallery ------------------------------ */

function GallerySection({
  bundle,
  onChange,
  setBundle,
  pushToast,
}: {
  bundle: VenueImageBundle
  onChange: () => void
  setBundle: React.Dispatch<React.SetStateAction<VenueImageBundle>>
  pushToast: (tone: 'ok' | 'err', text: string) => void
}) {
  const items = bundle.gallery
  const count = items.length
  const canAdd = count < MAX_GALLERY
  const [dragId, setDragId] = useState<string | null>(null)

  const move = useCallback(
    async (id: string, dir: -1 | 1) => {
      const idx = items.findIndex((i) => i.id === id)
      if (idx < 0) return
      const next = idx + dir
      if (next < 0 || next >= items.length) return
      const reordered = [...items]
      const [picked] = reordered.splice(idx, 1)
      reordered.splice(next, 0, picked)
      setBundle((prev) => ({ ...prev, gallery: reordered }))
      await persistOrder(reordered, pushToast)
      onChange()
    },
    [items, onChange, pushToast, setBundle]
  )

  const onDrop = useCallback(
    async (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null)
        return
      }
      const fromIdx = items.findIndex((i) => i.id === dragId)
      const toIdx = items.findIndex((i) => i.id === targetId)
      if (fromIdx < 0 || toIdx < 0) {
        setDragId(null)
        return
      }
      const reordered = [...items]
      const [picked] = reordered.splice(fromIdx, 1)
      reordered.splice(toIdx, 0, picked)
      setBundle((prev) => ({ ...prev, gallery: reordered }))
      setDragId(null)
      await persistOrder(reordered, pushToast)
      onChange()
    },
    [dragId, items, onChange, pushToast, setBundle]
  )

  return (
    <SectionShell
      title="Galería"
      subtitle="Hasta 12 fotos del salón, platos, equipo, exterior. Ordenalas como querés."
      counter={`${count} de ${MAX_GALLERY} fotos`}
    >
      {count === 0 ? (
        <Dropzone
          kind="gallery"
          label="Arrastrá hasta 12 fotos. Mostrá lo mejor de tu local."
          onUploaded={onChange}
          pushToast={pushToast}
        />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
            className="gallery-grid"
          >
            {items.map((img, idx) => (
              <GalleryCell
                key={img.id}
                image={img}
                index={idx}
                total={items.length}
                draggingId={dragId}
                onDragStart={() => setDragId(img.id)}
                onDragEnd={() => setDragId(null)}
                onDropTarget={() => onDrop(img.id)}
                onMoveUp={() => move(img.id, -1)}
                onMoveDown={() => move(img.id, 1)}
                onDeleted={onChange}
                onAltSaved={onChange}
                pushToast={pushToast}
              />
            ))}
            {canAdd && <AddPhotoTile onUploaded={onChange} pushToast={pushToast} />}
          </div>
          {/* Responsive grid: 3-col on >=720px */}
          <style>{`
            @media (min-width: 720px) {
              .gallery-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
            }
          `}</style>
        </>
      )}
    </SectionShell>
  )
}

async function persistOrder(items: VenueImage[], pushToast: (tone: 'ok' | 'err', text: string) => void) {
  try {
    const res = await fetch('/api/venue/images/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: items.map((i) => i.id) }),
    })
    if (!res.ok) {
      const msg = await safeMsg(res)
      pushToast('err', msg ?? 'No se pudo reordenar')
    }
  } catch {
    pushToast('err', 'No se pudo reordenar')
  }
}

/* ------------------------------ Section shell ------------------------------ */

function SectionShell({
  title,
  subtitle,
  badge,
  counter,
  children,
}: {
  title: string
  subtitle: string
  badge?: string
  counter?: string
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--ink-line-2)',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            className="font-display"
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: 'var(--ink-text)',
              marginBottom: 4,
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-text-2)' }}>{subtitle}</p>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--wine-bg)',
              color: 'var(--wine-soft)',
              border: '1px solid var(--wine)',
              whiteSpace: 'nowrap',
            }}
          >
            {badge}
          </span>
        )}
        {counter && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--ink-text-3)',
              whiteSpace: 'nowrap',
            }}
          >
            {counter}
          </span>
        )}
      </header>
      {children}
    </section>
  )
}

/* ------------------------------ Image card (logo / cover) ------------------------------ */

function ImageCard({
  image,
  shape,
  thumbSize,
  onReplace,
  onDelete,
  pushToast,
}: {
  image: VenueImage
  shape: 'circle' | 'cover'
  thumbSize?: number
  onReplace: () => void
  onDelete: () => void
  pushToast: (tone: 'ok' | 'err', text: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [alt, setAlt] = useState(image.alt_text ?? '')
  const [savingAlt, setSavingAlt] = useState(false)

  useEffect(() => setAlt(image.alt_text ?? ''), [image.alt_text])

  async function onPick(file: File) {
    if (!validateFile(file, pushToast)) return
    setBusy(true)
    try {
      // Replace = delete + upload
      await fetch(`/api/venue/images/${image.id}`, { method: 'DELETE' })
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', image.kind)
      fd.append('alt_text', alt || image.alt_text || '')
      const res = await fetch('/api/venue/images', { method: 'POST', body: fd })
      if (!res.ok) {
        pushToast('err', (await safeMsg(res)) ?? 'No se pudo reemplazar')
      } else {
        pushToast('ok', 'Imagen reemplazada')
        onReplace()
      }
    } finally {
      setBusy(false)
    }
  }

  async function onDel() {
    if (!confirm('¿Eliminar esta imagen?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/venue/images/${image.id}`, { method: 'DELETE' })
      if (!res.ok) {
        pushToast('err', (await safeMsg(res)) ?? 'No se pudo eliminar')
      } else {
        pushToast('ok', 'Imagen eliminada')
        onDelete()
      }
    } finally {
      setBusy(false)
    }
  }

  async function saveAlt() {
    if (alt === (image.alt_text ?? '')) return
    setSavingAlt(true)
    try {
      const res = await fetch(`/api/venue/images/${image.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt_text: alt }),
      })
      if (!res.ok) {
        pushToast('err', (await safeMsg(res)) ?? 'No se pudo guardar')
      } else {
        pushToast('ok', 'Texto alternativo actualizado')
      }
    } finally {
      setSavingAlt(false)
    }
  }

  const isCircle = shape === 'circle'
  const thumb = thumbSize ?? 96

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          width: isCircle ? thumb : '100%',
          maxWidth: isCircle ? thumb : 480,
          aspectRatio: isCircle ? '1 / 1' : '16 / 9',
          borderRadius: isCircle ? 999 : 12,
          overflow: 'hidden',
          background: 'var(--ink-3)',
          border: '1px solid var(--ink-line-2)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt_text || ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {busy && <SpinnerOverlay />}
      </div>

      <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--ink-text-3)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Texto alternativo (a11y)
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            onBlur={saveAlt}
            placeholder="Ej: Fachada con cartel de neón"
            aria-label="Texto alternativo de la imagen"
            style={{
              marginTop: 6,
              display: 'block',
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--ink)',
              border: '1px solid var(--ink-line)',
              color: 'var(--ink-text)',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'inherit',
              minHeight: 44,
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-wine"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            style={{ minHeight: 44, paddingInline: 16 }}
          >
            <IconUpload />
            <span style={{ marginLeft: 8 }}>Reemplazar</span>
          </button>
          <button
            type="button"
            onClick={onDel}
            disabled={busy}
            aria-label="Eliminar imagen"
            style={{
              minHeight: 44,
              paddingInline: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              background: 'var(--wine-bg)',
              color: 'var(--wine-soft)',
              border: '1px solid var(--wine)',
              cursor: 'pointer',
            }}
          >
            <IconTrash />
            <span>Eliminar</span>
          </button>
          {savingAlt && (
            <span style={{ fontSize: 12, color: 'var(--ink-text-3)', alignSelf: 'center' }}>Guardando…</span>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ALLOWED_MIME.join(',')}
          aria-label="Seleccionar archivo de imagen"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onPick(f)
            e.target.value = ''
          }}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

/* ------------------------------ Gallery cell ------------------------------ */

function GalleryCell({
  image,
  index,
  total,
  draggingId,
  onDragStart,
  onDragEnd,
  onDropTarget,
  onMoveUp,
  onMoveDown,
  onDeleted,
  onAltSaved,
  pushToast,
}: {
  image: VenueImage
  index: number
  total: number
  draggingId: string | null
  onDragStart: () => void
  onDragEnd: () => void
  onDropTarget: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDeleted: () => void
  onAltSaved: () => void
  pushToast: (tone: 'ok' | 'err', text: string) => void
}) {
  const [alt, setAlt] = useState(image.alt_text ?? '')
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)

  useEffect(() => setAlt(image.alt_text ?? ''), [image.alt_text])

  async function saveAlt() {
    if (alt === (image.alt_text ?? '')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/venue/images/${image.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt_text: alt }),
      })
      if (!res.ok) {
        pushToast('err', (await safeMsg(res)) ?? 'No se pudo guardar')
      } else {
        onAltSaved()
      }
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!confirm('¿Eliminar esta foto de la galería?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/venue/images/${image.id}`, { method: 'DELETE' })
      if (!res.ok) {
        pushToast('err', (await safeMsg(res)) ?? 'No se pudo eliminar')
      } else {
        pushToast('ok', 'Foto eliminada')
        onDeleted()
      }
    } finally {
      setBusy(false)
    }
  }

  const dragging = draggingId === image.id

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (!over) setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onDropTarget()
      }}
      style={{
        position: 'relative',
        background: 'var(--ink-3)',
        border: '1px solid',
        borderColor: over ? 'var(--wine)' : 'var(--ink-line-2)',
        borderRadius: 12,
        overflow: 'hidden',
        opacity: dragging ? 0.5 : 1,
        transition: 'border-color 120ms, opacity 120ms',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--ink-4, var(--ink-3))' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt_text || ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {busy && <SpinnerOverlay />}

        {/* Drag handle */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 32,
            height: 32,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(26,27,33,0.85)',
            color: '#fff',
            cursor: 'grab',
          }}
        >
          <IconGrip />
        </span>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Eliminar foto ${index + 1}`}
          disabled={busy}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--wine)',
            color: '#F5E9EB',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <IconTrash />
        </button>
      </div>

      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onBlur={saveAlt}
          placeholder="Texto alternativo"
          aria-label={`Texto alternativo de foto ${index + 1}`}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            background: 'var(--ink)',
            border: '1px solid var(--ink-line)',
            color: 'var(--ink-text)',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'inherit',
            minHeight: 36,
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0 || busy}
            aria-label={`Mover foto ${index + 1} hacia arriba`}
            style={cellMoveBtn(index === 0)}
          >
            <IconArrowUp />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1 || busy}
            aria-label={`Mover foto ${index + 1} hacia abajo`}
            style={cellMoveBtn(index === total - 1)}
          >
            <IconArrowDown />
          </button>
          <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 11, color: 'var(--ink-text-3)' }}>
            #{index + 1}
          </span>
        </div>
      </div>
    </div>
  )
}

function cellMoveBtn(disabled: boolean): React.CSSProperties {
  return {
    flex: '0 0 auto',
    minWidth: 36,
    height: 36,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 8,
    background: 'var(--ink)',
    border: '1px solid var(--ink-line)',
    color: disabled ? 'var(--ink-text-3)' : 'var(--ink-text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }
}

/* ------------------------------ Add tile (gallery) ------------------------------ */

function AddPhotoTile({
  onUploaded,
  pushToast,
}: {
  onUploaded: () => void
  pushToast: (tone: 'ok' | 'err', text: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Agregar foto a la galería"
        style={{
          aspectRatio: '1 / 1',
          background: 'var(--ink-3)',
          border: '2px dashed var(--ink-line-2)',
          borderRadius: 12,
          color: 'var(--ink-text-2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          minHeight: 44,
        }}
      >
        <IconPlus />
        <span>Agregar foto</span>
      </button>
      {open && (
        <UploadModal
          kind="gallery"
          onClose={() => setOpen(false)}
          onUploaded={() => {
            setOpen(false)
            onUploaded()
          }}
          pushToast={pushToast}
        />
      )}
    </>
  )
}

/* ------------------------------ Dropzone ------------------------------ */

function Dropzone({
  kind,
  label,
  onUploaded,
  pushToast,
}: {
  kind: VenueImageKind
  label: string
  onUploaded: () => void
  pushToast: (tone: 'ok' | 'err', text: string) => void
}) {
  const [over, setOver] = useState(false)
  const [pending, setPending] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!validateFile(file, pushToast)) return
    setPending(file)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!over) setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) handleFile(f)
        }}
        aria-label={label}
        style={{
          width: '100%',
          minHeight: 140,
          padding: 24,
          borderRadius: 14,
          background: 'var(--ink-3)',
          border: '2px dashed',
          borderColor: over ? 'var(--wine)' : 'var(--ink-line-2)',
          color: 'var(--ink-text-2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          cursor: 'pointer',
          transition: 'border-color 120ms, background 120ms',
          boxShadow: over ? '0 0 0 4px var(--wine-bg)' : 'none',
        }}
      >
        <IconImage />
        <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', maxWidth: 360 }}>{label}</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept={ALLOWED_MIME.join(',')}
        aria-label={label}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
        style={{ display: 'none' }}
      />
      {pending && (
        <UploadModal
          kind={kind}
          file={pending}
          onClose={() => setPending(null)}
          onUploaded={() => {
            setPending(null)
            onUploaded()
          }}
          pushToast={pushToast}
        />
      )}
    </>
  )
}

/* ------------------------------ Upload modal (alt_text) ------------------------------ */

function UploadModal({
  kind,
  file,
  onClose,
  onUploaded,
  pushToast,
}: {
  kind: VenueImageKind
  file?: File
  onClose: () => void
  onUploaded: () => void
  pushToast: (tone: 'ok' | 'err', text: string) => void
}) {
  const [picked, setPicked] = useState<File | null>(file ?? null)
  const [alt, setAlt] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  const previewUrl = useMemo(() => (picked ? URL.createObjectURL(picked) : null), [picked])
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function submit() {
    if (!picked) return
    if (!validateFile(picked, pushToast)) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', picked)
      fd.append('kind', kind)
      fd.append('alt_text', alt.trim())
      const res = await fetch('/api/venue/images', { method: 'POST', body: fd })
      if (!res.ok) {
        pushToast('err', (await safeMsg(res)) ?? 'No se pudo subir')
        setBusy(false)
        return
      }
      pushToast('ok', 'Foto subida')
      onUploaded()
    } catch {
      pushToast('err', 'No se pudo subir')
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Subir nueva imagen"
      ref={dialogRef}
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(10,11,14,0.78)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--surface-2)',
          border: '1px solid var(--ink-line-2)',
          borderRadius: 16,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-text)' }}>
          Subir imagen
        </h3>

        {!picked ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              width: '100%',
              padding: 28,
              borderRadius: 12,
              background: 'var(--ink-3)',
              border: '2px dashed var(--ink-line-2)',
              color: 'var(--ink-text-2)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Elegí un archivo (JPG/PNG/WebP, max 5MB)
          </button>
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: kind === 'logo' ? '1 / 1' : '16 / 9',
              maxHeight: 240,
              background: 'var(--ink-3)',
              border: '1px solid var(--ink-line-2)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {previewUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MIME.join(',')}
          aria-label="Archivo de imagen"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && validateFile(f, pushToast)) setPicked(f)
            e.target.value = ''
          }}
          style={{ display: 'none' }}
        />

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Texto alternativo (a11y)
          </span>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describí brevemente la imagen"
            aria-label="Texto alternativo"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--ink)',
              border: '1px solid var(--ink-line)',
              color: 'var(--ink-text)',
              fontSize: 13,
              fontFamily: 'inherit',
              minHeight: 44,
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--ink-text-3)' }}>
            Importante para personas con lectores de pantalla.
          </span>
        </label>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn"
            style={{ minHeight: 44, paddingInline: 16 }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!picked || busy}
            className="btn btn-wine"
            style={{ minHeight: 44, paddingInline: 18, opacity: !picked || busy ? 0.6 : 1 }}
          >
            {busy ? 'Subiendo…' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Helpers ------------------------------ */

function validateFile(file: File, pushToast: (tone: 'ok' | 'err', text: string) => void): boolean {
  if (!ALLOWED_MIME.includes(file.type)) {
    pushToast('err', 'Solo JPG, PNG o WebP')
    return false
  }
  if (file.size > MAX_BYTES) {
    pushToast('err', 'Max 5MB')
    return false
  }
  return true
}

async function safeMsg(res: Response): Promise<string | null> {
  try {
    const data = await res.json()
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
      return data.error
    }
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message
    }
  } catch {
    /* noop */
  }
  return null
}

function SpinnerOverlay() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(26,27,33,0.55)',
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.25)',
          borderTopColor: '#fff',
          animation: 'photos-spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes photos-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ------------------------------ Inline icons (no emoji) ------------------------------ */

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function IconGrip() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  )
}

function IconImage() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconArrowUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function IconArrowDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
