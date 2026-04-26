/**
 * Helper para servir thumbnails de imágenes de venue con la transformación
 * on-the-fly de Supabase Storage.
 *
 * Convierte URLs públicas (`/storage/v1/object/public/...`) al endpoint de
 * render (`/storage/v1/render/image/public/...`) y agrega query params para
 * resize/quality. Útil para galería (~400px) y hero (~1200px).
 *
 * Si la URL no es de Supabase (ej. ya es una URL externa de LoremFlickr o
 * un CDN custom), la devuelve sin tocar — fail-safe.
 */
export function thumbUrl(
  url: string,
  opts: { width?: number; height?: number; quality?: number } = {},
): string {
  try {
    const u = new URL(url)
    const isSupabase = u.pathname.includes('/storage/v1/object/public/')
    if (!isSupabase) return url

    if (opts.width) u.searchParams.set('width', String(opts.width))
    if (opts.height) u.searchParams.set('height', String(opts.height))
    u.searchParams.set('quality', String(opts.quality ?? 80))
    u.pathname = u.pathname.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/',
    )
    return u.toString()
  } catch {
    // URL inválida — devolver original sin transformar.
    return url
  }
}
