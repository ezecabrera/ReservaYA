'use client'

import { useState } from 'react'
import type { MenuCategory, MenuItem, MenuItemAvailability } from '@/lib/shared'
import { PageHeader } from '@/components/ui/PageHeader'

interface Props {
  venueId: string
  initialCategories: MenuCategory[]
  initialItems: MenuItem[]
}

type FormMode =
  | { type: 'none' }
  | { type: 'add-item'; categoryId: string }
  | { type: 'edit-item'; item: MenuItem }
  | { type: 'add-category' }

const AVAILABILITY_LABELS: Record<MenuItemAvailability, { label: string; cls: string }> = {
  available:   { label: 'Disponible', cls: 'bg-c2l text-[#15A67A] border-[#15A67A]/20' },
  limited:     { label: 'Limitado',   cls: 'bg-c3l text-[#CC7700] border-[#CC7700]/20' },
  unavailable: { label: 'Sin stock',  cls: 'bg-c1l text-[#D63646] border-[#D63646]/20' },
}

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

export function MenuManager({ venueId, initialCategories, initialItems }: Props) {
  const isPreview = venueId === 'preview'
  const [categories, setCategories] = useState(initialCategories)
  const [items, setItems] = useState(initialItems)
  const [mode, setMode] = useState<FormMode>({ type: 'none' })
  const [saving, setSaving] = useState(false)

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
    if (isPreview) { setMode({ type: 'none' }); return }
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
    if (isPreview) { setMode({ type: 'none' }); return }
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
    if (!isPreview) await fetch(`/api/menu/items/${itemId}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  async function handleToggleAvailability(item: MenuItem) {
    const next: MenuItemAvailability = item.availability_status === 'available'
      ? 'unavailable'
      : 'available'
    if (isPreview) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, availability_status: next } : i))
      return
    }
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
    <div className="min-h-screen bg-sf pb-20">
      <PageHeader
        title="Menú"
        subtitle={`${items.length} plato${items.length !== 1 ? 's' : ''} en ${categories.length} categoría${categories.length !== 1 ? 's' : ''}`}
        venueName={isPreview ? 'La Cantina de Martín' : undefined}
        right={
          <button onClick={openAddCategory} className={btnGhost}>
            + Categoría
          </button>
        }
      />

      {/* Lista */}
      <main className="max-w-3xl mx-auto px-5 pt-6 space-y-6">
        {categories.map(cat => (
          <section key={cat.id}>
            <div className="flex items-baseline justify-between mb-3">
              <p className="font-sans-black text-[20px] text-tx leading-none">{cat.name}</p>
              <button
                onClick={() => openAddItem(cat.id)}
                className="text-[12px] text-[#0F3460] font-semibold hover:underline"
              >
                + Agregar plato
              </button>
            </div>

            <div className="space-y-2">
              {itemsByCategory(cat.id).length === 0 && (
                <p className="text-tx3 text-[13px] italic">Sin platos aún</p>
              )}
              {itemsByCategory(cat.id).map(item => {
                const av = AVAILABILITY_LABELS[item.availability_status]
                const isPaused = item.availability_status === 'unavailable'
                return (
                  <div
                    key={item.id}
                    className={`rounded-md border p-4 flex items-start gap-3
                                ${isPaused
                                  ? 'bg-sf border-[rgba(0,0,0,0.06)] opacity-70'
                                  : 'bg-white border-[rgba(0,0,0,0.07)]'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-tx font-semibold text-[14px]">{item.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${av.cls}`}>
                          {av.label}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-tx2 text-[12px] mt-1 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-tx font-sans-black text-[17px] mt-1.5 tabular-nums">
                        ${item.price.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => openEditItem(item)} className={btnGhost}>
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-3 py-2 rounded-md border text-[12px] font-semibold transition-colors duration-[160ms]
                                    ${item.availability_status === 'available'
                                      ? 'bg-white border-[rgba(0,0,0,0.1)] text-tx2 hover:border-[#D63646]/30 hover:text-[#D63646]'
                                      : 'bg-white border-[#15A67A]/30 text-[#15A67A] hover:bg-c2l'
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
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                  stroke="#ABABBA" strokeWidth="2" strokeLinecap="round" />
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="#ABABBA" strokeWidth="2" />
              </svg>
            </div>
            <p className="font-display text-[18px] text-tx">No hay categorías</p>
            <p className="text-tx2 text-[13px] mt-1">Creá tu primera categoría para empezar.</p>
            <button
              onClick={openAddCategory}
              className="mt-4 text-[#0F3460] font-semibold text-[14px] hover:underline"
            >
              Crear primera categoría →
            </button>
          </div>
        )}
      </main>

      {/* Sheet — editar item */}
      {(mode.type === 'add-item' || mode.type === 'edit-item') && (
        <Sheet onClose={() => setMode({ type: 'none' })}>
          <h2 className="font-sans-black text-[20px] text-tx leading-none">
            {mode.type === 'add-item' ? 'Nuevo plato' : 'Editar plato'}
          </h2>

          <FormField label="Nombre">
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Ej: Bife de chorizo"
              className={inputCls}
              autoFocus
            />
          </FormField>

          <FormField label="Precio ($)">
            <input
              type="number"
              value={formPrice}
              onChange={e => setFormPrice(e.target.value)}
              placeholder="0"
              className={`${inputCls} font-mono tabular-nums`}
            />
          </FormField>

          <FormField label="Descripción (opcional)">
            <textarea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="Ingredientes, preparación…"
              rows={2}
              className={`${inputCls} resize-none leading-relaxed`}
            />
          </FormField>

          <FormField label="Disponibilidad">
            <div className="flex gap-2">
              {(['available', 'limited', 'unavailable'] as MenuItemAvailability[]).map(av => (
                <button
                  key={av}
                  onClick={() => setFormAvail(av)}
                  className={`flex-1 py-2.5 rounded-md text-[12px] font-semibold border transition-colors duration-[160ms]
                              ${formAvail === av
                                ? 'bg-[#0F3460] border-[#0F3460] text-white'
                                : 'bg-white border-[rgba(0,0,0,0.1)] text-tx2 hover:border-[#0F3460]/40 hover:text-tx'
                              }`}
                >
                  {AVAILABILITY_LABELS[av].label}
                </button>
              ))}
            </div>
          </FormField>

          <div className="flex gap-2 pt-1">
            {mode.type === 'edit-item' && (
              <button
                onClick={() => { handleDelete(mode.item.id); setMode({ type: 'none' }) }}
                className="px-4 py-3 rounded-md bg-c1l border border-[#D63646]/20 text-[#D63646] font-semibold text-[13px]
                           hover:bg-[#D63646]/10 transition-colors duration-[160ms]"
              >
                Eliminar
              </button>
            )}
            <button
              onClick={handleSaveItem}
              disabled={saving || !formName.trim() || !formPrice}
              className={btnPrimary}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </Sheet>
      )}

      {/* Sheet — nueva categoría */}
      {mode.type === 'add-category' && (
        <Sheet onClose={() => setMode({ type: 'none' })}>
          <h2 className="font-sans-black text-[20px] text-tx leading-none">Nueva categoría</h2>

          <FormField label="Nombre">
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Ej: Ensaladas"
              className={inputCls}
              autoFocus
            />
          </FormField>

          <button
            onClick={handleSaveCategory}
            disabled={saving || !formName.trim()}
            className={btnPrimary}
          >
            {saving ? 'Guardando…' : 'Crear categoría'}
          </button>
        </Sheet>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function FormField({
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
