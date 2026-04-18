'use client'

import { useState } from 'react'

interface Props {
  venueId: string
  venueName: string
  /** Base URL pública del app cliente (ej: https://reservaya.app). */
  appBaseUrl: string
}

type DeviceFrame = 'mobile' | 'desktop'

/**
 * Muestra el snippet HTML para embeber el widget de reservas en Instagram
 * o en la web del restaurante. Incluye copy-to-clipboard y preview del iframe
 * en vivo — toggle con mobile / desktop frames.
 *
 * Posicionamiento del pitch: "reservas desde tu Instagram sin comisión".
 */
export function EmbedWidgetSection({ venueId, venueName, appBaseUrl }: Props) {
  const base = appBaseUrl.replace(/\/$/, '')

  const snippet = `<div data-reservaya-venue="${venueId}"></div>
<script src="${base}/embed.js" async></script>`

  const iframeUrl = `${base}/embed/${venueId}`

  const [copied, setCopied] = useState<'snippet' | 'iframe' | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [device, setDevice] = useState<DeviceFrame>('mobile')

  function copy(text: string, key: 'snippet' | 'iframe') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <div>
      <p className="text-[11px] font-bold text-ink-text-3 uppercase tracking-[0.12em] mb-3">
        Widget embebible
      </p>

      <div className="bg-ink-2 border border-ink-line rounded-2xl p-4 space-y-4">
        <div>
          <p className="text-ink-text font-semibold text-[14px]">
            Reservas desde tu web o Instagram
          </p>
          <p className="text-ink-text-2 text-[12.5px] leading-snug mt-1">
            Pegá este código en tu sitio o usalo como link desde tu bio de
            Instagram. Las reservas que entren por acá son <span className="font-bold text-ink-text">tuyas</span>,
            sin comisión.
          </p>
        </div>

        {/* Snippet HTML */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-bold text-ink-text-3 uppercase tracking-[0.12em]">
              HTML para tu sitio
            </span>
            <button
              type="button"
              onClick={() => copy(snippet, 'snippet')}
              className="text-[11px] font-bold text-olive hover:brightness-110 transition-all"
            >
              {copied === 'snippet' ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <pre className="bg-ink border border-ink-line-2 rounded-xl p-3
                          text-[11px] text-ink-text/85 font-mono overflow-x-auto whitespace-pre">
{snippet}
          </pre>
        </div>

        {/* Direct link (para Instagram link-in-bio) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-bold text-ink-text-3 uppercase tracking-[0.12em]">
              Link directo (para Instagram bio)
            </span>
            <button
              type="button"
              onClick={() => copy(iframeUrl, 'iframe')}
              className="text-[11px] font-bold text-olive hover:brightness-110 transition-all"
            >
              {copied === 'iframe' ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="bg-ink border border-ink-line-2 rounded-xl px-3 py-2.5
                          text-[12px] text-ink-text/85 font-mono break-all">
            {iframeUrl}
          </div>
        </div>

        {/* Preview controls */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            aria-expanded={previewOpen}
            className="flex-1 py-2.5 rounded-xl bg-olive/20 border border-olive/35
                       text-olive text-[13px] font-bold
                       hover:bg-olive/28 transition-colors
                       flex items-center justify-center gap-2"
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              className={`transition-transform duration-200 ${previewOpen ? 'rotate-180' : ''}`}
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {previewOpen ? 'Ocultar preview' : 'Ver preview en vivo'}
          </button>
          <a
            href={iframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir en pestaña nueva"
            className="h-10 px-3 rounded-xl bg-ink border border-ink-line-2
                       text-ink-text-2 text-[12px] font-semibold
                       flex items-center justify-center gap-1.5
                       hover:text-ink-text hover:border-ink-line-2/80 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M14 3h7v7M10 14l11-11M21 14v7H3V3h7"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Nueva pestaña
          </a>
        </div>

        {/* Preview iframe inline — carga lazy, sólo cuando el toggle está abierto */}
        {previewOpen && (
          <div className="pt-1 animate-[fadeUp_0.26s_cubic-bezier(0.32,0.72,0,1)_both]">
            {/* Device selector */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10.5px] font-bold text-ink-text-3 uppercase tracking-[0.12em]">
                Preview
              </span>
              <div className="inline-flex p-0.5 rounded-lg bg-ink border border-ink-line-2">
                {(['mobile', 'desktop'] as DeviceFrame[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    className={`h-7 px-2.5 rounded-md text-[10.5px] font-bold uppercase
                                tracking-[0.08em] transition-colors
                                ${device === d
                                  ? 'bg-ink-3 text-ink-text'
                                  : 'text-ink-text-3 hover:text-ink-text-2'}`}
                  >
                    {d === 'mobile' ? 'Mobile' : 'Desktop'}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame device */}
            <div className="rounded-2xl bg-ink border border-ink-line-2 p-4
                            flex items-center justify-center overflow-hidden">
              {device === 'mobile' ? (
                <div
                  className="relative rounded-[32px] bg-paper overflow-hidden
                             shadow-[0_18px_44px_-10px_rgba(0,0,0,0.55)]
                             border-[6px] border-ink-3"
                  style={{ width: 300, height: 540 }}
                >
                  <iframe
                    src={iframeUrl}
                    title={`Preview embebible · ${venueName}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  className="relative rounded-lg bg-paper overflow-hidden
                             shadow-[0_18px_44px_-10px_rgba(0,0,0,0.55)]
                             border border-ink-3"
                  style={{ width: '100%', maxWidth: 640, height: 480 }}
                >
                  {/* Browser chrome minimalista */}
                  <div className="h-6 bg-ink-3 border-b border-ink-line-2 flex items-center px-2.5 gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-wine-soft/70" />
                    <span className="w-2 h-2 rounded-full bg-gold/70" />
                    <span className="w-2 h-2 rounded-full bg-olive/70" />
                    <span className="ml-3 text-[9.5px] font-mono text-ink-text-3 truncate">
                      {iframeUrl.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                  <iframe
                    src={iframeUrl}
                    title={`Preview embebible · ${venueName}`}
                    className="w-full border-0"
                    style={{ height: 'calc(100% - 24px)' }}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
            <p className="text-[10.5px] text-ink-text-3 mt-2 leading-snug">
              Esto es exactamente lo que ve un cliente que entra por tu link.
              Probá el flow de reserva sin miedo — no dispara pagos reales.
            </p>
          </div>
        )}

        <p className="text-[10.5px] text-ink-text-3 italic">
          {venueName} · ID: <span className="font-mono">{venueId}</span>
        </p>
      </div>
    </div>
  )
}
