import { ImageResponse } from 'next/og'

/**
 * Apple touch icon dinámico — Next.js metadata file convention.
 * 180×180 con la "u" minúscula Fraunces sobre lila pastel.
 */

export const runtime = 'edge'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          fontSize: 150,
          lineHeight: 1,
          borderRadius: 36,
        }}
      >
        u
      </div>
    ),
    { ...size },
  )
}
