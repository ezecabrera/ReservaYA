'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { VenueImage } from '@/lib/shared/types/venue-image'
import { thumbUrl } from '@/lib/venue-image-url'

interface VenueGalleryProps {
  images: VenueImage[]
}

const SWIPE_THRESHOLD = 50 // px

export function VenueGallery({ images }: VenueGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  const open = useCallback((i: number) => setLightboxIdx(i), [])
  const close = useCallback(() => setLightboxIdx(null), [])

  const prev = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)))
  }, [])
  const next = useCallback(() => {
    setLightboxIdx((i) =>
      i === null ? null : Math.min(images.length - 1, i + 1),
    )
  }, [images.length])

  // Bloquear scroll del body + listener de teclado mientras el lightbox está abierto.
  useEffect(() => {
    if (lightboxIdx === null) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxIdx, close, prev, next])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const dx = endX - touchStartX.current
    touchStartX.current = null
    if (dx > SWIPE_THRESHOLD) prev()
    else if (dx < -SWIPE_THRESHOLD) next()
  }

  if (images.length === 0) return null

  return (
    <>
      {/* Mobile: scroll horizontal con snap. Desktop: grid 3 cols */}
      <div
        className="
          md:grid md:grid-cols-3 md:gap-3
          flex md:block gap-3 overflow-x-auto md:overflow-visible
          snap-x snap-mandatory md:snap-none
          px-4 md:px-0 -mx-4 md:mx-0
          py-2
          no-scrollbar
        "
      >
        {images.map((img, i) => {
          const thumb = thumbUrl(img.url, { width: 600, height: 600, quality: 80 })
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => open(i)}
              className="
                flex-shrink-0 md:flex-shrink
                w-[280px] h-[280px] md:w-auto md:h-auto
                md:aspect-square
                snap-start md:snap-align-none
                relative overflow-hidden rounded-xl
                bg-[var(--br)]
                active:scale-[0.98] transition-transform
              "
              aria-label={`Abrir foto ${i + 1} de ${images.length}: ${img.alt_text}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb}
                alt={img.alt_text}
                loading={i < 2 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover"
                width={img.width ?? undefined}
                height={img.height ?? undefined}
              />
            </button>
          )
        })}
      </div>

      {/* Lightbox modal */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Galería de fotos"
        >
          {/* Counter */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10
                       text-white text-sm font-medium
                       bg-black/40 backdrop-blur-sm rounded-full px-3 py-1
                       pointer-events-none"
          >
            {lightboxIdx + 1}/{images.length}
          </div>

          {/* Close (≥44px touch target) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              close()
            }}
            aria-label="Cerrar galería"
            className="absolute top-3 right-3 z-10
                       w-11 h-11 rounded-full bg-white/15 hover:bg-white/25
                       flex items-center justify-center transition-colors
                       active:scale-95"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Prev (≥44px) */}
          {lightboxIdx > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              aria-label="Foto anterior"
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10
                         w-11 h-11 md:w-12 md:h-12 rounded-full
                         bg-white/15 hover:bg-white/25
                         flex items-center justify-center transition-colors
                         active:scale-95"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* Next (≥44px) */}
          {lightboxIdx < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              aria-label="Foto siguiente"
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10
                         w-11 h-11 md:w-12 md:h-12 rounded-full
                         bg-white/15 hover:bg-white/25
                         flex items-center justify-center transition-colors
                         active:scale-95"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl(images[lightboxIdx].url, { width: 1600, quality: 85 })}
              alt={images[lightboxIdx].alt_text}
              className="max-w-full max-h-[88vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default VenueGallery
