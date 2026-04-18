'use client'

import { useState } from 'react'
import type { MenuCategory, MenuItem, MenuItemAvailability } from '@/lib/shared'
import { NumericText } from '@/components/ui/NumericText'
import { PageHero } from '@/components/ui/PageHero'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconPlateCutlery } from '@/components/ui/Icons'
import { pushToast } from '@/lib/toast'

interface Props {
  venueId: string
  initialCategories: MenuCategory[]
  initialItems: MenuItem[]
}

const AVAILABILITY_LABELS: Record<MenuItemAvailability, { label: string; cls: string }> = {
  available:   { label: 'Disponible', cls: 'text-olive bg-olive/18 border border-olive/30' },
  limited:     { label: 'Limitado',   cls: 'text-gold bg-gold/18 border border-gold/35' },
  unavailable: { label: 'Sin stock',  cls: 'text-wine-soft bg-wine/20 border border-wine/35' },
}

type FormMode =
  | { type: 'none' }
  | { type: 'add-item'; categoryId: string }
  | { type: 'edit-item'; item: MenuItem }
  | { type: 'add-category' }

export function MenuManager({ venueId, initialCategories, initialItems }: Props) {
  const [categories, setCategories] = useState(
    // Normalizar sort_order: algunos venues piloto vienen con valores duplicados
    [...initialCategories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  )
  const [items, setItems] = useState(initialItems)
  const [mode, setMode] = useState<FormMode>({ type: 'none' })
  const [saving, setSaving] = useState(false)

  // ── Drag-reorder categorías ────────────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  async function persistReorder(next: MenuCategory[]) {
    const orders = next.map((c, i) => ({ id: c.id, sort_order: i }))
    const res = await fetch('/api/menu/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      pushToast({
        tone: 'error',
        text: body.error ?? 'No se pudo reordenar',
        hint: 'Volvimos al orden anterior.',
      })
      // Rollback visual
      setCategories([...categories])
    } else {
      pushToast({ tone: 'ok', text: 'Orden actualizado' })
    }
  }

  function handleCategoryDrop(fromIdx: number, toIdx: number) {
    setDragIndex(null)
    setOverIndex(null)
    if (fromIdx === toIdx) return

    const copy = [...categories]
    const [moved] = copy.splice(fromIdx, 1)
    copy.splice(toIdx, 0, moved)
    // Optimistic update — normalizamos sort_order localmente
    const normalized = copy.map((c, i) => ({ ...c, sort_order: i }))
    setCategories(normalized)
    persistReorder(normalized)
  }

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formAvail, setFormAvail] = useState<MenuItemAvailability>('available')

  function openAddItem(categoryId: string) {
    setFormName(''); setFormPrice(''); setFormDesc(''); setFormAvail('available')
    setMode({ type: 'add-item', categoryId })
  }

  function openEditItem(item: MenuItem) {
    setFormName(item.name)
    setFormPrice(String(item.price))
    setFormDesc(item.description ?? '')
    setFormAvail(item.availability_status)
    setMode({ type: 'edit-item', item })
  }

  function openAddCategory() {
    setFormName('')
    setMode({ type: 'add-category' })
  }

  async function handleSaveItem() {
    if (!formName.trim() || !formPrice) return
    setSaving(true)
    try {
      if (mode.type === 'add-item') {
        const res = await fetch('/api/menu/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venue_id: venueId,
            category_id: mode.categoryId,
            name: formName.trim(),
            price: Number(formPrice),
            description: formDesc.trim() || null,
            availability_status: formAvail,
          }),
        })
        const item = await res.json() as MenuItem
        setItems(prev => [...prev, item])
      } else if (mode.type === 'edit-item') {
        const res = await fetch(`/api/menu/items/${mode.item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            price: Number(formPrice),
            description: formDesc.trim() || null,
            availability_status: formAvail,
          }),
        })
        const updated = await res.json() as MenuItem
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
      }
      setMode({ type: 'none' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveCategory() {
    if (!formName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: venueId,
          name: formName.trim(),
          sort_order: categories.length + 1,
        }),
      })
      const cat = await res.json() as MenuCategory
      setCategories(prev => [...prev, cat])
      setMode({ type: 'none' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(itemId: string) {
    await fetch(`/api/menu/items/${itemId}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  async function handleToggleAvailability(item: MenuItem) {
    const next: MenuItemAvailability = item.availability_status === 'available'
      ? 'unavailable'
      : 'available'
    const res = await fetch(`/api/menu/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability_status: next }),
    })
    const updated = await res.json() as MenuItem
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  const itemsByCategory = (catId: string) => items.filter(i => i.category_id === catId)

  return (
    <div className="min-h-screen bg-ink pb-28">
      <PageHero
        kicker="Carta"
        title="Menú"
        subtitle={`${items.length} plato${items.length !== 1 ? 's' : ''} en ${categories.length} categoría${categories.length !== 1 ? 's' : ''}`}
        accent="olive"
        actions={
          <button
            onClick={openAddCategory}
            className="h-9 px-3.5 rounded-lg bg-ink-2 border border-ink-line-2
                       text-ink-text text-[13px] font-semibold
                       hover:bg-ink-3 active:scale-[0.97] transition-all duration-150"
          >
            + Categoría
          </button>
        }
      />

      <div className="px-5 lg:px-7 space-y-8 max-w-3xl mx-auto mt-6">
        {categories.map((cat, idx) => (
          <section
            key={cat.id}
            draggable
            onDragStart={(e) => {
              setDragIndex(idx)
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/category-id', cat.id)
              // Ghost mínimo — el propio section ya hace de preview
              const img = new Image()
              img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
              e.dataTransfer.setDragImage(img, 0, 0)
            }}
            onDragOver={(e) => {
              if (dragIndex === null) return
              e.preventDefault()
              setOverIndex(idx)
            }}
            onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIndex === null) return
              handleCategoryDrop(dragIndex, idx)
            }}
            className={`transition-all duration-150
                        ${dragIndex === idx ? 'opacity-45' : ''}
                        ${overIndex === idx && dragIndex !== null && dragIndex !== idx
                          ? 'scale-[1.01]'
                          : ''}`}
          >
            {/* Línea drop-target: se ilumina arriba de la categoría donde se soltaría */}
            {overIndex === idx && dragIndex !== null && dragIndex !== idx && (
              <div className="h-0.5 bg-wine-soft rounded-full mb-2
                              shadow-[0_0_12px_rgba(195,104,120,0.7)]" />
            )}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Drag handle — cursor grab cuando se hover */}
                <span
                  aria-hidden
                  className="text-ink-text-3 cursor-grab active:cursor-grabbing
                             hover:text-ink-text-2 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                  </svg>
                </span>
                <NumericText label tone="muted">{cat.name}</NumericText>
              </div>
              <button
                onClick={() => openAddItem(cat.id)}
                className="text-[12px] text-olive font-semibold
                           hover:brightness-110 active:scale-95 transition-transform"
              >
                + Agregar
              </button>
            </div>

            <div className="space-y-2">
              {itemsByCategory(cat.id).length === 0 && (
                <p className="text-ink-text-3 text-[12.5px] italic pl-1">Sin platos aún</p>
              )}
              {itemsByCategory(cat.id).map(item => {
                const av = AVAILABILITY_LABELS[item.availability_status]
                return (
                  <div key={item.id}
                    className="bg-ink-2 border border-ink-line rounded-2xl p-4
                               flex items-start gap-3
                               hover:border-ink-line-2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-ink-text font-semibold text-[14px]">{item.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${av.cls}`}>
                          {av.label}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-ink-text-3 text-[12px] mt-0.5 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <NumericText className="text-gold font-bold text-[15px] mt-1.5 block">
                        ${item.price.toLocaleString('es-AR')}
                      </NumericText>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => openEditItem(item)}
                        className="px-3 py-1.5 rounded-lg bg-ink-3 text-ink-text-2
                                   text-[11px] font-semibold
                                   hover:text-ink-text active:scale-95 transition-all"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold
                                    active:scale-95 transition-all
                                    ${item.availability_status === 'available'
                                      ? 'bg-wine/20 text-wine-soft hover:bg-wine/30'
                                      : 'bg-olive/22 text-olive hover:bg-olive/30'
                                    }`}
                      >
                        {item.availability_status === 'available' ? 'Pausar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {categories.length === 0 && (
          <EmptyState
            accent="sage"
            icon={<IconPlateCutlery size={28} />}
            title="Todavía no hay platos"
            description="Empezá por una categoría. Después cargás los platos con precio y disponibilidad."
            action={{ label: 'Crear primera categoría', onClick: openAddCategory }}
          />
        )}
      </div>

      {/* Bottom sheet — agregar/editar item */}
      {(mode.type === 'add-item' || mode.type === 'edit-item') && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setMode({ type: 'none' }) }}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setMode({ type: 'none' })} />
          <div
            className="relative rounded-t-3xl p-6 space-y-4 bg-ink-2 border-t border-ink-line-2
                       animate-[slideUp_0.28s_cubic-bezier(0.34,1.2,0.64,1)]"
            style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
          >
            <div className="w-10 h-1 rounded-full bg-ink-line-2 mx-auto -mt-1" />
            <h2 className="font-display text-ink-text font-bold text-[19px]">
              {mode.type === 'add-item' ? 'Nuevo plato' : 'Editar plato'}
            </h2>

            <div className="space-y-3">
              <FormField label="Nombre">
                <TextInput
                  value={formName}
                  onChange={setFormName}
                  placeholder="Ej: Bife de chorizo"
                />
              </FormField>

              <FormField label="Precio ($)">
                <TextInput
                  type="number"
                  value={formPrice}
                  onChange={setFormPrice}
                  placeholder="0"
                />
              </FormField>

              <FormField label="Descripción (opcional)">
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Ingredientes, preparación…"
                  rows={2}
                  className="w-full rounded-xl bg-ink border border-ink-line-2 px-4 py-3
                             text-[14px] text-ink-text placeholder-ink-text-3 outline-none
                             focus:border-olive/50 transition-all resize-none"
                />
              </FormField>

              <FormField label="Disponibilidad">
                <div className="flex gap-2">
                  {(['available', 'limited', 'unavailable'] as MenuItemAvailability[]).map(av => (
                    <button
                      key={av}
                      onClick={() => setFormAvail(av)}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all
                                  border
                                  ${formAvail === av
                                    ? 'bg-olive text-white border-olive'
                                    : 'bg-ink text-ink-text-2 border-ink-line-2 hover:border-ink-line-2/80'
                                  }`}
                    >
                      {AVAILABILITY_LABELS[av].label}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>

            <div className="flex gap-3 pt-1">
              {mode.type === 'edit-item' && (
                <button
                  onClick={() => { handleDelete(mode.item.id); setMode({ type: 'none' }) }}
                  className="px-4 py-3.5 rounded-xl bg-wine/20 text-wine-soft border border-wine/35
                             font-bold text-[13px]
                             hover:bg-wine/30 active:scale-95 transition-all"
                >
                  Eliminar
                </button>
              )}
              <button
                onClick={handleSaveItem}
                disabled={saving || !formName.trim() || !formPrice}
                className="flex-1 py-3.5 rounded-xl bg-olive text-white font-bold text-[15px]
                           disabled:opacity-50
                           hover:brightness-110 active:scale-[0.97] transition-all duration-150"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom sheet — agregar categoría */}
      {mode.type === 'add-category' && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setMode({ type: 'none' }) }}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setMode({ type: 'none' })} />
          <div
            className="relative rounded-t-3xl p-6 space-y-4 bg-ink-2 border-t border-ink-line-2
                       animate-[slideUp_0.28s_cubic-bezier(0.34,1.2,0.64,1)]"
            style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
          >
            <div className="w-10 h-1 rounded-full bg-ink-line-2 mx-auto -mt-1" />
            <h2 className="font-display text-ink-text font-bold text-[19px]">Nueva categoría</h2>
            <TextInput
              value={formName}
              onChange={setFormName}
              placeholder="Ej: Ensaladas"
              autoFocus
            />
            <button
              onClick={handleSaveCategory}
              disabled={saving || !formName.trim()}
              className="w-full py-3.5 rounded-xl bg-olive text-white font-bold text-[15px]
                         disabled:opacity-50
                         hover:brightness-110 active:scale-[0.97] transition-all duration-150"
            >
              {saving ? 'Guardando…' : 'Crear categoría'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-ink-text-3 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoFocus?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full rounded-xl bg-ink border border-ink-line-2 px-4 py-3
                 text-[14px] text-ink-text placeholder-ink-text-3 outline-none
                 focus:border-olive/50 transition-all"
    />
  )
}
