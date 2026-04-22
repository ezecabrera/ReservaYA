'use client'

import Link from 'next/link'

const CORAL = '#FF4757'
const AMBER = '#FFB800'

interface RewardsData {
  tier: 'bronce' | 'plata' | 'oro'
  tierLabel: string
  reservationsThisMonth: number
  toNextTier: number | null
  nextTierLabel: string | null
  incentive: string
  streaks: Array<{ icon: string; title: string; subtitle: string }>
}

interface ProfileData {
  name: string
  phone: string
  email: string
  memberSince: string
  stats: {
    total: number
    checkedIn: number
    pending?: number
    favoriteVenue: string | null
  }
  rewards?: RewardsData
}

interface Props {
  data: ProfileData
  initial: string
  color: string
}

const TIER_META: Record<RewardsData['tier'], { emoji: string; color: string; max: number }> = {
  bronce: { emoji: '🥉', color: '#7A4A24', max: 3 },
  plata:  { emoji: '🥈', color: '#525966', max: 7 },
  oro:    { emoji: '🥇', color: '#8A6310', max: 7 },
}

function memberSinceLabel(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export function DesktopPerfil({ data, initial, color }: Props) {
  const r = data.rewards
  const tierM = r ? TIER_META[r.tier] : null
  const progressPct = r && r.toNextTier !== null && tierM
    ? Math.min(((tierM.max - r.toNextTier) / tierM.max) * 100, 100)
    : 100

  return (
    <div className="hidden lg:block dk-content-centered py-8">
      {/* Profile header card */}
      <section className="rounded-2xl bg-bg border border-[rgba(0,0,0,0.07)] p-7 mb-6 flex items-center gap-6">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}22`, border: `2.5px solid ${color}` }}
        >
          <span className="font-display text-[40px]" style={{ color }}>{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-tx3 text-[11px] font-bold uppercase tracking-[0.18em] mb-1">
            Tu cuenta
          </p>
          <h1 className="font-display text-[32px] text-tx leading-none tracking-tight">
            {data.name}
          </h1>
          <p className="text-tx2 text-[14px] mt-2">{data.email}</p>
          <p className="text-tx3 text-[12px] mt-1">
            Miembro desde {memberSinceLabel(data.memberSince)}
          </p>
        </div>
        <Link
          href="/perfil/editar"
          className="px-5 py-2.5 rounded-md bg-sf border border-[rgba(0,0,0,0.08)] text-tx font-semibold text-[13px] no-underline hover:bg-sf2 transition-colors"
        >
          Editar perfil
        </Link>
      </section>

      <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Stats */}
          <section>
            <h2 className="font-display text-[22px] text-tx tracking-tight mb-4">
              Tu actividad
            </h2>
            <div className="grid grid-cols-4 gap-3">
              <Stat label="Reservas" value={data.stats.total} />
              <Stat label="Asistidas" value={data.stats.checkedIn} accent={'#0E8F6A'} />
              <Stat label="Pendientes" value={data.stats.pending ?? 0} accent={AMBER} />
              <Stat
                label="Favorito"
                value={data.stats.favoriteVenue ?? '—'}
                isText
              />
            </div>
          </section>

          {/* Tier + progress */}
          {r && tierM && (
            <section
              className="rounded-2xl p-6 border"
              style={{ background: `${tierM.color}08`, borderColor: `${tierM.color}33` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-[32px]"
                  style={{ background: `${tierM.color}18` }}
                >
                  {tierM.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tx3">Tu nivel</p>
                  <p className="font-display text-[28px] text-tx leading-none mt-0.5">
                    {r.tierLabel}
                  </p>
                  <p className="text-tx2 text-[13px] mt-1">
                    {r.reservationsThisMonth} reservas este mes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-tx3">Progreso</p>
                  <p className="font-display text-[20px] text-tx tabular-nums mt-0.5">
                    {Math.round(progressPct)}%
                  </p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-bg overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: tierM.color }}
                />
              </div>
              <p className="text-tx2 text-[13px] mt-3 leading-relaxed">
                {r.toNextTier !== null && r.nextTierLabel
                  ? `${r.toNextTier} reservas para subir a ${r.nextTierLabel}.`
                  : 'Alcanzaste el nivel máximo.'}
              </p>
              <p className="text-tx font-semibold text-[13px] mt-2">
                {r.incentive}
              </p>
            </section>
          )}

          {/* Streaks */}
          {r && r.streaks.length > 0 && (
            <section>
              <h2 className="font-display text-[22px] text-tx tracking-tight mb-4">
                Rachas activas
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {r.streaks.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[rgba(0,0,0,0.07)] bg-bg p-5"
                  >
                    <div className="text-[32px] mb-2 leading-none">{s.icon}</div>
                    <p className="font-semibold text-tx text-[14px] leading-tight">{s.title}</p>
                    <p className="text-tx3 text-[12px] mt-1.5 leading-relaxed">{s.subtitle}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: settings + logout */}
        <aside className="min-w-0">
          <div
            className="sticky space-y-3"
            style={{ top: 'calc(var(--dk-topbar-h, 68px) + 12px)' }}
          >
            <section className="rounded-2xl bg-bg border border-[rgba(0,0,0,0.07)] overflow-hidden">
              <p className="text-[10px] font-bold text-tx3 uppercase tracking-[0.18em] px-5 pt-5 pb-1">
                Configuración
              </p>
              <nav className="flex flex-col">
                <SettingLink href="/perfil/cuenta" label="Cuenta y datos" />
                <SettingLink href="/perfil/notificaciones" label="Notificaciones" />
                <SettingLink href="/perfil/privacidad" label="Privacidad" />
                <SettingLink href="/perfil/pagos" label="Métodos de pago" />
              </nav>
            </section>

            <section className="rounded-2xl bg-bg border border-[rgba(0,0,0,0.07)] p-5">
              <p className="text-[10px] font-bold text-tx3 uppercase tracking-[0.18em] mb-2">
                Información
              </p>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-tx2">Teléfono</span>
                  <span className="text-tx font-semibold">{data.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tx2">Miembro</span>
                  <span className="text-tx font-semibold capitalize">
                    {memberSinceLabel(data.memberSince)}
                  </span>
                </div>
              </div>
            </section>

            <Link
              href="/terms"
              className="block text-center py-2 text-tx3 text-[12px] hover:text-tx2 no-underline"
            >
              Términos · Privacidad
            </Link>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="w-full py-3 rounded-md bg-sf border border-[rgba(0,0,0,0.08)] text-tx2 font-semibold text-[13px] hover:text-[#C42434] hover:border-[#C42434]/30 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
            <p className="text-center text-tx3 text-[10px] pt-1">
              UnToque · v1.0
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
  isText,
}: {
  label: string
  value: number | string
  accent?: string
  isText?: boolean
}) {
  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.07)] bg-bg p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-tx3">{label}</p>
      {isText ? (
        <p className="font-display text-[16px] text-tx leading-tight mt-2 truncate" title={String(value)}>
          {value}
        </p>
      ) : (
        <p
          className="font-display text-[32px] leading-none tabular-nums tracking-tight mt-2"
          style={{ color: accent ?? CORAL }}
        >
          {value}
        </p>
      )}
    </div>
  )
}

function SettingLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-5 py-3 hover:bg-sf transition-colors no-underline text-tx text-[14px] font-semibold border-t border-[rgba(0,0,0,0.06)]"
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-tx3">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}
