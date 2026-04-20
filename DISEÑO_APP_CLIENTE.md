# ReservaYa — Diseño actual de la PWA cliente

> Relevamiento end-to-end del diseño **real** del cliente (post-consolidación `app-lab` → `app`, commit `7fcfa88`).
> Rama: `claude/app-lab-redesign`. Worktree: `trusting-almeida-a01981`.
> Fecha: 2026-04-19.

---

## 1. Sistema visual

### 1.1 Tipografía ([app/layout.tsx](app/app/layout.tsx))

- **Display**: `Poppins` (500/600/700/800/900) → títulos, CTAs fuertes, código de mesa
- **Body**: `Plus Jakarta Sans` (400/500/600/700/800) → texto, labels, forms

> Cambio vs versión vieja: antes era Fraunces (serif editorial), ahora Poppins (sans geométrica).

### 1.2 Paleta ([app/globals.css](app/app/globals.css))

| Token | HEX | Uso |
|---|---|---|
| `--c1` | `#FF4757` | CTA primario coral |
| `--c1l` | `#FFF1F2` | Fondo suave coral |
| `--c2` | `#2ED8A8` | Confirmado / verde |
| `--c2l` | `#EAFDF6` | Fondo suave verde |
| `--c3` | `#FFB800` | Pendiente / ámbar / seña |
| `--c3l` | `#FFF8E6` | Fondo suave ámbar |
| `--c4` | `#4E8EFF` | Info / "cerca mío" activado / links |
| `--c4l` | `#EEF5FF` | Fondo suave azul |
| `--c5` | `#9B59FF` | Alternativo (violeta) |
| `--wa` | `#25D366` | WhatsApp |
| `--bg` / `--sf` / `--sf2` | `#FFFFFF` / `#F9FAFB` / `#F0F2F5` | Fondos |
| `--tx` / `--tx2` / `--tx3` | `#0D0D0D` / `#5A5A6E` / `#ABABBA` | Texto primario/secundario/terciario |
| `--br` | `rgba(0,0,0,0.07)` | Borde universal |

Verde fuerte de acento `#0F7A5A` (texto sobre `c2l`) usado para badges "disponible" / "reservable hoy".

### 1.3 Accesibilidad (incorporada en este rediseño)

- `:focus-visible` con outline `var(--c4)` 2px, offset 2px — WCAG 2.4.7
- Sobre fondos oscuros, outline azul opaco `#7FA8FF`
- `@media (prefers-reduced-motion: reduce)` — desactiva animaciones globalmente
- Skip-link "Saltar al contenido" al tope del layout

### 1.4 Radios / sombras / easings

- Radios `--r-sm 10px` · `--r-md 14px` · `--r-lg 18px` · `--r-xl 20px` · `--r-full 99px`
- Sombras `--sh-sm/md/lg`
- Easings `--ease-snap` (default), `--ease-spring` (rebote), `--ease-ui` (0.18s)

### 1.5 Componentes CSS base

`.btn-primary` · `.btn-secondary` · `.btn-outline` · `.btn-surface` · `.btn-whatsapp` · `.card` · `.card-confirmation` · `.chip` / `.chip-active` · `.badge` + variantes verde/rojo/ámbar/azul/violeta · `.skeleton` shimmer · `.screen-x` (18px px) · `.safe-bottom` (iOS notch)

---

## 2. Navegación global — [BottomNav](app/components/ui/BottomNav.tsx)

Fixed bottom, `backdrop-blur-md`, respeta safe-area. 4 ítems:

| Ítem | Ruta | Estado |
|---|---|---|
| Inicio | `/` | ✅ |
| Favoritos | `/favoritos` | ✅ **nueva pantalla** |
| Reservas | `/mis-reservas` | ✅ |
| Perfil | `/perfil` | ✅ |

> En la versión vieja el 2° ítem era "Buscar" y no tenía pantalla. Ahora es Favoritos (funcional).

---

## 3. Home — [`/`](app/app/page.tsx) + [HomeClient](app/components/lab/HomeClient.tsx)

Server component liviano (fetch de venues activos) que pasa todo a `HomeClient`. El cliente arma la experiencia completa.

### 3.1 Header editorial

```
MEDIODÍA · BUENOS AIRES          [LAB]  🔔(3)
¿Qué sale?
```

- **Eyebrow dinámico por hora del día**:
  - `<11h` → "Buen día"
  - `<15h` → "Mediodía"
  - `<19h` → "Tarde"
  - `<23h` → "Esta noche"
  - `else` → "Late night"
- Badge "LAB" ámbar (indicador de ambiente experimental)
- Campana de notificaciones con contador `unreadCount` rojo (abre `NotificationsSheet`)

### 3.2 Barra de filtros (top controls)

```
[≡ Filtros (3)]   [📍 Cerca mío]   [ Lista ┃ Mapa ]
```

- **Filtros**: abre `FiltersSheet` bottom sheet. Badge coral con cantidad activa.
- **Cerca mío**: pide geolocalización (`useGeolocation`). Cuando está activo → bg azul `--c4`, botón blanco + orden por distancia. Si el usuario deniega: mensaje inline rojo.
- **Lista / Mapa toggle** (`ListMapToggle`): cambia entre grid de cards y `MapPreview` con pins.

### 3.3 Social proof strip (rotativo)

```
● 127 personas ya reservaron hoy · Mariana en Trattoria Sentori
```

- Pill `bg-c2l` verde suave, dot pulse
- Contador "reservaron hoy" mock determinístico por día (40–180)
- Feed de actividad rota cada 5s entre 6 entries (Mariana/Joaquín/Sofía/Agustín/Camila/Lucas)

### 3.4 Tabs "Ahora mismo" vs "Más adelante"

```
[⚡ Ahora mismo]    [📅 Más adelante]
```

- "Ahora": filtra venues con ≥2 slots disponibles en la próxima hora (mock). Fondo coral `--c1` si activo.
- "Más adelante" (default): muestra todos.

### 3.5 Hero venue destacado

```
DESTACADO ESTA SEMANA              ● 8 disponibles ahora
┌────────────────────────────────────────────┐
│ [imagen 16/10]                   ♡         │
│ 🥩 Carnes · Seña                            │
│                                             │
│ Cortes del 9                                │
│ Palermo · $$$                                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ ● Nuevo         Reservable hoy · 20:30     │
└────────────────────────────────────────────┘
```

Usa `VenueCardLab variant="hero"` con heart absoluto top-right, badge cocina + emoji top-left, gradiente oscuro, precio tier, distancia, slot "reservable hoy".

### 3.6 Empty state (sin hero)

```
🔍
Sin resultados
Probá otra cocina o ajustá los filtros.
[Limpiar filtros]
```

### 3.7 [LiveReviewsStrip](app/components/lab/LiveReviewsStrip.tsx)

Banda horizontal con reseñas recientes rotando — social proof editorial. Solo aparece si hay hero.

### 3.8 [SearchPill](app/components/lab/SearchPill.tsx)

```
[ 🗓 Hoy  ·  🕐 21:00  ·  👥 2 ]
```

Pill único que permite cambiar fecha / hora / cantidad de personas. El state se propaga como query string al link del venue → prefillea el wizard.

### 3.9 Buscador de texto

```
[🔍  Buscar por nombre, cocina o dirección… ][✕]
```

- Filtra en vivo sobre `name`, `address`, `description`
- Botón ✕ para limpiar cuando hay query

### 3.10 [CuisineTabs](app/components/lab/CuisineTabs.tsx)

Tabs horizontales scrollables con cocinas + contadores:
- 🍝 Pastas (12) · 🥩 Carnes (8) · 🍕 Pizza (6) · 🥗 Vegano (4) · 🍣 Sushi (3) · Todos

### 3.11 Chips de filtros activos

Si hay filtros aplicados, chips removibles (`×`) con "Limpiar todos".

### 3.12 Listado — grid + lista

Cuando `view === 'list'`:

**a. Info bar**: `{N} locales · {cocina}` + label del sort (Recomendados / Disponibles ahora / Mejor reputación / Cerca mío)

**b. "Más restaurantes"**: grid 2-col, `VenueCardLab variant="standard"` (aspect 4:3, imagen + badges slot overlay abajo, heart, NEW badge). Primeras 6.

**c. [EditorialBand](app/components/lab/EditorialBand.tsx)**: banda editorial insertada a mitad del feed.

**d. "Todos los locales"**: variante `compact` — foto 20×20, nombre + cocina + barrio + slots badges + seña + distancia, heart posicionado. Resto del listado.

### 3.13 Vista Mapa — [MapPreview](app/components/lab/MapPreview.tsx)

Cuando `view === 'map'`: mapa con pins de los primeros 20 venues filtrados, tap para activar. Leyenda: "Tap en un pin para ver el detalle · Integración con mapa real próximamente".

### 3.14 Bottom sheets

- [FiltersSheet](app/components/lab/FiltersSheet.tsx): sheet 85vh con grabber, secciones Sort / Momento del día / Cocinas / Dietary / Promos / Precio / Ambiente / Features / Barrios (12 barrios CABA: Palermo, Villa Crespo, Recoleta, San Telmo, Caballito, Belgrano, Núñez, Almagro, Boedo, Chacarita, Colegiales, Puerto Madero)
- [NotificationsSheet](app/components/lab/NotificationsSheet.tsx): bandeja de notifs con contador unread

---

## 4. Detalle de restaurante — [`/[venueId]`](app/app/[venueId]/page.tsx) + [VenueDetailClient](app/components/lab/VenueDetailClient.tsx)

Scaffolding mucho más rico que la versión vieja.

### 4.1 Estructura en tabs (scroll-spy)

```
[🍽️ Menú] [🕐 Horarios] [📍 Ubicación] [ℹ️ Detalles]
```

- Sticky tabs bar con IntersectionObserver → highlight del tab activo mientras scrolleás manualmente
- Click en tab → smooth scroll programático a la sección (usa `lib/scroll.ts` para evitar jitter)

### 4.2 Hero — galería

- **Galería**: múltiples imágenes desde `config_json.gallery_urls` o fallback derivado de `image_url` (fachada, interior, plato, ambiente)
- Dots indicador de posición
- Fullscreen gallery al tap (`fullscreenGallery`)
- Favorito (heart) sobre el hero

### 4.3 Header info

```
🥩 Cortes del 9 · Carnes · Palermo
$$$ · Abierto hoy 19:00–24:00
[♡ Guardar] [Compartir]
```

- Cuisine label + emoji dinámico
- Today hours calculado desde `config_json.service_hours` (array con `day_of_week`, `opens_at`, `closes_at`, `is_open`). Si no hay → "Cerrado hoy"
- Botón Compartir con Web Share API + fallback clipboard (microcopy `shareMsg`)

### 4.4 Sección Menú

- Preview de las primeras categorías + platos (de `menu_categories` / `menu_items`)
- Botón "Ver menú completo" → expande (`showFullMenu`)

### 4.5 Sección Horarios

Tabla de horarios de la semana construida desde `service_hours`.

### 4.6 Sección Ubicación

- [VenueMap](app/components/lab/VenueMap.tsx): mapa con pin del venue
- Dirección + botón "Cómo llegar"

### 4.7 Sección Detalles (features)

Grid de features (icono emoji + label). Biblioteca de features disponibles:

```
📶 Wi-Fi gratis · ♿ Accesible · 🅿️ Estacionamiento · 🐾 Pet-friendly
🌿 Al aire libre · 💳 Acepta tarjetas · 🥗 Opciones vegetarianas
🌱 Opciones veganas · 🌾 Sin TACC · 👶 Apto niños
🍷 Carta de vinos · 🍸 Barra / tragos · 🤫 Ambiente tranquilo · ✨ Trendy
```

Fallback si no hay `config_json.features`: `['cards', 'vegetarian', 'wifi', 'accessible']`.

### 4.8 Sección Reseñas

> **Scaffolding honesto**: hoy `DEMO_REVIEWS` está vacío (array `[]`). Comentario en el código: "Por ahora sin data real (venue_reputation_view aún no conectado en lab). Mostramos empty state verificable en vez de datos ficticios que erosionan confianza."
> 
> Pendiente: tabla `reviews` en Supabase + endpoint `/api/reviews` + RLS.

### 4.9 CTA sticky bottom

Botón "Reservar" fijado abajo. Abre el `ReservationWizard` como overlay (`showWizard`). Prefill desde query string si viene de SearchPill.

---

## 5. Wizard de reserva — [ReservationWizard](app/components/reservation/ReservationWizard.tsx)

4 pasos. Mismo flujo general que antes, pero con mejoras UX batch A+B+C (commit `f316bd6`) y fixes post (`a0ae099`, `89a824f`). 897 líneas.

### 5.1 Pasos

1. **datetime** — fecha / hora / pax, **todas las secciones siempre visibles** (scroll único, ya no step-by-step)
2. **table** — grid de mesas disponibles
3. **menu** — pre-pedido opcional con "¿Lo de siempre?" si hay lastOrder
4. **summary** — confirmación + countdown de lock + pago

### 5.2 Fixes del rediseño

- CTA sticky no bleedea más sobre el BottomNav (fondo coral contenido)
- RLS fix: crear table-lock sin sesión ya no tira error
- Scroll robusto: `lib/scroll.ts` evita jump al cambiar de step

### 5.3 Flujo de pago

- POST `/api/reserva/crear` → `pending_payment`
- POST `/api/orders` si hay pre-pedido
- POST `/api/reserva/{id}/pago` → redirect a Mercado Pago
- Retorno con `?status=approved|rejected|pending&payment_id=...`

---

## 6. Pagar — `/reserva/[id]/pagar`

> Ruta `app/reserva/[id]/pagar/page.tsx` **presente**. Usa [PaymentMethodClient](app/components/lab/PaymentMethodClient.tsx), [CreditCardForm](app/components/lab/CreditCardForm.tsx), [Countdown](app/components/lab/Countdown.tsx).

Permite pagar la seña dentro de la app (no sólo via redirect MP):
- Selector de método de pago
- Formulario de tarjeta custom (con validaciones visuales)
- Countdown para el lock de mesa

---

## 7. Confirmación — `/reserva/[id]/confirmacion`

Usa [ConfirmationClient](app/components/confirmation/ConfirmationClient.tsx) + [Confetti](app/components/confirmation/Confetti.tsx) + [QRDisplay](app/components/confirmation/QRDisplay.tsx). Idéntica a la versión vieja: animación staggered, QR JWT, confetti, botones WhatsApp / iCal / Invitar al grupo.

---

## 8. Mis reservas — [`/mis-reservas`](app/app/mis-reservas/page.tsx)

Tabs **Próximas / Historial** con badges status (Confirmada / Asistida / Pendiente / No asistí / Cancelada). CTAs contextuales "Ver QR", "Reservar de nuevo", "Volver a reservar".

> Nuevo en esta versión: **post-visita muestra botón "Dejar reseña"** que abre [ReviewModal](app/components/lab/ReviewModal.tsx) (ver §12).

---

## 9. Favoritos — [`/favoritos`](app/app/favoritos/page.tsx) ⭐ **NUEVA PANTALLA**

```
TU SELECCIÓN                          [ Vaciar ]
Favoritos

[ 3 lugares guardados ]

[VenueCardLab compact] × N
```

- Lee de `useFavorites()` ([lib/favorites.ts](app/lib/favorites.ts)) — **localStorage por ahora** (no Supabase)
- Fetch de `/api/venues` y filtra por IDs favoritos
- Empty state: ícono corazón, "Todavía no guardaste ninguno", "Tocá el corazón en cualquier restaurante…", CTA "Explorar restaurantes"
- "Vaciar" con confirm nativo

---

## 10. Perfil — [`/perfil`](app/app/perfil/page.tsx)

Similar a la versión anterior: avatar coloreado, edición de nombre, stats (total/asistidas/%), favorito, contacto, logout.

---

## 11. Grupo — [`/grupo/[token]`](app/app/grupo/[token]/page.tsx)

Dark theme, realtime Supabase, sin auth. Idéntica a la vieja.

---

## 12. ReviewModal — [components/lab/ReviewModal.tsx](app/components/lab/ReviewModal.tsx)

Modal/bottom sheet para dejar reseña post-visita.

```
┌────────────────────────────────────┐
│  ★ ★ ★ ★ ★  (0 → 5, hover preview) │
│  Comentario                        │
│  [ textarea ]                      │
│  [ Enviar reseña → ]               │
└────────────────────────────────────┘
```

**Estado actual (scaffolding honesto en el código)**:
- Guarda en `localStorage` key `reservaya-reviews` — **NO hay backend real todavía**
- Después del submit: animación success "¡Gracias por tu reseña! · Ayudás a otros a elegir mejor." 1.5s → cierra
- Comentario inline en el componente: *"Próximo paso: crear tabla `reviews` en Supabase con `{reservation_id, user_id, venue_id, score, comment, photos[], created_at}` + endpoint `POST /api/reviews` + RLS permitir sólo si `user_id` matcheó `reservation.user_id` y `reservation.status === 'checked_in'`."*

---

## 13. Login — [`/(auth)/login`](app/app/(auth)/login/page.tsx) + [callback](app/app/auth/callback/route.ts)

Tabs Iniciar / Crear, Supabase email+password. Sin cambios significativos vs la versión anterior.

---

## 14. API routes (completas)

| Endpoint | Uso |
|---|---|
| `POST /api/auth/ensure-profile` | Crea perfil user si no existe |
| `GET /api/venues`, `GET /api/venues/[id]` | Listado + detalle |
| `GET /api/mis-reservas` | Reservas del user |
| `GET, PATCH /api/perfil` | Perfil + edición nombre |
| `GET /api/tables/disponibles` | Mesas libres por fecha/hora/pax |
| `POST, DELETE /api/table-lock` | Lock temporal |
| `POST /api/reserva/crear` | Crea reserva pending_payment |
| `POST /api/reserva/[id]/pago` | Inicia Mercado Pago |
| `POST /api/reserva/[id]/confirmar-pago` | Webhook / confirmación |
| `POST /api/orders` | Pre-pedido |
| `GET /api/orders/ultimo` | Última orden del user |
| `POST /api/grupo` | Crea room de grupo |
| `GET /api/grupo/[token]` | Info del room |
| `POST /api/grupo/[token]/join` | Sumar guest |

> **Aún no existe**: `/api/reviews`. El `ReviewModal` persiste en localStorage hasta que se cree.

---

## 15. Librerías cliente nuevas ([app/lib/](app/lib/))

- **[favorites.ts](app/lib/favorites.ts)** — hook `useFavorites()` con `{ favorites, isFavorite, toggle, clear }`. Persistencia en localStorage.
- **[geolocation.ts](app/lib/geolocation.ts)** — hook `useGeolocation()` con `{ status, location, request, clear }`. Estados: idle / requesting / granted / denied. Helper `distanceKm(a, b)` Haversine.
- **[scroll.ts](app/lib/scroll.ts)** — `smoothScrollToElement()` + `isProgrammaticScrollActive()` para coordinar scroll + IntersectionObserver sin race conditions.

---

## 16. Diff clave vs versión vieja (valor agregado del rediseño)

| Feature | Vieja | Nueva |
|---|---|---|
| Tipografía display | Fraunces (serif) | Poppins (sans) |
| Favoritos | ❌ | ✅ Pantalla + persistencia localStorage |
| Búsqueda funcional | ❌ (placeholder) | ✅ Texto + tabs cocina |
| Filtros avanzados | ❌ | ✅ FiltersSheet (9 ejes) |
| Geolocalización / Cerca mío | ❌ | ✅ |
| Vista Mapa | ❌ | ✅ MapPreview + VenueMap |
| Social proof rotativo | ❌ | ✅ Strip + LiveReviewsStrip |
| Eyebrow por hora del día | ❌ | ✅ |
| Tab Ahora/Después en home | ❌ | ✅ |
| Tabs detalle venue (menú/horarios/ubicación/detalles) | ❌ (una página simple) | ✅ scroll-spy |
| Galería venue | ❌ | ✅ multi-imagen + fullscreen |
| Horarios semanales | ❌ | ✅ `service_hours` |
| Features venue con íconos | ❌ | ✅ 14 features mapeadas |
| ReviewModal post-visita | ❌ | ⚠️ scaffolding (localStorage, no backend) |
| Notificaciones inbox | ❌ (campana estática) | ✅ NotificationsSheet funcional |
| SearchPill (prefill wizard) | ❌ | ✅ |
| Accesibilidad (focus-visible, skip-link, prefers-reduced-motion) | ❌ | ✅ |
| Página /pagar in-app | ❌ | ✅ PaymentMethodClient + CreditCardForm |
| VenueCardLab 3 variantes (hero/standard/compact) con heart | ❌ (2 variantes, sin heart) | ✅ |

---

## 17. Pendientes / gaps honestos del rediseño

De la lectura directa del código (comentarios del propio equipo):

1. **Reseñas reales**: `ReviewModal` guarda en localStorage. Falta tabla `reviews` + endpoint + RLS.
2. **Rating en detalle**: `DEMO_REVIEWS = []` hardcodeado — la sección muestra empty state hasta conectar `venue_reputation_view`.
3. **Mapa real**: `MapPreview` y `VenueMap` usan aproximaciones visuales. Copy literal en home: "Integración con mapa real próximamente".
4. **Slots reales**: `mockSlots(id)` es determinístico por venue id. Falta `/api/availability` real.
5. **Actividad rotativa**: `ACTIVITY_FEED` y `reservedTodayCount()` son mock.
6. **Favoritos cloud**: persistencia en localStorage, no sincronizado entre devices.
7. **"Recuperar contraseña"**: login no ofrece flow.
8. **Cancelar reserva desde `/mis-reservas`**: no hay botón de cancelar.
9. **"LAB" badge** en el header: está bien durante desarrollo, pero hay que bajarlo cuando se presente como producto.

---

## 18. Resumen de rutas

| Ruta | Archivo | Tipo |
|---|---|---|
| `/` | [app/app/page.tsx](app/app/page.tsx) | Server |
| `/[venueId]` | [app/app/[venueId]/page.tsx](app/app/[venueId]/page.tsx) | Server |
| `/favoritos` | [app/app/favoritos/page.tsx](app/app/favoritos/page.tsx) | Client |
| `/mis-reservas` | [app/app/mis-reservas/page.tsx](app/app/mis-reservas/page.tsx) | Client |
| `/perfil` | [app/app/perfil/page.tsx](app/app/perfil/page.tsx) | Client |
| `/reserva/[id]/pagar` | [app/app/reserva/[id]/pagar/page.tsx](app/app/reserva/[id]/pagar/page.tsx) | Client |
| `/reserva/[id]/confirmacion` | [app/app/reserva/[id]/confirmacion/page.tsx](app/app/reserva/[id]/confirmacion/page.tsx) | Server |
| `/grupo/[token]` | [app/app/grupo/[token]/page.tsx](app/app/grupo/[token]/page.tsx) | Client |
| `/login` | [app/app/(auth)/login/page.tsx](app/app/(auth)/login/page.tsx) | Client |
| `/auth/callback` | [app/app/auth/callback/route.ts](app/app/auth/callback/route.ts) | Route |
