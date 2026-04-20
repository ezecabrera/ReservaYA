# Un Toque — Flujo del negocio (panel)

> Cómo un restaurante se vincula a Un Toque, qué puede hacer desde el panel, y qué partes están scaffolding vs producción.

---

## 0. URL del panel

- Dev: `http://localhost:3001`
- Prod: `https://reservaya-panel.vercel.app` (alias actual, pendiente rename a `panel.untoque.app` o similar)

El panel vive en el workspace `panel/` del monorepo. Stack idéntico al cliente: Next.js 14 + Supabase + TypeScript + Tailwind. Tema visual **dark** (vs cliente que es light) — da diferenciación clara entre "app de usuario" y "herramienta de trabajo".

---

## 1. Flujo de alta de un negocio

### Paso 0 — Descubrir Un Toque

Hoy no existe una landing pública en `/landing` (la última versión fue removida). El flow de entrada es:

- Venue llega a `reservaya-panel.vercel.app`
- Ve el login en `/login` con el CTA "¿Tu restaurante aún no está? → Registralo gratis"
- Tap al CTA → `/onboarding`

**Gap crítico:** falta una landing pública que explique el pitch al dueño de negocio (precio, beneficios, FAQ, testimonial). Hoy es demasiado abrupto: pedir datos sin contexto.

### Paso 1 — Onboarding wizard (5 pasos)

Ruta: `/onboarding` — single-page client component con state machine.

```
┌─ Paso 1/5 ─ Crear cuenta ───────────────────────┐
│  Email + Contraseña + Nombre del responsable    │
│  → supabase.auth.signUp                          │
│  → signInWithPassword inmediato                  │
│  → obtiene access_token para siguientes pasos   │
└──────────────────────────────────────────────────┘

┌─ Paso 2/5 ─ Datos del local ────────────────────┐
│  Nombre del restaurante                          │
│  Dirección completa                              │
│  Teléfono                                        │
│  Descripción (lede corto)                        │
└──────────────────────────────────────────────────┘

┌─ Paso 3/5 ─ Horario de atención ────────────────┐
│  Días de la semana (multi-select)               │
│  Turno almuerzo (opens_at / closes_at)          │
│  Turno cena (opens_at / closes_at)              │
│  Default: L-V, 12:00-15:30 + 20:00-23:30        │
└──────────────────────────────────────────────────┘

┌─ Paso 4/5 ─ Mesas y sectores ───────────────────┐
│  Zona (Salón / Terraza / Patio / Barra)         │
│    + prefix (S/T/P/B)                           │
│    + mesas: label + capacidad                   │
│  Múltiples zonas (botón "Agregar zona")         │
│  Default: Salón S1-S4 (2+2+4+4)                 │
└──────────────────────────────────────────────────┘

┌─ Paso 5/5 ─ Seña y política ────────────────────┐
│  Monto de seña por reserva ($ fijo)             │
│  Cut-off (minutos antes del turno que           │
│    se cierra la reserva nueva)                  │
│  Default: $2.000 · 60 min cut-off               │
│                                                  │
│  [ Activar mi restaurante ]  ← CTA final         │
└──────────────────────────────────────────────────┘
```

### Paso 2 — Submit del onboarding

El wizard hace `POST /api/onboarding` con todo el payload. El endpoint (server-side, admin client):

1. **Verifica auth** (header Bearer o cookies)
2. **Crea el venue** en `venues` con `is_active = false` (inactivo hasta completar billing)
3. **Crea staff_user** con `role = 'owner'` + `venue_id` del venue creado
4. **Crea zones** (una fila por zona)
5. **Crea tables** (una fila por mesa, FK a zone_id)
6. **Setea `config_json`**:
   - `service_hours` (array de turnos × día)
   - `deposit_amount`
   - `cancellation_grace_hours = 2` (default)
   - `cut_off_minutes`
   - `zones_enabled = true` si hay >1 zona

### Paso 3 — Redirect a billing

Después del POST exitoso, el wizard redirige a `/dashboard/billing`:

```
┌─ /dashboard/billing ─────────────────────────────┐
│  Plan Un Toque                                   │
│  $ 30.000/mes                                     │
│                                                   │
│  Incluye:                                         │
│  ✓ Reservas ilimitadas                           │
│  ✓ CRM con export                                 │
│  ✓ WhatsApp notifications                        │
│  ✓ Widget embebible                               │
│  ✓ Panel de análisis                              │
│                                                   │
│  [ Suscribirme vía Mercado Pago ]                │
└──────────────────────────────────────────────────┘
```

- Click → `POST /api/billing/subscribe` → crea suscripción en MP (preapproval) → redirect a checkout
- Tras pago → webhook `/api/webhooks/mp-subscription` → marca `billing_subscriptions.status = 'active'`
- En paralelo → `venues.is_active = true` (queda visible en la home del cliente)

### Paso 4 — Listo para operar

Con suscripción activa, el dueño tiene acceso completo al dashboard. El venue aparece en el home del cliente de Un Toque y puede recibir reservas.

---

## 2. El dashboard por dentro

Después del onboarding + billing, el staff tiene acceso a estas secciones:

### 2.1 `/dashboard` — Operación en vivo

- **Grid de mesas** (TableGrid) — vista spatial del local
- Cada mesa con estado en tiempo real: libre / reservada / ocupada (check-in hecho)
- Click en mesa → `RightActionPanel` con:
  - Quién tiene reserva (nombre + hora + N personas)
  - Botones: Check-in · Cancelar · Mover mesa · Ver pre-pedido
- **Timeline view alternativo** — matriz mesa × hora, drag reprograma horario
- **Queue lateral** — reservas del día ordenadas por hora
- **LiveClock + indicador LIVE** con tick cada 30s
- Keyboard shortcut `N` → nueva reserva manual desde cero
- Keyboard shortcut `?` → panel de todos los shortcuts

### 2.2 `/dashboard/reservas`

- Listado completo de reservas (futuras + historial)
- Filtros por fecha, estado, mesa
- Buscador por nombre del cliente
- Export CSV (diferenciador del pitch)

### 2.3 `/dashboard/menu`

- CRUD de categorías del menú (`menu_categories`) con drag-reorder
- CRUD de ítems (`menu_items`) con drag-reorder por categoría
- Campos por ítem: nombre · descripción · precio · status (available / limited / unavailable)
- Las fotos se cargan a Supabase Storage (URLs quedan en `menu_items.image_url`)

### 2.4 `/dashboard/config`

- Datos del venue (nombre, dirección, teléfono, descripción)
- Horarios semanales editables
- Política de cancelación
- Seña (monto + tipo: fijo o % del consumo)
- Features del venue (terraza, parking, wi-fi, etc)
- Galería de fotos

### 2.5 `/dashboard/analytics`

- Ocupación promedio por día de la semana
- No-show rate
- Ticket promedio (de pre-pedidos)
- Reservas por canal (app vs widget vs manual)
- % cancelaciones (**este % es público**, diferenciador del pitch — el cliente lo ve en el home)

### 2.6 `/dashboard/billing`

- Estado de suscripción (activa / pendiente / suspendida)
- Monto mensual
- Próximo cobro
- Link a portal MP para cambiar tarjeta
- Historial de cobros

### 2.7 `/check-in` (pantalla tablet-first)

- Endpoint especial para staff en la entrada del venue
- Input del token QR (manual o scanner)
- Hit a `/api/check-in` que valida JWT + cambia status a `checked_in`
- Feedback visual grande: "Bienvenido, {nombre}" + mesa asignada

### 2.8 Staff management

- `/api/staff` CRUD para invitar otros empleados
- Roles: `owner` (todo) · `receptionist` (check-in + ver reservas) · `cocina` (ver pre-pedidos sin tocar reservas)
- Nuevo staff recibe email de invitación con magic link

---

## 3. Diferenciadores que el dueño puede promocionar

Cosas que el panel habilita y que el cliente **ve** en el home/detalle del venue:

1. **Respuesta en segundos** — reservar en 30s vs llamar
2. **WhatsApp automático** — confirmación + recordatorios (cuando haya VAPID/web-push no hace falta esto)
3. **QR de check-in** — el staff escanea, adiós llamadas "soy Juan, vengo para la reserva"
4. **Pre-pedido** — el cliente adelanta menú por la app (reduce wait time, el venue ya sabe qué preparar)
5. **Grupo colaborativo** — el organizador invita, cada invitado elige su menú sin pasar el menú por WhatsApp
6. **% cancelaciones público** — transparencia radical; quien no cancela se diferencia
7. **Rating bidireccional** (pendiente backend) — el venue también puede reseñar al cliente
8. **CRM con export CSV** — históricos propios, no quedan atados a Un Toque
9. **Widget embebible** (pendiente implementar) — embed en su web/Instagram, sin comisión

---

## 4. Precio y modelo comercial

- **$30.000 ARS/mes** fijo, sin comisión por reserva
- Se cobra via Mercado Pago Preapproval (suscripción recurrente mensual)
- El webhook `/api/webhooks/mp-subscription` mantiene `billing_subscriptions.status` en sync
- Si se suspende (pago fallido N veces) → `venues.is_active = false` automáticamente → el venue deja de aparecer en el cliente hasta que regularice

---

## 5. Estado de madurez por sección

| Sección | Estado | Nota |
|---|---|---|
| Landing pública | ❌ No existe | Gap crítico — hoy se entra directo a /login |
| Onboarding wizard 5 pasos | ✅ Funcional | Incluye creación cuenta + venue + zones + tables |
| POST /api/onboarding | ✅ Funcional | Admin client, crea todo en una request |
| Login staff | ✅ Funcional | Basic email+password |
| Dashboard operativo | ✅ Funcional | TableGrid + RightActionPanel + Queue + Timeline |
| Reservas (listado) | ✅ Funcional | Filtros + export |
| Menu CRUD | ✅ Funcional | Drag-reorder + status limited/available |
| Config del venue | ✅ Funcional | Horarios, seña, datos básicos |
| Analytics | 🟡 Scaffolding | Dashboard con métricas mock, falta agregación real |
| Billing | 🟡 Básico | MP preapproval OK, falta manejo de edge cases (pago fallido, cambio de tarjeta) |
| Check-in via QR | ✅ Funcional | Validación JWT + update status |
| Staff management | ✅ Funcional | Invitación por email + roles |
| Widget embebible | ❌ No existe | Diferenciador del pitch, pendiente |
| Rating del venue al cliente | ❌ No existe | Pendiente backend + UI staff |
| Notificaciones WhatsApp staff | 🟡 Templates armados | Falta `META_WHATSAPP_TOKEN` en prod |

---

## 6. Acciones externas pendientes (según memoria del proyecto)

Según el contexto del proyecto, el piloto requería:

1. **Aplicar `supabase/APPLY_PILOT.sql`** en Supabase Studio (bundle idempotente 006-013)
2. **Registrar 5 templates HSM** en Meta Business Manager con `language_code=es_AR`:
   - `ry_reservation_confirmed`
   - `ry_reminder_24h`
   - `ry_reminder_2h`
   - `ry_cancelled_by_venue`
   - `ry_post_visit_review`
3. **Env vars prod del panel**:
   - `META_WHATSAPP_TOKEN`
   - `META_WHATSAPP_PHONE_NUMBER_ID`
   - `CRON_SECRET` (para cron jobs de reminders)
   - `MP_ACCESS_TOKEN` + `MP_WEBHOOK_SECRET` (MP production)

---

## 7. Flow de ejemplo end-to-end (venue nuevo)

Ejemplo: **Pasta Madre** (pizzería en Villa Crespo) quiere sumarse a Un Toque.

```
1. Marcela (dueña) ve una pauta de Un Toque en Instagram
2. Entra a panel.untoque.app (pendiente dominio)
3. Click "Registrá tu restaurante"
4. /onboarding:
   - Paso 1: email + pw + "Marcela Rodríguez"
   - Paso 2: "Pasta Madre" · "Murillo 770, Villa Crespo, CABA" · tel · desc
   - Paso 3: Mar-Dom · 20:00-24:00 cena
   - Paso 4: Salón 5 mesas (S1-S5, 2/2/4/4/6) + Terraza 3 mesas (T1-T3, 2/4/4)
   - Paso 5: $1.500 seña · 45 min cut-off
   - Click "Activar mi restaurante"
5. POST /api/onboarding crea todo en DB
6. Redirect a /dashboard/billing
7. Marcela suscribe con tarjeta MP → $30.000
8. /api/webhooks/mp-subscription marca activa
9. Venue pasa a is_active=true
10. Pasta Madre aparece en el home de clientes
11. Primera reserva entra → notification al panel → mesa iluminada en TableGrid
12. Cliente llega → staff escanea QR → check-in → mesa pasa a "ocupada"
13. Cliente come → dejá reseña al salir
14. Fin del mes: Marcela paga automático vía MP preapproval
```

**Tiempo total desde ver pauta → primera reserva real**: <24 hs si configura en el mismo momento.

---

## 8. Qué haría falta implementar para lanzamiento público

Orden de prioridad si quisieras abrir el panel a dueños de restaurantes nuevos **hoy**:

### Sprint 1 — Onboarding visible
1. **Landing pública** (`panel.untoque.app/`) con pitch + precio + testimonios + FAQ + CTA "Registrarme"
2. **Form de interés** (email + nombre del local + mensaje) si no están listos para onboarding completo → recibimos leads
3. **Confirmación por email** obligatoria en signup (hoy salta login directo)

### Sprint 2 — Billing robusto
4. Envío de email si el pago mensual falla (2 intentos antes de suspender)
5. UI para cambiar tarjeta (link a portal MP)
6. Período de gracia de 7 días tras primer pago fallido

### Sprint 3 — Notificaciones WhatsApp
7. Aplicar templates HSM aprobadas
8. Integrar WhatsApp Cloud API para notificar confirmación / recordatorio 24h / 2h antes
9. Cron job que dispara los recordatorios

### Sprint 4 — Widget embebible
10. `/widget/[venueId]` HTML standalone que el venue incrusta en su web/IG
11. Permite reservar sin salir del sitio del venue (comisión $0 para el venue)

### Sprint 5 — Producto diferenciador
12. Rating bidireccional (staff puede reseñar cliente "¿asistió? ¿fue puntual?")
13. No-show score del cliente visible en la reserva (staff decide aceptar o pedir seña extra)
14. Mejora del analytics con gráficos reales

---

## 9. Quick demo para mostrar a un inversor

**Script de 3 minutos**:

1. Abro `panel.untoque.app/onboarding`
2. Completo los 5 pasos en 90 segundos (tengo datos de Pasta Madre preparados)
3. "Y listo, el restaurante ya está vivo"
4. Abro `un-toque.app` en otra pestaña → buscá "Pasta Madre" → click → el venue que acabo de crear
5. Hago una reserva desde el cliente
6. Vuelvo al panel → la reserva apareció en tiempo real en el TableGrid
7. "Sin integraciones, sin setup técnico, sin llamadas. Treinta mil pesos al mes, todos los restaurantes de Palermo pueden pagar eso."

---

## 10. Archivos de referencia

- Onboarding UI: [`panel/app/onboarding/page.tsx`](panel/app/onboarding/page.tsx)
- Onboarding API: [`panel/app/api/onboarding/route.ts`](panel/app/api/onboarding/route.ts)
- Billing UI: [`panel/app/dashboard/billing/page.tsx`](panel/app/dashboard/billing/page.tsx)
- Billing subscribe: [`panel/app/api/billing/subscribe/route.ts`](panel/app/api/billing/subscribe/route.ts)
- MP webhook: [`panel/app/api/webhooks/mp-subscription/route.ts`](panel/app/api/webhooks/mp-subscription/route.ts)
- Dashboard op: [`panel/app/dashboard/page.tsx`](panel/app/dashboard/page.tsx)
- Schema SQL: [`supabase/migrations/`](supabase/migrations/)
