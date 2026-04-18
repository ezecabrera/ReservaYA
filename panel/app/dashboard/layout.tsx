import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PanelNav } from '@/components/nav/PanelNav'
import { DesktopShell } from '@/components/nav/DesktopShell'
import { NewReservationTrigger } from '@/components/reservas/NewReservationTrigger'
import { Toaster } from '@/components/ui/Toaster'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen">
      {/*
        Desktop (≥ lg): DesktopShell con sidebar izquierda que tiene el pill
        "Nueva reserva" persistente arriba.
        Mobile/tablet (< lg): PanelNav flotante abajo + FAB wine para crear
        reserva desde cualquier página (walk-in → future slot).
        Atajo "N" desde teclado abre el sheet desde cualquier lado.
      */}
      <DesktopShell>
        <div className="pb-20 lg:pb-0">
          {children}
        </div>
      </DesktopShell>
      <PanelNav />
      <NewReservationTrigger variant="fab" />
      <Toaster />
    </div>
  )
}
