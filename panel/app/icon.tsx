import { ImageResponse } from 'next/og'

/**
 * Favicon dinámico — Next.js metadata file convention.
 * Genera un PNG 32×32 con la "u" minúscula Fraunces sobre lila pastel.
 */

export const runtime = 'edge'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#E4CDED',
          color: '#A13143',
          fontFamily: 'serif',
          fontWeight: 800,
          fontStyle: 'italic',
          fontSize: 28,
          lineHeight: 1,
          borderRadius: 6,
        }}
      >
        u
      </div>
    ),
    { ...size },
  )
}
