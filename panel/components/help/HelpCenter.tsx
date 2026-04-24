'use client'

import { useMemo, useState } from 'react'
import { Ic } from '@/components/ui/brand'

interface FaqItem {
  q: string
  a: string
  tags: string[]
}

interface FaqSection {
  id: string
  title: string
  emoji: string
  items: FaqItem[]
}

const SECTIONS: FaqSection[] = [
  {
    id: 'reservas',
    title: 'Reservas',
    emoji: '📅',
    items: [
      {
        q: '¿Cómo recibo una nueva reserva en tiempo real?',
        a: 'El panel se conecta automáticamente vía WebSocket. Cuando llega una reserva nueva escuchás un sonido, aparece un toast verde y la mesa hace pulse. Si activás notificaciones push, te llega también con la app cerrada.',
        tags: ['notif', 'push', 'realtime'],
      },
      {
        q: '¿Por qué no escucho el sonido de notificación?',
        a: 'Verificá que tu navegador no haya bloqueado el audio (ícono de mute en la pestaña). En iOS Safari requiere primer toque del usuario para habilitar audio. Probá tocar cualquier botón del panel y volvé a esperar la notificación.',
        tags: ['notif', 'audio', 'safari'],
      },
      {
        q: '¿Qué pasa si dos clientes reservan la misma mesa al mismo tiempo?',
        a: 'El sistema bloquea con constraint EXCLUDE en Postgres usando rangos de tiempo. El segundo intento recibe error 409 — uno solo puede ganar la mesa.',
        tags: ['concurrency', 'mesa'],
      },
      {
        q: '¿Cómo cancelo una reserva como restaurante?',
        a: 'Tocá la card de la reserva → "Cambiar estado" → "Cancelada". Se libera la mesa automáticamente. Si la cancelación es tardía (<2h del horario) se aplica penalización configurable.',
        tags: ['cancel'],
      },
    ],
  },
  {
    id: 'mesas',
    title: 'Mesas y zonas',
    emoji: '🪑',
    items: [
      {
        q: '¿Cómo edito el plano del salón?',
        a: 'Andá a /dashboard/config/plano. Arrastrá las mesas a su posición real. Los cambios se guardan automáticamente. La vista se renderiza igual en el panel del cliente.',
        tags: ['plano', 'config'],
      },
      {
        q: '¿Cómo agrupo mesas para un evento grande?',
        a: 'En la vista Mesas seleccioná la primera mesa, mantené Shift y tocá las contiguas. Aparece la opción "Unir mesas". Se tratan como una sola unidad hasta que el grupo termine.',
        tags: ['grupo', 'evento'],
      },
      {
        q: '¿Qué significa el color de las mesas?',
        a: 'Verde menta = libre · Amarillo manteca = reservada próxima · Azul cielo = en servicio · Rosado = pidió la cuenta · Lavanda = mesa unida.',
        tags: ['colores', 'estados'],
      },
    ],
  },
  {
    id: 'crm',
    title: 'Clientes y CRM',
    emoji: '👥',
    items: [
      {
        q: '¿Cómo identifico a un cliente con riesgo?',
        a: 'En CRM, los clientes con 2+ no-shows o 3+ cancelaciones tardías en 90 días se marcan con badge "Riesgo". Tocá su nombre para ver historial completo.',
        tags: ['riesgo', 'no-show'],
      },
      {
        q: '¿Cómo importo mi base de clientes desde otro sistema?',
        a: 'Andá a Config → Migración → Importar CSV. Soportamos exports de TheFork, Maxirest, Fudo y CSVs genéricos. El wizard auto-mapea las columnas según el origen.',
        tags: ['import', 'migracion'],
      },
      {
        q: '¿Qué es el score RFM?',
        a: 'Recency-Frequency-Monetary: ranking del 1 al 5 en cada dimensión. R=hace cuánto vino, F=cuántas veces, M=cuánto gasta. 555 = mejor cliente, 111 = lost.',
        tags: ['rfm', 'analytics'],
      },
    ],
  },
  {
    id: 'campanas',
    title: 'Campañas WhatsApp',
    emoji: '💬',
    items: [
      {
        q: '¿Por qué dice "dry-run" cuando envío una campaña?',
        a: 'Significa que no están configuradas las variables de entorno META_WHATSAPP_TOKEN y META_PHONE_NUMBER_ID. Andá a Vercel → Settings → Environment Variables y completalas. Sin esto, los envíos quedan registrados como "skipped".',
        tags: ['whatsapp', 'meta', 'config'],
      },
      {
        q: '¿Cuántos mensajes puedo enviar por minuto?',
        a: 'Meta WhatsApp Cloud API permite ~80/seg. Nosotros throttle-amos a 5 paralelos por seguridad. En una campaña a 1.000 contactos calculá ~3-4 minutos.',
        tags: ['whatsapp', 'rate-limit'],
      },
      {
        q: '¿Qué template usar para reactivar dormidos?',
        a: 'Recomendamos template "we_miss_you_es_AR" con descuento del 10-15%. Audience: "dormant" (>180d sin venir). En CRM podés ver cuántos califican.',
        tags: ['template', 'dormant'],
      },
    ],
  },
  {
    id: 'pagos',
    title: 'Pagos y suscripción',
    emoji: '💳',
    items: [
      {
        q: '¿Cuánto cuesta UnToque?',
        a: '$30.000 ARS/mes. Trial gratuito de 30 días sin tarjeta. Cancelás cuando quieras desde Mercado Pago. Sin comisión por cubierto.',
        tags: ['precio', 'trial'],
      },
      {
        q: '¿Cómo cobro la seña de una reserva?',
        a: 'En Config → Reservas activá "Requerir seña". Definí monto fijo o porcentaje. La reserva queda en pending_payment hasta que el cliente paga vía Mercado Pago.',
        tags: ['seña', 'mp'],
      },
      {
        q: '¿Dónde veo el comprobante de mi suscripción?',
        a: 'Mercado Pago → Mis suscripciones → UnToque. El recibo se manda al email registrado en MP. Si necesitás factura A, escribinos a soporte@untoque.com.ar.',
        tags: ['factura', 'mp'],
      },
    ],
  },
  {
    id: 'tecnico',
    title: 'Soporte técnico',
    emoji: '🛠️',
    items: [
      {
        q: '¿Funciona offline?',
        a: 'Sí, parcialmente. La PWA cachea la última vista. Las mutaciones (crear reserva, cambiar estado) requieren conexión — quedan pendientes y se sincronizan al volver online.',
        tags: ['offline', 'pwa'],
      },
      {
        q: '¿Qué hago si el panel no carga?',
        a: '1) Hard refresh (Ctrl+Shift+R) 2) Verificá status.untoque.com.ar 3) Si seguís sin acceso, escribinos por WhatsApp al +54 9 11 5555-0000.',
        tags: ['outage'],
      },
      {
        q: '¿Cómo invito a un mozo nuevo?',
        a: 'Config → Staff → "Invitar miembro". Le mandás un mail con el link. Eligen rol (mozo, runner, encargada). Cada uno entra con su propio user.',
        tags: ['staff'],
      },
    ],
  },
]

const SHORTCUTS: Array<{ keys: string; label: string }> = [
  { keys: '?',     label: 'Mostrar atajos' },
  { keys: 'G D',   label: 'Ir a Dashboard' },
  { keys: 'G M',   label: 'Ir a Mesas' },
  { keys: 'G R',   label: 'Ir a Reservas' },
  { keys: 'G C',   label: 'Ir a CRM' },
  { keys: 'N',     label: 'Nueva reserva' },
  { keys: 'W',     label: 'Toggle Waitlist' },
  { keys: '/',     label: 'Buscar cliente' },
  { keys: 'Esc',   label: 'Cerrar modal' },
]

export function HelpCenter() {
  const [query, setQuery] = useState('')
  const [openItem, setOpenItem] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SECTIONS
    return SECTIONS
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (i) =>
            i.q.toLowerCase().includes(q) ||
            i.a.toLowerCase().includes(q) ||
            i.tags.some((t) => t.includes(q)),
        ),
      }))
      .filter((s) => s.items.length > 0)
  }, [query])

  const totalResults = filtered.reduce((acc, s) => acc + s.items.length, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <h1
            className="fr-900"
            style={{ fontSize: 36, color: 'var(--text)', letterSpacing: '-0.02em' }}
          >
            Centro de ayuda
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 6 }}>
            Encontrá respuestas rápidas o escribinos directo si necesitás más.
          </p>
        </header>

        {/* Search */}
        <div
          style={{
            position: 'relative',
            marginBottom: 24,
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar — ej. 'no-show', 'whatsapp', 'cancelar'…"
            style={{
              width: '100%',
              height: 48,
              padding: '0 16px 0 44px',
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-sm)',
              fontSize: 14,
              color: 'var(--text)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-3)',
            }}
          >
            <Ic.search width={18} height={18} />
          </span>
          {query && (
            <span
              className="caps"
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 10,
                color: 'var(--text-3)',
              }}
            >
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 8,
            marginBottom: 28,
          }}
        >
          <a
            href="https://wa.me/5491155550000"
            target="_blank"
            rel="noopener noreferrer"
            className="fr-900"
            style={quickActionStyle('p-mint')}
          >
            <span style={{ fontSize: 22 }}>💬</span>
            WhatsApp
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>
              Lun-Sáb 9-22h
            </span>
          </a>
          <a
            href="mailto:soporte@untoque.com.ar"
            className="fr-900"
            style={quickActionStyle('p-sky')}
          >
            <span style={{ fontSize: 22 }}>✉️</span>
            Email
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>
              Respuesta &lt;24h
            </span>
          </a>
          <a
            href="https://status.untoque.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="fr-900"
            style={quickActionStyle('p-butter')}
          >
            <span style={{ fontSize: 22 }}>📊</span>
            Status
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>
              Uptime en vivo
            </span>
          </a>
        </div>

        {/* FAQ sections */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {filtered.length === 0 && (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--text-3)',
                background: 'var(--bg-2)',
                borderRadius: 'var(--r-sm)',
              }}
            >
              No encontramos respuestas para "{query}".<br />
              Escribinos directo por{' '}
              <a href="https://wa.me/5491155550000" style={{ color: 'var(--text)' }}>
                WhatsApp
              </a>
              .
            </div>
          )}
          {filtered.map((section) => (
            <div key={section.id}>
              <h2
                className="fr-900"
                style={{
                  fontSize: 18,
                  color: 'var(--text)',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{section.emoji}</span> {section.title}
              </h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {section.items.map((item, idx) => {
                  const itemId = `${section.id}-${idx}`
                  const isOpen = openItem === itemId
                  return (
                    <li
                      key={itemId}
                      style={{
                        background: 'var(--bg-2)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--r-sm)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenItem(isOpen ? null : itemId)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        {item.q}
                        <span
                          style={{
                            fontSize: 18,
                            color: 'var(--text-3)',
                            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                            transition: 'transform 200ms ease',
                            flexShrink: 0,
                          }}
                        >
                          +
                        </span>
                      </button>
                      {isOpen && (
                        <div
                          style={{
                            padding: '0 16px 14px',
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: 'var(--text-2)',
                          }}
                        >
                          {item.a}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </section>

        {/* Shortcuts cheatsheet */}
        <section style={{ marginTop: 36 }}>
          <h2
            className="fr-900"
            style={{
              fontSize: 18,
              color: 'var(--text)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>⌨️</span> Atajos de teclado
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 6,
              padding: 12,
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-sm)',
            }}
          >
            {SHORTCUTS.map((s) => (
              <div
                key={s.keys}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  fontSize: 12,
                  color: 'var(--text-2)',
                }}
              >
                <span>{s.label}</span>
                <kbd
                  className="ff-mono"
                  style={{
                    padding: '2px 8px',
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: 'var(--text)',
                  }}
                >
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function quickActionStyle(pastelVar: string): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    padding: '14px 16px',
    background: `var(--${pastelVar})`,
    border: '1px solid var(--line)',
    borderRadius: 'var(--r-sm)',
    color: '#1A1B1F',
    fontSize: 14,
    fontWeight: 700,
    textDecoration: 'none',
    transition: 'transform 120ms ease',
  }
}
