/**
 * Rate limiter en memoria — simple y efectivo para piloto.
 *
 * Guarda contadores por clave (ej. IP+endpoint) en un Map con ventana
 * deslizante. Usa timestamps para expirar entries automáticamente.
 *
 * Limitaciones conscientes:
 *  - In-memory: si Vercel escala a N instancias, cada una tiene su propio Map
 *    → límite efectivo es N×límite. Suficiente hasta ~1k reqs/min totales.
 *  - Se reinicia al redeployear. Si alguien abusa justo durante un deploy,
 *    pasa sin contador → risk bajo.
 *
 * Para piloto masivo: migrar a Upstash Redis con @upstash/ratelimit. El
 * swap es trivial — mismo interface.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Cleanup periódico para evitar memory leak en ventana de deploy larga
// (cada hora barrido de entries ya expiradas).
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k)
    }
  }, 60_000 * 60)
}

export interface RateLimitOptions {
  /** Key única (ej. "ip-of-user:endpoint-name"). */
  key: string
  /** Cantidad máxima de requests permitidos en la ventana. */
  limit: number
  /** Ventana en segundos. */
  windowSec: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

export function rateLimit({ key, limit, windowSec }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSec * 1000
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    // Primera request o ventana expirada → resetear
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/**
 * Helper: extrae una "key de identidad" del request. Prioriza header
 * x-forwarded-for (Vercel lo popula con la IP real del cliente). Falla
 * silenciosa a "anon" si no hay header → todos los anónimos comparten
 * bucket, lo cual es más estricto (bien para piloto).
 */
export function clientKey(request: Request, endpoint: string): string {
  const fwd = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = fwd ?? request.headers.get('x-real-ip') ?? 'anon'
  return `${ip}:${endpoint}`
}
