# AUDIT REPORT — ReservaYa app-lab

**Fecha:** 2026-04-17
**Alcance:** PWA cliente (`app-lab/`) · 20 venues demo · flow de reserva end-to-end
**Método:** inspección de código + preview_eval DOM + análisis de UX contra benchmarks (Woki/TheFork/Resy)

---

## 1. Mapa del proyecto

### Rutas / flujos principales
```
/                          Home — lista + mapa + filtros + editorial
/[venueId]                 Detalle venue — galería, menu preview, wizard
/reserva/[id]/pagar        ✨ NUEVO: selector de método de pago
/reserva/[id]/confirmacion Confirmación — QR, countdown, WhatsApp, grupo
/mis-reservas              Lista con countdown hero
/perfil                    Avatar + stats + próxima salida
/favoritos                 ✨ Lista guardada (localStorage)
/grupo/[token]             Modo grupo compartible (dark theme)
/login | /auth/callback    Email+pass + Google OAuth
```

### Componentes clave (líneas de código)
- `ReservationWizard.tsx` — **662 LOC** · 4 pasos (datetime/table/menu/summary)
- `VenueDetailClient.tsx` — **480 LOC** · galería + menu preview + sectores + reviews
- `HomeClient.tsx` — **409 LOC** · search pill + filtros + editorial + mapa
- `PaymentMethodClient.tsx` — selector Tarjeta / MP

### APIs
- `/api/reserva/crear`, `/api/reserva/[id]/pago`, `/api/table-lock`
- `/api/auth/ensure-profile`, `/api/auth/callback`
- `/api/venues`, `/api/venues/[id]`, `/api/tables/disponibles`
- `/api/grupo`, `/api/mis-reservas`, `/api/perfil`

### Integraciones vivas
- ✅ Supabase (Auth + DB + realtime modo grupo)
- ✅ MercadoPago Checkout Pro (con filtro de métodos por tipo)
- ✅ Google OAuth (via Supabase)
- ✅ PWA manifest + iOS meta tags
- ❌ **Google Maps** — no integrado (hoy sólo MapPreview con pins fake)
- ❌ **Notificaciones** — botón en home sin implementar
- ❌ **Reseñas** — empty state solamente, sin flujo de crear reseña

---

## 2. Bugs encontrados (por severidad)

### 🔴 CRÍTICO

| # | Bug | Ubicación |
|---|---|---|
| B-1 | **Wizard sin auto-scroll**: al seleccionar fecha→hora→personas→mesa, el usuario queda scrolleado arriba y tiene que bajar manualmente | `ReservationWizard.tsx` |
| B-2 | **Menú obliga a scrollear TODO para saltar**: no hay forma rápida de pasar a summary sin recorrer todas las categorías | `ReservationWizard.tsx:407-546` |
| B-3 | **Sin validación real de tarjeta**: el selector "Tarjeta" manda directo a MP, no hay form propio con Luhn ni máscaras | `PaymentMethodClient.tsx` |
| B-4 | **Notificaciones dummy**: el bell icon del home abre nada — click sin handler | `HomeClient.tsx:106-116` |
| B-5 | **Botón share dummy**: aria-label "Compartir" sin onClick, no invoca Web Share API ni copia al clipboard | `VenueDetailClient.tsx` |

### 🟠 ALTO

| # | Bug | Ubicación |
|---|---|---|
| B-6 | **No hay flujo de dejar reseña post-visita**: aunque hay empty state, no hay botón que abra un form de review | `VenueDetailClient.tsx` · `mis-reservas` |
| B-7 | **Google Maps ausente del detail**: sólo texto dirección, no mini-mapa ni "Cómo llegar" | `VenueDetailClient.tsx` |
| B-8 | **Filter "Cuisines" duplica con tabs**: tenés CuisineTabs + FiltersSheet con cuisines — confuso | `HomeClient.tsx` + `FiltersSheet.tsx` |
| B-9 | **Tipo de cocina único (no multi-tag)**: cada venue tiene 1 solo `cuisine`, no permite "Celíacos + Italiana" | DB schema |
| B-10 | **QR en Mis Reservas no está prominente**: hay "Ver QR" link pero sin thumbnail del QR | `mis-reservas/page.tsx` |

### 🟡 MEDIO

| # | Bug | Ubicación |
|---|---|---|
| B-11 | `next/image` no usado: `<img>` crudo cargando 1200×800 desde picsum → performance malo | `VenueCardLab.tsx` · `VenueDetailClient.tsx` |
| B-12 | Reviews hardcoded removidas pero rating del header venue dice "Nuevo" — sin lógica real desde DB | `VenueDetailClient.tsx` |
| B-13 | **Default party_size=2** en search pill no se propaga al wizard (el wizard tiene su propio state inicial) | `ReservationWizard.tsx:39` |
| B-14 | Idempotencia MP: si usuario elige MP, vuelve, elige Tarjeta → obtiene preference MP (vieja) por caché preference_id | `api/reserva/[id]/pago/route.ts:108` |
| B-15 | Session storage de geolocation cache — si la ubicación cambia en 10 min, el usuario ve distancias incorrectas | `lib/geolocation.ts` |

### 🟢 BAJO

| # | Bug | Ubicación |
|---|---|---|
| B-16 | `tx3` (#ABABBA) contrast 2.3:1 — falla WCAG AA en placeholders y fine print | `globals.css` |
| B-17 | "Nuevo" badge en todas las cards: inconsistente con un sistema que ya tiene data | `VenueCardLab.tsx` |
| B-18 | Editorial band tiene guías hardcoded ("Parrillas con cortes premium") — no llevan a nada real | `EditorialBand.tsx` |
| B-19 | MapPreview es SVG fake — ningún usuario esperaría que se integre con un mapa real | `MapPreview.tsx` |
| B-20 | Schema.org / Open Graph faltan — no indexa en Google ni preview en WhatsApp | `app-lab/app/[venueId]/page.tsx` |

---

## 3. Coincidencias con bugs reportados

| Request | Mapea a | Estado |
|---|---|---|
| 1. Auto-scroll wizard | B-1 | 🔴 Bug existente, hay que implementar |
| 2. Pop-up omitir menú | B-2 | 🔴 Bug existente, hay que implementar |
| 3. QR code | Ya existe en confirmación | 🟢 Verificar + agregar a mis-reservas |
| 4. Form tarjeta funcional | B-3 | 🔴 Faltante, hay que implementar |
| 5. Google Maps | B-7 | 🟠 Falta integración |
| 6. cuisine_type multi-tag | B-8 + B-9 | 🟠 Refactor de schema |
| 7. Share button | B-5 | 🔴 Botón dummy — arreglar |
| 8. Notificaciones | B-4 | 🔴 Botón dummy — arreglar |
| 9. Sistema reseñas | B-6 | 🟠 Implementar flujo |

---

## 4. Mejoras de UX sugeridas

### U-1. Indicador de progreso visible en wizard
Hoy los pasos están implícitos (el usuario no ve "estoy en 2/4"). Agregar un progress bar superior.

### U-2. Sticky CTA en summary
"Confirmar reserva" debe estar siempre visible en summary, no al final del scroll.

### U-3. Auto-focus en primer campo del form de pago
Cuando se abre el form de tarjeta, focus automático en "Número de tarjeta".

### U-4. Estados disabled claros
Cuando el usuario selecciona un método de pago, los otros botones quedan `pointer-events: none` hasta que el fetch termina o falla.

### U-5. Feedback háptico en selecciones importantes
`navigator.vibrate(10)` al seleccionar mesa, método de pago, confirmar reserva. Mejora feel móvil.

### U-6. Notificación toast post-acción
"Agregado a favoritos" como toast de 2s en vez de solo el relleno del corazón.

### U-7. Empty states con acción clara
El empty de reviews tiene buen copy. Replicar patrón en notifications, reservas pasadas, etc.

---

## 5. Funcionalidades incompletas / faltantes

1. ❌ **Notificaciones in-app** (bell icon sin handler)
2. ❌ **Share venue con Web Share API** (botón aria-label sin onClick)
3. ❌ **Form de tarjeta real** (MP Cards SDK o wrapping custom)
4. ❌ **Google Maps embed** en venue detail
5. ❌ **Flujo "Dejar reseña"** post-visita
6. ❌ **Multi-tag cuisine** (Celíacos, Vegano, Italiana)
7. ❌ **Auto-scroll wizard**
8. ❌ **Modal omitir pre-pedido**
9. ⚠️  **next/image** para performance
10. ⚠️  **Schema.org LocalBusiness** para SEO

---

## 6. Próximos pasos (implementación)

Ver `CHANGELOG.md` para la lista detallada de correcciones aplicadas.
Ver `TESTING_CHECKLIST.md` para la checklist de QA post-fix.

**Orden ejecutado:**
1. ✅ CRÍTICO: auto-scroll wizard (B-1)
2. ✅ CRÍTICO: modal omitir menú (B-2)
3. ✅ CRÍTICO: QR en mis-reservas prominente (B-10)
4. ✅ ALTO: form tarjeta con validación Luhn (B-3)
5. ✅ MEDIO: Google Maps embed + "Cómo llegar" (B-7)
6. ✅ MEDIO: cuisine_type multi-tag (B-9)
7. ✅ BAJO: share Web Share API (B-5)
8. ⏸️  Notifications — scaffolding + backlog (B-4)
9. ⏸️  Reviews — scaffolding + backlog (B-6)
