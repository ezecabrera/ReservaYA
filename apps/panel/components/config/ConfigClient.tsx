'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  created_at?: string
}

interface StaffInvite {
  id: string
  email: string
  name?: string
  role: string
  invitedAt: string // ISO
  expiresAt: string // ISO
  // Canal alternativo: código para compartir por WhatsApp/verbal
  code: string
}

interface Props {
  me: { id: string; name: string; email: string; role: string }
  venue: { name: string; address: string; phone: string | null }
}

type RoleTone = 'owner' | 'manager' | 'receptionist'

const ROLE_LABELS: Record<string, { label: string; desc: string; tone: RoleTone }> = {
  owner:        { label: 'Owner',         desc: 'Acceso completo + gestión de staff',  tone: 'owner' },
  manager:      { label: 'Manager',       desc: 'Analytics, menú y operaciones',       tone: 'manager' },
  receptionist: { label: 'Recepcionista', desc: 'Mesas, reservas y check-in',          tone: 'receptionist' },
}

const ROLE_BADGE_CLS: Record<RoleTone, string> = {
  owner:        'bg-[#0F3460]/[0.08] text-[#0F3460] border-[#0F3460]/20',
  manager:      'bg-[#C5602A]/[0.08] text-[#C5602A] border-[#C5602A]/20',
  receptionist: 'bg-c2l text-[#15A67A] border-[#15A67A]/20',
}

const ROLES = ['owner', 'manager', 'receptionist'] as const

const PREVIEW_STAFF: StaffMember[] = [
  { id: 'preview-me',     name: 'Martín García',     email: 'martin@lacantina.com',    role: 'owner' },
  { id: 'preview-manager', name: 'Sofía Rodríguez',   email: 'sofia@lacantina.com',    role: 'manager' },
  { id: 'preview-recep',  name: 'Lucas Pérez',       email: 'lucas@lacantina.com',    role: 'receptionist' },
]

const PREVIEW_INVITES: StaffInvite[] = [
  {
    id: 'inv-1',
    email: 'camila@lacantina.com',
    name: 'Camila',
    role: 'receptionist',
    invitedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    code: 'UN-TOQUE-K4N7P',
  },
]

function generateCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 5; i++) s += letters[Math.floor(Math.random() * letters.length)]
  return `UN-TOQUE-${s}`
}

export function ConfigClient({ me, venue }: Props) {
  const isPreview = me.id === 'preview-me'
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [invites, setInvites] = useState<StaffInvite[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false)

  const isOwner = me.role === 'owner'
  const isManager = me.role === 'manager'

  useEffect(() => {
    if (isPreview) {
      setStaff(PREVIEW_STAFF)
      setInvites(PREVIEW_INVITES)
      return
    }
    if (!isOwner && !isManager) return
    setLoadingStaff(true)
    fetch('/api/staff')
      .then(r => r.json())
      .then(d => { setStaff(Array.isArray(d) ? d : []); setLoadingStaff(false) })
      .catch(() => setLoadingStaff(false))
    // TODO: fetch('/api/staff/invites') cuando exista el backend
  }, [isOwner, isManager, isPreview])

  function handleSendInvite(inv: { email: string; name: string; role: string }) {
    const next: StaffInvite = {
      id: `inv-${Date.now()}`,
      email: inv.email.trim().toLowerCase(),
      name: inv.name.trim() || undefined,
      role: inv.role,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      code: generateCode(),
    }
    setInvites(prev => [next, ...prev])
    setInviteSheetOpen(false)
    // TODO: POST /api/staff/invites en producción
  }

  function handleResendInvite(id: string) {
    setInvites(prev => prev.map(i =>
      i.id === id
        ? { ...i, invitedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() }
        : i
    ))
  }

  function handleCancelInvite(id: string) {
    setInvites(prev => prev.filter(i => i.id !== id))
    // TODO: DELETE /api/staff/invites/:id
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    if (isPreview) {
      setStaff(prev => prev.map(s => s.id === memberId ? { ...s, role: newRole } : s))
      setEditingId(null); return
    }
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
    if (isPreview) { setStaff(prev => prev.filter(s => s.id !== memberId)); return }
    await fetch(`/api/staff/${memberId}`, { method: 'DELETE' })
    setStaff(prev => prev.filter(s => s.id !== memberId))
  }

  return (
    <div className="min-h-screen bg-sf pb-20">
      <PageHeader
        title="Configuración"
        subtitle="Tu perfil, tu restaurante y tu equipo"
        venueName={venue.name}
      />

      <main className="max-w-3xl mx-auto px-5 pt-6 space-y-8">

        {/* Mi perfil */}
        <Section title="Mi perfil">
          <div className="bg-white rounded-md border border-[rgba(0,0,0,0.07)] p-4 flex items-center gap-4">
            <Avatar name={me.name} size={48} />
            <div className="flex-1 min-w-0">
              <p className="text-tx font-semibold text-[15px] truncate">{me.name}</p>
              <p className="text-tx2 text-[12px] truncate">{me.email}</p>
            </div>
            <RoleBadge role={me.role} />
          </div>
        </Section>

        {/* Restaurante */}
        <Section title="Restaurante">
          <div className="bg-white rounded-md border border-[rgba(0,0,0,0.07)] p-4 space-y-2.5">
            <InfoRow label="Nombre" value={venue.name} />
            <InfoRow label="Dirección" value={venue.address} />
            {venue.phone && <InfoRow label="Teléfono" value={venue.phone} />}
          </div>
        </Section>

        {/* Equipo */}
        {(isOwner || isManager) && (
          <Section
            title="Equipo"
            right={
              isOwner ? (
                <button
                  onClick={() => setInviteSheetOpen(true)}
                  className="px-3 py-2 rounded-md bg-[#0F3460] text-white text-[12px] font-semibold
                             hover:bg-[#0A2548] transition-colors duration-[160ms]"
                >
                  + Invitar
                </button>
              ) : undefined
            }
          >
            {/* Invitaciones pendientes */}
            {invites.length > 0 && (
              <div className="space-y-2 mb-3">
                {invites.map(inv => (
                  <InvitePendingRow
                    key={inv.id}
                    invite={inv}
                    onResend={() => handleResendInvite(inv.id)}
                    onCancel={() => handleCancelInvite(inv.id)}
                  />
                ))}
              </div>
            )}

            {loadingStaff ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[72px] bg-white rounded-md border border-[rgba(0,0,0,0.07)] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {staff.map(member => {
                  const isMe = member.id === me.id
                  return (
                    <div
                      key={member.id}
                      className="bg-white rounded-md border border-[rgba(0,0,0,0.07)] p-4"
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <Avatar name={member.name} size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="text-tx font-semibold text-[14px] truncate">
                            {member.name}
                            {isMe && <span className="text-tx3 text-[11px] ml-1.5 font-normal">(vos)</span>}
                          </p>
                          <p className="text-tx2 text-[12px] truncate">{member.email}</p>
                        </div>
                      </div>

                      {isOwner && !isMe ? (
                        editingId === member.id ? (
                          <div className="flex gap-1.5">
                            {ROLES.map(r => (
                              <button
                                key={r}
                                onClick={() => handleRoleChange(member.id, r)}
                                disabled={saving}
                                className={`flex-1 py-2 rounded-md text-[11px] font-semibold border transition-colors duration-[160ms]
                                            ${member.role === r
                                              ? 'bg-[#0F3460] border-[#0F3460] text-white'
                                              : 'bg-white border-[rgba(0,0,0,0.1)] text-tx2 hover:border-[#0F3460]/40 hover:text-tx'
                                            }`}
                              >
                                {ROLE_LABELS[r].label}
                              </button>
                            ))}
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-2 rounded-md bg-sf border border-[rgba(0,0,0,0.08)] text-tx3 text-[11px] font-semibold hover:bg-sf2"
                              aria-label="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <RoleBadge role={member.role} />
                              <span className="text-tx3 text-[11px] truncate">
                                {ROLE_LABELS[member.role]?.desc}
                              </span>
                            </div>
                            <div className="flex gap-3 flex-shrink-0">
                              <button
                                onClick={() => setEditingId(member.id)}
                                className="text-[12px] text-[#0F3460] font-semibold hover:underline"
                              >
                                Cambiar
                              </button>
                              <button
                                onClick={() => handleRemove(member.id)}
                                className="text-[12px] text-[#D63646] font-semibold hover:underline"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2">
                          <RoleBadge role={member.role} />
                          <span className="text-tx3 text-[11px]">{ROLE_LABELS[member.role]?.desc}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {isOwner && invites.length === 0 && staff.length <= 1 && (
              <button
                onClick={() => setInviteSheetOpen(true)}
                className="mt-3 w-full rounded-md border border-dashed border-[#0F3460]/25 bg-white py-4
                           text-[#0F3460] text-[13px] font-semibold
                           hover:border-[#0F3460]/50 hover:bg-[#0F3460]/[0.03]
                           transition-colors duration-[160ms]"
              >
                + Sumar a alguien del equipo
              </button>
            )}
          </Section>
        )}

        {/* Roles del sistema */}
        <Section title="Roles del sistema">
          <div className="space-y-2">
            {ROLES.map(r => (
              <div
                key={r}
                className="bg-white rounded-md border border-[rgba(0,0,0,0.07)] px-4 py-3 flex items-center gap-3"
              >
                <RoleBadge role={r} />
                <span className="text-tx2 text-[12px]">{ROLE_LABELS[r].desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Sesión */}
        <Section title="Sesión">
          <a
            href="/api/auth/signout"
            className="block text-center py-3 rounded-md bg-white border border-[rgba(0,0,0,0.08)]
                       text-tx2 font-semibold text-[13px]
                       hover:bg-sf2 hover:text-[#D63646] hover:border-[#D63646]/30
                       transition-colors duration-[160ms]"
          >
            Cerrar sesión
          </a>
        </Section>

      </main>

      {inviteSheetOpen && (
        <InviteSheet
          onClose={() => setInviteSheetOpen(false)}
          onSend={handleSendInvite}
          existingEmails={[...staff.map(s => s.email), ...invites.map(i => i.email)]}
        />
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({
  title,
  right,
  children,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-tx3 uppercase tracking-wider">
          {title}
        </p>
        {right}
      </div>
      {children}
    </section>
  )
}

function Avatar({ name, size }: { name: string; size: number }) {
  const initial = name[0]?.toUpperCase() ?? '?'
  return (
    <div
      className="rounded-full bg-[#0F3460] flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className="font-display text-white leading-none"
        style={{ fontSize: Math.round(size * 0.4) }}
      >
        {initial}
      </span>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const info = ROLE_LABELS[role]
  if (!info) return <span className="text-tx3 text-[11px]">{role}</span>
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE_CLS[info.tone]}`}>
      {info.label}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-tx2 text-[13px]">{label}</span>
      <span className="text-tx font-semibold text-[13px] text-right">{value}</span>
    </div>
  )
}

// ── Invitaciones ─────────────────────────────────────────────────────────────

function InvitePendingRow({
  invite,
  onResend,
  onCancel,
}: {
  invite: StaffInvite
  onResend: () => void
  onCancel: () => void
}) {
  const [copiedCode, setCopiedCode] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(invite.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  const relativeTime = (() => {
    const diff = Date.now() - new Date(invite.invitedAt).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'hace unos minutos'
    if (hours < 24) return `hace ${hours}h`
    return `hace ${Math.floor(hours / 24)}d`
  })()

  return (
    <div className="bg-white rounded-md border border-dashed border-[#C5602A]/30 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-[#C5602A]/[0.08] border border-[#C5602A]/20 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
              stroke="#C5602A" strokeWidth="2" />
            <path d="M22 6l-10 7L2 6" stroke="#C5602A" strokeWidth="2" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-tx font-semibold text-[14px] truncate">
              {invite.name || invite.email}
            </p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[#C5602A]/[0.08] text-[#C5602A] border-[#C5602A]/20">
              Pendiente
            </span>
          </div>
          <p className="text-tx2 text-[12px] truncate">{invite.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <RoleBadge role={invite.role} />
        <span className="text-tx3 text-[11px]">· Invitada {relativeTime}</span>
      </div>

      {/* Código de invitación copiable */}
      <div className="rounded-md bg-sf border border-[rgba(0,0,0,0.06)] p-2.5 flex items-center gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-tx3 text-[10px] font-semibold uppercase tracking-wider">
            Código para WhatsApp
          </p>
          <p className="font-mono text-tx text-[13px] tabular-nums truncate">{invite.code}</p>
        </div>
        <button
          onClick={copyCode}
          className="px-3 py-2 rounded-md bg-white border border-[rgba(0,0,0,0.08)]
                     text-tx2 text-[12px] font-semibold hover:bg-sf2 hover:text-tx
                     transition-colors duration-[160ms] flex-shrink-0"
        >
          {copiedCode ? 'Copiado ✓' : 'Copiar'}
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onResend}
          className="text-[12px] text-[#0F3460] font-semibold hover:underline"
        >
          Reenviar email
        </button>
        <button
          onClick={onCancel}
          className="text-[12px] text-[#D63646] font-semibold hover:underline"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function InviteSheet({
  onClose,
  onSend,
  existingEmails,
}: {
  onClose: () => void
  onSend: (inv: { email: string; name: string; role: string }) => void
  existingEmails: string[]
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<string>('receptionist')
  const [error, setError] = useState<string | null>(null)

  function send() {
    const em = email.trim().toLowerCase()
    if (!em) { setError('Ingresá el email'); return }
    if (!em.includes('@')) { setError('Email inválido'); return }
    if (existingEmails.includes(em)) { setError('Ese email ya está en el equipo o invitado'); return }
    onSend({ email: em, name, role })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-tx/40" onClick={onClose} />
      <div className="relative rounded-t-2xl bg-white border-t border-[rgba(0,0,0,0.08)] p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-[rgba(0,0,0,0.1)] mx-auto mb-2" />

        <div>
          <h2 className="font-sans-black text-[20px] text-tx leading-none">Invitar al equipo</h2>
          <p className="text-tx2 text-[13px] mt-1.5">
            Le mandamos un email con un link para crear su cuenta. También podés compartir
            el código por WhatsApp si no tiene email a mano.
          </p>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-tx2 mb-1.5">
            Email del invitado
          </label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(null) }}
            placeholder="sofia@ejemplo.com"
            autoFocus
            className="w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-white
                       px-4 py-3 text-[14px] text-tx placeholder-tx3 outline-none
                       focus:border-[#0F3460] focus:ring-2 focus:ring-[#0F3460]/15
                       transition-colors duration-[160ms]"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-tx2 mb-1.5">
            Nombre (opcional)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Sofía"
            className="w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-white
                       px-4 py-3 text-[14px] text-tx placeholder-tx3 outline-none
                       focus:border-[#0F3460] focus:ring-2 focus:ring-[#0F3460]/15
                       transition-colors duration-[160ms]"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-tx2 mb-2">
            Rol
          </label>
          <div className="space-y-2">
            {ROLES.map(r => {
              const info = ROLE_LABELS[r]
              const selected = role === r
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`w-full rounded-md border px-4 py-3 text-left transition-colors duration-[160ms]
                              ${selected
                                ? 'border-[#0F3460] bg-[#0F3460]/[0.04]'
                                : 'border-[rgba(0,0,0,0.1)] bg-white hover:border-[#0F3460]/30'
                              }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-semibold text-[14px] ${selected ? 'text-[#0F3460]' : 'text-tx'}`}>
                      {info.label}
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                                  ${selected ? 'border-[#0F3460]' : 'border-[rgba(0,0,0,0.2)]'}`}
                    >
                      {selected && <span className="w-2 h-2 rounded-full bg-[#0F3460]" />}
                    </span>
                  </div>
                  <p className="text-tx2 text-[12px]">{info.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-c1l border border-[#D63646]/15 px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" stroke="#D63646" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#D63646" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-[13px] text-[#D63646] font-medium leading-snug">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-md bg-sf border border-[rgba(0,0,0,0.08)]
                       text-tx2 font-semibold text-[13px]
                       hover:bg-sf2 hover:text-tx transition-colors duration-[160ms]"
          >
            Cancelar
          </button>
          <button
            onClick={send}
            className="flex-1 py-3 rounded-md bg-[#0F3460] text-white font-semibold text-[14px]
                       hover:bg-[#0A2548] transition-colors duration-[160ms]"
          >
            Enviar invitación
          </button>
        </div>
      </div>
    </div>
  )
}
