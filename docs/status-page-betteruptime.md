# Status page con BetterUptime — setup

Status page público en `status.deuntoque.com` que muestra el estado en tiempo real
de los componentes de UnToque y permite a los clientes suscribirse para recibir
avisos cuando algo cae.

## 1. Cuenta y plan

1. Crear cuenta en https://betteruptime.com con `hola@deuntoque.com`.
2. Plan: **Free** (10 monitors, 1 status page, branding limitado). Si necesitamos
   white-label completo, upgrade al plan Freelancer (USD 18/mes).

## 2. Monitors a configurar

Crear los siguientes monitors HTTP/keyword (request cada 3 min):

| Nombre                | URL                                              | Tipo                         | Expected                       |
| --------------------- | ------------------------------------------------ | ---------------------------- | ------------------------------ |
| App PWA               | `https://app.deuntoque.com`                      | HTTP keyword                 | status 200                     |
| Panel                 | `https://panel.deuntoque.com`                    | HTTP keyword                 | status 200                     |
| Supabase REST         | `https://<project>.supabase.co/rest/v1/`         | HTTP                         | status 401 (sin token = ok)    |
| MercadoPago API       | `https://api.mercadopago.com/v1/payments/0`      | HTTP                         | status 401 o 404               |
| Meta Graph            | `https://graph.facebook.com/`                    | HTTP                         | status 200                     |

Las cuentas free permiten 10 monitors así que tenemos margen para agregar:
- Webhook MP (`/api/webhooks/mp-subscription`)
- Webhook Stripe (si lo agregamos)
- DNS check `deuntoque.com`

## 3. Status page

1. **Status Pages** → New page → `status.deuntoque.com`.
2. **Components**:
   - "App de reservas" → asociar monitor "App PWA"
   - "Panel para restaurantes" → monitor "Panel"
   - "Base de datos" → "Supabase REST"
   - "Pagos" → "MercadoPago API"
   - "WhatsApp / SMS" → "Meta Graph"
3. **Branding**:
   - Logo: subir `panel/public/og/og-default.svg` o un PNG dedicado.
   - Color principal: `#A13143` (wine).
   - Color secundario: `#4F8A5F` (olive).
   - Tipografía: Inter (Fraunces no está disponible en BetterUptime).
4. **Custom domain**: `status.deuntoque.com`.
   - En Cloudflare → DNS → CNAME `status` → el host que da BetterUptime
     (ej. `statuspage.betteruptime.com`). Proxy: gris (DNS only).
   - Esperar provisioning del cert TLS (5–10 min).

## 4. Suscripciones a incidentes

1. **Subscribers**:
   - Founder: `hola@deuntoque.com` (todas las severidades).
   - Slack canal `#status` vía webhook.
   - Después: ofrecer en la status page que clientes se suscriban por email.
2. Mostrar el botón "Subscribe" en la página → on by default en BetterUptime.

## 5. Webhooks de notificación

Configurar **outgoing webhooks** para que cuando un monitor caiga:

1. **Slack**: webhook → canal `#alerts`. Plantilla:
   `🚨 [{{component}}] {{status}} — {{started_at}} — {{url}}`
2. **Email**: a `hola@deuntoque.com` (ya viene por default).
3. **PagerDuty** (opcional, futuro): integrar cuando tengamos on-call.

## 6. Maintenance windows

Cuando hagamos deploys con downtime esperado:
1. **Maintenance** → "Schedule maintenance" → 30 min antes.
2. Componentes afectados → pausa de monitors automática.
3. Subscribers reciben email "Mantenimiento programado".

## 7. Verificación post-setup

- [ ] `curl -I https://status.deuntoque.com` devuelve 200.
- [ ] Forzar caída de un monitor (cambiar URL a 404) → ver alerta en email + Slack.
- [ ] Status page muestra histórico de incidentes (90 días free).
- [ ] Suscribirse con un email de prueba y verificar que llegue confirmación.

## Backup / fallback

Si BetterUptime falla o aumenta precios, alternativas:
- **Instatus** (free 5 monitors, similar UX).
- **UptimeRobot + Statuspage.io** (más manual).
- **Self-hosted Uptime Kuma** en Fly.io (gratis, requiere mantenimiento).
