# Testing Checklist — Post-auditoría

**URL de prueba:** https://app-lab-khaki.vercel.app
**Credenciales demo:** `test@reservaya.test` / `Test1234!`

Marcá cada ítem cuando lo verifiques manualmente en iPhone/Android/Desktop.

---

## 1. Auto-scroll wizard (CRÍTICO)

Entrá a un venue → "Reservar mesa":

- [ ] **Paso 1 (Cuándo)**: aparece barra de progreso arriba "Paso 1 de 4 · Cuándo"
- [ ] Tocar un día → scroll suave hacia **Horario** (no hace falta hacerlo manual)
- [ ] Tocar un horario → scroll suave hacia **Personas**
- [ ] Tocar un número de personas → scroll suave hacia el CTA **"Ver mesas disponibles"**
- [ ] Tocar "Ver mesas" → **scroll al top** + barra pasa a "Paso 2 de 4 · Mesa"
- [ ] Al elegir una mesa → scroll al top + "Paso 3 de 4 · Menú"
- [ ] En cada paso la barra de progreso se actualiza

**Acceptance:** en ningún momento el usuario debería tener que hacer scroll manual para encontrar el siguiente campo.

---

## 2. Modal omitir pre-pedido (CRÍTICO)

Seguí del paso anterior hasta llegar al paso 3 (Menú):

- [ ] Al entrar al paso Menú aparece **modal automáticamente** con título "¿Pre-pedir tu menú?"
- [ ] Hay 2 botones grandes:
  - [ ] **"Ver menú"** (coral) — cierra el modal y muestra el menú
  - [ ] **"Continuar sin pre-pedido"** (gris) — cierra el modal y salta al resumen directamente
- [ ] El modal cubre todo — incluida la nav inferior (z-index correcto)
- [ ] Si tocás afuera (backdrop), el modal se cierra
- [ ] Si elegís "Ver menú" podés seleccionar platos, sumar cantidad +/- y después tocar "Continuar con pre-pedido"

**Acceptance:** el usuario **no tiene que scrollear todas las categorías** para saltar.

---

## 3. QR code en Mis Reservas (CRÍTICO)

Logueate con `test@reservaya.test` / `Test1234!`:

- [ ] En la pestaña "Próximas" aparece card "Tu próxima salida" con venue + fecha
- [ ] Debajo del card y del Countdown aparece un **card blanco con QR real** (no placeholder)
- [ ] Label "Tu QR de check-in" + badge verde "Listo"
- [ ] El QR es escaneable (probar con otra cámara)
- [ ] Al escanear abre la URL del panel con el token

**Acceptance:** el QR está **siempre a la vista en Mis Reservas** sin hacer taps extra.

---

## 4. Form de tarjeta con validación Luhn (ALTO)

Completá una reserva hasta `/pagar`:

- [ ] Aparece pantalla "Cómo querés pagar" con card resumen + 2 opciones
- [ ] Tap en **"Tarjeta de crédito o débito"** → aparece form inline (no redirige todavía)
- [ ] **Preview de tarjeta** en la parte superior se actualiza mientras tipeás
- [ ] **Número** formatea automáticamente en grupos de 4: `4111 1111 1111 1111`
- [ ] Si el número falla Luhn, sale error "Número de tarjeta inválido" en rojo
- [ ] Prueba con **4111 1111 1111 1111** (Visa test) — no debe salir error
- [ ] **Vencimiento** formatea MM/AA automáticamente (01/26 al tipear 0126)
- [ ] Si el MM es inválido (15/26) sale error "Fecha inválida o vencida"
- [ ] Si el año está vencido (01/24) sale error
- [ ] **CVV** acepta sólo 3 dígitos (4 si la tarjeta es Amex — se detecta por prefijo 34/37)
- [ ] **Nombre** requiere al menos 3 caracteres
- [ ] **Botón "Pagar $X"** está disabled hasta que todos los campos validen
- [ ] Click en "Pagar" redirige a MP Checkout con form de tarjeta pre-configurado
- [ ] Link "Cambiar método" vuelve al selector
- [ ] Autocomplete iOS/Android: al tocar el input de número, iOS ofrece autofill de tarjetas guardadas

**Acceptance:** el form valida en tiempo real, muestra errores específicos por campo, y el submit sólo procede con datos válidos.

---

## 5. Google Maps en venue detail (MEDIO)

Entrá a un venue (ej. Trattoria Sentori):

- [ ] Al scrollear aparece sección **"Dónde estamos"** con mini mapa
- [ ] El mapa muestra un pin en la ubicación del venue (OpenStreetMap)
- [ ] Overlay flotante muestra nombre + dirección encima del mapa
- [ ] Botón **"Cómo llegar →"** arriba a la derecha del título
- [ ] Botón **"Abrir en Maps"** grande debajo del mapa (azul)
- [ ] Tap abre Google Maps (Android/Desktop) o Apple Maps (iOS) con directions al destino
- [ ] En el browser móvil real, la app de mapas nativa se lanza

**Acceptance:** usuario ve dónde queda el restaurante sin salir de la app, con 1 tap puede abrir directions.

---

## 6. Tipo de cocina multi-tag (MEDIO)

En el home:

- [ ] Tocar "Filtros" abre el sheet
- [ ] Nueva sección **"Dieta / restricciones"** con 5 chips: Vegetariano, Vegano, Celíacos, Kosher, Halal
- [ ] Seleccionar **"Vegano"** + **"Celíacos"** → aplicar
- [ ] Vuelve al home con 2 chips activos arriba y filtrado aplicado
- [ ] Sólo aparecen los 4 venues "Vegano" (Verde de Mercado, Bowl Verde, Raíz Vegana, Crudo y Wok) que tienen ambos tags

En la ficha de un venue vegano:

- [ ] Junto al badge "Nuevo en ReservaYa" y "Seña $X" aparecen badges mauve: **Vegetariano · Vegano · Celíacos**

**Acceptance:** los tags se muestran visualmente en la card + filtran correctamente en la búsqueda.

---

## 7. Share funcional (BAJO)

En un venue detail:

- [ ] Botón **⋮ Compartir** en el header (arriba derecha)
- [ ] En **iOS Safari**: abre el share sheet nativo (AirDrop, WhatsApp, SMS, Mail, Copy…)
- [ ] En **Android Chrome**: abre share sheet con WhatsApp, Telegram, etc.
- [ ] En **desktop**: copia el link al clipboard y muestra toast "Link copiado al portapapeles ✓"
- [ ] Si cancelás el share sheet, no se muestra error
- [ ] El link compartido (`/{venueId}`) abre el detail correcto en cualquier dispositivo

**Acceptance:** el share funciona nativo en móviles y con fallback en desktop.

---

## 8. Notificaciones (BAJO)

En el home:

- [ ] El icono de **campana** arriba derecha muestra badge rojo con número si hay pendientes
- [ ] Tap en la campana abre un **bottom sheet**
- [ ] Lista de notificaciones con:
  - [ ] Icono a color según tipo (💳 pending_payment · ⏰ upcoming · ✓ confirmed)
  - [ ] Título en **negrita** si no leída, semi-bold si leída
  - [ ] Punto coral al lado del título si no leída
  - [ ] Timestamp relativo ("Hace 5 min", "Hace 1 h")
- [ ] Tocar una notificación → navega al link correspondiente
- [ ] Si no hay notificaciones, empty state "Sin notificaciones" con ícono campana
- [ ] Al cerrar y reabrir el sheet después de 2s, el badge del contador baja a 0

**Acceptance:** la campana muestra info útil y el usuario puede accionar desde ahí.

---

## 9. Dejar reseña (BAJO)

Pre-requisito: tener una reserva con status `checked_in`. Para testear manualmente: desde el panel del restaurante escanear el QR (o crear data directa en Supabase).

En `/mis-reservas` → tab "Historial":

- [ ] Reservas con status `checked_in` muestran 2 botones: **"★ Dejar reseña"** (amber) + **"Volver a reservar →"**
- [ ] Tap en "Dejar reseña" abre modal con nombre del venue + fecha
- [ ] 5 estrellas interactivas: hover cambia color amber
- [ ] Label dinámica: "Tocá las estrellas" → "No me gustó" → "Regular" → "Bueno" → "Muy bueno" → "¡Excelente!"
- [ ] Textarea con max 500 chars + contador
- [ ] Si no seleccionaste estrella, el botón "Publicar" está disabled
- [ ] Al publicar aparece pantalla de gracias con ✓ verde
- [ ] Al cerrar el modal, el botón "Dejar reseña" se reemplaza por **"✓ Ya dejaste reseña"** (verde)
- [ ] Al refrescar la página, el estado "ya dejé reseña" persiste (localStorage)

**Acceptance:** usuario puede reseñar fácil desde mis-reservas, el flujo es de 3 taps (tab Historial → Dejar reseña → elegir estrella + publicar).

---

## ✅ Criterios de éxito globales

- [ ] Flujo de reserva completo sin scroll manual (fecha → hora → personas → mesa → menú → resumen → pagar)
- [ ] Modal de menú aparece al entrar al paso Menú
- [ ] QR visible en confirmación + mis-reservas
- [ ] Form de tarjeta valida Luhn en tiempo real
- [ ] Google Maps/OSM visible en todos los venue details
- [ ] Share funciona en iOS, Android y desktop
- [ ] Notificaciones con datos reales derivados de /api/mis-reservas
- [ ] Usuarios pueden dejar reseña post checked-in

## 🧪 Casos edge a testear

- [ ] Wizard: cambiar fecha a mitad del flujo — el horario se resetea
- [ ] Wizard: timeout del lock de mesa (3 min) — volver a paso mesa
- [ ] Pago: cancelar desde MP — volver a la app con `?status=rejected`
- [ ] Pago: aprobar — redirect a confirmación con QR generado
- [ ] Offline: home carga desde cache, detail se queda con skeleton
- [ ] Sin ubicación: "Cerca mío" muestra "Permiso denegado"
- [ ] Navegación con teclado: todos los botones tienen `:focus-visible` ring azul
- [ ] Screen reader: aria-labels en icon-only buttons (compartir, guardar, notificaciones)

---

## 🚀 Pendientes (siguientes sprints)

- Reviews: persistir en Supabase (`reviews` table + RLS) en vez de localStorage
- Notifications: migrar a tabla `notifications` con push real (Web Push API + triggers DB)
- Tarjeta: integración MP Cards SDK.js para tokenización client-side (cobro sin redirect)
- Google Maps: reemplazar OSM por `@react-google-maps/api` cuando tengan API key
- Schema.org LocalBusiness JSON-LD en venue detail para SEO
- `next/image` en VenueCardLab y galería de venue detail
- Fotos reales de los partners piloto (swap picsum)
