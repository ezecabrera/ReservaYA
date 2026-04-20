# Un Toque — Diseño actual de la PWA cliente

> Relevamiento end-to-end del diseño real del cliente para revisión de diseño.
> Branch: `claude/app-lab-redesign` · Worktree: `trusting-almeida-a01981`
> Fecha: 2026-04-20 · HEAD: `928a8fd`

---

## 0. Posicionamiento y marca

- **Nombre**: Un Toque (antes: ReservaYa)
- **Tagline**: "Reservá en Un toque"
- **Propuesta**: reservar mesa en restaurantes de Buenos Aires en segundos, sin llamar
- **Diferenciadores clave (producto)**: rating bidireccional (cliente ⇄ venue), % cancelaciones público, seña devuelve, CRM con export, WhatsApp templates oficiales
- **Ícono**: mano blanca estilizada sobre fondo coral `#FF4757` (ver `app/public/icons/*`)
- **Splash screen**: sprite de 24 frames animando la mano del ícono (coral), 900ms + fade 280ms, una sola vez por sesión (`sessionStorage`). Respeta `prefers-reduced-motion`.

---

## 1. Sistema visual

### 1.1 Tipografía

| Rol | Fuente | Weights |
|---|---|---|
| Display (títulos, precios grandes) | **Fraunces** (serif editorial) | 600 · 700 · 800 · 900 · **default 700, h1/h2/h3 800** |
| Body (labels, inputs, párrafos) | **Plus Jakarta Sans** (sans) | 400 · 500 · 600 · 700 · 800 |

La clase `.font-display` garantiza `font-weight: 700` por default (h1/h2/h3 → 800) incluso si falta `font-bold` explícito — decisión: Fraunces en regular no funciona bien en mobile, el producto pide peso robusto en títulos.

### 1.2 Paleta (CSS vars en `globals.css`)

| Token | HEX | Uso |
|---|---|---|
| `--c1` | `#FF4757` | CTA primario coral · theme_color PWA |
| `--c1l` | `#FFF1F2` | Fondo suave coral |
| `--c2` | `#2ED8A8` | Confirmado / "Disponible" / verde |
| `--c2l` | `#EAFDF6` | Fondo suave verde (+ texto `#0F7A5A`) |
| `--c3` | `#FFB800` | Pendiente / ámbar / seña (+ texto `#B78200`) |
| `--c3l` | `#FFF8E6` | Fondo suave ámbar |
| `--c4` | `#4E8EFF` | Info · focus ring (a11y) |
| `--c5` | `#9B59FF` | Violeta (dietary badges, texto `#6B30CC`) |
| `--wa` | `#25D366` | WhatsApp |
| `--bg/--sf/--sf2` | `#FFFFFF / #F9FAFB / #F0F2F5` | Fondos |
| `--tx/--tx2/--tx3` | `#0D0D0D / #5A5A6E / #ABABBA` | Texto principal / secundario / terciario |
| `--br` | `rgba(0,0,0,0.07)` | Borde universal |

### 1.3 Radios / sombras / easings

- Radios: `--r-sm 10px · --r-md 14px · --r-lg 18px · --r-xl 20px · --r-full 99px`
- Sombras: `--sh-sm` ligero · `--sh-md` medio · `--sh-lg` elevado
- Easings: `--ease-snap` cubic-bezier(0.32, 0.72, 0, 1) · `--ease-spring` cubic-bezier(0.34, 1.56, 0.64, 1) · `--ease-ui` 0.18s ease
- Keyframe notable: `splashPlay` (24 steps, 900ms) para la animación de splash

### 1.4 Accesibilidad

- `:focus-visible` con outline azul `var(--c4)` 2px, offset 2px — sobre fondos oscuros usa `#7FA8FF` más opaco (WCAG 2.4.7)
- `@media (prefers-reduced-motion: reduce)` desactiva animaciones globalmente + stop al splash sprite
- Skip link "Saltar al contenido" al tope del layout

### 1.5 Responsive

Mobile-first puro. `screen-x` = 18px padding horizontal. `safe-bottom` respeta iOS notch. Viewport `user-scalable=no`.

---

## 2. Navegación global

**BottomNav** (fixed bottom, `backdrop-blur-md`):

| Ítem | Ruta | Ícono |
|---|---|---|
| Inicio | `/` | casa |
| Favoritos | `/favoritos` | corazón |
| Reservas | `/mis-reservas` | calendario |
| Perfil | `/perfil` | user |

Tab activo: ícono + label en `--c1` con dot indicador. Inactivo: `--tx3`.

**Excepción**: la **pantalla de detalle de venue (`/[venueId]`) no muestra BottomNav** — es una pantalla de foco donde el usuario explora + reserva. Se vuelve al home con el back arrow del hero.

---

## 3. Home — [`/`](app/app/page.tsx)

### 3.1 Estructura

```
┌─────────────────────────────────────┐
│ Un toque                         🔔 │  h1 Fraunces 30px (o "Hola {nickname}")
│ Reservá en Un toque                 │  tagline 14px tx2
├─────────────────────────────────────┤
│ 🔍 ¿a dónde salís hoy?          ≡  │  search + filter icon inline pill
├─────────────────────────────────────┤
│ [Todos·22] [Pastas·4] [Parrilla·4]… │  cuisine tabs (bold, no emoji)
├─────────────────────────────────────┤
│ ● 169 personas ya reservaron hoy    │  social proof rotativo (5s)
│   · Mariana en Trattoria Sentori    │
├─────────────────────────────────────┤
│ DESTACADO       ● 22 disponibles    │  label + chip verde
│                                     │
│ [VenueCardLab hero — rica info]     │
├─────────────────────────────────────┤
│ LO QUE DICE LA GENTE        En vivo │  LiveReviewsStrip
│ [M] Martina ★★★★★  [J] Joaquín ★★★│
├─────────────────────────────────────┤
│ [SearchPill — fecha/hora/personas]  │  prefill wizard
├─────────────────────────────────────┤
│ 22 locales              Recomendados│  info bar
│                                     │
│ Más restaurantes                  21│
│ [standard card] [standard card]     │  grid 2-col × 3 filas
│ …                                   │
│                                     │
│ [EditorialBand]                     │
│                                     │
│ Todos los locales                   │
│ [compact card] × N                  │
├─────────────────────────────────────┤
│ BottomNav                           │
└─────────────────────────────────────┘
```

### 3.2 Header dinámico

- **Sin auth / sin nombre**: título `Un toque`
- **Con nombre**: título `Hola {nickname || firstName}`
  - Prioridad: `user_metadata.nickname` (configurable desde /perfil/configuracion) > primer nombre de `users.name`

### 3.3 Buscador + filtro inline

Single pill con 3 zonas: ícono lupa · input (placeholder "¿a dónde salís hoy?") · ícono ≡ filtro. El ícono filtro va sin borde, integrado a la derecha, con badge coral si hay filtros activos. Click abre `FiltersSheet`.

### 3.4 Cuisine tabs (CuisineTabs)

Chips horizontales scroll-x: `Todos · Pastas · Parrilla · Pizza · Sushi · Vegano`. Sin emojis, font-bold, contador al lado del label.

### 3.5 Social proof strip

Pill verde con dot pulse. Contador "N personas reservaron hoy" + feed rotativo de actividad cada 5s (6 entries ficticios determinísticos). **Mock** hasta que haya event stream real.

### 3.6 Hero venue card (VenueCardLab variant="hero")

```
┌───────────────────────────────────┐
│ [image 16:10]                   ♡ │
│ ● Disponible                       │  badge verde top-left (si hay slots)
│                                    │
│                                    │
│ Asador Don Ramiro                  │  name 24px Fraunces white, drop-shadow
│ Belgrano · $$$$                    │  meta 13px white/85
├───────────────────────────────────┤
│ ★ 4.1 · 38 reseñas · Seña         │  rating row
│ Asado al asador criollo con…       │  description line-clamp-2
│ Ver mesas →            Hoy · 20:00 │  CTA coral · slot
└───────────────────────────────────┘
```

Rating y count son **mock determinístico por venue.id** (`mockVenueRating`) hasta que tabla `reviews` esté conectada.

### 3.7 FiltersSheet

Bottom sheet 85vh con grabber. Secciones:
- **Sort**: Recomendados / Disponibles ahora / Mejor reputación / Cerca mío
- **Momento del día**: Desayuno/Almuerzo/Merienda/Cena/Late (emojis)
- **Cocinas** / **Dietary** (vegetariano/vegano/celíaco/kosher/halal) / **Promos** (HH, descuento, plato del día, evento)
- **Precio** ($ $$ $$$ $$$$)
- **Ambiente** (Cita, Grupo grande, Con niños, Tranquilo, Animado, Al aire libre, Después del trabajo)
- **Features** (Terraza, Patio, Barra, Privado, Pet-friendly, Sin música fuerte…)
- **Barrios CABA**: Palermo, Villa Crespo, Recoleta, San Telmo, Caballito, Belgrano, Núñez, Almagro, Boedo, Chacarita, Colegiales, Puerto Madero

### 3.8 NotificationsSheet

Bottom sheet. Entradas derivadas automáticamente de reservas + rewards:
- **Reservas**: pending_payment (💳), próxima <24h (⏰), confirmada (✓)
- **Streaks** (🔥 / ⭐ / 🍽️): cocinas distintas mes, cliente frecuente, fines seguidos
- **Tier nudge**: "A 1 reserva de Plata 🔥" si `toNextTier <= 2`

Unread state en localStorage (`reservaya-notifs-read`). Badge rojo en la campana.

---

## 4. Detalle de restaurante — [`/[venueId]`](app/app/%5BvenueId%5D/page.tsx)

BottomNav **oculta**. Back button en el hero vuelve al home.

### 4.1 Hero con info embebida

```
┌─────────────────────────────────┐
│ ←       [Carnes]         ⇆  ♡  │  badge cocina, dots
│                                 │  gradient overlay
│                                 │
│                                 │
│ Bodega del Sur                  │  30px Fraunces bold overlay
│ ★ 4.6 (142) · $$$ · Palermo    │  rating + price + hood overlay
└─────────────────────────────────┘
[thumbnails scroll]
```

- Galería multi-imagen (config_json.gallery_urls o fallback derivado)
- Fullscreen gallery stories-style con dots/tap zones
- Heart (toggle favorito) + share (Web Share API o clipboard)

### 4.2 Tabs underline (estilo resy/opentable)

```
Reservar | Menú | Reseñas (142) | Sobre nosotros
━━━━━━━━                                  ← coral underline bajo activo
```

Sin emojis. Font-bold. Switch entre tabs (no scroll-spy). Sticky arriba mientras scrolleás contenido.

### 4.3 Tab **Reservar** (default)

- Descripción corta del venue
- Card Dirección (ícono azul) + botón `Mapa` (abre Google Maps nativo)
- Card Horarios hoy (ícono ámbar) + badge `Abierto` (c2l) / `Cerrado` (sf2) calculado en tiempo real
- Sección "Hacé tu reserva": CTA coral full-width "Empezar reserva →" que monta el ReservationWizard inline
- Copy legal: "Cancelá gratis hasta {N}h antes · Reserva en ~30 segundos"

### 4.4 Tab **Menú**

Preview de primeras 2 categorías (toggle "Ver toda la carta"). Cada categoría: label uppercase + lista de platos (nombre bold + descripción + precio en Fraunces tabular). Hint al pie: "Los precios pueden variar".

### 4.5 Tab **Reseñas (N)**

Empty state hoy (backend de reviews no existe):
- Ícono estrella
- "Todavía no hay reseñas"
- "Sé el primero en compartir tu experiencia después de tu visita."

Cuando haya data: lista de reviews con nombre + fecha + estrellas + texto.

### 4.6 Tab **Sobre nosotros**

Consolidación de info secundaria:
- Historia (description larga con border-left coral, italic)
- **Lo bueno de acá**: grid 2-col de features con emoji (Wi-Fi, accesible, parking, pet-friendly, terraza, sin TACC, vegetariano, wine bar, barra, quiet, trendy, etc.)
- Sectores (si `zones_enabled`): Salón principal / Terraza / Barra / Privado
- Horarios semanales (grid día × shifts, hoy resaltado coral)
- Mapa con pin (VenueMap) o dirección + aviso "coordenadas no configuradas"
- Política de cancelación (card con 🛡️)

---

## 5. ReservationWizard — 4 pasos

Mismo flujo dentro de la tab Reservar (ya no bottom sheet).

### Paso 1 — **Fecha / Hora / Personas**

Todas las secciones siempre visibles (scroll único). FECHA: cards horizontales DIA/DÍA/MES. HORARIO: chips. PERSONAS: botones circulares 1–8. CTA "Ver mesas disponibles →" activa cuando las 3 estén elegidas.

### Paso 2 — **Mesa**

Grid 3-col aspect 1:1. Cada mesa: label (A3, B2…) + capacidad + sub-label (Ventana/Patio/etc si zones). Verde = disponible, gris = no.

Al elegir: DELETE lock anterior → POST `/api/table-lock` (10 min) → paso 3.

### Paso 3 — **Pre-pedido (opcional)**

- "¿Lo de siempre?" (si hay lastOrder)
- Categorías + ítems (nombre + descripción + precio + [−][qty][+])
- Badge "Últimos" (c3l) si `availability_status='limited'`
- Resumen con total. CTA "Continuar con pre-pedido" / "Continuar sin pre-pedido".

### Paso 4 — **Confirmar**

Card gradient verde-azul con resumen: Restaurante · Mesa (c2 bold) · Fecha · Horario · Personas.
Countdown ámbar visible ("Mesa reservada por 08:37"). Si vence → toast error + reset.
Pre-pedido editable, seña, CTA "Confirmar y pagar seña →" dispara Mercado Pago.

---

## 6. Confirmación — [`/reserva/[id]/confirmacion`](app/app/reserva/%5Bid%5D/confirmacion/page.tsx)

Animación secuenciada (5 pasos, 100-200ms cada):
1. Confetti canvas (55 partículas paleta)
2. Checkmark stroke-dashoffset
3. Título "¡Reserva confirmada!"
4. Dark card: "TU CÓDIGO DE MESA · {nick}·{mesa}" 32px Fraunces + QR 200×200 firmado JWT (4h exp)
5. Acciones: **Guardar en WhatsApp** (deep-link) · **Agregar al calendario** (.ics) · **Invitar al grupo** (link realtime)

Status rejected/pending: pantallas alternativas limpias con ícono + copy + CTA.

---

## 7. Mis reservas — [`/mis-reservas`](app/app/mis-reservas/page.tsx)

Tabs **Próximas / Historial** (segmented control). Cada reserva card con:
- Franja coral arriba si próxima
- Nombre venue + badge status
- Ícono fecha · ícono hora · ícono personas · mesa bold
- CTAs condicionales según status:
  - `confirmed` + próxima → "Ver QR" + "Reservar de nuevo"
  - `checked_in` pasada → "Volver a reservar" + "Dejar reseña" (abre ReviewModal)
  - `cancelled` → sin CTA

Badges status: Confirmada (azul) · Asistida (verde) · Pendiente (ámbar) · No asistí (rojo) · Cancelada (gris).

---

## 8. Favoritos — [`/favoritos`](app/app/favoritos/page.tsx)

- Header "TU SELECCIÓN · Favoritos" + botón Vaciar
- Lista de VenueCardLab variant="compact" con los venues guardados
- Empty state: ícono corazón, "Todavía no guardaste ninguno", "Tocá el corazón en cualquier restaurante para tenerlo siempre a mano", CTA "Explorar restaurantes"

Persistencia en **localStorage** (`reservaya-favorites`) hasta que se implemente tabla `favorites` cloud-synced.

---

## 9. Perfil — [`/perfil`](app/app/perfil/page.tsx)

```
┌──────────────────────────────────┐
│ [Avatar 80px]  Tester ReservaYA ✎│  edita nombre inline
│                desde abril 2026   │
├──────────────────────────────────┤
│ ● TU PRÓXIMA SALIDA              │  si hay reserva próxima
│ Bodega del Sur                    │
│ sáb 15 dic · 20:00 hs · Mesa A3  │
│ [Countdown card dark 13h 41m 45s] │
├──────────────────────────────────┤
│ 🥉 TU NIVEL · Bronce         2    │  card con gradient sutil del tier
│                          reservas │
│                          este mes │
│ ▓▓▓▓▓▓░░░░░░░  (progress bar)    │
│ ¡Una reserva más y subís a Plata!🔥  ← incentivo contextual
├──────────────────────────────────┤
│ ⭐ 6 visitas a Asador Don Ramiro  │  streak card
│    Cliente frecuente — preguntá…  │
│ 🔥 2 finde con plan este mes     │  streak card
│    Racha caliente — no la cortes  │
├──────────────────────────────────┤
│ [12 Total] [2 Asistidas] [67%]   │  stats grid
├──────────────────────────────────┤
│ ⭐ TU FAVORITO                    │
│    Bodega del Sur                 │
├──────────────────────────────────┤
│ Teléfono · Email (read-only)     │
├──────────────────────────────────┤
│ Mis reservas            →         │
│ Configuración           →         │
├──────────────────────────────────┤
│ Cerrar sesión                     │
│ Un Toque · v1.0                   │
└──────────────────────────────────┘
```

### 9.1 Sistema de niveles (A)

Tiers basados en `checked_in` del **mes actual**:

| Tier | Rango | Beneficios propuestos |
|---|---|---|
| 🥉 **Bronce** | 0-2/mes | Acceso normal |
| 🥈 **Plata** | 3-6/mes | Prioridad en lista de espera, avisos tempranos de cupo |
| 🥇 **Oro** | 7+/mes | -50% seña, copa de bienvenida en venues participantes |

Card con emoji + barra de progreso + incentivo motivacional contextual:
- `toNextTier === 1` → "¡Una reserva más y subís a {next}! 🔥"
- `toNextTier <= 2` → "{N} reservas más para {next} — estás cerca."
- `tier === 'oro'` → "Sos Oro este mes. Disfrutá los beneficios."
- cocinas >= 3 → "Probaste N cocinas distintas este mes. Animate con otra."

### 9.2 Rachas / challenges (C)

Detectadas automáticamente de reservas reales:
- 🍽️ **N cocinas distintas este mes** (≥3)
- ⭐ **N visitas a {venue}** + "Cliente frecuente" (≥3 al mismo venue)
- 🔥 **N finde con plan este mes** (≥2 fines de semana)

Cada racha:
- Renderiza como card en `/perfil` (abajo del tier card)
- Se inyecta en `NotificationsSheet` (campana) — unread hasta que abrís la bandeja
- Sube el contador rojo de la campana

---

## 10. Configuración — [`/perfil/configuracion`](app/app/perfil/configuracion/page.tsx) **nueva**

```
← PERFIL
  Configuración

┌─ Datos personales ───────────────┐
│ Nombre        [Germán        ]   │
│ Apellido      [García        ]   │
│ Sobrenombre                      │
│ Cómo te saluda la app (opcional) │
│               [Ger           ]   │
└──────────────────────────────────┘

┌─ Cuenta ─────────────────────────┐
│ Email      ezediga…@gmail.com    │
│ El email no se puede cambiar     │
│ desde acá por seguridad.         │
└──────────────────────────────────┘

[    Guardar cambios    ]  ← coral, disabled si no hay diff

La app te va a saludar como **Ger**.
```

Storage:
- **Nombre** → `users.name` (público)
- **Apellido** → `auth.user_metadata.surname`
- **Sobrenombre** → `auth.user_metadata.nickname`

El home lee `nickname || firstName(name)` para el saludo.

---

## 11. Grupo — [`/grupo/[token]`](app/app/grupo/%5Btoken%5D/page.tsx)

Tema **dark**, único del app (gradient `#0f0f1a → #1a1a2e`). Sin auth (link público):
- Badge "Grupo activo" pulse
- Nombre del restaurante (28px Fraunces white)
- Card organizador + lista de confirmados
- Progress bar (N/party_size)
- Form "Tu nombre" → "Me apunto →"
- Estados: joined (success) / lleno (warning)
- Supabase Realtime channel `group_guests:{room_id}` → updates en vivo
- WhatsApp share con copy pre-armado

---

## 12. Auth — [`/login`](app/app/%28auth%29/login/page.tsx) + `/auth/callback`

Tabs Iniciar sesión / Crear cuenta (segmented). Register agrega campo Nombre. Email+password Supabase. Post-register sin sesión → pantalla "Revisá tu email".

Mensajes de error traducidos: "Email o contraseña incorrectos", "Confirmá tu email antes de ingresar", "Ese email ya está registrado", etc.

---

## 13. API routes

| Endpoint | Uso |
|---|---|
| `POST /api/auth/ensure-profile` | Crea perfil si no existe (post-login) |
| `GET /api/venues`, `GET /api/venues/[id]` | Catálogo |
| `GET /api/mis-reservas` | Reservas del user |
| `GET /api/perfil` | Perfil + stats + **rewards** (tier, incentivo, streaks) |
| `PATCH /api/perfil` | Update `{name, surname, nickname}` |
| `GET /api/tables/disponibles` | Mesas libres fecha/hora/pax |
| `POST, DELETE /api/table-lock` | Lock temporal 10min |
| `POST /api/reserva/crear` | Crea reserva pending_payment |
| `POST /api/reserva/[id]/pago` | Inicia Mercado Pago |
| `POST /api/reserva/[id]/confirmar-pago` | Webhook / confirmación |
| `POST /api/orders` | Pre-pedido |
| `GET /api/orders/ultimo` | Última orden (para "¿Lo de siempre?") |
| `POST /api/grupo` | Crea room |
| `GET /api/grupo/[token]` | Info del room |
| `POST /api/grupo/[token]/join` | Sumar guest |

Endpoint **pendiente**: `/api/reviews` — hoy ReviewModal persiste en localStorage.

---

## 14. Componentes clave (inventario)

### Lab (`components/lab/`)
- **HomeClient** — orquesta home: header, search+filter, cuisine tabs, social proof, hero, strip, SearchPill, grid, EditorialBand
- **VenueCardLab** — 3 variantes: hero (rica info), standard (grid 2-col), compact (lista)
- **VenueDetailClient** — hero + 4 tabs + secciones por tab
- **FiltersSheet** — bottom sheet 9 ejes de filtros
- **NotificationsSheet** — bottom sheet con reservas + rewards
- **CuisineTabs** — chips horizontales scroll-x bold sin emoji
- **SearchPill** — selector fecha/hora/personas compacto
- **LiveReviewsStrip** — banda editorial horizontal de reseñas recientes
- **EditorialBand** — banner editorial en mitad del feed
- **ReviewModal** — post-visita (localStorage hasta backend)
- **Countdown** — visual de cuenta regresiva a próxima reserva
- **PaymentMethodClient + CreditCardForm** — pago in-app (alternativa al redirect MP)
- **MapPreview, VenueMap** — visualizaciones placeholder hasta mapa real

### Confirmation (`components/confirmation/`)
- ConfirmationClient · Confetti · QRDisplay

### UI core (`components/ui/`)
- **BottomNav**
- **SplashScreen** — sprite animation coral, 1x por sesión
- **Skeleton** (+ VenueCardSkeleton, TableCardSkeleton)
- **Toast** (useToast hook)

### Libs cliente (`lib/`)
- `favorites.ts` — hook `useFavorites()` (localStorage)
- `geolocation.ts` — `useGeolocation()` + Haversine `distanceKm`
- `scroll.ts` — scroll programático coordinado con IntersectionObserver

---

## 15. Animaciones notables

| Efecto | Dónde | Duración |
|---|---|---|
| `splashPlay` (sprite 24 frames) | SplashScreen | 900ms + 280ms fade |
| `slideEnter` | Toasts / sheets | 0.4s `--ease-snap` |
| Stagger confirmación (animStep 0→5) | ConfirmationClient | 100-200ms por paso |
| Checkmark stroke-dashoffset | Confirmación | ~500ms |
| Confetti particles physics | Confirmación | 90 frames (~1.5s) |
| `animate-pulse` dot | "Grupo activo", "Disponible", social proof | loop |
| Social proof rotativo | Home strip | 5000ms entre entries |
| Stories-style gallery progress | Detalle venue galería | — |
| `active:scale-[0.97~0.99]` | Botones + cards | 180ms |
| Progress bar tier | Perfil reward card | 500ms transition |

---

## 16. Gaps honestos (pendientes, marcados con comentario en el código)

1. **Reseñas reales**: ReviewModal guarda en `localStorage`. Falta tabla `reviews` + RLS (user_id matcheó reservation + status checked_in) + endpoint `POST /api/reviews`. Hoy el badge "(N)" en la tab muestra 0 siempre.
2. **Rating de venue en card/hero**: `mockVenueRating(venue.id)` determinístico por id. Se reemplaza por `venue_reputation_view` cuando esté.
3. **Mapa real**: `MapPreview` y `VenueMap` son placeholders. Copy: "Integración con mapa real próximamente".
4. **Slots reales**: `mockSlots(venue.id)` determinístico. Falta `/api/availability`.
5. **Social proof rotativo**: `ACTIVITY_FEED` y `reservedTodayCount()` son mock por día.
6. **Favoritos cloud**: hoy localStorage, no sincroniza entre devices.
7. **Notificaciones push reales**: hoy derivadas client-side de `/api/mis-reservas` + `/api/perfil`. Falta tabla `notifications` + triggers SQL.
8. **Recuperar contraseña**: login no ofrece flow todavía.
9. **Cancelar reserva desde mis-reservas**: no hay botón de cancelar, solo muestra status.
10. **Tier beneficios activables**: los beneficios de Plata/Oro son copy prometido — falta integración real con venues (prioridad waitlist, -50% seña, copa de bienvenida).

---

## 17. Rutas (overview)

| Ruta | Archivo | Tipo |
|---|---|---|
| `/` | `app/app/page.tsx` | Server |
| `/[venueId]` | `app/app/[venueId]/page.tsx` | Server |
| `/favoritos` | `app/app/favoritos/page.tsx` | Client |
| `/mis-reservas` | `app/app/mis-reservas/page.tsx` | Client |
| `/perfil` | `app/app/perfil/page.tsx` | Client |
| `/perfil/configuracion` | `app/app/perfil/configuracion/page.tsx` | Client |
| `/reserva/[id]/pagar` | `app/app/reserva/[id]/pagar/page.tsx` | Client |
| `/reserva/[id]/confirmacion` | `app/app/reserva/[id]/confirmacion/page.tsx` | Server |
| `/grupo/[token]` | `app/app/grupo/[token]/page.tsx` | Client |
| `/login` | `app/app/(auth)/login/page.tsx` | Client |
| `/auth/callback` | `app/app/auth/callback/route.ts` | Route |

---

## 18. Identidad visual resumida

- **Serif editorial bold** (Fraunces) para títulos como sello: siempre pesado, nunca regular
- **Coral `#FF4757`** como único accent cromático — no hay púrpuras secundarios fuertes
- **Verde mint `#2ED8A8`** reservado para "disponible" / "confirmado" — scarcity positiva
- **Gold `#FFB800`** reservado para "pendiente" / "seña" — atención blanda
- **Sin emojis en tabs** (navegación), **con emojis en badges** (features, cocinas dentro de FiltersSheet, streaks)
- **Cards blanco + borde `rgba(0,0,0,0.07)` + shadow-sm** — estética limpia, no flat, no skeumórfica
- **Cero acentos dark** excepto en `/grupo/[token]` (único modo dark, como espacio social separado)
