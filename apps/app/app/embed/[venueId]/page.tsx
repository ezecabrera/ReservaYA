import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server-admin'

// Widget embebible — se usa con iframe desde Instagram, web del restaurant, etc.
// URL: /embed/[venueId]   (dominio de la app cliente)
// Sin auth. Next.js respeta el header X-Frame-Options: ALLOWALL definido en
// next.config.mjs solo para la ruta /embed/*.

export const dynamic = 'force-dynamic'

interface Venue {
  id: string
  name: string
  address: string | null
  description: string | null
  image_url: string | null
  is_active: boolean
}

export default async function EmbedPage({ params }: { params: { venueId: string } }) {
  const admin = createAdminClient()
  const { data: venue } = await admin
    .from('venues')
    .select('id, name, address, description, image_url, is_active')
    .eq('id', params.venueId)
    .eq('is_active', true)
    .single() as { data: Venue | null }

  if (!venue) return notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const reserveUrl = `${appUrl}/${venue.id}`

  return (
    <html lang="es" style={{ margin: 0, padding: 0 }}>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div
          style={{
            maxWidth: 360,
            margin: '0 auto',
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.08)',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {venue.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={venue.image_url}
              alt={venue.name}
              style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: 100,
                background: 'linear-gradient(135deg, #0F3460 0%, #16213E 100%)',
              }}
            />
          )}

          <div style={{ padding: 20 }}>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                fontWeight: 700,
                color: '#ABABBA',
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
              }}
            >
              Reservar en
            </p>
            <h2
              style={{
                margin: '4px 0 2px',
                fontSize: 22,
                fontWeight: 700,
                color: '#0D0D0D',
                lineHeight: 1.1,
              }}
            >
              {venue.name}
            </h2>
            {venue.address && (
              <p style={{ margin: 0, fontSize: 12, color: '#5A5A6E' }}>{venue.address}</p>
            )}

            <Link
              href={reserveUrl}
              target="_top"
              style={{
                display: 'block',
                marginTop: 16,
                padding: '12px 16px',
                background: '#0F3460',
                color: '#FFFFFF',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 14,
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Reservar mesa →
            </Link>

            <p
              style={{
                margin: '12px 0 0',
                fontSize: 10,
                color: '#ABABBA',
                textAlign: 'center',
              }}
            >
              Reservas por{' '}
              <a
                href={appUrl}
                target="_top"
                style={{ color: '#0F3460', textDecoration: 'none', fontWeight: 600 }}
              >
                UnToque
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
