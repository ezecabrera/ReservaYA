import { NextResponse } from 'next/server'

// Healthcheck público — usado por monitoreo externo (UptimeRobot, Better Stack).
// Responde 200 si el server está vivo.
// No toca DB para evitar falsos positivos en caídas transitorias de Supabase.

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'un-toque-panel',
    ts: new Date().toISOString(),
  })
}
