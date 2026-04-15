# ReservaYa — Design System

> Guía de diseño visual y UX para la PWA del cliente y el panel del negocio.
> Versión: 2.0 · Abril 2026

---

## Índice

1. [Filosofía de diseño](#1-filosofía-de-diseño)
2. [Paleta de colores](#2-paleta-de-colores)
3. [Tipografía](#3-tipografía)
4. [Espaciado y grilla](#4-espaciado-y-grilla)
5. [Componentes base](#5-componentes-base)
6. [Pantallas — PWA cliente](#6-pantallas--pwa-cliente)
7. [Pantallas — Panel negocio](#7-pantallas--panel-negocio)
8. [Pantalla de confirmación](#8-pantalla-de-confirmación)
9. [Estados de UI](#9-estados-de-ui)
10. [Diseño mobile-first y PWA](#10-diseño-mobile-first-y-pwa)
11. [Animaciones y transiciones](#11-animaciones-y-transiciones)
12. [Tokens CSS de referencia](#12-tokens-css-de-referencia)

---

## 1. Filosofía de diseño

### Concepto central: Vibrante y sin fricción

ReservaYa tiene que sentirse como la anticipación de una buena salida — energética, clara y confiable. No es una app de gestión fría ni una interfaz genérica. Cada pantalla tiene un trabajo único y el usuario siempre sabe dónde está y qué hacer.

### Principios de diseño

**1. Claridad sobre densidad**
Cada pantalla tiene una sola tarea. No se mezclan flujos ni se sobrecarga de información. El usuario siempre sabe dónde está y qué hacer.

**2. Color con propósito**
Los colores no son decorativos. Cada color del sistema tiene un significado operativo consistente. El verde siempre es disponible. El rojo siempre es ocupado o urgente. El azul siempre es reservado digitalmente.

**3. Feedback inmediato**
Cada acción tiene una respuesta visual inmediata. Sin estados de carga sin animación, sin botones mudos, sin formularios que no confirman.

**4. Opcional siempre se ve como ventaja, no como paso extra**
El pre-pedido y la descarga de la app se presentan visualmente como beneficios que el usuario elige, nunca como fricción que se le impone. Los flujos secundarios tienen jerarquía visual menor que el flujo principal.

**5. Mobile primero, tablet consciente**
El 90%+ de los usuarios finales interactúan desde mobile en la PWA. El panel del negocio se diseña primariamente para tablet — es el dispositivo de la recepcionista.

**6. Tipografía como jerarquía**
Fraunces para títulos y números importantes — comunica calidez y personalidad. Plus Jakarta Sans para todo lo demás — limpio, legible, funcional. Nunca mezclar con otras familias.

---

## 2. Paleta de colores

### Colores principales del sistema

| Token | Hex | Nombre | Uso |
|-------|-----|--------|-----|
| `--c1` | `#FF4757` | Coral Red | CTA principal, urgencia, estado ocupado, no disponible |
| `--c2` | `#2ED8A8` | Mint Green | Confirmación, disponible, éxito, check-in |
| `--c3` | `#FFB800` | Gold | Lock, advertencia, timers, promos |
| `--c4` | `#4E8EFF` | Electric Blue | Reservado vía plataforma, info |
| `--c5` | `#9B59FF` | Purple | Postres, categorías especiales, modo grupo |

### Colores de superficie

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg` | `#FFFFFF` | Fondo base de pantallas |
| `--sf` | `#F9FAFB` | Fondo de cards secundarias, inputs |
| `--sf2` | `#F0F2F5` | Fondo de chips inactivos, botones terciarios |

### Colores de texto

| Token | Hex | Uso |
|-------|-----|-----|
| `--tx` | `#0D0D0D` | Texto principal, títulos |
| `--tx2` | `#5A5A6E` | Texto secundario, subtítulos, descripciones |
| `--tx3` | `#ABABBA` | Placeholder, labels inactivos, metadata |

### Variantes claras (fondos de badges y estados)

| Token | Hex | Derivado de |
|-------|-----|-------------|
| `--c1l` | `#FFF1F2` | `--c1` |
| `--c2l` | `#EAFDF6` | `--c2` |
| `--c3l` | `#FFF8E6` | `--c3` |
| `--c4l` | `#EEF5FF` | `--c4` |
| `--c5l` | `#F4EFFF` | `--c5` |

### Panel del negocio — tema oscuro

Header del panel:
```css
background: linear-gradient(145deg, #1A1A2E 0%, #16213E 60%, #0F3460 100%)
```

Textos sobre fondo oscuro:
- Título: `#FFFFFF`
- Subtítulo: `rgba(255, 255, 255, 0.55)`
- Label inactivo: `rgba(255, 255, 255, 0.30)`

---

## 3. Tipografía

### Familias

| Familia | Tipo | Fuente | Uso |
|---------|------|--------|-----|
| **Fraunces** | Display / Serif | Google Fonts | Títulos de pantalla, nombres de restaurantes, números grandes, código de mesa en confirmación |
| **Plus Jakarta Sans** | Body / Sans-serif | Google Fonts | Todo lo demás: body, buttons, labels, chips, navegación |

### Import

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@700;900&display=swap" rel="stylesheet">
```

### Escala tipográfica

| Rol | Familia | Tamaño | Peso | Uso |
|-----|---------|--------|------|-----|
| Display | Fraunces | 34–38px | 900 | Splash, títulos heroicos |
| H1 | Fraunces | 24–26px | 700 | Títulos de sección principal |
| H2 | Fraunces | 20–22px | 700 | Nombre del restaurante, detalle |
| Código de mesa | Fraunces | 28–32px | 700 | Pantalla de confirmación — muy prominente |
| H3 | Plus Jakarta | 16–17px | 800 | Subtítulos, nombres de cards |
| H4 | Plus Jakarta | 14–15px | 700 | Nombres de ítems de menú |
| Body | Plus Jakarta | 14px | 400–500 | Texto descriptivo |
| Caption | Plus Jakarta | 12–13px | 500–600 | Metadata, horarios, distancia |
| Label | Plus Jakarta | 10–11px | 600–700 | Labels de navegación, badges, categorías |

### Reglas tipográficas

- Letter-spacing de `-0.02em` a `-0.03em` en Fraunces
- Line-height de `1.5–1.6` para body text
- **Nunca usar Inter, Roboto ni Arial**
- Los precios, números grandes y códigos de mesa siempre van en Fraunces

---

## 4. Espaciado y grilla

### Sistema de espaciado (base 4px)

| Token | Valor | Uso |
|-------|-------|-----|
| `xs` | 4px | Gap entre elementos muy cercanos |
| `sm` | 8px | Gap entre chips |
| `md` | 12px | Padding interno de cards compactas |
| `lg` | 16px | Padding horizontal base de pantallas |
| `xl` | 20px | Padding de secciones |
| `2xl` | 24–28px | Separación entre secciones |
| `3xl` | 32px | Padding vertical de pantallas hero |

### Padding horizontal de pantalla
`18–20px` en todos los contextos.

### Border radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--r-sm` | 8–10px | Inputs, tags |
| `--r-md` | 12–14px | Chips, botones, badges, mesas |
| `--r-lg` | 16–18px | Cards principales |
| `--r-xl` | 20px | Cards heroicas, info cards |
| `--r-full` | 99px | Botones pill, toggles, chips redondeados |

---

## 5. Componentes base

### 5.1 Botones

**Primario (CTA principal)**
```css
background: #FF4757;
color: white;
border-radius: 14px;
padding: 15px 24px;
font-weight: 700;
font-size: 15px;
box-shadow: 0 6px 20px rgba(255, 71, 87, 0.38);
width: 100%;
```

**Secundario (acción positiva / confirmación)**
```css
background: #2ED8A8;
color: white;
box-shadow: 0 6px 20px rgba(46, 216, 168, 0.35);
```

**Terciario (outline)**
```css
background: transparent;
border: 2px solid rgba(0, 0, 0, 0.07);
color: #0D0D0D;
```

**Superficie (acción suave)**
```css
background: #F9FAFB;
color: #0D0D0D;
border: none;
```

**Estado activo en todos:** `transform: scale(0.97)` con `transition: 0.18s`

**Botón de WhatsApp (guardar reserva)**
```css
background: #25D366;
color: white;
border-radius: 14px;
padding: 15px 24px;
font-weight: 700;
display: flex;
align-items: center;
gap: 8px;
```

**Botón de calendario**
```css
background: #F9FAFB;
color: #0D0D0D;
border: 1.5px solid rgba(0,0,0,0.07);
border-radius: 14px;
padding: 13px 24px;
font-weight: 600;
```

---

### 5.2 Chips / Filtros

Estado inactivo:
```css
background: #FFFFFF;
border: 1.5px solid rgba(0,0,0,0.07);
color: #5A5A6E;
border-radius: 99px;
padding: 7px 15px;
font-weight: 600;
font-size: 13px;
```

Estado activo:
```css
background: #FF4757;
color: white;
border-color: #FF4757;
box-shadow: 0 4px 12px rgba(255, 71, 87, 0.25);
```

---

### 5.3 Badges / Pills de estado

Base: `padding: 4px 10px`, `border-radius: 99px`, `font-size: 11px`, `font-weight: 700`

| Variante | Fondo | Texto | Uso |
|----------|-------|-------|-----|
| Verde | `#EAFDF6` | `#15A67A` | Disponible, confirmado, check-in |
| Rojo | `#FFF1F2` | `#D63646` | Ocupado, no disponible |
| Naranja | `#FFF8E6` | `#CC7700` | Advertencia, promo, timer |
| Azul | `#EEF5FF` | `#2B5FCC` | Reservado vía plataforma |
| Púrpura | `#F4EFFF` | `#6B30CC` | Modo grupo, especial |
| Verde WhatsApp | `#E8F8EE` | `#128C7E` | Acción de guardar en WhatsApp |

---

### 5.4 Cards

**Card estándar:**
```css
background: #FFFFFF;
border-radius: 20px;
border: 1px solid rgba(0, 0, 0, 0.07);
box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
overflow: hidden;
```

**Card de confirmación (mesa elegida / reserva activa):**
```css
background: linear-gradient(135deg, #EAFDF6, #F0F8FF);
border: 2px solid #2ED8A8;
border-radius: 18px;
```

**Card de seña / advertencia:**
```css
border-color: rgba(255, 184, 0, 0.35);
background: #FFFDF5;
```

**Card de código de mesa (en pantalla de confirmación):**
```css
background: #0D0D0D;
border-radius: 20px;
padding: 24px;
color: white;
text-align: center;
```

---

### 5.5 Mesas (panel del negocio)

Tamaño: `aspect-ratio: 1`, `border-radius: 14px`, `border: 2px solid transparent`

| Estado | Fondo | Texto/icono | Border |
|--------|-------|-------------|--------|
| Libre | `#EAFDF6` | `#14A874` | `rgba(46,216,168,0.3)` |
| Reservada (digital) | `#EEF5FF` | `#2B5FCC` | `rgba(78,142,255,0.3)` |
| Ocupada | `#FFF1F2` | `#D63646` | `rgba(255,71,87,0.3)` |

Cada tarjeta de mesa en el panel muestra además:
- **Código de mesa:** prominente (S3, T2, Mesa 4)
- **Label de estado en texto** además del color (Libre / Nombre del titular / Ocupada)
- Si está reservada: nombre del titular + hora de llegada esperada
- Si tiene pre-pedido: ícono de plato + cantidad de ítems

---

### 5.6 Ítem de menú

Layout: `display: flex`, `gap: 12px`, `padding: 14px 0`, `border-bottom: 1px solid var(--br)`

- Imagen: `74×74px`, `border-radius: 16px`
- Nombre: Plus Jakarta Sans, 14px, 700
- Precio: 13px, 800
- Descripción: 12px, color `--tx2`
- Contador (+/−): botones de `29×29px`, `border-radius: 9px`; activo con fondo `#FF4757`
- Badge "Últimas porciones": variante naranja

**Gradientes de imagen por categoría:**

| Categoría | Gradiente |
|-----------|-----------|
| Pastas / Principales | `#1A1A2E → #2D3561` |
| Carnes / Pizzas | `#FF4757 → #FF8C42` |
| Verdes / Ensaladas | `#2ED8A8 → #00B8A9` |
| Postres | `#9B59FF → #6C63FF` |
| Bebidas / Vinos | `#8B1A1A → #C0392B` |

---

### 5.7 Cart bar (sticky — menú anticipado)

```css
position: sticky;
bottom: 0;
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(16px);
padding: 10px 18px 22px;
border-top: 1px solid var(--br);
```

Estado vacío: `opacity: 0.45`, `pointer-events: none`
Estado con items: `opacity: 1`, `pointer-events: auto`

---

### 5.8 Timer de seña

```css
background: linear-gradient(135deg, #FFF8E0, #FFF3D0);
border-radius: 12px;
padding: 12px 14px;
border: 1px solid rgba(255, 184, 0, 0.25);
```

Número del timer: Fraunces, 22px, 700, color `#B87800`

---

### 5.9 Toast / Notificación in-app

```css
position: absolute;
top: 10px; left: 12px; right: 12px;
background: #0D0D0D;
color: white;
border-radius: 16px;
padding: 13px 15px;
box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
animation: slideDown 0.38s cubic-bezier(0.32, 0.72, 0, 1) forwards;
```

Auto-dismiss a los 4.5 segundos.

---

### 5.10 Bottom Navigation (PWA cliente)

```css
position: sticky;
bottom: 0;
background: var(--bg);
border-top: 1px solid var(--br);
display: flex;
padding: 6px 0 18px;
backdrop-filter: blur(12px);
```

Activo: ícono en `#FF4757` + dot visible.
Inactivo: ícono y label en `#ABABBA`.

---

### 5.11 Banner de modo servicio activo (PWA)

Cuando el negocio está en modo servicio, el cliente que intenta reservar para ese turno ve:

```css
background: #FFF8E6;
border: 1px solid rgba(255, 184, 0, 0.3);
border-radius: 14px;
padding: 14px 16px;
display: flex;
align-items: center;
gap: 10px;
```

Copy: _"Las reservas para este turno ya están cerradas. Podés reservar para otro horario."_
Ícono: reloj con color `#CC7700`

---

## 6. Pantallas — PWA cliente

### Pantalla 1: Splash

- Fondo gradiente diagonal `#FF4757 → #FF8C42`
- Logo con backdrop-filter
- Nombre "ReservaYa" en Fraunces 38px / 900
- Tagline en 15px / 500
- Barra de progreso animada
- Auto-transición a Home a los 2.9s

---

### Pantalla 2: Home

- Header con saludo y botón de notificaciones
- Barra de búsqueda
- Chips de categorías (scroll horizontal)
- Cards de restaurantes: hero card + cards compactas
- Badge de modo servicio activo en cards con turno en curso

---

### Pantalla 3: Detalle del restaurante

**Tabs:** Mesas / Menú / Info

**Tab Mesas:**
- Selector de fecha (scroll horizontal de fechas)
- Chips de horarios disponibles
- Si el turno está en modo servicio activo: banner de aviso (componente 5.11)
- Selector de personas
- Grilla de mesas disponibles
- Botón CTA full-width

---

### Pantalla 4: Pre-pedido (opcional)

Esta pantalla se presenta como opción, nunca como paso obligatorio.

**Encabezado:**
```
[Banner]  ¿Querés que tu comida esté lista cuando llegués?
          Elegí tu plato ahora — es opcional.
          
          [Botón primario]  Ver el menú
          [Texto link]      No, prefiero elegir cuando llegue →
```

**Si elige ver el menú:** flujo normal de menú anticipado con cart bar sticky.

**Si elige no pre-pedir:** va directo a la pantalla de resumen y pago.

---

### Pantalla 5: Resumen y pago de seña

- Card de resumen de reserva (restaurante, mesa, fecha, hora, personas)
- Card de pedido anticipado (si eligió pre-pedir) con badge "Opcional"
- Card de seña con timer activo
- Métodos de pago
- Botón CTA "Confirmar reserva"

---

### Pantalla 6: Confirmación (pantalla de éxito)

Esta es la pantalla más importante para la retención. Ver sección [8. Pantalla de confirmación](#8-pantalla-de-confirmación).

---

## 7. Pantallas — Panel negocio

### Header del panel

```css
background: linear-gradient(145deg, #1A1A2E 0%, #16213E 60%, #0F3460 100%)
```

Secciones:
- Nombre del negocio en Fraunces blanco
- Fecha y turno activo
- Indicador de modo: "Pre-servicio" (verde) o "Servicio activo" (rojo)
- Grilla de stats: reservas confirmadas, mesas libres, mesas ocupadas

---

### Vista de mesas (pantalla principal del panel)

**Durante modo pre-servicio:**
- Todas las mesas con su estado actual
- Mesas reservadas muestran nombre del titular + hora

**Durante modo servicio activo:**
- Vista de operación: el staff gestiona el estado manualmente
- Reservas del turno ordenadas por hora de llegada esperada en sidebar o sección inferior
- Botón prominente de check-in para cada reserva confirmada

**Cada card de mesa muestra:**
```
[Color de estado]
Código: T2
Capacidad: 4
Estado: "Libre" / "Germán · 21:00" / "Ocupada"
[Si tiene pre-pedido]: 🍽 3 platos
```

---

### Acciones rápidas durante el servicio

Grid 2×2:

| Acción | Fondo | Texto |
|--------|-------|-------|
| Marcar ocupada | `#FFF1F2` | `#C0313E` |
| Hacer check-in | `#EAFDF6` | `#0A9A72` |
| Plato agotado | `#FFF8E6` | `#CC7700` |
| Liberar mesa | `#EEF5FF` | `#2B5FCC` |

---

### Navegación del panel (bottom bar oscura)

```css
background: #1A1A2E;
padding: 8px 0 18px;
```

4 ítems: Mesas / Reservas / Carta / Config
Activo: ícono en `--c1` + label en `--c1`
Inactivo: `rgba(255,255,255,0.25)`

---

## 8. Pantalla de confirmación

Esta es la pantalla más crítica del flujo del cliente. Tiene que funcionar sin internet (el usuario la abre en el restaurante con señal mala) y tiene que ser usable en condiciones de luz variable (interior oscuro, sol directo).

### Layout completo (de arriba hacia abajo)

**1. Animación de éxito**
- Círculo con gradiente `#2ED8A8 → #00E5C4`
- Check animado con stroke-dasharray
- Confetti al entrar (55 partículas con colores del sistema)

**2. Título**
```
¡Reserva confirmada!
```
Fraunces, 26px, 700, fadeUp

**3. Subtítulo**
```
La Cantina · Viernes 18 de abril · 21:00 hs
```
Plus Jakarta, 14px, color `--tx2`

**4. Card de código de mesa (el elemento más prominente)**
```css
background: #0D0D0D;
border-radius: 20px;
padding: 28px 24px;
text-align: center;
color: white;
```

Contenido de la card:
```
[Label pequeño]  TU CÓDIGO DE MESA
[Código grande]  Germán · Mesa 3
                 (Fraunces, 32px, 700, blanco)
[Label pequeño]  Mostrá este código en la entrada
```

**5. QR**
Card con fondo `#F9FAFB`, borde suave, QR centrado.
Tamaño del QR: `200×200px` mínimo para escaneo cómodo desde la distancia.

**6. Botones de acción (en orden de importancia visual)**

```
[Verde WhatsApp] Guardar en WhatsApp
[Superficie]     Agregar al calendario
[Texto link]     Ver detalles de la reserva →
```

El botón de WhatsApp es secundario visualmente al código de mesa pero primario entre los botones — es la acción más útil.

**7. Cards de detalle (collapsibles)**
- Resumen de reserva (mesa, personas, horario)
- Pedido anticipado (si eligió pre-pedir) con badge "En cocina"
- Seña abonada
- Política de cancelación

### Comportamiento del botón "Guardar en WhatsApp"

Al tocar, abre: `https://wa.me/?text=[mensaje codificado]`

El mensaje pre-armado:
```
Reserva confirmada en [Nombre Restaurante] 🍽
📅 [Día], [fecha] · [hora] hs
👤 [Nombre del usuario] · [Código de mesa]
📍 [Dirección]

Mostrá este mensaje en la entrada
o presentate como "[Nombre], [Código]".
```

Es texto plano, sin links, sin QR. Funciona offline para el check-in.

### Comportamiento del botón "Agregar al calendario"

Genera y descarga un archivo `.ics` con:
- Título: `Reserva en [Restaurante]`
- Fecha y hora de la reserva
- Dirección
- Alarma: 60 minutos antes
- Descripción: código de mesa + nombre de contacto del restaurante

---

## 9. Estados de UI

### Estados globales

| Estado | Qué mostrar |
|--------|-------------|
| Cargando | Skeleton screens con shimmer (no spinners) |
| Vacío | Copy claro + acción sugerida |
| Error | Toast rojo + mensaje corto + opción de reintentar |
| Sin conexión | Banner superior con dot parpadeante |
| Éxito | Toast verde o pantalla dedicada |
| Turno cerrado | Banner amarillo con copy claro y alternativa |

### Estados de mesa (resumen)

| Estado | Color | Label panel |
|--------|-------|-------------|
| Libre | Verde | "Libre" |
| Reservada | Azul | "[Nombre] · [hora]" |
| Ocupada | Rojo | "Ocupada" |

### Estados del botón de pre-pedido

| Estado | Apariencia |
|--------|-----------|
| Opción presentada | Botón primario "Ver menú" + texto secundario "No, elegir en el local" |
| Pre-pedido en progreso | Cart bar visible con total |
| Pre-pedido completado | Badge "3 platos elegidos" en resumen de reserva |
| Sin pre-pedido | Sin badge, flujo limpio — no se menciona la ausencia |

---

## 10. Diseño mobile-first y PWA

### Breakpoints

| Breakpoint | Ancho | Comportamiento |
|------------|-------|----------------|
| Mobile | < 400px | PWA full screen |
| Tablet | 768px–1024px | Panel del negocio — layout de 2 columnas |
| Desktop | > 1024px | PWA centrada en frame de 390px |

### Reglas táctiles

- Zona táctil mínima: `44×44px`
- Spacing entre elementos táctiles: mínimo `8px`
- El código de mesa y el QR tienen que ser visibles sin zoom desde 30cm de distancia

### PWA — manifest y comportamiento

```json
{
  "name": "ReservaYa",
  "short_name": "ReservaYa",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#FF4757",
  "orientation": "portrait"
}
```

- La pantalla de confirmación debe funcionar sin conexión (cachear con Service Worker)
- El QR y el código de mesa se renderizan antes de que carguen otros elementos
- La pantalla de confirmación no tiene bottom navigation — es una pantalla de destino limpia

### Safe areas iOS

- Respetar `env(safe-area-inset-bottom)` para padding inferior
- La confirmación tiene padding extra al pie para no quedar detrás del indicador de home

---

## 11. Animaciones y transiciones

### Transiciones de pantalla

```css
/* Entrada */
transform: translateX(105%) → translateX(0)
transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)

/* Salida */
transform: translateX(-22%)
```

### Aparición de elementos

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Stagger en pantalla de confirmación: cada elemento +0.1s (0.3s, 0.4s, 0.5s...).

### Check de confirmación

```css
stroke-dasharray: 100;
stroke-dashoffset: 100;
animation: drawCheck 0.65s 0.4s ease forwards;

@keyframes drawCheck {
  to { stroke-dashoffset: 0; }
}
```

### Confetti (pantalla de éxito)

55 partículas con colores del sistema (`#FF4757`, `#2ED8A8`, `#FFB800`, `#4E8EFF`, `#9B59FF`, `#FF8C42`), tamaño 4–14px, duración 0.7s–2.2s aleatorio.

### Entrada de modal / card

```css
@keyframes scaleIn {
  from { transform: scale(0.6); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
/* cubic-bezier(0.34, 1.56, 0.64, 1) para overshoot */
```

### Reglas generales

- Transiciones hover/active: `0.18s ease`
- Botones on active: `transform: scale(0.97)`
- Nunca usar `0.3s linear`
- Las animaciones de entrada solo se disparan una vez

---

## 12. Tokens CSS de referencia

```css
:root {
  /* ── Colores principales ── */
  --c1: #FF4757;
  --c1l: #FFF1F2;
  --c2: #2ED8A8;
  --c2l: #EAFDF6;
  --c3: #FFB800;
  --c3l: #FFF8E6;
  --c4: #4E8EFF;
  --c4l: #EEF5FF;
  --c5: #9B59FF;
  --c5l: #F4EFFF;

  /* ── WhatsApp ── */
  --wa: #25D366;
  --wal: #E8F8EE;

  /* ── Fondos ── */
  --bg:  #FFFFFF;
  --sf:  #F9FAFB;
  --sf2: #F0F2F5;

  /* ── Texto ── */
  --tx:  #0D0D0D;
  --tx2: #5A5A6E;
  --tx3: #ABABBA;

  /* ── Bordes ── */
  --br: rgba(0, 0, 0, 0.07);

  /* ── Sombras ── */
  --sh-sm: 0 1px 4px rgba(0, 0, 0, 0.04);
  --sh-md: 0 2px 10px rgba(0, 0, 0, 0.08);
  --sh-lg: 0 4px 16px rgba(0, 0, 0, 0.10);

  /* ── Border radius ── */
  --r-sm:   10px;
  --r-md:   14px;
  --r-lg:   18px;
  --r-xl:   20px;
  --r-full: 99px;

  /* ── Tipografía ── */
  --font-display: 'Fraunces', serif;
  --font-body:    'Plus Jakarta Sans', system-ui, sans-serif;

  /* ── Transiciones ── */
  --ease-snap:   cubic-bezier(0.32, 0.72, 0, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-ui:     0.18s ease;
}
```

---

*ReservaYa — Design System v2.0 · Abril 2026*
*Documento de producto: `ReservaYa_Proyecto_v2.md`*
