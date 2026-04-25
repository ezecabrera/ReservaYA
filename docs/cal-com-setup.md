# Cal.com setup — UnToque

Guía para dejar Cal.com listo y embebido en `panel/app/demo/page.tsx`.

---

## 1. Crear cuenta

1. Ir a https://cal.com/signup
2. Email: `hola@deuntoque.com` (alias Resend ya activo, recibe el verification mail).
3. Username: `untoque` → URL pública: `https://cal.com/untoque`.
4. Plan: **Free** (suficiente para arrancar).

---

## 2. Event Type — "Demo UnToque 15min"

Settings → Event Types → New.

| Campo | Valor |
|-------|-------|
| Title | Demo UnToque · 15 minutos |
| URL slug | `demo` → `https://cal.com/untoque/demo` |
| Description | "Te muestro cómo funciona UnToque (panel + WhatsApp + reservas) y respondo dudas. Sin compromiso. Si tenés tu sistema actual abierto en otra pestaña, mejor — comparamos en vivo." |
| Duration | 15 minutos |
| Buffer time before/after | 15 min antes / 0 después |
| Minimum notice | 2 horas |
| Limit per day | 4 demos / día (cap real para no quemarme) |
| Available hours | Lun-Vie 09:00-19:00 ART (UTC-3) |
| Time zone | America/Argentina/Buenos_Aires |

### Custom questions del booking form

Hacer obligatorias estas tres:

1. **Nombre del restaurante** (short text, required)
2. **Ciudad** (short text, required)
3. **¿Qué sistema usás hoy para reservas?** (select)
   - TheFork / Maxirest / Fudo / Excel / Cuaderno / WhatsApp / Otro / Ninguno
4. **¿Cuántas mesas tenés aprox?** (number, required)
5. **¿Algún tema puntual que querés tocar en la call?** (long text, optional)

---

## 3. Calendar integration

Settings → Apps → Connect:
- Google Calendar (asociado a `ezedigital2021@gmail.com`).
- **Conflict calendar:** marcar el calendario personal para que no me agende encima.
- **Add to calendar:** crear eventos en `hola@deuntoque.com` calendar (creado en Workspace).

Settings → Apps → Google Meet → Enable. Cada booking genera link Meet automático.

---

## 4. Personalización visual

Settings → Appearance:

- **Brand color:** `#7B1F2A` (wine del panel UnToque) — fallback `#6B1825`.
- **Light/Dark mode:** Dark.
- **Custom logo:** subir `/public/untoque-logo.svg` (24x24).
- **Brand name:** UnToque.

Settings → Profile:

- **Bio:** "Founder UnToque. Te muestro en 15 min cómo manejar reservas, mesas, cobros y WhatsApp en un solo panel. Sin comisión por cubierto. Pricing flat ARS 30k/mes."

---

## 5. FAQ pre-meeting (custom HTML en confirmation page)

Settings → Event → Demo · Confirmation Page → Custom Note (markdown):

```markdown
### Antes de la call, te pido 3 cosas:

1. **Tener tu sistema actual abierto** (TheFork / Maxirest / Excel / lo que sea). Lo abrimos al lado del panel UnToque y lo comparamos directo.
2. **Saber cuántos no-shows tenés al mes**, aunque sea aproximado. Es la métrica que más mueve la aguja.
3. **Pensar 1-2 cosas que te frustran del sistema actual.** No tenés que tener una lista, sólo lo top of mind.

Si tenés que cancelar o reprogramar, hay un botón al final del email de confirmación.

Hasta el {{date}} — Eze.
```

---

## 6. Webhooks → recordatorio + briefing

Settings → Webhooks → New webhook.

- **URL:** endpoint propio `https://app.deuntoque.com/api/webhooks/cal-com` (POST).
- **Trigger events:** `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`.
- **Secret:** generar con `openssl rand -hex 32` y guardar en Vercel env como `CAL_WEBHOOK_SECRET`.

El endpoint nuestro (a implementar):
- Verifica firma HMAC.
- Llama Resend con template "demo-briefing-1h" 1h antes del evento.

Email del briefing 1h antes:

> **Subject:** Tu demo UnToque arranca en 1 hora
>
> Hola {{nombre}},
>
> En 1 hora nos vemos en Meet: {{meet_link}}
>
> Para que la call sea útil, vení con:
> - Tu sistema actual de reservas abierto (TheFork / Maxirest / lo que uses)
> - Aprox cuántas mesas tenés
> - Top 1-2 dolores con tu setup actual
>
> Si surgió algo y tenés que cancelar, mandame WhatsApp directo: +54 9 11 XXXX XXXX
>
> Nos vemos.
> Eze · UnToque

---

## 7. Embed en `/demo`

Cal.com → Event Types → Demo → Embed → React Inline.

Code snippet listo para `panel/app/demo/page.tsx` (otro agente lo crea, no toques este archivo desde acá):

```tsx
'use client'
import { useEffect } from 'react'
import Cal, { getCalApi } from '@calcom/embed-react'

export default function DemoEmbed() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi()
      cal('ui', {
        theme: 'dark',
        styles: { branding: { brandColor: '#7B1F2A' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      })
    })()
  }, [])

  return (
    <Cal
      calLink="untoque/demo"
      style={{ width: '100%', height: '100%', overflow: 'scroll' }}
      config={{ layout: 'month_view', theme: 'dark' }}
    />
  )
}
```

Dependencia a instalar cuando se haga: `pnpm add @calcom/embed-react` en panel.

---

## 8. Métricas a trackear (mensual)

- Bookings creados / mes
- Show rate (asisten / agendan) — target ≥ 75%
- Conversion demo → pilot — target ≥ 30%
- Tiempo promedio entre booking y call — target < 72h

Export CSV de Cal.com cada lunes, importar a Notion CRM como complemento.
