import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * POST /api/demo-requests — lead capture desde la landing pública.
 * Público (sin auth). Rate-limit implícito por IP (Vercel edge).
 */

interface Payload {
  email?: string
  name?: string
  venueName?: string
  phone?: string
  message?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  // Rate limit — 5 requests por IP cada 10 minutos. Suficiente para un form
  // real, bloquea scrapers triviales.
  const ip = getClientIp(req)
  const rl = rateLimit(`demo:${ip}`, 5, 10 * 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intentá de nuevo más tarde.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  let body: Payload
  try {
    body = await req.json() as Payload
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const name = (body.name ?? '').trim().slice(0, 120) || null
  const venueName = (body.venueName ?? '').trim().slice(0, 200) || null
  const phone = (body.phone ?? '').trim().slice(0, 30) || null
  const message = (body.message ?? '').trim().slice(0, 1000) || null

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }
  if (email.length > 200) {
    return NextResponse.json({ error: 'Email demasiado largo' }, { status: 400 })
  }

  const admin = createAdminClient()
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null

  try {
    const { error } = await admin
      .from('demo_requests')
      .insert({
        email,
        name,
        venue_name: venueName,
        phone,
        message,
        source: 'landing',
        user_agent: userAgent,
      })

    if (error) {
      // Tabla no existe aún (migración 008 sin aplicar) → fallback a log,
      // devolvemos ok: true para que la landing no asuste al lead.
      const msg = error.message ?? ''
      const tableMissing =
        msg.includes('does not exist') ||
        msg.includes('schema cache') ||
        msg.includes('relation') && msg.includes('demo_requests')
      if (tableMissing) {
        console.warn('[demo-requests] tabla no existe, logging lead:', { email, name, venueName, phone, message })
        return NextResponse.json({ ok: true, fallback: 'log' })
      }
      console.error('[demo-requests] db error:', msg)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[demo-requests] unexpected:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
