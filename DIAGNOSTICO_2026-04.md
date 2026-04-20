# Un Toque — Diagnóstico técnico

> Análisis integral del proyecto al **2026-04-20** · branch `claude/app-lab-redesign` · HEAD `e3e4353` sobre `main`
> PWA cliente de reservas de restaurantes en Buenos Aires

---

## 1. Resumen ejecutivo

Un Toque está en un punto **"piloto-listo"**: la UX del cliente ya es indistinguible de apps comerciales (Resy / OpenTable / Yummo en términos de sensación), el sistema visual es coherente y propio, y el flujo de reservar → pagar seña → confirmar → check-in está cerrado end-to-end. El panel del negocio queda pendiente de validación externa.

**Madurez por área**:

| Área | Estado | Madurez |
|---|---|---|
| Frontend cliente (UX, diseño, navegación) | ✅ Producción | 85% |
| Backend core (reservas, pagos, grupos) | ✅ Funcional | 75% |
| Sistema de reviews / rating | ⚠️ Scaffolding | 30% |
| Mapas / geolocalización | ⚠️ Placeholder | 40% |
| Tests automatizados | ❌ No existen | 0% |
| Observability (Sentry, logs) | ❌ No existe | 0% |
| Rate limiting / abuso | ❌ No existe | 0% |
| CI/CD | 🟡 Vercel auto-deploy sin gates | 50% |

**Recomendación macro**: antes de abrir piloto con usuarios reales, cerrar tests + observability + un pass de security. El resto es polish iterativo.

---

## 2. Stack y estructura

### Tecnologías

- **Next.js 14.2.15** (App Router, Server Components)
- **TypeScript strict**
- **Tailwind** con CSS custom properties para tokens
- **Supabase** (Postgres + Auth + RLS + Realtime)
- **pnpm workspaces + Turborepo** — 3 packages: `app/`, `panel/`, `shared/`
- **Mercado Pago SDK** para cobros
- **Vercel** para deploy
- **Fuentes**: Fraunces (display, weight 900) + Plus Jakarta Sans (body)

### Monorepo

```
reservaya/
├─ app/        PWA cliente (este análisis)
├─ panel/      panel del negocio (fuera de scope)
├─ shared/     types compartidos (@reservaya/shared)
├─ supabase/   migrations + APPLY_PILOT.sql bundle
└─ scripts/    seeds + herramientas
```

### Estadísticas del cliente

- **30 rutas** (páginas + route handlers)
- **16 componentes `lab/`** (feature components)
- **16 endpoints API**
- **6 migraciones SQL**
- **0 tests** ← ver §7
- **~50 commits** de trabajo de diseño/features desde la consolidación inicial

---

## 3. Funcionalidad cubierta

### 3.1 Descubrimiento (Home)
- Título dinámico con saludo personalizado (`Hola {nickname}` si logueado)
- Buscador inline + ícono filtro (FiltersSheet 9 ejes)
- Cuisine tabs con contador (Todos · Pastas · Parrilla · Pizza · Sushi · Vegano)
- **Social proof strip** rotando actividad cada 5s
- **Destacados carrusel** auto-scroll 5s, card centrada con scale 1.03, 4 tags (Evento especial / 20% OFF / Destacado / Nuevo menú)
- **LiveReviewsStrip** — reseñas clickeables que aterrizan en la tab Reseñas del venue
- SearchPill (fecha/hora/personas) → prefillea wizard
- Grid 2-col "Más restaurantes" + lista compacta
- **EditorialBand** con 5 guías curadas por ocasión

### 3.2 Guías por ocasión (NUEVO)
- 5 guías: `parrillas-cortes-premium`, `nuevas-aperturas`, `al-aire-libre`, `para-cita`, `grupo-grande`
- Scoring determinístico en [`lib/occasions.ts`](app/lib/occasions.ts)
- Usa `cuisine`, `price_tier`, rating mock, `created_at`, zones (outdoor/privada)
- Threshold MIN_SCORE=3 evita ruido
- Rutas `/guias` (lista) + `/guias/[slug]` (detalle con hero + grid)

### 3.3 Detalle del venue
- Hero 240px con **auto-scroll 3s** entre fotos + crossfade
- Click en imagen → fullscreen stories-style
- Pill "Nuevo" discreta top-left
- **5 tabs**: Reservar · Menú · Reseñas · Horarios · Sobre nosotros
- Descripción + card Dirección (botón Mapa) + card Horarios hoy (badge Abierto/Cerrado calculado en runtime)
- CTA "Empezar reserva" → navega a `/[venueId]/reservar`
- Reviews tab con aggregate card (44px rating + bar chart 5→1) + empty state
- Horarios: estado actual + grilla semanal con HOY resaltado
- Sobre nosotros: historia + features en grid + sectores + mapa + política cancelación

### 3.4 Wizard de reserva
- Ruta dedicada `/[venueId]/reservar` con back button correcto (no loop)
- **3 o 4 pasos dinámico**: datetime → [sector si hay varios] → menu → summary
- Step sector con chips grandes emojis + opción "Cualquier lugar"
- Mesa **auto-asignada** por prefix del sector + capacidad + disponibilidad
- Lock de 10 min en `/api/table-lock`
- Pre-pedido opcional con modal "¿querés ver menú?" al entrar al step
- Countdown de lock visible en summary
- POST a Mercado Pago con redirect a `init_point`

### 3.5 Confirmación
- Animación staggered (confetti → checkmark → título → dark code card → QR)
- JWT QR firmado server-side (4h expiry post-reserva)
- CTAs: WhatsApp share · Agregar al calendario (.ics) · Invitar al grupo
- Card de seña abonada

### 3.6 Grupos (NUEVO — menú colaborativo)
- `/grupo/[token]` tema dark, sin auth
- Cada invitado puede elegir su propio pre-pedido
- Estados: `pending` / `ordered` / `skipped` por guest
- Realtime Supabase: UPDATE + INSERT de `group_guests`
- MenuPickerSheet bottom-sheet con categorías + qty +/-
- WhatsApp share copy premium
- Migration 006 pendiente de aplicar en DB de prod

### 3.7 Mis reservas
- Tabs Próximas / Historial con contador
- Status badges (Confirmada / Asistida / Pendiente / No asistí / Cancelada)
- Countdown card a próxima reserva
- Cancel sheet con confirmación + motivos
- "Dejar reseña" post-visita (ReviewModal → localStorage)

### 3.8 Favoritos
- Lista de venues guardados
- Persistencia en localStorage (`reservaya-favorites`)
- Empty state + "Vaciar" con confirm

### 3.9 Perfil
- Avatar coloreado por hash del nombre
- Próxima reserva + Countdown dark
- **TierCard** con gradient por nivel (Bronce/Plata/Oro)
- Rachas auto-detectadas (cocinas distintas, cliente frecuente, fines consecutivos)
- Stats grid, contacto, configuración

### 3.10 Configuración (NUEVO)
- `/perfil/configuracion` — edit nombre/apellido/sobrenombre
- Sobrenombre usado en saludo del home

### 3.11 Splash + Ícono
- SplashScreen con sprite de 24 frames (mano) + hold 2s + texto "Un Toque"
- Ícono propio en 3 tamaños (192/512/180)
- Manifest PWA completo + theme_color coral

---

## 4. Arquitectura y patrones

### Fortalezas

- **Server Components** con fetch directo a Supabase: rápido, SEO-friendly, sin flash of loading para data crítica
- **CSS vars + Tailwind** mezcla bien: tokens centralizados + utility classes
- **Client components chicos y específicos** — no hay god components (con la excepción de `ReservationWizard` de ~900 líneas, que merece split)
- **Helpers aislados en `lib/`**: `favorites.ts`, `geolocation.ts`, `occasions.ts`, `venue-images.ts`, `scroll.ts` — cada uno con responsabilidad clara
- **Degradación elegante**: cuando un endpoint no está o una migration falta, se muestra empty state en vez de crash

### Debilidades

- **`ReservationWizard.tsx` ~900 líneas** — tiene 4 steps + toast + menu + lock timer + wizard state. Candidato para split en `DateTimeStep / SectorStep / MenuStep / SummaryStep` files
- **Acoplamiento entre configs de backend y seed**: `demo-data.mjs` maneja venues + zones + tables + menus todo junto. Difícil probar con data alternativa
- **Duplicación de paleta y tipografía**: los tokens están en `globals.css` del app Y también en `tokens.css` del bundle Claude Design + en el panel. Idealmente un solo source of truth
- **RLS inconsistente**: algunos endpoints usan service_role admin client como "bypass" (ej. menu en venue detail) porque la RLS bloquea lectura anónima. Se puede solucionar con políticas SELECT públicas para tablas read-only (venues, zones, menu_items)

---

## 5. Data y mocks

Honestos sobre lo que es real vs simulado:

| Dato | Fuente | Real? |
|---|---|---|
| Venues (20) | Supabase `venues` (seed) | ✅ Data ficticia pero estable en DB |
| Menú | `menu_categories` + `menu_items` | ✅ Real |
| Mesas / zones | `tables` + `zones` | ✅ Real |
| Reservas propias | `reservations` (user-scoped) | ✅ Real |
| Rating del venue | `mockVenueRating(id)` hash determinístico | ⚠️ Mock |
| Reviews del venue | `DEMO_REVIEWS = []` vacío + empty state | ⚠️ Pendiente tabla `reviews` |
| LiveReviewsStrip del home | `SEED_REVIEWS` hardcoded rotando | ⚠️ Mock con venueId real (lleva al venue) |
| Social proof (X reservaron hoy) | `reservedTodayCount()` hash por día | ⚠️ Mock |
| Actividad rotativa (6 entries) | Array hardcoded rotando cada 5s | ⚠️ Mock |
| Slots disponibles | `mockSlots(venue.id)` determinístico | ⚠️ Mock (falta `/api/availability` real) |
| Imágenes del venue | `loremflickr.com/...` con tags por cocina | ⚠️ Placeholder — mejora cuando cada venue suba foto propia |
| Notificaciones | Derivadas de `/api/mis-reservas` + `/api/perfil` rewards | 🟡 Real pero client-computed, falta tabla `notifications` |
| Favoritos | `localStorage['reservaya-favorites']` | 🟡 Real pero no syncea entre devices |
| Reseñas de ReviewModal | `localStorage['reservaya-reviews']` | ⚠️ Scaffolding, falta backend |
| Tier system (Bronce/Plata/Oro) | Calculado server-side de `reservations.checked_in` del mes | ✅ Real |
| Rachas | Calculadas server-side (cocinas distintas, visitas frecuentes, finde consecutivos) | ✅ Real |

**Observación**: los mocks visibles (rating, reviews, slots) están documentados en código con comentarios `// mock hasta…`. Buena práctica que ya aplicamos; cuando llegue la tabla real, el cambio es drop-in sin tocar componentes.

---

## 6. Seguridad

### Lo que está OK

- **Supabase Auth + RLS** como gate principal de authorización
- **JWT QR firmado** para check-in (no revocable pero time-bound)
- **Service role key** guardada en env vars (no en código)
- **Input validation** en API routes (campos obligatorios, rangos de party_size)
- **HTTPS forzado** vía Vercel

### Pendientes críticos

1. **Secret leak en git history** — ese `settings.local.json` tiene tokens de GitHub expuestos en commits de main pasados (GitHub Push Protection ya los detectó). **Rotar los tokens desde GitHub settings** y hacer `git rm --cached` del archivo.
2. **Rate limiting** — ninguno de los endpoints tiene rate limit. Ataque simple: POST en loop a `/api/reserva/crear` o `/api/table-lock` dropea seat inventory. Solución: middleware de rate limit (Upstash Redis o Vercel KV).
3. **CSRF** — las API routes públicas no validan origin. Next.js server actions sí, pero estos son route handlers.
4. **Sensitive data en logs** — ningún logger estructurado. Si se agrega Sentry + console.log, atención a no loggear PII.
5. **SQL injection** — Supabase client parametriza todo, cero riesgo directo. Pero el `.in('id', '(${busyTableIds.join(',)})')'` manual en `/api/tables/disponibles` es un string concat — aunque los IDs son UUIDs que vienen de la DB, es un patrón frágil.

### Pendientes medianos

- **Captcha** en signup para prevenir bot registrations
- **Content Security Policy** headers
- **CORS** explícito en las route handlers

---

## 7. Testing y CI

**Estado actual: 0 tests, 0 CI gates.**

- No hay `*.test.ts` ni `*.spec.ts` en el repo
- Vercel auto-deploya desde main sin correr type-check ni lint en PR
- El único "gate" es que yo corro `pnpm --filter @reservaya/app type-check` antes de commitear — no está automatizado

### Recomendación prioritaria

**Etapa 1 (crítico antes de piloto público)**:
1. Unit tests para `lib/` — occasions, venue-images, favorites, geolocation son funciones puras, tests en Vitest son rápidos
2. API route tests — ReservationWizard flow end-to-end con supabase-js mock
3. GitHub Actions workflow: type-check + lint + test en cada PR

**Etapa 2 (despues del piloto)**:
4. E2E con Playwright: signup → reservar → pagar → confirmar
5. Visual regression (Chromatic o Playwright screenshots) para prevenir regresiones de diseño

---

## 8. Observabilidad

**Estado actual: ninguna.**

No hay Sentry, no hay logs estructurados, no hay métricas de negocio. Si un usuario ve un error, nadie se entera.

### Recomendación

- **Sentry** o similar (~15 min setup con el SDK de Next.js)
- **Posthog** o **PlausibleAnalytics** para tracking de eventos
  - Métricas clave a trackear: `reserva_iniciada`, `reserva_completada`, `pago_aprobado`, `wizard_abandonado` (y en qué step), `dejar_reseña_clicked`
- **Supabase Realtime** logs para debug de Realtime channels del grupo

---

## 9. Performance

### Lo que está bien

- Next.js App Router con Server Components = HTML crítico pre-renderizado
- Imágenes con `<img>` directo (no Next Image) — LoremFlickr sirve con CDN rápido
- Tailwind JIT = CSS minificado
- Code-split por ruta nativo

### Opportunities

- **Ninguna imagen está optimizada con Next Image + sharp**. Podría reducir bytes 30-60% en hero images. Trade-off: necesita whitelist de `loremflickr.com` en `remotePatterns` y supabase storage si alguna vez se usa
- **No hay prefetch en los cards del home** — `next/link` prefetchea por default pero podrías disablar para cards lejanas del viewport con `prefetch={false}` y usar IntersectionObserver
- **Splash screen es 1.2MB PNG** — podría ser un APNG animado más chico, o SVG animado
- **Supabase queries en serie vs paralelo** — varias páginas hacen `Promise.all([...])` bien, pero algunas podrían paralelizar más (ej. guides page: venues y zones van paralelo ✅)

### Core Web Vitals

No está medido. Sin Lighthouse runs automatizadas, no sé números reales. **Requiere**: configurar lighthouse-ci en el pipeline.

---

## 10. Accesibilidad

### Lo que está OK

- `:focus-visible` global con outline azul (WCAG 2.4.7)
- Skip link "Saltar al contenido" en layout
- `@media (prefers-reduced-motion: reduce)` respetado en splash, carrusel, auto-scroll hero
- `aria-label` en botones icon-only (back, heart, share, etc.)
- `role="tablist"` + `aria-selected` en tabs
- Contraste coral `#FF4757` sobre blanco ✅ WCAG AA

### Gaps

- **No hay tests automatizados** de accesibilidad (axe-core en Playwright resolvería)
- **Algunas imágenes sin `alt` útil**: los thumbnails del hero del venue tienen `alt=""` (decorativo OK pero podría ser descriptivo)
- **Contraste de texto terciario `--tx3 #ABABBA` sobre blanco**: borderline WCAG AA para texto chico (<16px). Varias copy lines usan este color a 11-12px
- **Form fields sin labels visibles** en el wizard — los `uppercase-label` hacen de label pero no están conectados con `for`/`id` al input relacionado

---

## 11. Internacionalización

Todo hardcoded en **español rioplatense** (vos, reservá, salís). Consistente con el target BA.

**Si quieren expandir**: next-intl es el camino en Next.js 14. Mover todos los strings a un archivo de mensajes, extraer con un script. No es trivial pero tampoco catastrófico — con ~200 strings únicos estimados.

---

## 12. Mobile / PWA

### Lo que funciona

- Manifest completo (name, icons, theme_color, shortcuts a Mis reservas + Favoritos)
- Theme color coral `#FF4757`
- `user-scalable=no` + `status-bar-style=black-translucent` para feel nativo en iOS
- Safe-area-inset respetado en BottomNav + sticky CTAs

### Gaps

- **Sin service worker** → no funciona offline. Si el usuario pierde señal en pleno checkout, la app muere. `next-pwa` lo soluciona
- **Sin push notifications** — el piloto puede salir sin esto, pero engagement retention sufre
- **Instalabilidad** funciona pero no hay prompt educativo ("Agregá Un Toque a tu pantalla")

---

## 13. Deployment

### Estado actual

- Vercel proyecto `app-lab` (alias `app-lab-khaki.vercel.app`) — sirviendo producción desde main
- Deploy automático en cada push a main via Vercel GitHub integration
- Build time ~40s, deploy ~1 min total

### Gaps / decisiones pendientes

1. **Proyecto Vercel se llama `app-lab`** — heredado del rebrand. Rename a `un-toque` o `reservaya` cuando quieras
2. **Dominio custom** — `app-lab-khaki.vercel.app` no es production-grade. Comprar `untoque.app` (o similar) y apuntar
3. **Preview deploys en PRs** — están activos pero nadie los mira porque no se abren PRs. Si se merge directo a main, no hay preview
4. **Env vars production** — faltan `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `CRON_SECRET` según memoria del proyecto
5. **Sin staging environment** — un error en producción es visible a todos los usuarios (hoy nadie). A futuro conviene staging branch + env dedicada

---

## 14. Deuda técnica (priorizada)

### 🔴 Crítica (antes de piloto público)

1. **Rotar tokens de GitHub expuestos** + `.gitignore` de `settings.local.json`
2. **Aplicar migration 006** (`006_group_menu_selections.sql`) en Supabase Studio — la feature de menú colaborativo está inactiva hasta esto
3. **Tests básicos + CI** — al menos smoke tests de flujo de reserva
4. **Sentry** — aunque sea el SDK default

### 🟡 Alta (antes de marketing)

5. **Tabla `reviews`** + endpoint `POST /api/reviews` + RLS (user_id matchea reservation + status='checked_in') para cerrar el loop de ReviewModal
6. **Rate limit** en endpoints públicos (crear reserva, table-lock)
7. **Recuperar contraseña** en login
8. **Notificaciones push** (opcional pero alto valor)
9. **Dominio propio**
10. **Service worker** para offline básico

### 🟢 Media (mejora continua)

11. **Mapas reales** (Mapbox / Google Maps) en lugar de placeholder dotted
12. **Splits del ReservationWizard** en archivos separados
13. **Consolidar tokens de diseño** en un único source of truth
14. **Tests E2E con Playwright**
15. **Imagen optimization** con next/image
16. **Agenda de imagen por venue** — hoy LoremFlickr, ideal que cada venue suba sus propias fotos al panel
17. **Sort order** en `zones` table (columna inexistente — hoy caemos a created_at)

### 🔵 Baja (nice-to-have)

18. Tabla `occasions_manual_pins` para override del scoring algorítmico
19. Dark mode del app cliente (el grupo dark ya existe — ampliable)
20. Multi-language (es-AR → es / en)
21. Widget embebible para que los venues lo incrusten en su Instagram/web (diferenciador del pitch original, pero no crítico para piloto)

---

## 15. Riesgos concretos

1. **Dependencia de LoremFlickr**: si su CDN se cae o cambia política, todas las imágenes de los venues desaparecen. Mitigación: alojar imágenes propias en Supabase Storage (el admin del panel ya puede subirlas por venue).
2. **Mock rating nunca se reemplaza**: si se lanza piloto con rating hardcoded (4.1 ★ mock), y un venue real resulta peor, genera distorsión. Mitigación: mostrar "sin reseñas" hasta que haya data real, en lugar de mock.
3. **Migración 006 no aplicada en prod**: el código está live pero la feature silenciosamente falla. Mitigación: aplicar ASAP o feature-flag off hasta aplicarla.
4. **Escalado de scoring de guías**: con 200 venues, iterar todos por cada request de guía puede dar 200ms extra. Mitigación: cachear por slug + revalidación de 5min (ya tiene `revalidate = 300`). Escala hasta ~2000 venues sin problemas.
5. **Lock de 10 min en table-lock**: si el proceso de Mercado Pago tarda >10 min (posible con webhook queue), se pierde la mesa. Mitigación: extender lock a 15 min o permitir renewal.

---

## 16. Roadmap sugerido

### Sprint 1 (1 semana) — Pre-piloto hardening
- Rotar secrets + gitignore
- Aplicar migration 006
- Setup Sentry + 5 tests básicos del flujo de reserva
- Rate limit en creación de reservas + table-lock
- Dominio propio

### Sprint 2 (1-2 semanas) — Data layer completion
- Tabla `reviews` + endpoint + wiring de ReviewModal
- Swap mock rating por real
- Recuperar contraseña
- 20 tests unit + 3 E2E

### Sprint 3 (2 semanas) — Crecimiento
- Push notifications
- Service worker / offline mode
- Mapa real
- Onboarding de primer uso
- 5 guías curadas manualmente (hoy algorítmico)

### Sprint 4 (ad-hoc) — Producto
- Widget embebible (diferenciador B2B)
- Rating bidireccional (venue → cliente) — ya en memoria del proyecto
- Export CRM al venue (otro diferenciador del pitch)

---

## 17. Resumen para compartir

**Si tuvieras que venderle el estado del producto a un inversor**:

> "Un Toque tiene la experiencia de cliente terminada — desde descubrimiento con guías curadas hasta reserva, pago, confirmación con QR y gestión post-visita, incluyendo features diferenciadoras como menú colaborativo en grupos y sistema de rewards por tier. La calidad visual está a nivel de apps comerciales. El backend core está funcional en Supabase con RLS, y el despliegue automático a Vercel permite iterar rápido. Lo que queda antes de abrir piloto público es 1-2 semanas de hardening: tests básicos, monitoring con Sentry, rate limiting, y completar el loop de reseñas reales — todos bloqueos resolubles, no de producto."

**Si tuvieras que ser brutalmente honesto con vos mismo**:

> "Hice mucho diseño muy rápido sin escribir tests. El producto se ve terminado pero si un cliente real rompe un edge case no me entero. Los rating/reviews mostrados son ficticios. El dominio es un preview URL feo. Y hay tokens de GitHub expuestos en git history que urge rotar. Primero eso, después abrir la puerta."

---

## 18. Archivos de referencia

- Diseño UI: [`DISEÑO_APP_CLIENTE.md`](DISEÑO_APP_CLIENTE.md) — inventario pantalla-por-pantalla
- Migrations: [`supabase/migrations/`](supabase/migrations/) (001-006)
- Scoring guides: [`app/lib/occasions.ts`](app/lib/occasions.ts)
- Gastro images: [`app/lib/venue-images.ts`](app/lib/venue-images.ts)
- API: [`app/app/api/`](app/app/api/)
