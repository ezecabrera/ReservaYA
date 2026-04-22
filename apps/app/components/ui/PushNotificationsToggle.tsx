'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Toggle para activar/desactivar notificaciones push del navegador.
 *
 * Estado de permisos (Notification API):
 *  - 'default': nunca preguntamos → mostramos botón "Activar"
 *  - 'granted': tiene permiso → mostramos switch on, user puede desactivar
 *  - 'denied': rechazó → mensaje "Desbloqueá desde el browser"
 *
 * El toggle guarda la preferencia en auth.user_metadata.push_enabled.
 * Cuando haya VAPID keys + web-push server setup, este toggle también
 * suscribirá al user vía /api/push/subscribe.
 */
export function PushNotificationsToggle() {
  const [supported, setSupported] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setSupported(false)
      return
    }
    setPermission(Notification.permission)

    // Leer la preferencia guardada
    supabase.auth.getUser().then(({ data }) => {
      const pushed = (data.user?.user_metadata?.push_enabled ?? false) as boolean
      setEnabled(pushed && Notification.permission === 'granted')
    })
  }, [supabase])

  async function handleActivate() {
    if (typeof Notification === 'undefined') return
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm === 'granted') {
        setEnabled(true)
        await supabase.auth.updateUser({ data: { push_enabled: true } })
        // Test notification — feedback inmediato de que funciona
        new Notification('🎉 Notificaciones activadas', {
          body: 'Te vamos a avisar cuando tu reserva esté próxima.',
          icon: '/icons/icon-192.png',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    setLoading(true)
    try {
      await supabase.auth.updateUser({ data: { push_enabled: false } })
      setEnabled(false)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <div className="bg-sf rounded-xl p-4 border border-[var(--br)]">
        <p className="text-[13px] font-bold text-tx">Notificaciones no disponibles</p>
        <p className="text-[12px] text-tx3 mt-1">
          Tu navegador no soporta notificaciones push. Probá desde Chrome,
          Safari 16+ o Edge.
        </p>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="bg-c1l rounded-xl p-4 border border-[var(--c1)]/20">
        <p className="text-[13px] font-bold text-c1">Notificaciones bloqueadas</p>
        <p className="text-[12px] text-tx2 mt-1 leading-relaxed">
          Desbloqueá las notificaciones desde el ícono del candado en la
          barra de direcciones del navegador, después volvé acá.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-[var(--br)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-[13.5px] font-bold text-tx">Notificaciones</p>
          <p className="text-[12px] text-tx3 mt-0.5 leading-snug">
            Avisos de reservas próximas, cambios de estado y novedades de tus
            restaurantes favoritos.
          </p>
        </div>
        {permission === 'granted' ? (
          <button
            onClick={enabled ? handleDisable : handleActivate}
            disabled={loading}
            role="switch"
            aria-checked={enabled}
            aria-label={enabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
            className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200
                        ${enabled ? 'bg-c1' : 'bg-sf2'}
                        ${loading ? 'opacity-50' : ''}`}
          >
            <span
              aria-hidden
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
                          ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        ) : (
          <button
            onClick={handleActivate}
            disabled={loading}
            className="flex-shrink-0 bg-c1 text-white text-[12px] font-bold
                       px-3 py-1.5 rounded-full active:scale-95 transition-transform
                       disabled:opacity-60"
          >
            {loading ? '…' : 'Activar'}
          </button>
        )}
      </div>
    </div>
  )
}
