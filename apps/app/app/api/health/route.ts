import { NextResponse } from 'next/server'

// Healthcheck público — usado por monitoreo externo.
// Responde 200 si el server está vivo. No toca DB.

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'un-toque-app',
    ts: new Date().toISOString(),
  })
}
