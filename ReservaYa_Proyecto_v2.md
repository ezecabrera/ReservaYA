# ReservaYa — Documento de Proyecto

> Plataforma web/PWA de reservas, menú anticipado y gestión operativa para restaurantes, cafés y bares.
> Versión del documento: 2.0 · Abril 2026

---

## Índice

1. [Visión general](#1-visión-general)
2. [Problema que resuelve](#2-problema-que-resuelve)
3. [Usuarios objetivo](#3-usuarios-objetivo)
4. [Modelo de acceso — PWA primero, app como upgrade](#4-modelo-de-acceso--pwa-primero-app-como-upgrade)
5. [Modelo de negocio](#5-modelo-de-negocio)
6. [Modos operativos del sistema](#6-modos-operativos-del-sistema)
7. [Configuración base del negocio](#7-configuración-base-del-negocio)
8. [App del cliente — flujos](#8-app-del-cliente--flujos)
9. [Panel del negocio](#9-panel-del-negocio)
10. [Sistema de códigos de mesa](#10-sistema-de-códigos-de-mesa)
11. [Confirmación de reserva](#11-confirmación-de-reserva)
12. [Menú anticipado — opcional](#12-menú-anticipado--opcional)
13. [Modo grupo](#13-modo-grupo)
14. [Sistema de notificaciones](#14-sistema-de-notificaciones)
15. [Seña y política de cancelación](#15-seña-y-política-de-cancelación)
16. [Stack tecnológico](#16-stack-tecnológico)
17. [Fases de desarrollo](#17-fases-de-desarrollo)
18. [KPIs de éxito](#18-kpis-de-éxito)
19. [Lo que NO hacer en v1](#19-lo-que-no-hacer-en-v1)

---

## 1. Visión general

**ReservaYa** es una plataforma B2B/B2C accesible desde cualquier navegador (PWA) que permite a los clientes de restaurantes, cafés y bares:

- Reservar una mesa con anticipación sin descargar ninguna app
- Recibir una confirmación con código de mesa y QR via email
- Guardar su reserva directamente en WhatsApp o calendario
- Hacer pedido anticipado de forma opcional antes de llegar
- Coordinar reservas grupales compartiendo un link por WhatsApp

Y permite al negocio:

- Ver en tiempo real el estado de todas sus mesas durante el servicio
- Recibir pedidos anticipados antes de que el cliente llegue
- Reducir no-shows con seña automática
- Gestionar disponibilidad, promos y plato del día desde el panel
- Operar sin conflictos digitales/presenciales mediante modo de servicio activo

---

## 2. Problema que resuelve

### Del lado del cliente
- Incertidumbre de si hay mesa disponible al llegar
- Espera para ser atendido y para decidir qué comer
- Fricción en reservas grupales — cada uno pide desde su teléfono
- Perder la confirmación porque quedó en una pestaña del navegador

### Del lado del negocio
- No-shows que generan pérdida de ingreso
- Conflicto entre clientes digitales y presenciales en hora pico
- Sin visibilidad anticipada de cuántas personas llegan ni qué van a pedir
- Dificultad para comunicar disponibilidad y promos en tiempo real

---

## 3. Usuarios objetivo

### Cliente final (B2C)
- Personas de 22–45 años con smartphone
- Frecuencia media-alta de salidas (1–3 veces por semana)
- Prefieren no descargar apps de marcas que no conocen
- Valoran eficiencia y no perder tiempo en el local

### Negocio (B2B — cliente pagador)
- Restaurantes, cafeterías, bares y espacios gastronómicos
- Establecimientos con reserva como parte de su operación habitual
- Tamaño: desde 4 mesas hasta establecimientos medianos (50+ cubiertos)
- Perfil del tomador de decisión: dueño o encargado de operaciones
- Dispositivo de operación: tablet en el puesto de recepción

---

## 4. Modelo de acceso — PWA primero, app como upgrade

### Estrategia: Progressive Web App como entrada, app nativa como beneficio

**La app NO es obligatoria.** El flujo completo de reserva funciona desde cualquier navegador móvil o desktop, sin instalación, desde el link que el restaurante comparte en Instagram, WhatsApp o Google Maps.

### Capa 1 — PWA (el núcleo, acceso universal)

- Funciona en cualquier navegador sin instalación
- Cubre el flujo completo: explorar → elegir mesa → pre-pedir → pagar seña → recibir confirmación
- El usuario no necesita cuenta para explorar
- Registro solo al momento de confirmar la reserva: número de teléfono + código OTP (sin contraseña)
- Hosteado en Vercel

### Capa 2 — App nativa (upgrade opcional con beneficios reales)

La app existe pero no es obligatoria. Sus ventajas reales sobre la web:

| Beneficio | Web | App |
|-----------|-----|-----|
| Notificaciones push | ❌ No confiable en iOS | ✅ Sí |
| Recordatorio 1h antes con código | Solo por email | Push nativo |
| Sesión persistente sin relogin | Depende de cookies | ✅ Siempre |
| Wallet de reservas próximas | Requiere guardar link | ✅ Acceso directo |
| "Lo de siempre" (sugerencias) | Limitado | ✅ Completo |
| Ofertas exclusivas del restaurante | ❌ | ✅ |

### Incentivos para descargar la app

- Descuento en primera reserva vía app (configurado por cada restaurante desde su panel)
- Acceso a platos de disponibilidad limitada solo para usuarios con app
- El restaurante puede configurar promos exclusivas para usuarios de la app
- El momento correcto para proponer la descarga es justo después de la primera reserva exitosa desde la web, con contexto claro: _"Descargá la app para recibir el recordatorio con tu código directamente en el teléfono"_

---

## 5. Modelo de negocio

**Modelo principal: suscripción mensual al negocio.**

Los clientes finales usan la plataforma de forma gratuita. El negocio paga una tarifa mensual por acceso al panel, funcionalidades y procesamiento de reservas.

| Plan | Precio estimado | Incluye |
|------|----------------|---------|
| Starter | $15.000 ARS / mes | Hasta 20 mesas, sin zonas, notificaciones por email |
| Pro | $35.000 ARS / mes | Mesas ilimitadas, zonas opcionales, analytics, promos, modo grupo |
| Enterprise | A convenir | Multi-sucursal, API, integración POS |

**Revenue adicional opcional:**
- Comisión del 3–5% sobre el monto de señas procesadas vía Mercado Pago
- Módulo de publicidad destacada dentro de la app de búsqueda (post-MVP)

---

## 6. Modos operativos del sistema

Este es el núcleo de la arquitectura anti-conflictos. El sistema tiene dos modos distintos que cambian automáticamente según el horario del negocio.

### Modo pre-servicio

**Cuándo:** antes de que el negocio abra (o antes del corte configurable)

- Las reservas digitales están abiertas al 100%
- Los clientes pueden reservar mesa, elegir fecha y horario, hacer pre-pedido y pagar seña
- No hay conflictos posibles porque el local está vacío
- El negocio puede revisar las reservas confirmadas para el turno

### Modo servicio activo

**Cuándo:** desde la hora de apertura del negocio (configurable)

- **No entran reservas digitales nuevas para el turno en curso**
- Las reservas ya confirmadas permanecen activas — el sistema las respeta
- La plataforma muestra al usuario que el turno ya comenzó: _"Las reservas para este turno están cerradas. Podés reservar para otro horario o fecha."_
- El panel se convierte en herramienta operativa pura para el staff
- La recepcionista gestiona el estado de mesas manualmente desde la tablet
- El mozo no necesita interactuar con el sistema durante el servicio

### Configuración del corte

El negocio define en su panel:

- **Horario de corte de reservas:** cuánto tiempo antes de abrir deja de aceptar reservas para ese turno. Ejemplo: 30 minutos antes, o exactamente a la hora de apertura.
- **Turnos de servicio:** horarios de apertura y cierre por día. El sistema cambia de modo automáticamente, sin intervención del staff.
- El encargado puede activar/desactivar manualmente el modo servicio si necesita flexibilidad.

### ¿Por qué este enfoque y no un sistema de locks en tiempo real?

Un sistema de locks en tiempo real durante el servicio requiere que el mozo esté constantemente actualizando el estado en el teléfono. En la práctica, durante el servicio el mozo atiende mesas, no puede detenerse a tocar pantallas. El corte por horario elimina el problema de raíz: durante el servicio no hay reservas digitales nuevas que puedan chocar con la realidad del local. El staff opera con información confiable.

---

## 7. Configuración base del negocio

### Principio: simple por defecto, extensible por necesidad

El onboarding base de un negocio nuevo toma menos de 10 minutos. Las funcionalidades adicionales se activan solo si el negocio las necesita.

### Configuración base (todos los planes)

Solo requiere definir:

1. Nombre del negocio y dirección
2. Horarios de atención por día
3. Cantidad de mesas y capacidad de cada una
4. Horario de corte de reservas
5. Email de contacto para notificaciones

El sistema genera automáticamente los códigos de mesa:

```
Mesa 1 · capacidad 2
Mesa 2 · capacidad 2
Mesa 3 · capacidad 4
Mesa 4 · capacidad 6
```

El panel muestra una grilla de tarjetas, una por mesa, con estado en color. Sin plano visual, sin configuración espacial.

### Módulos opcionales (se activan por plan o solicitud)

**Zonas** — el negocio agrupa sus mesas con nombre propio (Salón, Terraza, VIP, Barra, Jardín, etc.). Al activar zonas, los códigos de mesa incluyen el prefijo de zona. Una sola zona no cuenta como módulo — es simplemente el nombre que el negocio quiera darle a su espacio.

**Plano visual** — posicionamiento visual aproximado de las mesas en un espacio. No es un plano arquitectónico exacto, es una referencia espacial para la recepcionista. Módulo más complejo, no crítico para el MVP.

**Ambientes especiales** — zonas con configuraciones adicionales: precio diferencial, mínimo de personas, reserva solo bajo petición.

**Múltiples turnos** — negocios que tienen servicio de almuerzo y cena como turnos separados con disponibilidad independiente.

---

## 8. App del cliente — flujos

### 8.1 Exploración

- Lista de restaurantes disponibles con estado en tiempo real
- Filtros por tipo de cocina, precio, distancia, disponibilidad
- Cards con: nombre, descripción, próxima disponibilidad, promos activas
- El usuario no necesita cuenta para explorar

### 8.2 Selección de mesa

- Vista del estado de mesas (según configuración del negocio: lista o grilla)
- Selector de fecha y horario disponible
- Selector de cantidad de personas
- Cada mesa muestra su código, capacidad y estado

**Estados de mesa visibles al cliente:**
- Verde: disponible para reservar
- Gris: ocupada o no disponible para este horario

### 8.3 Flujo de reserva (individual)

```
Elegir restaurante
    ↓
Seleccionar fecha + horario + personas
    ↓
Elegir mesa disponible
    ↓
[OPCIONAL] ¿Querés elegir tu plato ahora?
    → Sí: ir al menú anticipado
    → No: continuar directamente
    ↓
Registrarse o ingresar (teléfono + OTP)
    ↓
Revisar resumen + pagar seña
    ↓
Pantalla de confirmación con código y QR
```

**El pre-pedido nunca es obligatorio.** Es una opción que se presenta como ventaja: _"Elegí tu plato ahora y tu comida va a estar lista cuando llegués."_ El usuario que elige no pedir ve igualmente confirmada su reserva.

### 8.4 Reserva grupal

Ver sección [Modo grupo](#13-modo-grupo).

### 8.5 Post-reserva

- Email de confirmación inmediato con código de mesa, QR, datos del restaurante
- Botón "Guardar en WhatsApp" en la pantalla de confirmación
- Botón "Agregar al calendario" (.ics)
- Email de recordatorio automático antes del turno
- Opción de cancelar (dentro del período de gracia configurado por el negocio)

### 8.6 Check-in en el local

El cliente se presenta en la entrada con:
- El QR (desde el email o la app)
- O el código legible: _"Germán, Mesa 3"_

La recepcionista escanea el QR o busca el código en el panel. La mesa cambia a estado "ocupada" automáticamente.

---

## 9. Panel del negocio

### 9.1 Vista de mesas (pantalla principal)

Grilla de tarjetas de mesas en tiempo real. Cada tarjeta muestra:

- Código de mesa (Mesa 3 o T2 según configuración)
- Capacidad
- Estado en color con label de texto
- Si hay reserva activa: nombre del titular y hora

**Estados visibles en el panel:**

| Estado | Color | Label | Descripción |
|--------|-------|-------|-------------|
| Libre | Verde | Libre | Disponible |
| Reservada | Azul | Nombre + hora | Reserva digital confirmada |
| Ocupada | Rojo | Ocupada | Presencial o check-in realizado |

### 9.2 Gestión durante el servicio (modo servicio activo)

La recepcionista opera el panel con dos acciones principales:

- **Marcar ocupada:** cuando llega un cliente presencial sin reserva. Un toque en la mesa, sin confirmaciones intermedias.
- **Hacer check-in:** cuando llega el cliente con reserva. Escanea el QR o busca por nombre + código. La mesa cambia automáticamente a "ocupada".

El mozo no necesita usar el panel durante el servicio. La responsabilidad operativa es de quien está en la entrada.

### 9.3 Vista de reservas del turno

Lista de reservas confirmadas para el turno actual ordenadas por hora:
- Nombre del titular
- Código de mesa asignada
- Cantidad de personas
- Estado del pedido anticipado (si eligió pre-pedir)
- Estado de check-in

El panel filtra automáticamente por turno activo — la recepcionista solo ve las reservas vigentes, no todas las del día.

### 9.4 Acciones rápidas

- Marcar mesa como ocupada (presencial)
- Liberar mesa
- Marcar plato como agotado (actualiza disponibilidad en tiempo real para nuevas reservas)

### 9.5 Gestión de pedidos anticipados

- Lista de pedidos confirmados por orden de llegada esperada
- Estado: pendiente / en cocina / listo
- Alertas de modificaciones especiales (alergias, sin ingrediente)

### 9.6 Plato del día

- Selección desde la carta existente
- Copy de notificación autogenerado y editable
- Se resetea automáticamente al día siguiente

### 9.7 Gestión de promos

3 tipos:
1. Descuento % sobre total o ítem específico
2. Ítem gratis con condición (postre gratis con menú completo)
3. Promo horaria (válida en franja del día)

Configuración: condiciones, stock limitado con contador, vigencia.

### 9.8 Analytics (Plan Pro)

- Ocupación por día y franja horaria
- Tasa de no-show con y sin seña
- Ticket promedio por canal (con pre-pedido vs. sin pre-pedido)
- Platos más pedidos
- Efectividad de promos

---

## 10. Sistema de códigos de mesa

### Estructura del código

Cada mesa tiene un código fijo que se asigna en el onboarding y no cambia.

**Configuración base (sin zonas):**
```
Mesa 1, Mesa 2, Mesa 3 ... Mesa N
```

**Con zonas activas:**

| Zona | Prefijo | Mesas |
|------|---------|-------|
| Salón | S | S1, S2, S3... |
| Terraza | T | T1, T2, T3... |
| VIP | V | V1, V2... |
| Barra | B | B1, B2... |
| Jardín | J | J1, J2... |

El prefijo lo define el negocio al crear la zona. El sistema asigna los números secuencialmente.

### Separación entre código y estado

El **código de mesa** es permanente. T2 siempre es T2.
El **estado de mesa** es dinámico y cambia en tiempo real.

Esta separación permite que el negocio modifique su plano (agregar mesas, cambiar zonas) sin invalidar las reservas ya confirmadas que tienen un código asignado.

### Unicidad en el contexto operativo

El código "Germán · Mesa 3" es único dentro del turno activo. El panel del negocio filtra por turno, de modo que no puede existir ambigüedad entre dos reservas con el mismo nombre y mesa en distintos turnos.

---

## 11. Confirmación de reserva

### Tres elementos siempre presentes

**1. QR**
Para escaneo rápido con tablet en la entrada. Técnicamente es un JWT firmado con `{ reservation_id, venue_id, exp: hora de reserva + 4h }`. Verificable sin llamada a base de datos, funciona offline desde el panel.

**2. Código legible**
```
Germán · Mesa 3
```
o con zonas:
```
Germán · T2
```
Tipografía grande, alta visibilidad, para check-in verbal cuando el QR no es conveniente.

**3. Mensaje guardable**

El usuario puede tocar "Guardar en WhatsApp" que abre directamente la app con el mensaje pre-armado:

```
Reserva confirmada en La Cantina 🍽
📅 Viernes 18 de abril · 21:00 hs
👤 Germán · Mesa T2
📍 Av. Corrientes 1234, CABA

Mostrá este mensaje en la entrada
o presentate como "Germán, T2".
```

El mensaje es texto plano — funciona aunque el destinatario no tenga internet al momento del check-in. El usuario puede enviárselo a su propio número como recordatorio, o a un familiar que va a ir con él.

**Botón secundario:** "Agregar al calendario" genera un `.ics` con dirección del restaurante y alarma 1 hora antes.

### Email de confirmación

Se envía automáticamente al confirmar la reserva. Contiene:

- Nombre del restaurante y dirección
- Fecha y horario
- Código de mesa en tipografía grande
- QR como imagen embebida
- Detalle del pedido anticipado (si eligió pre-pedir)
- Monto de seña abonado
- Botón "Agregar al calendario"
- Política de cancelación

---

## 12. Menú anticipado — opcional

### El pre-pedido es siempre opcional para el cliente

En ningún punto del flujo se obliga al usuario a elegir platos. Se presenta como una ventaja con incentivos claros:

| | Sin pre-pedido | Con pre-pedido |
|---|---|---|
| Garantía de mesa | 10 minutos de gracia | 15 minutos de gracia |
| Platos de disponibilidad limitada | ❌ | ✅ |
| Tiempo de espera al llegar | Normal | Reducido |
| Posición en cola de cocina | Al llegar | Desde la reserva |

### Presentación en el flujo

Después de elegir la mesa y antes del resumen de pago, aparece una pantalla con dos opciones claras:

- Botón primario: _"Elegir mi plato ahora"_ (ir al menú)
- Texto secundario: _"No, prefiero elegir cuando llegue"_ (continuar sin pre-pedir)

### Gestión de disponibilidad

El negocio configura por ítem:
- ✅ Disponible
- ❌ No disponible mañana
- ⚠️ Porciones limitadas (con contador)

Si el negocio no carga disponibilidad antes del servicio, el fallback es el menú base completo disponible.

---

## 13. Modo grupo

### Flujo del organizador

1. El organizador crea la reserva normalmente: fecha, horario, mesa, cantidad de personas
2. Antes del pago, el sistema ofrece: _"¿Es una salida en grupo? Compartí el link para que cada uno elija su plato"_
3. Si activa el modo grupo, el sistema genera un **link único de sala compartida**
4. Aparece un botón "Compartir por WhatsApp" que abre directamente WhatsApp con el mensaje pre-armado:

```
Reservé en La Cantina para el viernes 18 a las 21h.
Entrá acá para confirmar y elegir tu plato si querés:
[link único de sala]
```

5. El organizador completa la reserva y paga la seña normalmente
6. Ve en tiempo real quién confirmó asistencia y qué eligió

### Flujo del invitado

1. El invitado recibe el link por WhatsApp
2. Al tocarlo, accede directamente a la sala — **sin necesidad de crear cuenta**
3. Ve la información de la reserva: restaurante, fecha, hora, mesa
4. Tiene dos opciones:
   - Confirmar asistencia solamente
   - Ver el menú disponible y elegir su plato (opcional)
5. Su elección queda visible para el organizador en tiempo real

### Sesión del invitado

La sesión es anónima y está asociada al link único. Solo el organizador necesita cuenta con seña. Esto es crítico: si se le pide al invitado que se registre para acceder, se pierde la mayoría de las conversiones en ese paso.

### Pedido consolidado

El organizador ve un resumen del pedido completo del grupo antes de confirmar. El pedido consolidado llega al panel del negocio antes de que el grupo arribe.

---

## 14. Sistema de notificaciones

### Canal principal: Email (MVP)

El email cubre los dos casos críticos sin complejidad adicional ni dependencias externas:

**Email de confirmación** (inmediato al confirmar reserva)
- Código de mesa en tipografía grande
- QR embebido
- Datos del restaurante
- Botón de calendario
- Política de cancelación

**Email de recordatorio** (automático antes del turno, horario configurable por el negocio — ejemplo: 3 horas antes)
- Código de mesa
- Hora de la reserva
- Dirección del restaurante

**Proveedor:** Resend — se integra nativamente con Vercel y Supabase, tier gratuito de 3.000 emails/mes suficiente para el piloto.

### Canales para versiones posteriores (no en MVP)

- **WhatsApp Business API** — canal más efectivo para el mercado argentino, requiere aprobación de Meta para templates. Post-MVP cuando el volumen lo justifique.
- **Push nativo** — disponible para usuarios que descarguen la app, uno de los beneficios diferenciadores de la app vs. la web.
- **Push web (PWA)** — funciona en Android, poco confiable en iOS. No se implementa en MVP por cobertura incompleta.

---

## 15. Seña y política de cancelación

### Lógica de la seña

- Configurable por el negocio: monto fijo o % del subtotal del pedido anticipado
- Se descuenta del total al llegar al local
- Timer de 10 minutos para completar el pago desde la pantalla de confirmación
- Si el timer vence sin pago: la reserva se cancela y la mesa vuelve a estado libre

### Política de cancelación

El negocio configura:
- Horas de gracia para cancelación gratuita (ej: hasta 2h antes)
- % de devolución fuera del período de gracia
- La devolución de la seña se ejecuta automáticamente — nunca es un proceso manual

### No-show

```
Hora de reserva + 15 minutos sin check-in:
    → Seña cobrada automáticamente
    → Mesa liberada
    → Log en el panel del negocio
    → Email automático al usuario con el cargo informado
```

---

## 16. Stack tecnológico

### Frontend — PWA + Panel negocio

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| PWA cliente | Next.js + App Router | SSR para SEO de restaurantes, PWA manifest para "agregar a inicio", mismo repo que el panel |
| Panel negocio | Next.js (mismo repo) | Funciona bien en tablet, real-time con Supabase, deploy en Vercel |
| App nativa (post-MVP) | React Native + Expo | Comparte lógica de negocio con la web en monorepo |

### Backend y datos

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Base de datos | Supabase (PostgreSQL) | RLS nativo para multi-tenancy, real-time incluido, auth incluido, tier gratuito suficiente para piloto |
| Real-time (panel) | Supabase Realtime | Escucha cambios en tabla de mesas y los empuja al panel sin overhead de Socket.io. < 2s latencia. |
| Auth | Supabase Auth | OTP por teléfono para clientes, email/password para staff del negocio |
| Locks de mesa (MVP) | Supabase + campo `lock_expires_at` | Suficiente para MVP. Lock atómico con `SELECT FOR UPDATE`. Migrar a Redis solo si hay contención alta. |
| Hosting | Vercel | Deploy instantáneo, integración nativa con Supabase, edge network |
| Pagos | Mercado Pago | Domina el mercado argentino; IPN para webhooks de señas con idempotencia |
| Emails | Resend | SDK simple, integración nativa con Next.js y Vercel, 3.000 emails/mes gratis |
| Imágenes | Supabase Storage | Incluido en el plan, suficiente para fotos de platos y restaurantes en MVP |

### Modelo de datos base (entidades mínimas)

```
Venue          (id, name, address, config_json, cut_off_minutes, created_at)
Table          (id, venue_id, zone_id?, label, capacity, position_order)
Zone           (id, venue_id, name, prefix)  ← opcional
User           (id, phone, email, name, created_at)
Reservation    (id, venue_id, table_id, user_id, date, time_slot, party_size,
                status, qr_token, group_room_id?, created_at)
TableLock      (id, table_id, reservation_id, type, expires_at)
MenuItem       (id, venue_id, category_id, name, price, description, availability_status)
MenuCategory   (id, venue_id, name, sort_order)
Order          (id, reservation_id, status, total)
OrderItem      (id, order_id, menu_item_id, qty, unit_price, notes)
Payment        (id, reservation_id, amount, provider, external_id,
                status, idempotency_key, created_at)
GroupRoom      (id, reservation_id, link_token, created_at)
GroupGuest     (id, room_id, name, confirmed_at)
StaffUser      (id, venue_id, name, role, email)
```

---

## 17. Fases de desarrollo

### Fase 0 — Setup y fundación (semanas 1–3)

**Entregables:**
- Monorepo configurado (web cliente + panel + shared)
- Schema de Supabase con RLS multi-tenant
- Auth funcionando (OTP para clientes, email para staff)
- CI/CD en Vercel con preview environments
- Tipos compartidos en TypeScript

**Criterio de salida:** developer puede hacer login, crear un venue de prueba y consultar la base de datos desde el panel.

---

### Fase 1 — MVP core — primera reserva real (meses 1–3)

**Entregables:**
- PWA cliente: explorar restaurantes del piloto
- Flujo completo de reserva (sin pre-pedido)
- Lock de mesa con `lock_expires_at` en Supabase
- Pago de seña con Mercado Pago + idempotencia en webhook
- QR firmado (JWT) para check-in
- Email de confirmación y recordatorio via Resend
- Botón "Guardar en WhatsApp" en pantalla de confirmación
- Botón "Agregar al calendario"
- Código legible Nombre · Mesa en confirmación
- Panel: vista de mesas + marcar ocupada/libre
- Modo pre-servicio y modo servicio activo con corte automático
- Onboarding del negocio en menos de 10 minutos

**Bloqueante:** contrato firmado con al menos 1 restaurante piloto.

**Criterio de salida:** primera reserva real procesada, seña cobrada, cliente llega con código, recepcionista lo recibe desde el panel.

---

### Fase 2 — Real-time + menú anticipado (meses 3–6)

**Entregables:**
- Supabase Realtime para estados de mesa en el panel (< 2s)
- Menú anticipado completo (opcional en el flujo)
- Gestión de stock por ítem desde el panel
- Plato del día + promos (3 tipos)
- Analytics básico (ocupación, no-show, ticket promedio)
- Modo grupo con link compartible y sala de invitados sin cuenta

**Criterio de salida:** el panel refleja cambios de estado en menos de 2 segundos. Al menos 30% de reservas incluyen pre-pedido.

---

### Fase 3 — Diferencial y retención (meses 6–9)

**Entregables:**
- Roles y permisos en panel (dueño / encargado / mozo)
- App nativa React Native con push notifications
- Historial de reservas + "Lo de siempre"
- QR en mesa para pedir extras y solicitar cuenta
- División de cuenta
- Promos exclusivas para usuarios de la app
- WhatsApp Business API para notificaciones (si el volumen lo justifica)

---

### Fase 4 — Escalabilidad (mes 9+)

**Entregables:**
- Multi-sucursal por operador
- Self-service onboarding sin intervención del equipo
- Billing automatizado (MercadoPago Suscripciones)
- API pública para integración con POS
- Plano visual de mesas (módulo opcional)

---

## 18. KPIs de éxito

### Producto (cliente)

| Métrica | Objetivo mes 3 | Objetivo mes 6 |
|---------|---------------|---------------|
| Reservas completadas | 50/mes | 300/mes |
| Conversión reserva → pre-pedido | 25% | 40% |
| Tasa de no-show (con seña) | < 10% | < 6% |
| Retención mes 2 | 35% | 50% |

### Negocio (B2B)

| Métrica | Objetivo mes 3 | Objetivo mes 6 |
|---------|---------------|---------------|
| Restaurantes activos | 3 | 15 |
| MRR | $45.000 ARS | $300.000 ARS |
| Churn mensual | < 10% | < 5% |
| NPS del panel | > 6 | > 8 |

### Operativos

| Métrica | Umbral aceptable |
|---------|----------------|
| Latencia real-time de estados de mesas | < 2 segundos |
| Tiempo máximo de lock de selección | 3 minutos |
| Tiempo máximo de lock de pago | 10 minutos |
| Uptime del sistema | > 99.5% |

---

## 19. Lo que NO hacer en v1

- No construir la app nativa antes de validar el flujo completo en web
- No abrir el acceso a cualquier restaurante — hacer onboarding manual controlado con el piloto
- No lanzar el Modo Grupo hasta que el flujo de reserva individual esté validado en producción real
- No implementar WhatsApp Business API hasta tener volumen que lo justifique
- No construir el plano visual de mesas hasta que haya demanda explícita de los negocios
- No forzar el pre-pedido en ningún punto del flujo — siempre opcional
- No pedir al usuario que se descargue la app antes de que haya tenido su primera experiencia positiva

---

*ReservaYa — Documento de Proyecto v2.0 · Abril 2026*
