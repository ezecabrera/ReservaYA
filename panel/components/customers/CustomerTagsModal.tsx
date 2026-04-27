'use client'

/**
 * UnToque · CustomerTagsModal
 * Modal/sheet para gestionar tags por cliente.
 * Layout: BottomSheet del design-system. Tabs por kind, optimistic update.
 *
 * UX:
 *  - allergy / dietary / celebration → chips pre-cargados toggleables
 *  - restriction / preference / note → free text (input + Agregar)
 *  - vip → toggle simple on/off (value='true')
 *  - lista de actuales con pencil edit + trash delete
 */

import { useEffect, useMemo, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import {
  CheckIcon,
  EditIcon,
  PlusIcon,
  TagKindIcon,
  Trash2Icon,
  XIcon,
  TAG_KIND_COLOR,
  TAG_KIND_LABEL,
} from './tag-icons'
import {
  COMMON_ALLERGIES,
  COMMON_CELEBRATIONS,
  COMMON_DIETARY,
  type CustomerTag,
  type CustomerTagKind,
} from '@/lib/shared/types/customer-tag'

const KIND_TABS: CustomerTagKind[] = [
  'allergy',
  'restriction',
  'dietary',
  'vip',
  'celebration',
  'preference',
  'note',
]

interface Props {
  phone: string
  existingTags: CustomerTag[]
  initialKind?: CustomerTagKind
  open: boolean
  onClose: () => void
  /** Recibe la lista actualizada para que el sheet padre re-pinte sin re-fetch. */
  onSaved: (tags: CustomerTag[]) => void
}

interface Toast {
  id: number
  message: string
  variant: 'ok' | 'err'
}

export function CustomerTagsModal({
  phone,
  existingTags,
  initialKind,
  open,
  onClose,
  onSaved,
}: Props) {
  const [tags, setTags] = useState<CustomerTag[]>(existingTags)
  const [activeKind, setActiveKind] = useState<CustomerTagKind>(
    initialKind ?? 'allergy',
  )
  const [freeInput, setFreeInput] = useState('')
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(
    null,
  )
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pendingId, setPendingId] = useState<string | null>(null)

  // Sync con parent al abrir
  useEffect(() => {
    if (open) {
      setTags(existingTags)
      setActiveKind(initialKind ?? 'allergy')
      setFreeInput('')
      setEditing(null)
    }
  }, [open, existingTags, initialKind])

  const toast = (message: string, variant: Toast['variant'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
  }

  const tagsForKind = useMemo(
    () => tags.filter((t) => t.kind === activeKind),
    [tags, activeKind],
  )

  const commit = (next: CustomerTag[]) => {
    setTags(next)
    onSaved(next)
  }

  /* ── API calls (optimistic) ────────────────────────────── */

  const createTag = async (kind: CustomerTagKind, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (
      tags.some(
        (t) =>
          t.kind === kind &&
          t.value.toLocaleLowerCase('es-AR') ===
            trimmed.toLocaleLowerCase('es-AR'),
      )
    ) {
      toast('Ya existe ese tag', 'err')
      return
    }

    const tempId = `temp-${Date.now()}`
    const optimistic: CustomerTag = {
      id: tempId,
      venue_id: '',
      customer_phone: phone,
      kind,
      value: trimmed,
      notes: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const prev = tags
    commit([...tags, optimistic])

    try {
      const res = await fetch(
        `/api/customers/${encodeURIComponent(phone)}/tags`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            customer_phone: phone,
            kind,
            value: trimmed,
            notes: null,
          }),
        },
      )
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? 'No se pudo crear')
      }
      const created = (await res.json()) as CustomerTag
      commit([...prev, created])
      toast('Agregado')
    } catch (e) {
      commit(prev)
      toast(e instanceof Error ? e.message : 'Error', 'err')
    }
  }

  const deleteTag = async (id: string) => {
    const prev = tags
    setPendingId(id)
    commit(tags.filter((t) => t.id !== id))
    try {
      const res = await fetch(
        `/api/customers/${encodeURIComponent(phone)}/tags/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      )
      if (!res.ok) throw new Error('No se pudo borrar')
      toast('Borrado')
    } catch (e) {
      commit(prev)
      toast(e instanceof Error ? e.message : 'Error', 'err')
    } finally {
      setPendingId(null)
    }
  }

  const updateTag = async (id: string, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const prev = tags
    commit(tags.map((t) => (t.id === id ? { ...t, value: trimmed } : t)))
    setEditing(null)
    try {
      const res = await fetch(
        `/api/customers/${encodeURIComponent(phone)}/tags/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ value: trimmed }),
        },
      )
      if (!res.ok) throw new Error('No se pudo actualizar')
      const updated = (await res.json()) as CustomerTag
      commit(prev.map((t) => (t.id === id ? updated : t)))
      toast('Actualizado')
    } catch (e) {
      commit(prev)
      toast(e instanceof Error ? e.message : 'Error', 'err')
    }
  }

  /* ── Handlers UI ───────────────────────────────────────── */

  const togglePreset = (kind: CustomerTagKind, value: string) => {
    const existing = tags.find(
      (t) =>
        t.kind === kind &&
        t.value.toLocaleLowerCase('es-AR') ===
          value.toLocaleLowerCase('es-AR'),
    )
    if (existing) deleteTag(existing.id)
    else createTag(kind, value)
  }

  const onAddFree = () => {
    if (!freeInput.trim()) return
    createTag(activeKind, freeInput)
    setFreeInput('')
  }

  const isVipOn = useMemo(
    () => tags.some((t) => t.kind === 'vip'),
    [tags],
  )

  const toggleVip = () => {
    if (isVipOn) {
      const vipTag = tags.find((t) => t.kind === 'vip')
      if (vipTag) deleteTag(vipTag.id)
    } else {
      createTag('vip', 'true')
    }
  }

  /* ── Render ────────────────────────────────────────────── */

  if (!open) return null

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Información del cliente"
      subtitle={phone}
      maxWidth="md"
    >
      {/* Tabs scroll-x */}
      <div
        role="tablist"
        aria-label="Tipo de información"
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 16,
          scrollbarWidth: 'thin',
        }}
      >
        {KIND_TABS.map((k) => {
          const active = activeKind === k
          const count = tags.filter((t) => t.kind === k).length
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveKind(k)
                setFreeInput('')
                setEditing(null)
              }}
              style={{
                flexShrink: 0,
                height: 36,
                padding: '0 14px',
                borderRadius: 99,
                border: `1px solid ${active ? 'var(--text)' : 'var(--line)'}`,
                background: active ? 'var(--text)' : 'var(--surface-2)',
                color: active ? '#1A1B1F' : 'var(--text-2)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <TagKindIcon kind={k} size={13} />
              {TAG_KIND_LABEL[k]}
              {count > 0 && (
                <span
                  className="ff-mono"
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    background: active ? 'rgba(0,0,0,0.12)' : 'var(--bg-2)',
                    borderRadius: 99,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="caps">{TAG_KIND_LABEL[activeKind]}</div>

        {/* Chips presets para allergy / dietary / celebration */}
        {activeKind === 'allergy' && (
          <PresetChips
            options={COMMON_ALLERGIES}
            kind="allergy"
            tags={tags}
            onToggle={togglePreset}
          />
        )}
        {activeKind === 'dietary' && (
          <PresetChips
            options={COMMON_DIETARY}
            kind="dietary"
            tags={tags}
            onToggle={togglePreset}
          />
        )}
        {activeKind === 'celebration' && (
          <PresetChips
            options={COMMON_CELEBRATIONS}
            kind="celebration"
            tags={tags}
            onToggle={togglePreset}
          />
        )}

        {/* VIP toggle */}
        {activeKind === 'vip' && (
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}
              >
                Cliente VIP
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Atención especial · resaltado en lista
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isVipOn}
              onClick={toggleVip}
              style={{
                width: 52,
                height: 30,
                borderRadius: 99,
                border: 'none',
                cursor: 'pointer',
                background: isVipOn ? 'var(--p-butter)' : 'var(--surface-2)',
                position: 'relative',
                transition: 'background 0.15s',
              }}
              aria-label={isVipOn ? 'Quitar VIP' : 'Marcar como VIP'}
            >
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 3,
                  left: isVipOn ? 25 : 3,
                  width: 24,
                  height: 24,
                  borderRadius: 99,
                  background: '#1A1B1F',
                  transition: 'left 0.15s',
                }}
              />
            </button>
          </div>
        )}

        {/* Free input para restriction / preference / note (y celebration extra) */}
        {(activeKind === 'restriction' ||
          activeKind === 'preference' ||
          activeKind === 'note' ||
          activeKind === 'celebration') && (
          <div>
            <label
              className="caps"
              style={{
                display: 'block',
                marginBottom: 6,
                color: 'var(--text-3)',
              }}
            >
              {activeKind === 'celebration'
                ? 'Otra ocasión'
                : 'Agregar texto libre'}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={freeInput}
                onChange={(e) => setFreeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onAddFree()
                  }
                }}
                placeholder={
                  activeKind === 'restriction'
                    ? 'Ej: no come picante'
                    : activeKind === 'preference'
                      ? 'Ej: vino malbec, mesa cerca de ventana'
                      : activeKind === 'note'
                        ? 'Ej: amigo del dueño'
                        : 'Ej: graduación'
                }
                style={{
                  flex: 1,
                  height: 44,
                  padding: '0 14px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r-sm)',
                  color: 'var(--text)',
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                onClick={onAddFree}
                disabled={!freeInput.trim()}
                aria-label="Agregar"
                style={{
                  height: 44,
                  padding: '0 16px',
                  background: 'var(--wine)',
                  border: 'none',
                  borderRadius: 'var(--r-sm)',
                  color: '#F5E9EB',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: freeInput.trim() ? 'pointer' : 'not-allowed',
                  opacity: freeInput.trim() ? 1 : 0.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <PlusIcon size={14} />
                Agregar
              </button>
            </div>
          </div>
        )}

        {/* Lista de tags actuales para este kind */}
        {tagsForKind.length > 0 && activeKind !== 'vip' && (
          <div>
            <div
              className="caps"
              style={{ marginBottom: 8, color: 'var(--text-3)' }}
            >
              Actuales · {tagsForKind.length}
            </div>
            <ul
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                margin: 0,
                padding: 0,
                listStyle: 'none',
              }}
            >
              {tagsForKind.map((t) => {
                const isEditing = editing?.id === t.id
                const isPending = pendingId === t.id
                return (
                  <li
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: 'var(--bg-2)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--r-sm)',
                      opacity: isPending ? 0.5 : 1,
                    }}
                  >
                    <span
                      style={{
                        color: TAG_KIND_COLOR[t.kind],
                        display: 'inline-flex',
                      }}
                    >
                      <TagKindIcon kind={t.kind} size={14} filled={t.kind === 'vip'} />
                    </span>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editing.value}
                          autoFocus
                          onChange={(e) =>
                            setEditing({ id: t.id, value: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateTag(t.id, editing.value)
                            if (e.key === 'Escape') setEditing(null)
                          }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            height: 32,
                            padding: '0 10px',
                            background: 'var(--surface-2)',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--r-sm)',
                            color: 'var(--text)',
                            fontSize: 13,
                          }}
                        />
                        <IconBtn
                          onClick={() => updateTag(t.id, editing.value)}
                          aria-label="Guardar"
                        >
                          <CheckIcon size={14} />
                        </IconBtn>
                        <IconBtn
                          onClick={() => setEditing(null)}
                          aria-label="Cancelar edición"
                        >
                          <XIcon size={14} />
                        </IconBtn>
                      </>
                    ) : (
                      <>
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: 13,
                            color: 'var(--text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t.value}
                        </span>
                        <IconBtn
                          onClick={() =>
                            setEditing({ id: t.id, value: t.value })
                          }
                          aria-label={`Editar ${t.value}`}
                        >
                          <EditIcon size={14} />
                        </IconBtn>
                        <IconBtn
                          onClick={() => deleteTag(t.id)}
                          aria-label={`Borrar ${t.value}`}
                          danger
                        >
                          <Trash2Icon size={14} />
                        </IconBtn>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {tagsForKind.length === 0 && activeKind !== 'vip' && (
          <div
            style={{
              padding: '20px 14px',
              background: 'var(--bg-2)',
              border: '1px dashed var(--line)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--text-3)',
              fontSize: 12,
              textAlign: 'center',
            }}
          >
            Todavía no hay {TAG_KIND_LABEL[activeKind].toLowerCase()} cargadas.
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 22,
          paddingTop: 14,
          borderTop: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            height: 44,
            padding: '0 18px',
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>

      {/* Toasts */}
      {toasts.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                padding: '10px 14px',
                background:
                  t.variant === 'ok' ? 'var(--p-mint)' : 'var(--wine)',
                color: t.variant === 'ok' ? '#1A1B1F' : '#F5E9EB',
                borderRadius: 'var(--r-sm)',
                fontSize: 12,
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function PresetChips({
  options,
  kind,
  tags,
  onToggle,
}: {
  options: readonly string[]
  kind: CustomerTagKind
  tags: CustomerTag[]
  onToggle: (kind: CustomerTagKind, value: string) => void
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-2)',
          marginBottom: 8,
        }}
      >
        Tocá para marcar las que tenga el cliente:
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((value) => {
          const active = tags.some(
            (t) =>
              t.kind === kind &&
              t.value.toLocaleLowerCase('es-AR') ===
                value.toLocaleLowerCase('es-AR'),
          )
          return (
            <button
              key={value}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => onToggle(kind, value)}
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 99,
                border: active
                  ? '1px solid transparent'
                  : '1px solid var(--line)',
                background: active ? TAG_KIND_COLOR[kind] : 'var(--surface-2)',
                color: active ? '#1A1B1F' : 'var(--text-2)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {active && <CheckIcon size={12} />}
              {value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function IconBtn({
  children,
  danger,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      style={{
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: 99,
        border: '1px solid var(--line)',
        background: 'var(--surface-2)',
        color: danger ? 'var(--wine-soft)' : 'var(--text-2)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}
