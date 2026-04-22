# Un Toque

Plataforma SaaS de reservas para restaurantes — mercado argentino.

**Diferenciadores:** rating bidireccional (el local también califica al cliente),
% de cancelaciones del local público, WhatsApp automático nativo, widget
embebible sin comisión por reserva.

---

## Stack

- **Next.js 14** App Router · TypeScript strict · Tailwind
- **Supabase** (Postgres + Auth + RLS + Storage + Realtime)
- **Mercado Pago** para cobros y suscripción
- **Meta WhatsApp Cloud API** para notificaciones
- **Capacitor** para apps nativas (iOS + Android, futuro)
- Monorepo **pnpm + Turborepo**

---

## Estructura

```
un-toque/
├── apps/                  # Apps desplegables
│   ├── app/               # PWA cliente (puerto 3000)
│   └── panel/             # Panel del negocio (puerto 3001)
│
├── packages/              # Código compartido
│   └── shared/            # Types + utils (@untoque/shared)
│
├── native/                # Wrappers Capacitor (iOS + Android)
│   ├── client/            # "Un Toque" (comensales)
│   └── business/          # "Un Toque Negocios" (staff)
│
├── supabase/              # Esquema + migraciones
├── scripts/               # Utilidades (seed, etc.)
├── docs/                   # Documentación técnica
│   ├── architecture.md     # stack, carpetas, decisiones
│   ├── contributing.md     # workflow git, convenciones
│   ├── releases.md         # Changesets + semver + release flow
│   ├── branch-protection.md # setup de GitHub branch protection
│   ├── mobile-setup.md     # JDK + Android Studio + Xcode + stores
│   └── CHANGELOG.md        # historial de releases
└── .github/workflows/     # CI/CD
```

Para detalle del stack y decisiones: [`docs/architecture.md`](./docs/architecture.md).
Para workflow de trabajo: [`docs/contributing.md`](./docs/contributing.md).

---

## Setup local

```bash
# 1. Clonar + instalar
corepack pnpm install

# 2. Crear .env.local desde los .env.example
cp apps/app/.env.example apps/app/.env.local
cp apps/panel/.env.example apps/panel/.env.local
# Completar con credenciales reales (Supabase, MP)

# 3. Aplicar schema en Supabase
# Copiar supabase/APPLY_PILOT.sql al SQL Editor

# 4. Levantar las dos apps
corepack pnpm dev
# o por separado:
corepack pnpm --filter @untoque/app dev     # localhost:3000
corepack pnpm --filter @untoque/panel dev   # localhost:3001
```

---

## Comandos útiles

```bash
pnpm dev             # Levanta todas las apps (Turbo)
pnpm build           # Build de producción de todo
pnpm type-check      # TypeScript en los 3 packages
pnpm lint            # ESLint en los 2 apps
pnpm clean           # Limpia caches y .next
pnpm seed:demo       # Seed de datos demo en Supabase
pnpm seed:demo:reset # Reset + re-seed

# ── Apps nativas (requieren Android Studio / Xcode) ──────
pnpm native:client:sync          # sincroniza native/client
pnpm native:client:open:android  # abre Android Studio (native/client)
pnpm native:client:open:ios      # abre Xcode (native/client, Mac)
pnpm native:business:sync
pnpm native:business:open:android
pnpm native:business:open:ios
pnpm native:sync                 # sincroniza ambos a la vez
```

Ver [`docs/mobile-setup.md`](./docs/mobile-setup.md) para instalación de JDK, Android Studio, Xcode y flujo completo de release en stores.

---

## Ambientes y variables

Cada app carga su `.env.local`. En producción, setear en Vercel.

**Obligatorias** (en ambos apps):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo server-side, crítico)
- `QR_JWT_SECRET` (32+ chars random)
- `MERCADOPAGO_ACCESS_TOKEN`
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_PANEL_URL`

**Opcionales:**
- `NEXT_PUBLIC_SENTRY_DSN` — monitoreo de errores
- `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID` — notificaciones WA
- `CRON_SECRET` — jobs programados
- `ENABLE_DEV_PREVIEW=1` — solo en dev, permite `?preview=1` en el panel

---

## Deploy

Dos proyectos separados en Vercel:

- `panel.untoque.app` → `apps/panel/`
- `app.untoque.app` → `apps/app/`

Cada uno con Root Directory = carpeta de la app, Framework = Next.js. Ver config específica en `apps/<app>/vercel.json`.

---

## Contribución

Leer [`docs/contributing.md`](./docs/contributing.md) antes de hacer el primer PR.

En resumen:
1. Branch por cambio (`feature/*`, `fix/*`, `hotfix/*`)
2. Commits con Conventional Commits (`feat:`, `fix:`, `chore:`)
3. PR con descripción + testing + screenshots
4. Merge solo con CI verde + review

---

## Licencia

Propietario. Todos los derechos reservados.
