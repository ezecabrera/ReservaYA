import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReservationWizard } from '@/components/reservation/ReservationWizard'
import { AutoResize } from '@/components/embed/AutoResize'
import type { Venue } from '@/lib/shared'

/**
 * Widget embebible.
 *
 * El restaurante embebe un <iframe src="https://reservaya.app/embed/<id>" />
 * en su Instagram link-in-bio o en su propia web. Sin comisión para reservas
 * que entran por acá — son "reservas propias" del local.
 *
 * CSP frame-ancestors se seteá en next.config para permitir iframe cross-origin.
 * AutoResize postea el altura al parent para que ajuste el iframe dinámicamente.
 */
export default async function EmbedPage({
  params,
}: {
  params: { venueId: string }
}) {
  const supabase = await createClient()
  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('id', params.venueId)
    .eq('is_active', true)
    .single()

  if (!venue) notFound()

  const v = venue as Venue

  return (
    <div className="p-4 max-w-xl mx-auto" id="ry-embed-root">
      <AutoResize />

      {/* Header compacto — branding del venue */}
      <header className="mb-4 text-center">
        <h1 className="font-display text-[20px] font-bold text-tx leading-tight">
          Reservá en {v.name}
        </h1>
        <p className="text-tx2 text-[12.5px] mt-0.5">{v.address}</p>
      </header>

      <ReservationWizard venue={v} />

      {/* Atribución discreta — requisito para widgets gratis */}
      <p className="text-center text-[10px] text-tx3 mt-4">
        Powered by{' '}
        <a
          href="https://reservaya.app"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-tx2"
        >
          ReservaYa
        </a>
      </p>
    </div>
  )
}
