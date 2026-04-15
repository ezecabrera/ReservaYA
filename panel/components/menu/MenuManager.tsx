'use client'

import { useState } from 'react'
import type { MenuCategory, MenuItem, MenuItemAvailability } from '@/lib/shared'

interface Props {
  venueId: string
  initialCategories: MenuCategory[]
  initialItems: MenuItem[]
}

const AVAILABILITY_LABELS: Record<MenuItemAvailability, { label: string; color: string }> = {
  available:   { label: 'Disponible', color: 'text-[#15A67A] bg-c2l' },
  limited:     { label: 'Limitado',   color: 'text-[#CC7700] bg-c3l' },
  unavailable: { label: 'Sin stock',  color: 'text-[#D63646] bg-c1l' },
}

type FormMode = { type: 'none' } | { type: 'add-item'; categoryId: string } | { type: 'edit-item'; item: MenuItem } | { type: 'add-category' }

export function MenuManager({ venueId, initialCategories, initialItems }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [items, setItems] = useState(initialItems)
  const [mode, setMode] = useState<FormMode>({ type: 'none' })
  const [saving, setSaving] = useState(false)

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
    <div className="min-h-screen pb-28"
      style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[24px] font-bold text-white tracking-tight">Menú</h1>
          <p className="text-white/55 text-[13px] mt-0.5">
            {items.length} platos en {categories.length} categorías
          </p>
        </div>
        <button
          onClick={openAddCategory}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/15
                     text-white text-[13px] font-semibold active:scale-95 transition-transform"
        >
          + Categoría
        </button>
      </div>

      {/* Lista por categorías */}
      <div className="px-5 space-y-6">
        {categories.map(cat => (
          <div key={cat.id}>
            {/* Cabecera de categoría */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
                {cat.name}
              </p>
              <button
                onClick={() => openAddItem(cat.id)}
                className="text-[12px] text-c2 font-semibold active:scale-95 transition-transform"
              >
                + Agregar
              </button>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {itemsByCategory(cat.id).length === 0 && (
                <p className="text-white/25 text-[13px] italic pl-1">Sin platos aún</p>
              )}
              {itemsByCategory(cat.id).map(item => {
                const av = AVAILABILITY_LABELS[item.availability_status]
                return (
                  <div key={item.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4
                               flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-[14px]">{item.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${av.color}`}>
                          {av.label}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-white/40 text-[12px] mt-0.5 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-c2 font-bold text-[15px] mt-1.5">
                        ${item.price.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => openEditItem(item)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70
                                   text-[11px] font-semibold active:scale-95 transition-transform"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold
                                    active:scale-95 transition-transform
                                    ${item.availability_status === 'available'
                                      ? 'bg-c1/20 text-c1'
                                      : 'bg-c2/20 text-c2'
                                    }`}
                      >
                        {item.availability_status === 'available' ? 'Pausar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/30 text-[15px]">No hay categorías aún.</p>
            <button onClick={openAddCategory}
              className="mt-3 text-c2 font-semibold text-[14px]">
              Crear primera categoría →
            </button>
          </div>
        )}
      </div>

      {/* Bottom sheet — agregar/editar item */}
      {(mode.type === 'add-item' || mode.type === 'edit-item') && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMode({ type: 'none' })} />
          <div className="relative rounded-t-3xl p-6 space-y-4"
            style={{ background: '#1E2240' }}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-2" />
            <h2 className="text-white font-bold text-[17px]">
              {mode.type === 'add-item' ? 'Nuevo plato' : 'Editar plato'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
                  Nombre
                </label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: Bife de chorizo"
                  className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3
                             text-[14px] text-white placeholder-white/30 outline-none
                             focus:border-c2/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
                  Precio ($)
                </label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={e => setFormPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3
                             text-[14px] text-white placeholder-white/30 outline-none
                             focus:border-c2/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Ingredientes, preparación…"
                  rows={2}
                  className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3
                             text-[14px] text-white placeholder-white/30 outline-none
                             focus:border-c2/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
                  Disponibilidad
                </label>
                <div className="flex gap-2">
                  {(['available', 'limited', 'unavailable'] as MenuItemAvailability[]).map(av => (
                    <button
                      key={av}
                      onClick={() => setFormAvail(av)}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all
                                  ${formAvail === av
                                    ? 'bg-c2 text-white'
                                    : 'bg-white/10 text-white/50'
                                  }`}
                    >
                      {AVAILABILITY_LABELS[av].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              {mode.type === 'edit-item' && (
                <button
                  onClick={() => { handleDelete(mode.item.id); setMode({ type: 'none' }) }}
                  className="px-4 py-3.5 rounded-xl bg-c1/20 text-c1 font-bold text-[14px]
                             active:scale-95 transition-transform"
                >
                  Eliminar
                </button>
              )}
              <button
                onClick={handleSaveItem}
                disabled={saving || !formName.trim() || !formPrice}
                className="flex-1 py-3.5 rounded-xl bg-c2 text-white font-bold text-[15px]
                           disabled:opacity-50 active:scale-[0.97] transition-transform"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom sheet — agregar categoría */}
      {mode.type === 'add-category' && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMode({ type: 'none' })} />
          <div className="relative rounded-t-3xl p-6 space-y-4"
            style={{ background: '#1E2240' }}>
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-2" />
            <h2 className="text-white font-bold text-[17px]">Nueva categoría</h2>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Ej: Ensaladas"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3
                         text-[14px] text-white placeholder-white/30 outline-none
                         focus:border-c2/50 transition-all"
              autoFocus
            />
            <button
              onClick={handleSaveCategory}
              disabled={saving || !formName.trim()}
              className="w-full py-3.5 rounded-xl bg-c2 text-white font-bold text-[15px]
                         disabled:opacity-50 active:scale-[0.97] transition-transform"
            >
              {saving ? 'Guardando…' : 'Crear categoría'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
