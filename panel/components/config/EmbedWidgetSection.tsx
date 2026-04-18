'use client'

import { useState } from 'react'

interface Props {
  venueId: string
  venueName: string
  /** Base URL pública del app cliente (ej: https://reservaya.app). */
  appBaseUrl: string
}

/**
 * Muestra el snippet HTML para embeber el widget de reservas en Instagram
 * o en la web del restaurante. Incluye copy-to-clipboard y preview del iframe.
 *
 * Posicionamiento del pitch: "reservas desde tu Instagram sin comisión".
 */
export function EmbedWidgetSection({ venueId, venueName, appBaseUrl }: Props) {
  const base = appBaseUrl.replace(/\/$/, '')

  const snippet = `<div data-reservaya-venue="${venueId}"></div>
<script src="${base}/embed.js" async></script>`

  const iframeUrl = `${base}/embed/${venueId}`

  const [copied, setCopied] = useState<'snippet' | 'iframe' | null>(null)

  function copy(text: string, key: 'snippet' | 'iframe') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <div>
      <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
        Widget embebible
      </p>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
        <div>
          <p className="text-white font-semibold text-[14px]">
            Reservas desde tu web o Instagram
          </p>
          <p className="text-white/55 text-[12.5px] leading-snug mt-1">
            Pegá este código en tu sitio o usalo como link desde tu bio de
            Instagram. Las reservas que entren por acá son <span className="font-bold">tuyas</span>,
            sin comisión.
          </p>
        </div>

        {/* Snippet HTML */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-white/45 uppercase tracking-wider">
              HTML para tu sitio
            </span>
            <button
              type="button"
              onClick={() => copy(snippet, 'snippet')}
              className="text-[11px] font-bold text-c2 hover:underline"
            >
              {copied === 'snippet' ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <pre className="bg-black/35 border border-white/10 rounded-xl p-3
                          text-[11px] text-white/80 font-mono overflow-x-auto whitespace-pre">
{snippet}
          </pre>
        </div>

        {/* Direct link (para Instagram link-in-bio) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-white/45 uppercase tracking-wider">
              Link directo (para Instagram bio)
            </span>
            <button
              type="button"
              onClick={() => copy(iframeUrl, 'iframe')}
              className="text-[11px] font-bold text-c2 hover:underline"
            >
              {copied === 'iframe' ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="bg-black/35 border border-white/10 rounded-xl px-3 py-2.5
                          text-[12px] text-white/80 font-mono break-all">
            {iframeUrl}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <a
            href={iframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2.5 rounded-xl bg-c2/20 border border-c2/35
                       text-white text-[13px] font-bold"
          >
            Ver preview
          </a>
        </div>

        <p className="text-[10.5px] text-white/35 italic">
          {venueName} · ID: {venueId}
        </p>
      </div>
    </div>
  )
}
