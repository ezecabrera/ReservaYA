import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReservationWizard } from '@/components/reservation/ReservationWizard'
import { ReservarBackButton } from './BackButton'
import type { Venue } from '@/lib/shared'

interface Props {
  params: { venueId: string }
  searchParams: { date?: string; time?: string; party?: string }
}

/**
 * Pantalla dedicada del wizard de reserva. El "Empezar reserva" del detalle
 * del venue linkea acá — da sensación de "siguiente pantalla" en lugar de
 * desplegarse inline.
 *
 * El back button usa router.back() (no Link) para no agregar una entrada
 * al history y evitar el loop venue → wizard → venue → wizard.
 */
export default async function ReservarPage({ params, searchParams }: Props) {
  const supabase = await createClient()
  const { data: venue, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', params.venueId)
    .eq('is_active', true)
    .single()

  if (error || !venue) notFound()

  // Fetch de zones (sectores) — usa el mismo supabase client (anon tiene
  // lectura pública a zones). Si falla o devuelve vacío, el wizard salta
  // el paso de sector sin romperse.
  const { data: zonesData } = await supabase
    .from('zones')
    .select('name, prefix')
    .eq('venue_id', params.venueId)
    .order('created_at')
  const zones: { name: string; prefix: string | null }[] = zonesData ?? []

  // Prefill desde SearchPill del home
  const party = searchParams.party ? parseInt(searchParams.party, 10) : undefined
  const prefill = {
    date: searchParams.date,
    time: searchParams.time,
    partySize: party && party >= 1 && party <= 20 ? party : undefined,
  }

  return (
    <div className="min-h-screen bg-bg pb-20 lg:pb-0">
      {/* ═══════ DESKTOP ═══════ */}
      <div className="hidden lg:block dk-content-centered py-8">
        <nav className="flex items-center gap-1.5 text-[13px] text-tx3 font-semibold mb-5">
          <Link href="/" className="hover:text-tx no-underline">Inicio</Link>
          <span>›</span>
          <Link href={`/${params.venueId}`} className="hover:text-tx no-underline">
            {venue.name}
          </Link>
          <span>›</span>
          <span className="text-tx">Reservar</span>
        </nav>

        <div className="grid gap-8" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
          <div className="min-w-0">
            <header className="mb-6">
              <p className="text-tx3 text-[11px] font-bold uppercase tracking-[0.18em] mb-1">
                Reservar mesa
              </p>
              <h1 className="font-display text-[36px] text-tx leading-none tracking-tight">
                {venue.name}
              </h1>
              <p className="text-tx2 text-[14px] mt-2">
                Completá los pasos y listo. Sin llamadas.
              </p>
            </header>
            <div className="rounded-2xl border border-[rgba(0,0,0,0.07)] bg-bg p-6">
              <ReservationWizard venue={venue as Venue} prefill={prefill} sectors={zones} />
            </div>
          </div>

          {/* Sidebar: info del venue */}
          <aside className="min-w-0">
            <div
              className="sticky rounded-2xl border border-[rgba(0,0,0,0.07)] bg-bg overflow-hidden"
              style={{ top: 'calc(var(--dk-topbar-h, 68px) + 12px)' }}
            >
              <div
                className="h-[180px] overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FF4757 0%, #FF7A6B 50%, #FFB080 100%)',
                }}
              />
              <div className="p-5">
                <h2 className="font-display text-[22px] text-tx leading-tight tracking-tight">
                  {venue.name}
                </h2>
                <p className="text-tx2 text-[13px] mt-2">{venue.address}</p>
                {venue.phone && (
                  <p className="text-tx2 text-[13px] mt-1">{venue.phone}</p>
                )}
                <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)] space-y-2.5">
                  <InfoRowInline
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="4" y="11" width="16" height="10" rx="2" stroke="#FF4757" strokeWidth="2"/><path d="M8 11V7a4 4 0 118 0v4" stroke="#FF4757" strokeWidth="2" strokeLinecap="round"/></svg>}
                    label="Pago seguro vía Mercado Pago"
                  />
                  <InfoRowInline
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#FF4757" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    label="Seña se descuenta del consumo"
                  />
                  <InfoRowInline
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#FF4757" strokeWidth="2" strokeLinejoin="round"/></svg>}
                    label="Confirmación por WhatsApp"
                  />
                </div>
                <Link
                  href={`/${params.venueId}`}
                  className="block text-center mt-5 py-2.5 text-[13px] font-semibold text-tx2 hover:text-tx no-underline"
                >
                  ← Volver al restaurante
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ═══════ MOBILE ═══════ */}
      <div className="lg:hidden">
        <header className="screen-x pt-12 pb-2 flex items-start gap-3">
          <ReservarBackButton venueId={params.venueId} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[22px] text-tx leading-[1.1] tracking-[-0.3px] truncate">
              {venue.name}
            </h1>
            <p className="text-tx2 text-[12.5px] mt-0.5">
              Hacé tu reserva en {venue.name}
            </p>
          </div>
        </header>

        <div className="screen-x pt-3">
          <ReservationWizard venue={venue as Venue} prefill={prefill} sectors={zones} />
        </div>
      </div>
    </div>
  )
}

function InfoRowInline({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-[13px] text-tx">{label}</span>
    </div>
  )
}
