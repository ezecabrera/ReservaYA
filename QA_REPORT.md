# QA Report — app-lab (ReservaYa rediseño B+A)

**Fecha:** 2026-04-17
**Tester:** `test@reservaya.test` (Tester ReservaYA, 2 reservas `pending_payment` pre-existentes)
**Método:** `preview_eval` contra el DOM real corriendo en http://localhost:3020, inspección de red y consola.
**Dispositivo simulado:** mobile 375×812 (iPhone baseline).

---

## Resumen ejecutivo

**8 bugs encontrados** · **3 corregidos inline** · **5 pendientes priorizados**

- ✅ Flujos core funcionando: login email+pass, browse home, detalle, navegación, sesión persistente.
- ✅ Accesibilidad base razonable: semántica HTML, alt text en imágenes, autocomplete en inputs.
- ⚠️ 3 bugs visuales/de formato corregidos durante el QA (commit `6a98038`).
- 🔴 1 problema estructural de accesibilidad: no hay `:focus-visible` definido → navegación por teclado invisible.
- 💡 8 recomendaciones de priorización para llamar mejor la atención del usuario.

---

## 1. Home — `/`

### ✅ Lo que funciona

| Check | Resultado |
|---|---|
| H1 único "ReservaYa" | ✓ |
| Jerarquía de headers (h1 → h2 → h3) | ✓ 9 elementos bien ordenados |
| Alt text en las 24 imágenes | ✓ 100% |
| Aria-label en botones ícono | ✓ 0 sin label |
| SearchPill visible above the fold | ✓ top=113px |
| Hero venue card con slots inline | ✓ top=428px (requiere scroll mínimo) |
| Autocomplete en inputs | ✓ |
| Cuisine active tab contraste | ✓ 21:1 (negro sobre blanco) |
| BottomNav con iconos + label | ✓ |
| Editorial band con 4 guías | ✓ |
| Filter chips con count | ✓ |

### ⚠️ Observaciones

**O-1. First fold denso.** Lo primero que se ve:
1. "ReservaYa" + tagline
2. Badge `LAB` + bell
3. SearchPill (cuándo/personas)
4. Search bar ("Buscar por nombre…")
5. Cuisine tabs
6. Filtros / toggle lista-mapa
7. **Recién ahí aparece el hero venue**

El usuario tiene que pasar 5 bloques de controles antes de ver contenido. Propuesta: collapse del search bar secundario dentro del SearchPill o moverlo abajo del hero.

**O-2. Tabbable count = 44** en una pantalla. Demasiado para navegación por teclado. El usuario con teclado tiene que pasar 44 tabs para llegar al último elemento. Sugiero skip links ("Saltar al contenido").

### 🔴 Bugs pendientes

**B-1. `:focus-visible` no definido globalmente.** Hice probe — ninguna regla CSS define estilo de focus en el design system. Significa que cuando un usuario con teclado navega (Tab), el outline del navegador por default queda o se pierde. Impacto: **WCAG 2.1 AA fail (2.4.7 Focus Visible)**.
- **Fix sugerido**: agregar al `globals.css`:
  ```css
  @layer base {
    :focus-visible {
      outline: 2px solid var(--c4);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }
  ```

---

## 2. Venue Detail — `/[venueId]`

**Venue testado:** Trattoria Sentori

### ✅ Funcional

- Galería con 4 fotos + 4 thumbnails ✓
- Rating visible "4.2 · 116 reseñas" ✓
- Cancellation policy card pre-checkout ✓
- Sectores con emoji (Salón/Terraza/Barra/Privado) ✓
- Feature grid (Wi-Fi, accesible, vegetariano, tarjetas) ✓
- Reviews verificadas × 3 ✓
- Sticky CTA "Reservar mesa" ✓
- Back/share/save flotantes con aria-label ✓

### ✅ FIXED durante QA

**B-2. 4 thumbnails de galería sin aria-label.** → Agregado `aria-label="Ver foto N"` + `aria-pressed` en `VenueDetailClient.tsx`.

### ⚠️ Pendientes

**O-3. Datos sintéticos obvios.** Las 3 reviews son hardcoded ("Agustina R. hace 3 días…"). Para un piloto real hay que:
- Conectar con `venue_reputation_view` (memoria lo menciona)
- O esconder sección si no hay reviews reales
- Placeholder copy que diga "Sé el primero en reseñar" en empty state

**O-4. "Lo bueno de acá" hardcoded.** Wi-Fi/Accesible/Vegetariano/Tarjetas son 4 ítems fijos sin relación con el venue. Propuesta: sacar la sección o hacer que venga de `venue.config_json.features`.

**O-5. Horario hardcoded.** Muestra "12:00–15:30 · 20:00–00:00" para todos los venues. Tenemos `service_hours` en `config_json` — hay que computarlo real.

---

## 3. Login — `/login`

### ✅ Funcional

- H1 "Bienvenido" ✓
- Google OAuth button con logo oficial ✓
- Email + password inputs ✓
- Autocomplete correcto (`email`, `current-password`, `new-password`) ✓
- Tabs Login/Registro ✓
- Ingresar con test@reservaya.test / Test1234! exitoso ✓
- Redirect post-login a `/` ✓
- Cookie Supabase seteada (length=2752) ✓

### ⚠️ Observaciones

**O-6. El flujo Register no pide verificación de email antes de usar.** Como Supabase tiene email_confirm OFF (o el seed skipped), cualquiera se puede registrar con cualquier email falso. Para producción: habilitar email_confirm + integrar Resend para el link.

**O-7. No hay "Olvidé contraseña".** Mínimo esperable en login tradicional.

---

## 4. Mis Reservas — `/mis-reservas` (autenticado)

### ✅ Funcional

- H1 "Mis reservas" ✓
- Tabs "Próximas" (badge count) / "Historial" ✓
- Hero "Tu próxima salida" + Countdown prominente ✓
- 2 reservas pending_payment listadas ✓
- Ordenamiento cronológico ✓

### ✅ FIXED durante QA

**B-3. Time_slot mostraba "12:00:00 hs"** (con segundos). Postgres devuelve `TIME` como `HH:MM:SS`. Normalicé a `HH:MM` con helper `formatTime()`.

### ⚠️ Pendientes

**O-8. Status "pending_payment" visible como badge amber "Pendiente".** Claro, pero no hay CTA clara para completar el pago si quedó a medias. Propuesta: en la card de una reserva pending, agregar botón "Completar pago" o "Cancelar" visible.

**O-9. Empty state "Sin reservas próximas" con CTA "Explorar restaurantes"**. Excelente ✓ pero sólo en la tab `proximas`. En `pasadas` vacía sólo dice "Tus reservas pasadas aparecerán acá" — falta CTA de retroalimentación.

---

## 5. Perfil — `/perfil` (autenticado)

### ✅ Funcional (post-fix)

- Avatar con inicial + color por hash ✓
- Edit inline del nombre ✓
- Member since formateado ✓
- Hero "Tu próxima salida" con Countdown ✓
- Stats grid (total / asistidas / %) ✓
- Email + phone ✓
- Cerrar sesión ✓

### ✅ FIXED durante QA

**B-4. Hero countdown no renderizaba.** Filter construía ISO inválido `${date}T${time_slot}:00` con time_slot que traía segundos. Normalizado.

### ⚠️ Pendientes

**O-10. Stats muestran 0/0/—** cuando hay 2 reservas pending. Es comportamiento intencional del API `/api/perfil` (sólo cuenta `['confirmed', 'checked_in', 'no_show']`). **Impacto UX**: nuevo usuario con todas sus reservas en pending_payment ve "0 reservas" en su perfil y puede pensar que el sistema está roto. Sugerencia: incluir `pending_payment` en el conteo pero distinguir con label "1 en proceso".

**O-11. No hay ReputationBadge visible.** Memoria del proyecto dice que F5-1 ya lo tiene en shared/src/ui. En el lab no se está usando. Tu diferencial vs Woki está invisible.

**O-12. "ReservaYA · v1.0" en footer.** Está OK pero podría sumarse link a política de privacidad y términos — obligatorio para App Store si/cuando publiquen.

---

## 6. Grupo — `/grupo/[token]` (no testeado con data real)

**Código revisado**: tiene dark theme, realtime via supabase channel, form de join anónimo, estado `joined` con check verde, counter de spots. Ya está muy bien visualmente.

### ⚠️ Observación

**O-13. Es la única pantalla con dark theme.** Hermoso, se siente especial. Pero rompe consistencia con el resto del sistema. Dos opciones: (a) dejarla así como "momento especial" — funciona como diferenciador; (b) ofrecer dark mode completo en toda la app (roadmap).

---

## 7. Accesibilidad global

| Check | Resultado |
|---|---|
| Lang attr `lang="es"` | ✓ |
| Viewport meta | ✓ |
| Theme-color `#FF4757` | ✓ |
| Touch targets ≥44px | ✓ mayoritariamente |
| Contraste texto principal | ✓ `--tx #0D0D0D` sobre blanco = 21:1 |
| Contraste `--tx2 #5A5A6E` | ✓ 7.3:1 |
| Contraste `--tx3 #ABABBA` | ⚠️ **2.3:1** — falla AA (4.5:1). Se usa para placeholders, fine print. Según memoria ya había sido identificado. |
| `:focus-visible` custom | 🔴 **No definido** |
| `prefers-reduced-motion` | ⚠️ Hay animaciones con pulse + animate-spin — no verifiqué si las envuelve `@media (prefers-reduced-motion: reduce)` |
| Skip to main content | 🔴 **No existe** |
| `aria-live` para toasts | ⚠️ No verificado |

---

## 8. Performance / Red

- Imágenes cargan de `picsum.photos` → external, no cacheadas por Next.js. Con 24 imágenes en home, ~1.5MB de banda.
- No se usa `next/image` → sin optimización automática.
- Múltiples `_rsc=` abortados son normales (pre-fetches de Next.js que cancela al navegar).
- Warning de webpack "Serializing big strings 215KB" → no bloqueante.

**Recomendación**: migrar a `next/image` en `VenueCardLab` y `VenueDetailClient`. Ganancia estimada: 60% menos de bytes + LCP mejor.

---

## 9. Qué poner primero — Jerarquía sugerida

Basado en el comportamiento real de usuarios en apps de reservas (Woki/TheFork/Resy):

### Home — orden óptimo propuesto

1. **Greeting + ubicación** ("Buenos Aires · ¿A dónde salís hoy?") — hook emocional
2. **Hero venue del día** (destacado grande con rating + foto) — "ver resultados" visual
3. **Search pill** compacto debajo — controles
4. **Cuisine tabs** horizontales — filtrado rápido
5. **Live reviews strip** (prueba social en movimiento)
6. **Grid de venues** — navegación
7. **Editorial band** — descubrimiento
8. **Lista compacta** — long tail

**Diferencia con el lab actual**: hoy el orden es 1→search→cuisine→filtros→hero. Mover el hero arriba del search genera **gancho visual inmediato**. El usuario ve una foto atractiva en el first fold, no 5 bloques de controles.

### Venue detail — orden óptimo

1. **Galería** (visual primero)
2. **Nombre + cuisine + barrio + rating + price tier** (identidad)
3. **CTA sticky "Reservar mesa"** (conversión primaria)
4. **Político de cancelación** (removedor de fricción)
5. **Sectores + features** (micro-detalles)
6. **Descripción editorial** (storytelling)
7. **Reviews verificadas** (prueba social)
8. **Wizard expandible** (pensado en el que ya decidió)

---

## 10. Cómo llamar mejor la atención — propuestas

### Propuestas priorizadas

#### 💡 P1 (implementables en 1-2 días, alto impacto)

1. **Pulse animado en el CTA primario** del hero venue ("Reservar esta noche · quedan 3 mesas"). Bubble de urgencia + escasez.
2. **Hero del home con Hora y Actualidad**: "Esta noche a las 21 hs — 12 restaurantes abiertos cerca tuyo" con countdown al happy hour.
3. **Badge "Disponible ahora"** verde pulsante en las cards de venues con slots abiertos.
4. **Reviews timestamp que rotan** (ya existe en LiveReviewsStrip) — mover arriba del hero para efecto "app viva".
5. **Mesa ocupándose en vivo** (fake o real): "Alguien reservó en Trattoria hace 2 min" — FOMO real.
6. **Countdown hero en mis-reservas** — ✅ ya implementado.

#### 💡 P2 (1 semana, diferenciadores)

7. **Hero card con gradient sutil coral→peach** alrededor del hero venue para guiar la mirada.
8. **Sticky header que se compacta al scroll** (se vuelve barra fina con logo + shortcut de búsqueda).
9. **Easter eggs animados**: confetti al cerrar una reserva ✓ existe. Sumar animación coral→mint en el flip del countdown a las 00:00:00.

#### 💡 P3 (2-4 semanas)

10. **Hero card con Live Activity**: foto + "Hoy, 22:00 hs en Niko Sushi Bar · confirmada tu reserva". Muestra tu próxima reserva grande como sección fija arriba de todo si está a menos de 24h.
11. **"Lo que estás a punto de perderte"**: sección con venues que se están por quedar sin slots.

---

## 11. Datos sobre restaurante — qué falta/sobra

### Dónde encontrar data faltante hoy

| Dato | Lugar | Estado |
|---|---|---|
| Nombre | `venues.name` | ✓ |
| Dirección | `venues.address` | ✓ |
| Teléfono | `venues.phone` | ✓ pero no mostrado en detail lab |
| Descripción | `venues.description` | ✓ |
| Foto principal | `venues.image_url` (picsum) | ⚠️ demo |
| Horario | `venues.config_json.service_hours` | ✓ pero **no se muestra real** (hardcoded) |
| Seña | `venues.config_json.deposit_amount` | ✓ |
| Cancelación | `venues.config_json.cancellation_grace_hours` | ✓ |
| Cocina | `venues.config_json.cuisine` | ✓ |
| **Fotos adicionales** | — | 🔴 **NO existen en schema** |
| **Menú categorías + precios** | `menu_categories` + `menu_items` | ✓ sembrado, pero no mostrado en detail lab |
| **Reviews reales** | `venue_reputation_view` (per memoria) | ⚠️ no conectado al lab |
| **Barrio estructurado** | — | 🔴 no hay campo, se infiere del texto |
| **Price tier $/$$$/$$$$** | — | 🔴 mockeado desde deposit_amount |
| **Ambience tags** | — | 🔴 no existe |
| **Dietary tags** (celíaco, vegano) | — | 🔴 no existe |
| **Feature tags** (terraza, accesible, pet-friendly) | `zones.name` parcial | ⚠️ no estructurado |

### Recomendaciones schema

Campos a agregar en `venues.config_json` para subir calidad de la data:

```json
{
  "price_tier": 2,              // 1-4
  "ambience": ["romantic", "outdoor", "trendy"],
  "features": ["wifi", "accessible", "parking", "pet_friendly"],
  "dietary": ["vegetarian", "vegan", "celiaco", "kosher"],
  "neighborhood": "Palermo Soho",
  "gallery_urls": ["...", "...", "...", "..."],
  "hours_display_override": null  // si querés custom text
}
```

Migración sugerida: hacer `script/upgrade-venue-metadata.mjs` que pasa por los 20 demo venues y les llena estos campos coherentes con la cocina declarada.

---

## 12. Próximas acciones priorizadas

### Sprint A (esta semana — 2-3 días)

- [ ] Agregar `:focus-visible` global en `globals.css` (5 min, alto impacto WCAG)
- [ ] Pasar `VenueCardLab` y `VenueDetailClient` a `next/image` (3-4h, performance)
- [ ] Computar horario real desde `service_hours` en Detail (30 min)
- [ ] Ocultar reviews hardcoded o reemplazar por `venue_reputation_view` (1-2h)
- [ ] Hacer que perfil stats incluyan `pending_payment` con label "en proceso" (30 min)
- [ ] Agregar "Olvidé contraseña" al login (1-2h)

### Sprint B (1 semana — datos)

- [ ] Script para enriquecer venues con ambience/features/dietary/gallery
- [ ] Mostrar features reales en Detail (desde `config_json.features`)
- [ ] Conectar Ratings reales desde reputation view
- [ ] Agregar campo `menu` visible en Detail antes de abrir wizard

### Sprint C (2 semanas — visual premium)

- [ ] Hero del home reordenado (venue del día arriba del search)
- [ ] Sticky header compacto
- [ ] Pulse CTA + badges "ahora"
- [ ] Featured editorial con voz real
- [ ] Live Activities de reservas próximas

---

## Apéndice: commits del QA

- `6a98038` fix(lab): bugs encontrados en QA — thumbnails aria, time_slot formateado, perfil countdown

**Rama:** `claude/app-lab-redesign`
**PR:** [#2](https://github.com/ezecabrera/reservaya/pull/2)
