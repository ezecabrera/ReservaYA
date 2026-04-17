# Análisis detallado — ReservaYa

**Fecha:** 2026-04-17 · **Alcance:** cliente (`app-lab/`) + negocio (`panel/`) + seed (`scripts/`) + DB (Supabase)

---

## 1. Para qué existe la app — y quiénes la usan

**Problema que resuelve**: simplificar la reserva de mesa en restaurantes argentinos, bajando fricción vs llamar/WhatsApp, y reducir no-shows con depósito + recordatorios.

**Dos productos, no uno**:
| Usuario | Qué necesita | Frecuencia |
|---|---|---|
| **Cliente** (comensal) | Decidir dónde salir, reservar rápido, llegar y que lo reconozcan | 2-6 veces/mes |
| **Negocio** (dueño/anfitrión) | Llenar mesas, no perder cupos por no-shows, gestionar turno sin caos | **Todo el día, todos los días** |

**Insight crítico**: el cliente usa la app **minutos por semana**. El negocio vive **adentro de la app** 8-12 horas al día. El éxito del producto depende más del negocio que del cliente.

**Tu situación hoy**: 80% del tiempo puesto en cliente. El panel existe pero nunca lo revisamos en este ciclo.

---

## 2. Estado real por superficie

### 2.1 Cliente (`app-lab/` — rediseño B+A)

✅ **Sólido**
- Home con hero venue + SearchPill + filtros ricos (cocina/dieta/barrio/momento/promos/precio)
- Venue detail con galería, menú preview, mapa OSM, sectores, política cancelación
- Wizard 4 pasos con auto-scroll + sections siempre visibles + CTA sticky + progress bar
- Confirmación con countdown + QR + WhatsApp + ICS calendar + modo grupo
- Mis reservas con hero "próxima salida" + QR visible + reseñas en historial
- Favoritos localStorage + corazón en cards
- Notificaciones (scaffolding con datos reales)
- Login email+pass + Google OAuth
- Geolocalización con "Cerca mío" + distancia en cards
- PWA instalable iOS (add to home screen)
- 20 venues demo con metadata real (coords, dietary, features, precio)

⚠️ **Parcial**
- Reseñas persisten en localStorage (no Supabase)
- Notifications sin push real (sólo derivadas de reservas)
- Apple Wallet pass: stub (genera .ics en vez de .pkpass)
- Compartir: funciona Web Share pero no hay Open Graph en prod
- `next/image` no usado → performance mejorable (~30% LCP)

❌ **Ausente**
- Onboarding explicativo para primera visita
- Schema.org / SEO (Google no indexa las fichas)
- Error boundaries / Sentry
- Tests E2E
- Webhook de MP (hoy depende sólo de back_urls)

### 2.2 Negocio (`panel/` — no tocado en este ciclo)

✅ **Existe**
- Dashboard con grid de mesas + estado en tiempo real
- Gestión de reservas (lista + acciones)
- Check-in por QR scan
- Menú manager (categorías + ítems + disponibilidad)
- Onboarding self-service de nuevo negocio
- Analytics básico
- Billing (suscripción MP)
- Staff con roles (owner/manager/receptionist)

⚠️ **Probable mejora necesaria**
- No sé el estado visual del panel (no lo redesigné)
- Notificaciones push al negocio cuando entra reserva: falta
- Manejo de no-show + reseña del cliente (reputación bilateral): código existe pero no sé si está cableado en UI del panel
- Reportes/exports para el dueño
- Bloqueo masivo de días/horarios (feriados, vacaciones, eventos privados)
- Modo "reserva interna" para walk-ins / llamadas telefónicas
- Múltiples usuarios por venue (hoy un staff sólo por venue)

### 2.3 Base de datos (Supabase)

✅ Schema sólido: `venues`, `zones`, `tables`, `menu_*`, `reservations`, `table_locks`, `orders`, `payments`, `group_rooms`, `group_guests`, `staff_users`, `venue_subscriptions`, `users`. 8 migraciones, RLS en todas.

⚠️ Campos faltantes que se usan hoy por JSONB (ok para piloto, mal para queries masivas):
- `coords`, `features`, `dietary`, `price_tier`, `neighborhood` → en `config_json` (funciona, pero no indexable)

❌ Faltan tablas:
- `reviews` (hoy localStorage)
- `notifications` (hoy derivado)
- `business_blocked_slots` (para cerrar días)
- `staff_permissions` (granular > role fijo)

### 2.4 Integraciones externas

| Servicio | Estado |
|---|---|
| Supabase Auth | ✅ email+pass + Google OAuth |
| Supabase DB + RLS | ✅ |
| Supabase Realtime | ✅ modo grupo |
| MercadoPago Checkout Pro | ✅ con filter de métodos |
| MP Webhook | ⚠️ no implementado (usa back_urls) |
| WhatsApp Business API | ❌ (sólo wa.me links) |
| Resend / Email | ❌ (memoria dice Fase 2) |
| Google Maps API | ❌ (OSM embed funciona) |
| Google Reserve with Google | ❌ |
| iOS Live Activities | ❌ |
| Apple Wallet | ❌ (stub) |
| Push Notifications (Web Push API) | ❌ |
| Sentry / monitoring | ❌ |

---

## 3. Qué le falta al producto para ser "usable" de verdad

### 3.1 Del lado del cliente — las 10 mejoras que mueven la aguja

| # | Mejora | Impacto | Esfuerzo |
|---|---|---|---|
| C-1 | **Reseñas reales en Supabase** con tabla + RLS + mostrar en venue detail | 🔴 Alto — confianza social | M (4-6h) |
| C-2 | **Push notifications** (Web Push API) para recordatorio 24h/2h + cambios | 🔴 Alto — reduce no-shows | M (6-8h) |
| C-3 | **Email con QR adjunto** (Resend) al confirmar — imprimible, reenviable | 🟠 Alto — muchos usuarios aún esperan email | S (2-3h) |
| C-4 | **WhatsApp Business API** templates (confirmar, recordatorio, cancelación 1-tap) | 🔴 Alto — AR es WhatsApp-first | L (1-2 días) |
| C-5 | **Onboarding guided de primera vez** (3 cards: descubrí/reservá/mostrá el QR) | 🟡 Medio — reduce abandono | S (2h) |
| C-6 | **Editar cantidad/fecha de una reserva** (hoy sólo cancelar) | 🟠 Alto — flexibilidad básica | M (4h) |
| C-7 | **Apple Wallet .pkpass real** con countdown auto-actualizable | 🟢 Bajo — wow factor, nadie en AR lo tiene | L (Apple cert $99/año) |
| C-8 | **Filtros persistentes en URL** para compartir búsquedas (hoy state in-memory) | 🟡 Medio — descubribilidad | S (1-2h) |
| C-9 | **"Volver a reservar"** 1-tap desde histórico (hoy tenés que recorrer wizard) | 🟠 Alto — retención | M (3-4h) |
| C-10 | **Modo grupo prominente en home** (cuando hay una reserva grupal activa) | 🟢 Bajo — diferenciador vs Woki | S (1h) |

### 3.2 Del lado del negocio — las 10 que hacen o rompen el piloto

| # | Mejora | Por qué importa |
|---|---|---|
| N-1 | **Push notification al entrar una reserva** en el panel (navegador + audio + badge) | El mozo/recepción no está mirando el monitor 8hs — necesita señal |
| N-2 | **Vista "Esta noche"** con timeline horaria en vez de grid de mesas | Manager entiende rápido: 20:00→2 mesas, 20:30→5 mesas, 21:00→llenos |
| N-3 | **Reserva manual (walk-in + telefónica)** desde el panel | Muchas reservas siguen llegando por teléfono — hay que cargarlas |
| N-4 | **Bloqueo de días y slots** (feriado, evento privado, vacaciones) | Sin esto, el negocio acepta reservas cuando está cerrado |
| N-5 | **Marcar no-show con 1 tap + cobrar seña** (ya existe el campo, falta UI) | Es la razón principal por la que un negocio paga por el sistema |
| N-6 | **Reseña al cliente post-asistencia** (rating bilateral F5-1 ya existe en views) | Diferencial vs Woki + disciplina comensales |
| N-7 | **Reportes exportables** (CSV reservas del mes, top platos, etc.) | Contabilidad + decisiones |
| N-8 | **Multi-staff por venue con permisos granulares** | Hoy: 1 owner. Real: dueño + 2-3 mozos + recepcionista, todos con accesos distintos |
| N-9 | **Impresión ticket de reserva** (desde panel a impresora térmica) | Muchos locales tienen impresora térmica en barra |
| N-10 | **Integración con TPV/POS** (opcional fase 2) | Cuando el cliente llega y abre mesa, jalar del POS total para calcular cashback |

### 3.3 Para que la app "sirva para lo que está pensada" — gaps críticos

1. **Sin email de confirmación** → cliente olvida la reserva, no-show sube
2. **Sin push ni recordatorio automático** → mismo problema
3. **Panel sin push al recibir reserva** → negocios "no la usan" porque no la miran → aceptan dobles reservas
4. **Modo reserva manual ausente** → negocios piloto terminan con la libreta Excel paralela → producto muere
5. **Sin webhook MP** → si el cliente cierra el browser antes del redirect, el pago queda en limbo
6. **Sin monitoring** → errores en producción pasan desapercibidos
7. **Reseñas en localStorage** → no sirven como feature diferencial porque no son visibles a otros

---

## 4. Mejoras priorizadas — qué haría yo la próxima semana

### Sprint A (3-5 días) — cerrar los leaks del flujo

1. **Tabla `reviews` en Supabase** + endpoint POST /api/reviews + mostrar en venue detail + reemplazar localStorage
2. **Email de confirmación con Resend** + adjuntar QR como PNG + link de gestión
3. **Webhook MP** (`POST /api/webhooks/mp`) para confirmar pagos aunque el cliente cierre el browser
4. **Push notification al negocio** cuando entra reserva (Web Push + sonido)
5. **Bloqueo de días en panel** (tabla `blocked_slots` + UI calendario)

**Impacto combinado**: pasar de "demo que se rompe con un restaurante real" a "MVP funcional para piloto firmado".

### Sprint B (1 semana) — WhatsApp + fixing UX

6. **WhatsApp Business API** con templates Meta (confirmación, recordatorio 24h, recordatorio 2h, cancelación)
7. **Onboarding 3-steps** de primera vez en la app
8. **"Volver a reservar"** 1-tap desde histórico
9. **Filtros en URL** (`?cuisine=pastas&neighborhood=palermo`)
10. **Reseñas al cliente post checked-in** desde el panel (rating bilateral wired)

**Impacto**: reducir no-show del 20% industria al 5-7% + subir retención al 40%.

### Sprint C (2-3 semanas) — platform + visual

11. **`next/image`** + schema.org/LocalBusiness + Open Graph — 2x Lighthouse score, 40% más CTR en WhatsApp share
12. **Sentry + Web Vitals monitoring**
13. **Tests E2E Playwright** (5 flows críticos: login, reservar, pagar, check-in, cancelar)
14. **Reserva manual desde panel** (walk-in + teléfono)
15. **Multi-staff con permisos granulares**

### Sprint D (mes+) — diferenciadores que nadie tiene en AR

16. **Live Activities iOS** (countdown en Dynamic Island)
17. **Apple Wallet .pkpass** firmado (requiere Apple Dev $99)
18. **Loyalty "Puntos ReservaYa"** con cashback transparente
19. **Waitlist virtual** cuando el venue está lleno + notificación cuando se libera
20. **Concierge AI** en cada venue (chat RAG sobre menú + horarios)

---

## 5. Mejoras de UX que facilitan el uso — orden lógico para el usuario

### Cliente — 20 mejoras específicas para bajar fricción

#### Home
1. **Texto "X personas reservaron hoy"** debajo del hero — prueba social
2. **"Disponible en Xmin"** en cards cuando hay slot inmediato (walk-in)
3. **Colapsar search pill al hacer scroll** (sticky header minimal)
4. **Tab "Ahora" / "Después"** como toggle primario (el porteño suele decidir last-minute)
5. **Sección "Últimas reservas"** con avatars rotando (si hay opt-in de usuarios)

#### Venue detail
6. **Precio promedio por persona** explícito (hoy sólo se ve $ tier)
7. **"X% de los que fueron, volvieron"** — retention proof
8. **Fotos de plato separadas de fotos del local** con labels
9. **Botón "Llamar al restaurante"** directo (tel: link) como fallback
10. **Stories-style gallery** (full screen vertical scroll de fotos)

#### Wizard
11. **Prefill del search pill del home** al entrar al wizard (no reelegir fecha/hora)
12. **Sugerir mesa según party size** ("4 personas → mesa 5 (4-6 pax) o mesa 3 (2-4 pax)")
13. **Mostrar visual del salón** (plano 2D con mesas clickables)
14. **"Agregar nota al restaurante"** como campo opcional ("alérgico a...", "mesa ventana por favor")
15. **"Invitar amigos ahora"** inline en summary (anticipar modo grupo)

#### Confirmación
16. **Auto-generate Apple Wallet Pass** visible 1-tap además de QR
17. **Timer hasta la reserva** como Live Activity / Dynamic Island
18. **Link "Compartir reserva"** generate un link público read-only con QR + dirección
19. **"Cancelar reserva"** con razones pre-armadas (me enfermé / cambié plan / ...)
20. **Sugerencia "Te reservé mesa, ¿no olvidas?" via notification** 2hs antes

### Negocio — 15 mejoras para los que están 8hs/día

#### Dashboard
1. **Vista timeline** (horas del eje X, mesas del eje Y) — intuición inmediata
2. **Alarma sonora + flash** al recibir nueva reserva
3. **Contador "Hoy: X confirmadas · Y pendientes · Z no-show"** arriba
4. **Arrastrar mesa a otra** en el plano para cambiar asignación con drag & drop
5. **Marcar mesa "lista para entregar"** con 1 tap (tras pagar)

#### Reservas
6. **Filtro rápido "Hoy / Mañana / Esta semana"** persistente
7. **Búsqueda por nombre del cliente o teléfono**
8. **Bulk action: confirmar todas las pending** con 1 click
9. **Exportar CSV de la semana** desde el header

#### Operación
10. **Modo "turno ocupado"** con bloqueo automático de slots
11. **Historial del cliente** (cuantas veces vino, si hizo no-show) al abrir su reserva
12. **Chat rápido con el cliente** vía WhatsApp pre-armado desde la reserva
13. **"Agregar reserva manual"** grande y visible (walk-in + llamada)
14. **Impresión ticket** desde cada reserva
15. **Recordatorio automático al mozo** cuando una mesa reserva está por cumplir el tiempo

---

## 6. Qué haría AHORA — mi recomendación estratégica

### La pregunta real: ¿Qué te acerca al primer restaurante firmado?

Tu memoria del proyecto dice: *"Próximo paso: Fase G.5 (piloto real con restaurante firmado). NO agregar features nuevas durante el piloto."*

**Análisis honesto**: las mejoras que hiciste este ciclo (home reorder, favoritos, notificaciones, reviews modal, mapa, wizard reestructurado, form tarjeta) son **excelentes** pero ninguna cierra ese gap. El gap real es:

1. **Email + WhatsApp al confirmar** (hoy no se entera nadie)
2. **Push al negocio** (sin esto, el negocio piloto dice "no la uso porque no me suena")
3. **Reserva manual en panel** (el negocio recibe llamadas — si no puede cargarlas, vuelve a Excel)
4. **Webhook MP** (cualquier abandono genera un limbo)

**Mi recomendación concreta**:

#### Opción A — "Cerrar el piloto" (3-5 días)
Hacer Sprint A completo. Después de esto, el producto no tiene leaks críticos y se puede mostrar a un restaurante con cara seria.

#### Opción B — "Seguir puliendo cliente" (1-2 semanas)
Hacer las 20 mejoras UX cliente. Producto se ve espectacular. Riesgo: nadie lo usa porque no hay restaurantes piloto.

#### Opción C — "Mezcla realista" (1 semana)
1 día: Email confirmación con Resend + QR
1 día: Webhook MP
1 día: Push al negocio en panel + alarma sonora
1 día: Reserva manual en panel
1 día: Promoción de lab → app, deploy producción estable

**Voto**: **Opción C**. Resuelve los 4 leaks críticos + deja producto en estado "primer restaurante puede firmar".

---

## 7. Resumen ejecutivo

**Fortalezas actuales**:
- Cliente visualmente al nivel TheFork/Resy
- Diferenciadores únicos en AR: modo grupo, rating bilateral, countdown, widget embed
- Stack técnico sólido (Supabase + Next 14 + PWA iOS)
- 20 venues demo con metadata real para testing

**Debilidades críticas**:
- Panel negocio no revisado recientemente (donde vive el negocio 8hs/día)
- Sin email/WhatsApp/push real (no-show sin mitigación automática)
- Sin webhook MP (pagos en limbo posibles)
- Sin reserva manual en panel (fricción con flujo real del negocio)

**Para tu piloto real**, priorizá: email Resend + webhook MP + push al negocio + reserva manual + bloqueo de días. Son ~5 días de trabajo. Después ya podés mostrar la app a un dueño con confianza.

**Para distinguirte a largo plazo**: WhatsApp Business API + Live Activities + Apple Wallet + Loyalty. Eso te pone a nivel OpenTable/Resy global, nadie en AR lo tiene.
