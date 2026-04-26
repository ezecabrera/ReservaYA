/**
 * Dynamic OG image endpoint — UnToque.
 *
 * Generates 1200×630 PNG og:image cards on the edge using next/og.
 * Replaces the static SVGs in /public/og/ because crawlers (Facebook,
 * Twitter, LinkedIn) require raster og:image with explicit width/height.
 *
 * Slugs: default, landing, demo, pilot, vs.
 *
 * Routes:  GET /og/default
 *          GET /og/landing
 *          GET /og/demo
 *          GET /og/pilot
 *          GET /og/vs
 */

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'

export const dynamicParams = false

export function generateStaticParams() {
  return [
    { slug: 'default' },
    { slug: 'landing' },
    { slug: 'demo' },
    { slug: 'pilot' },
    { slug: 'vs' },
  ]
}

interface Slot {
  /** First chunk of the headline (regular). */
  head: string
  /** Italic emphasis fragment inside the headline. */
  italic: string
  /** Trailing chunk of the headline after the italic fragment (optional). */
  tail?: string
  /** Subhead under the title. */
  sub: string
  /** Pill content shown bottom-left. */
  pill: string
}

const SLOTS: Record<string, Slot> = {
  default: {
    head: 'El panel que pone ',
    italic: 'el toque',
    tail: '.',
    sub: 'ARS 30.000 fijos al mes',
    pill: 'Sin comisión por cubierto',
  },
  landing: {
    head: 'Sin comisión',
    italic: ' por cubierto',
    tail: '.',
    sub: 'Para restaurantes argentinos · 2026',
    pill: 'ARS 30.000 / mes flat',
  },
  demo: {
    head: 'Agendá una demo de ',
    italic: '15 min',
    tail: '.',
    sub: 'Sin venta de humo',
    pill: 'Migración real en vivo',
  },
  pilot: {
    head: 'Programa Piloto · ',
    italic: '50% off 3 meses',
    tail: '.',
    sub: 'Para los primeros 10 restaurantes',
    pill: 'ARS 15.000 / mes',
  },
  vs: {
    head: 'UnToque vs ',
    italic: 'competencia',
    tail: '.',
    sub: 'La comparación honesta',
    pill: '$0 vs €2.50 por cubierto',
  },
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
): Promise<Response> {
  const slot: Slot = SLOTS[params.slug] ?? SLOTS.default

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#111315',
          color: '#F4F2EE',
          padding: '64px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {/* ─── Top row: lila "u" badge ─── */}
        <div style={{ display: 'flex' }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: '#E4CDED',
              color: '#1A1B1F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 56,
              fontWeight: 900,
              fontStyle: 'italic',
              borderRadius: 12,
              lineHeight: 1,
              paddingBottom: 6,
            }}
          >
            u
          </div>
        </div>

        {/* ─── Center: headline + subhead ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 900,
              fontSize: 88,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: '#F4F2EE',
            }}
          >
            <span>{slot.head}</span>
            <span style={{ fontStyle: 'italic', color: '#E4CDED' }}>{slot.italic}</span>
            {slot.tail ? <span>{slot.tail}</span> : null}
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#A9A8A2',
              fontWeight: 500,
              letterSpacing: -0.4,
            }}
          >
            {slot.sub}
          </div>
        </div>

        {/* ─── Bottom row: pill + domain ─── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#A13143',
              color: '#F4F2EE',
              padding: '14px 28px',
              borderRadius: 999,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: -0.2,
            }}
          >
            {slot.pill}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              color: '#6D6C68',
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            deuntoque.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  )
}
