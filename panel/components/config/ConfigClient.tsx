'use client'

import { useEffect, useState } from 'react'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  created_at?: string
}

interface Props {
  me: { id: string; name: string; email: string; role: string }
  venue: { name: string; address: string; phone: string | null }
}

const ROLE_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  owner:        { label: 'Owner',         desc: 'Acceso completo + gestión de staff',    color: 'bg-c5l text-[#6B30CC]' },
  manager:      { label: 'Manager',       desc: 'Analytics, menú y operaciones',          color: 'bg-c4l text-[#2B5FCC]' },
  receptionist: { label: 'Recepcionista', desc: 'Mesas, reservas y check-in solamente',   color: 'bg-c2l text-[#15A67A]' },
}

const ROLES = ['owner', 'manager', 'receptionist'] as const

export function ConfigClient({ me, venue }: Props) {
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
    <div className="min-h-screen pb-28"
      style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <h1 className="font-display text-[24px] font-bold text-white tracking-tight">
          Configuración
        </h1>
      </div>

      <div className="px-5 space-y-6">

        {/* Mi perfil */}
        <div>
          <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
            Mi perfil
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-c1 flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-[18px] text-white">
                {me.name[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-[15px]">{me.name}</p>
              <p className="text-white/45 text-[12px]">{me.email}</p>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0
                              ${ROLE_LABELS[me.role]?.color ?? 'bg-sf2 text-tx3'}`}>
              {ROLE_LABELS[me.role]?.label ?? me.role}
            </span>
          </div>
        </div>

        {/* Info del venue */}
        <div>
          <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
            Restaurante
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-white/45 text-[13px]">Nombre</span>
              <span className="text-white font-semibold text-[13px]">{venue.name}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-white/45 text-[13px]">Dirección</span>
              <span className="text-white font-semibold text-[13px] text-right max-w-[60%]">{venue.address}</span>
            </div>
            {venue.phone && (
              <div className="flex justify-between items-start">
                <span className="text-white/45 text-[13px]">Teléfono</span>
                <span className="text-white font-semibold text-[13px]">{venue.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Gestión de equipo (owner + manager) */}
        {(isOwner || isManager) && (
          <div>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
              Equipo
            </p>

            {loadingStaff ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {staff.map(member => {
                  const roleInfo = ROLE_LABELS[member.role] ?? { label: member.role, desc: '', color: 'bg-sf2 text-tx3' }
                  const isMe = member.id === me.id
                  return (
                    <div key={member.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-[13px] text-white">
                            {member.name[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-[14px]">
                            {member.name}
                            {isMe && <span className="text-white/35 text-[11px] ml-1">(vos)</span>}
                          </p>
                          <p className="text-white/40 text-[12px]">{member.email}</p>
                        </div>
                      </div>

                      {/* Selector de rol (solo owner y no para sí mismo) */}
                      {isOwner && !isMe ? (
                        editingId === member.id ? (
                          <div className="flex gap-1.5 mt-2">
                            {ROLES.map(r => (
                              <button
                                key={r}
                                onClick={() => handleRoleChange(member.id, r)}
                                disabled={saving}
                                className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all
                                            ${member.role === r ? 'bg-c2 text-white' : 'bg-white/10 text-white/50'}`}
                              >
                                {ROLE_LABELS[r].label}
                              </button>
                            ))}
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-2 rounded-lg bg-white/5 text-white/40 text-[11px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                                {roleInfo.label}
                              </span>
                              <span className="text-white/30 text-[11px]">{roleInfo.desc}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingId(member.id)}
                                className="text-[11px] text-white/40 font-semibold hover:text-c2 transition-colors"
                              >
                                Cambiar
                              </button>
                              <button
                                onClick={() => handleRemove(member.id)}
                                className="text-[11px] text-c1/60 font-semibold hover:text-c1 transition-colors"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                          <span className="text-white/30 text-[11px]">{roleInfo.desc}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Nota para agregar staff */}
            <div className="mt-3 bg-white/5 border border-dashed border-white/15 rounded-2xl p-4">
              <p className="text-white/40 text-[12px] leading-relaxed">
                Para agregar un nuevo miembro, pedile que se registre en el panel
                y luego insertá su ID en la tabla <code className="text-c2 text-[11px]">staff_users</code> con el venue_id correspondiente.
              </p>
            </div>
          </div>
        )}

        {/* Roles disponibles (info) */}
        <div>
          <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
            Roles del sistema
          </p>
          <div className="space-y-2">
            {ROLES.map(r => (
              <div key={r} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${ROLE_LABELS[r].color}`}>
                  {ROLE_LABELS[r].label}
                </span>
                <span className="text-white/45 text-[12px]">{ROLE_LABELS[r].desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
