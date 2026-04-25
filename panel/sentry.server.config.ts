/**
 * Sentry — server-side config (Node runtime).
 * Ver sentry.client.config.ts para instrucciones de activación.
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'
const release = process.env.VERCEL_GIT_COMMIT_SHA

const SENSITIVE_KEYS = [
  'password',
  'pass',
  'token',
  'authorization',
  'cookie',
  'set-cookie',
  'api_key',
  'apikey',
  'secret',
  'access_token',
  'refresh_token',
  'mp_access_token',
  'service_role',
  'supabase_service_role_key',
]

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 6 || obj == null) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map((v) => redact(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const lower = k.toLowerCase()
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      out[k] = '[REDACTED]'
    } else {
      out[k] = redact(v, depth + 1)
    }
  }
  return out
}

if (dsn) {
  Sentry.init({
    dsn,
    environment: env,
    release,
    tracesSampleRate: env === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        if (event.request.headers) {
          event.request.headers = redact(event.request.headers) as Record<
            string,
            string
          >
        }
        if (event.request.cookies) {
          event.request.cookies = '[REDACTED]' as unknown as Record<string, string>
        }
        if (event.request.data) {
          event.request.data = redact(event.request.data)
        }
      }
      if (event.extra) {
        event.extra = redact(event.extra) as Record<string, unknown>
      }
      if (event.contexts) {
        event.contexts = redact(event.contexts) as typeof event.contexts
      }
      return event
    },
    ignoreErrors: [
      'NEXT_REDIRECT',
      'NEXT_NOT_FOUND',
      'AbortError',
      'ECONNRESET',
      'EPIPE',
      // Hot-reload dev noise
      /HMR/i,
      /webpack-hmr/i,
    ],
  })

  if (release) {
    Sentry.setTag('release', release)
  }
}
