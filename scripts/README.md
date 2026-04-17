# scripts/ — Utilidades de testing

## 🌱 Seed demo

Genera un entorno de prueba con:

- **20 restaurantes ficticios** variados en las 5 cocinas que hoy filtra la PWA (Pastas, Carnes, Pizza, Vegano, Sushi) — 4 por categoría.
- Para cada negocio: zonas, mesas, menú coherente con la cocina, imagen placeholder y configuración de reservas.
- **20 cuentas staff `owner`** (una por negocio) para entrar al panel.
- **10 usuarios cliente** para probar la PWA.
- **1 cuenta tester destacada** (`test@reservaya.test` / `Test1234!`) lista para login.
- `venue_subscriptions` en `trial` de 365 días (así los venues aparecen en la home).

Todos los UUIDs de venues empiezan con `dec0...` y los emails usan el dominio `@demo.reservaya.test`, para distinguirlos de datos reales.

## Requisitos

En el `.env.local` del root (o el `.env.example` ya funciona como fallback dev):

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Instalar dependencias:

```bash
pnpm install
```

## Correr el seed

```bash
pnpm seed:demo
```

Es **idempotente**: lo podés correr varias veces, los datos no se duplican.

Al terminar genera:

- `scripts/demo-credentials.md` — tabla legible con todas las cuentas
- `scripts/demo-credentials.json` — misma info para consumir programáticamente

## Resetear (borrar todo lo demo)

```bash
pnpm seed:demo:reset
```

Borra sólo:
- Venues con UUID `dec0...` (cascada: zones, tables, menu_categories, menu_items, staff_users, venue_subscriptions)
- Cuentas auth con email `@demo.reservaya.test`
- Cuenta tester `test@reservaya.test`
- Filas en `public.users` asociadas

**No toca** La Cantina (venue `00000000-0000-0000-0000-000000000001`) ni datos productivos.

## Cómo acceder a las cuentas generadas

Después de correr el seed, abrí `scripts/demo-credentials.md`. Tiene:

- 🎯 Cuenta tester (login rápido PWA)
- Tabla de 20 staff (email + password + venue + dirección)
- Tabla de 10 clientes adicionales

Servidores dev:
- PWA cliente — http://localhost:3010
- Panel negocio — http://localhost:3011

## Notas técnicas

- El script usa la `service_role_key`, lo que bypasea RLS. **No correr en producción**.
- Las imágenes son de `picsum.photos` con seed determinístico — no dependen de assets reales.
- El tipo de cocina se guarda en `venue.config_json.cuisine` (no hay columna dedicada en el schema actual). Si más adelante se agrega una columna `cuisine_types`, adaptar el seed.
- Los venues tienen suscripción `trial` válida 365 días para que `venue_has_access()` devuelva `true` y aparezcan en el home.
- Reservas de ejemplo **no se crean** para evitar locks/notifications espurios en realtime.
