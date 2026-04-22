/**
 * Rate limiting en memoria — simple token bucket por IP.
 *
 * LIMITACIONES:
 * - Se resetea al reiniciar el server (deploy en Vercel = fresh memory).
 * - No comparte estado entre regiones/instancias.
 * - Para prod serio, migrar a Upstash Redis.
 *
 * Sirve como **primera línea de defensa** para evitar abusos triviales
 * del form de landing y el onboarding público.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Cleanup periódico de buckets viejos (evita memory leak si el server queda vivo mucho)
let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt < now) buckets.delete(k)
  }
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

/**
 * @param key identificador único (típicamente `ip:scope`)
 * @param limit máx requests por ventana
 * @param windowMs tamaño de la ventana en ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanup()
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/**
 * Extrae el IP del cliente desde headers estándar de Vercel/Cloudflare.
 * Retorna 'unknown' si no encuentra — el rate limit aún aplica contra ese
 * string (no se bypassa mandando headers vacíos).
 */
export function getClientIp(req: Request | { headers: Headers }): string {
  const h = req.headers
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    'unknown'
  )
}
