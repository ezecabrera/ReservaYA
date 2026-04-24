/* UnToque · Rate limiter con Upstash Redis (sliding window) + fallback in-memory.
 *
 * Uso:
 *   import { rateLimit } from '@/lib/rate-limit'
 *
 *   const rl = await rateLimit(request, { key: 'public-search', limit: 30, windowSec: 60 })
 *   if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, {
 *     status: 429,
 *     headers: { 'Retry-After': String(rl.retryAfter) },
 *   })
 *
 * Si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN están definidos, usa Redis.
 * Si no, fallback a un Map en memoria (válido para un solo serverless instance —
 * no comparte entre instancias, pero protege en dev y como red-herring en prod).
 */

import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

interface RateLimitOptions {
  /** Identificador lógico del bucket (ej. 'login', 'campaign-send'). */
  key: string
  /** Máximo número de requests por ventana. */
  limit: number
  /** Ventana en segundos. */
  windowSec: number
  /** Identificador override (default: IP del request). */
  identifier?: string
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfter: number
  limit: number
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

/** Estado in-memory por bucket — Map<bucketKey, timestamps[]>. */
const memoryStore = new Map<string, number[]>()

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

/**
 * Sliding-window rate limiter.
 * Usa Upstash si hay env vars; fallback in-memory en otro caso.
 */
export async function rateLimit(
  request: NextRequest,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const ident = opts.identifier ?? getClientIp(request)
  const bucket = `rl:${opts.key}:${ident}`
  const now = Date.now()
  const windowMs = opts.windowSec * 1000

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      return await rateLimitUpstash(bucket, opts.limit, windowMs, now)
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : err, bucket },
        'rate-limit upstash failed, falling back to memory',
      )
    }
  }

  return rateLimitMemory(bucket, opts.limit, windowMs, now)
}

/** Sliding window via ZSET en Upstash (atómico vía pipeline). */
async function rateLimitUpstash(
  bucket: string,
  limit: number,
  windowMs: number,
  now: number,
): Promise<RateLimitResult> {
  const minScore = now - windowMs
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`

  // Pipeline: cleanup + add + count + ttl
  const body = [
    ['ZREMRANGEBYSCORE', bucket, '0', String(minScore)],
    ['ZADD', bucket, String(now), member],
    ['ZCARD', bucket],
    ['PEXPIRE', bucket, String(windowMs)],
  ]

  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`upstash status ${res.status}`)
  const json = (await res.json()) as Array<{ result: number }>
  const count = json[2]?.result ?? 0

  const remaining = Math.max(0, limit - count)
  const ok = count <= limit
  return {
    ok,
    remaining,
    limit,
    retryAfter: ok ? 0 : Math.ceil(windowMs / 1000),
  }
}

/** Fallback in-memory — array de timestamps recortado a la ventana. */
function rateLimitMemory(
  bucket: string,
  limit: number,
  windowMs: number,
  now: number,
): RateLimitResult {
  const minScore = now - windowMs
  const arr = (memoryStore.get(bucket) ?? []).filter((t) => t > minScore)
  arr.push(now)
  memoryStore.set(bucket, arr)

  // Garbage collect ocasional para evitar leak
  if (memoryStore.size > 5000) {
    for (const [k, v] of memoryStore) {
      if (v.length === 0 || v[v.length - 1] < minScore) memoryStore.delete(k)
    }
  }

  const ok = arr.length <= limit
  return {
    ok,
    remaining: Math.max(0, limit - arr.length),
    limit,
    retryAfter: ok ? 0 : Math.ceil(windowMs / 1000),
  }
}

/** Helper para responder 429 standard. */
export function tooManyRequests(rl: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(rl.retryAfter),
      'X-RateLimit-Limit': String(rl.limit),
      'X-RateLimit-Remaining': '0',
    },
  })
}
