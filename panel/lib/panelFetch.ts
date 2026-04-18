/**
 * Wrapper sobre `fetch` que degrada con un mensaje útil cuando el navegador
 * está offline, en vez del críptico "Failed to fetch".
 *
 * Regla: GETs pueden ser servidos por el service worker desde caché, pero
 * las mutaciones siempre van a la red. Por eso este helper está diseñado
 * para envolver POST/PATCH/DELETE, donde un "offline" es fatal para la acción.
 *
 * Devuelve un Response con status=503 y body { error, offline: true } sin red.
 */
export async function mutateFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return new Response(
      JSON.stringify({
        error: 'Sin conexión — volvé a intentar cuando tengas internet',
        offline: true,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    return await fetch(input, init)
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Sin conexión — volvé a intentar cuando tengas internet',
        offline: true,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
