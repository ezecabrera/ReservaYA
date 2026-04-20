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

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
    // Performance: sampling conservador para no quemar quota
    tracesSampleRate: 0.1,
    // Solo capturamos replays cuando hay un error (no todos los sesiones)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    // Ignorar errores esperables del cliente
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Errores de extensiones del browser
      /extension\//i,
    ],
  })
}
