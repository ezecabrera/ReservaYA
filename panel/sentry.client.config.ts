/**
 * Sentry — client-side config.
 * Sólo se inicializa si existe la env var NEXT_PUBLIC_SENTRY_DSN. Sin DSN,
 * el SDK queda dormido (noop) y no afecta la app.
 *
 * Para activar:
 *   1. Crear proyecto Next.js en sentry.io
 *   2. Agregar NEXT_PUBLIC_SENTRY_DSN="https://..." a .env.local y a Vercel
 *   3. Redeploy
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
const env =
  process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'
const release = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA

// PII / secret patterns que filtramos antes de mandar a Sentry
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
    // Performance: 100% en dev/preview, 10% en prod para no quemar quota
    tracesSampleRate: env === 'production' ? 0.1 : 1.0,
    // Replays sólo cuando hay error
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Redact request/headers/extra
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
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'NetworkError when attempting to fetch resource',
      'Failed to fetch',
      'Load failed',
      'AbortError',
      // Hot-reload Next.js dev
      'HMR',
      'webpack-hmr',
      'Cannot find module',
      'Loading chunk',
      'ChunkLoadError',
      // Errores de extensiones del browser
      /extension\//i,
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
    ],
    denyUrls: [
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
      /safari-extension:\/\//i,
    ],
  })

  if (release) {
    Sentry.setTag('release', release)
  }
}
