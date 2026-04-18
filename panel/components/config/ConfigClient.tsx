'use client'

import { useEffect, useState } from 'react'
import { EmbedWidgetSection } from './EmbedWidgetSection'
import { WhatsAppSection } from './WhatsAppSection'
import { PageHero } from '@/components/ui/PageHero'
import { NumericText } from '@/components/ui/NumericText'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  created_at?: string
}

interface Props {
  me: { id: string; name: string; email: string; role: string }
  venue: { id: string; name: string; address: string; phone: string | null }
  appBaseUrl: string
}

const ROLE_LABELS: Record<string, { label: string; desc: string; cls: string }> = {
  owner:        { label: 'Owner',         desc: 'Acceso completo + gestión de staff',   cls: 'bg-wine/20 text-wine-soft border border-wine/35' },
  manager:      { label: 'Manager',       desc: 'Analytics, menú y operaciones',         cls: 'bg-olive/22 text-olive border border-olive/35' },
  receptionist: { label: 'Recepcionista', desc: 'Mesas, reservas y check-in solamente',  cls: 'bg-gold/22 text-gold border border-gold/35' },
}

const ROLES = ['owner', 'manager', 'receptionist'] as const

export function ConfigClient({ me, venue, appBaseUrl }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isOwner = me.role === 'owner'
  const isManager = me.role === 'manager'

  useEffect(() => {
    if (!isOwner && !isManager) return
    setLoadingStaff(true)
    fetch('/api/staff')
      .then(r => r.json())
      .then(d => { setStaff(Array.isArray(d) ? d : []); setLoadingStaff(false) })
      .catch(() => setLoadingStaff(false))
  }, [isOwner, isManager])

  async function handleRoleChange(memberId: string, newRole: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, role: newRole }),
      })
      const updated = await res.json() as StaffMember
      setStaff(prev => prev.map(s => s.id === updated.id ? { ...s, role: updated.role } : s))
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('¿Eliminar este miembro del equipo?')) return
    await fetch(`/api/staff/${memberId}`, { method: 'DELETE' })
    setStaff(prev => prev.filter(s => s.id !== memberId))
  }

  return (
    <div className="min-h-screen bg-ink pb-28">
      <PageHero
        kicker="Configuración"
        title="Ajustes"
        subtitle="Perfil, equipo, restaurante e integraciones"
        accent="wine"
      />

      <div className="px-5 lg:px-7 space-y-8 max-w-3xl mx-auto mt-6">

        {/* Mi perfil */}
        <section>
          <NumericText label tone="muted" className="mb-3 block">Mi perfil</NumericText>
          <div className="bg-ink-2 border border-ink-line rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-wine flex items-center justify-center flex-shrink-0
                            shadow-[0_6px_16px_-4px_rgba(161,49,67,0.45)]">
              <span className="font-display font-bold text-[18px] text-white">
                {me.name[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ink-text font-bold text-[15px]">{me.name}</p>
              <p className="text-ink-text-3 text-[12px]">{me.email}</p>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0
                              ${ROLE_LABELS[me.role]?.cls ?? 'bg-ink-3 text-ink-text-2 border border-ink-line-2'}`}>
              {ROLE_LABELS[me.role]?.label ?? me.role}
            </span>
          </div>
        </section>

        {/* Info del venue */}
        <section>
          <NumericText label tone="muted" className="mb-3 block">Restaurante</NumericText>
          <div className="bg-ink-2 border border-ink-line rounded-2xl p-4 space-y-3">
            <InfoRow label="Nombre" value={venue.name} />
            <InfoRow label="Dirección" value={venue.address} />
            {venue.phone && <InfoRow label="Teléfono" value={venue.phone} mono />}
          </div>
        </section>

        {/* Gestión de equipo (owner + manager) */}
        {(isOwner || isManager) && (
          <section>
            <NumericText label tone="muted" className="mb-3 block">Equipo</NumericText>

            {loadingStaff ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-ink-2 border border-ink-line rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {staff.map(member => {
                  const roleInfo = ROLE_LABELS[member.role]
                    ?? { label: member.role, desc: '', cls: 'bg-ink-3 text-ink-text-2 border border-ink-line-2' }
                  const isMe = member.id === me.id
                  return (
                    <div key={member.id}
                      className="bg-ink-2 border border-ink-line rounded-2xl p-4
                                 hover:border-ink-line-2 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-ink-3 border border-ink-line-2
                                        flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-[13px] text-ink-text">
                            {member.name[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-ink-text font-semibold text-[14px]">
                            {member.name}
                            {isMe && <span className="text-ink-text-3 text-[11px] ml-1">(vos)</span>}
                          </p>
                          <p className="text-ink-text-3 text-[12px]">{member.email}</p>
                        </div>
                      </div>

                      {isOwner && !isMe ? (
                        editingId === member.id ? (
                          <div className="flex gap-1.5 mt-2">
                            {ROLES.map(r => (
                              <button
                                key={r}
                                onClick={() => handleRoleChange(member.id, r)}
                                disabled={saving}
                                className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all
                                            ${member.role === r
                                              ? 'bg-olive text-white border border-olive'
                                              : 'bg-ink text-ink-text-2 border border-ink-line-2 hover:text-ink-text'}`}
                              >
                                {ROLE_LABELS[r].label}
                              </button>
                            ))}
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-2 rounded-lg bg-ink text-ink-text-3 text-[11px]
                                         border border-ink-line hover:text-ink-text-2 transition-colors"
                              aria-label="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.cls}`}>
                                {roleInfo.label}
                              </span>
                              <span className="text-ink-text-3 text-[11px] truncate">{roleInfo.desc}</span>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setEditingId(member.id)}
                                className="text-[11px] text-ink-text-2 font-semibold
                                           hover:text-olive transition-colors"
                              >
                                Cambiar
                              </button>
                              <button
                                onClick={() => handleRemove(member.id)}
                                className="text-[11px] text-wine-soft/70 font-semibold
                                           hover:text-wine-soft transition-colors"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.cls}`}>
                            {roleInfo.label}
                          </span>
                          <span className="text-ink-text-3 text-[11px]">{roleInfo.desc}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Nota para agregar staff */}
            <div className="mt-3 bg-ink-2 border border-dashed border-ink-line-2 rounded-2xl p-4">
              <p className="text-ink-text-3 text-[12px] leading-relaxed">
                Para agregar un nuevo miembro, pedile que se registre en el panel
                y luego insertá su ID en la tabla{' '}
                <code className="text-olive text-[11.5px] font-mono">staff_users</code>{' '}
                con el venue_id correspondiente.
              </p>
            </div>
          </section>
        )}

        {/* Widget embebible */}
        <EmbedWidgetSection
          venueId={venue.id}
          venueName={venue.name}
          appBaseUrl={appBaseUrl}
        />

        {/* WhatsApp */}
        <WhatsAppSection venueName={venue.name} />

        {/* Roles disponibles (info) */}
        <section>
          <NumericText label tone="muted" className="mb-3 block">Roles del sistema</NumericText>
          <div className="space-y-2">
            {ROLES.map(r => (
              <div key={r} className="bg-ink-2 border border-ink-line rounded-xl px-4 py-3 flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${ROLE_LABELS[r].cls}`}>
                  {ROLE_LABELS[r].label}
                </span>
                <span className="text-ink-text-3 text-[12px]">{ROLE_LABELS[r].desc}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-ink-text-3 text-[12.5px] flex-shrink-0">{label}</span>
      <span
        className={`text-ink-text text-[13px] font-semibold text-right max-w-[70%] ${
          mono ? 'font-mono tabular-nums' : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}
