/* ReservaYa Panel — Service Worker
 *
 * Objetivo: que el panel siga siendo utilizable cuando se cae el internet
 * durante el servicio. El staff puede VER la lista del día y navegar el
 * shell. Las mutaciones (check-in, crear, editar) requieren conexión en
 * esta versión — se mostrará un error amable que no bloquea la UI.
 *
 * Estrategias:
 *   - Shell del panel (HTML, CSS, JS chunks):  cache-first con revalidación
 *   - Navegaciones:                            network-first → cache → /offline.html
 *   - GET /api/reservas | /api/waitlist |
 *     /api/tables      | /api/venue/slots:     stale-while-revalidate
 *   - Otros GET /api/*:                        network-only
 *   - POST/PATCH/DELETE /api/*:                network-only (sin caché)
 *
 * Bumpear SW_VERSION invalida todos los cachés viejos en `activate`.
 */

const SW_VERSION = 'ry-panel-v1'
const SHELL_CACHE = `${SW_VERSION}-shell`
const DATA_CACHE  = `${SW_VERSION}-data`
const OFFLINE_URL = '/offline.html'

// Pre-cache del shell básico — el resto se cachea lazy al navegar
const SHELL_ASSETS = [
  OFFLINE_URL,
  '/manifest.json',
]

// Endpoints que queremos servir desde caché cuando estamos offline
const SWR_PATHS = [
  '/api/reservas',
  '/api/waitlist',
  '/api/tables',
  '/api/venue/slots',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

/** ¿Es este request un endpoint SWR (datos del panel)? */
function isSwrRequest(url) {
  return SWR_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'))
}

/** Stale-while-revalidate: respondemos del caché si hay, revalidamos en bg.
 *  Si no hay caché, vamos a la red; si la red falla, devolvemos un 503 JSON
 *  genérico (no un HTML roto). */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DATA_CACHE)
  const cached = await cache.match(request)

  const networkPromise = fetch(request)
    .then((response) => {
      // Sólo cacheamos 200 OK — evitamos guardar 401/403 de sesiones expiradas
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) {
    // Disparamos la revalidación sin esperarla
    networkPromise
    return cached
  }

  const fresh = await networkPromise
  if (fresh) return fresh

  return new Response(
    JSON.stringify({ error: 'offline', message: 'Sin conexión' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  )
}

/** Network-first para navegaciones HTML.
 *  Si la red falla, tiramos del caché; si tampoco hay, mostramos /offline.html. */
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(SHELL_CACHE)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cache = await caches.open(SHELL_CACHE)
    const cached = await cache.match(request)
    if (cached) return cached
    const offline = await cache.match(OFFLINE_URL)
    return offline ?? new Response('Sin conexión', { status: 503 })
  }
}

/** Cache-first para assets estáticos de Next (chunks, _next/static/*). */
async function cacheFirstAsset(request) {
  const cache = await caches.open(SHELL_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    return cached ?? new Response('', { status: 504 })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return // mutaciones: paso directo a la red

  const url = new URL(request.url)

  // Ignoramos extensiones de navegador, websockets, etc.
  if (url.origin !== self.location.origin) return

  // 1) Datos del panel: SWR
  if (isSwrRequest(url)) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // 2) Otros endpoints API: red directa (no cacheamos auth, webhooks, etc.)
  if (url.pathname.startsWith('/api/')) return

  // 3) Assets estáticos de Next
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon-')) {
    event.respondWith(cacheFirstAsset(request))
    return
  }

  // 4) Navegaciones HTML
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  // Default: network-first suave con fallback a caché
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached ?? new Response('', { status: 504 }))
    )
  )
})

// Permite forzar actualización desde la app (ej: tras un deploy)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
