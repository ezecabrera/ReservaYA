/**
 * Sentry — edge runtime config (middleware, edge routes).
 * Ver sentry.client.config.ts para instrucciones de activación.
 *
 * Edge runtime = APIs limitadas (no Node modules). Mantenemos beforeSend liviano.
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'
const release = process.env.VERCEL_GIT_COMMIT_SHA

const SENSITIVE_KEYS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'api_key',
  'apikey',
  'secret',
]

function shallowRedact(
  obj: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!obj) return obj
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase()
    out[k] = SENSITIVE_KEYS.some((s) => lower.includes(s)) ? '[REDACTED]' : v
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
      if (event.request?.headers) {
        event.request.headers = shallowRedact(
          event.request.headers as Record<string, unknown>,
        ) as Record<string, string>
      }
      if (event.request?.cookies) {
        event.request.cookies = '[REDACTED]' as unknown as Record<string, string>
      }
      return event
    },
    ignoreErrors: [
      'NEXT_REDIRECT',
      'NEXT_NOT_FOUND',
      'AbortError',
    ],
  })

  if (release) {
    Sentry.setTag('release', release)
  }
}
