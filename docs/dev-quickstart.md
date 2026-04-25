# UnToque · Dev quickstart

Guía mínima para arrancar el monorepo UnToque en menos de 10 minutos.

## Stack

- **Monorepo**: pnpm workspaces + Turbo.
- **Apps**: `app/` (Next.js 14, PWA cliente), `panel/` (Next.js 14, panel ops), `shared/` (tipos).
- **DB**: Supabase (Postgres + RLS + Realtime + Storage).
- **Auth**: Supabase Auth (panel) + magic link (app).
- **Pagos**: MercadoPago Argentina.
- **Deploy**: Vercel (preview por PR + production en `main`).
- **Observability**: Sentry (DSN-gated) + Vercel Analytics + BetterUptime status page.

## Requisitos

- Node 20+ (recomendado 20.18 LTS).
- pnpm 9+ (`npm i -g pnpm`).
- Supabase CLI (`brew install supabase/tap/supabase` o `npm i -g supabase`).
- Cuenta en Supabase (free tier ok), MercadoPago (TEST credentials), Vercel.
- Editor: VS Code recomendado con extensiones ESLint + Tailwind IntelliSense + TypeScript.

## Primera vez

```bash
git clone https://github.com/<org>/untoque.git
cd untoque
pnpm install

# Copiar envs
cp .env.example .env.local
cp app/.env.example app/.env.local
cp panel/.env.example panel/.env.local
# Editar las 3 con credenciales reales (ver docs/migrations-apply-prod.md para Supabase)

# Levantar Supabase local (opcional pero recomendado)
supabase start

# Aplicar migrations
supabase db reset
```

## Comandos clave

| Comando                       | Qué hace                                          |
| ----------------------------- | ------------------------------------------------- |
| `pnpm dev`                    | Levanta `app` (3000) y `panel` (3001) en paralelo |
| `pnpm dev --filter=app`       | Solo cliente PWA                                  |
| `pnpm dev --filter=panel`     | Solo panel                                        |
| `pnpm build`                  | Build de todo el monorepo                         |
| `pnpm type-check`             | TypeScript en todos los workspaces                |
| `pnpm test`                   | Vitest (panel)                                    |
| `pnpm lint`                   | ESLint en todos los workspaces                    |
| `supabase db diff -f <name>`  | Crear migration nueva desde cambios locales       |
| `supabase db push`            | Aplicar migrations al proyecto remoto             |

## Estructura

```
untoque/
├── app/              ← PWA cliente (deuntoque.com / app.deuntoque.com)
├── panel/            ← Panel restaurantes (panel.deuntoque.com)
├── shared/           ← Tipos compartidos (@untoque/shared)
├── supabase/         ← Migrations + seeds + functions
├── scripts/          ← Outreach, migration, ETL
├── docs/             ← Setup guides (ESTE archivo)
└── turbo.json
```

## Troubleshooting típico

### `pnpm install` lento o falla
- Borrá `node_modules`, `.next`, `.turbo` y volvé a instalar.
- Verificá que `pnpm-workspace.yaml` apunte a los 3 paquetes correctos.

### Errors de tipos en `shared`
- Correr `pnpm --filter=@untoque/shared build` antes de los demás.

### Supabase local no levanta
- `supabase status` para ver qué falla.
- Por lo general es Docker no corriendo, o puerto 54321 ocupado.

### Sentry "DSN not set" en dev
- Es esperado. Los configs son DSN-gated, sin DSN quedan noop.

### Vercel preview no muestra Analytics
- Las deps `@vercel/analytics` y `@vercel/speed-insights` deben estar instaladas.
  Si recién las agregamos: `pnpm install` y redeploy.

### MP webhook no llega en local
- Usá ngrok o `cloudflared tunnel` para exponer `localhost:3000` con HTTPS.
- Configurá la URL pública en MP → Webhooks.

## Documentación adicional

- [DNS Cloudflare](./dns-cloudflare.md) — config de subdominios y CNAMEs.
- [Migrations en producción](./migrations-apply-prod.md) — cómo aplicar cambios de schema sin downtime.
- [Status page](./status-page-betteruptime.md) — observability pública.
- [Iubenda setup](./iubenda-setup.md) — cookie banner y políticas legales.
- [Notion CRM template](./notion-crm-template.md) — pipeline de outreach.

## Convenciones

- **Commits**: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- **Branches**: `main` = production, PRs desde feature branches.
- **TypeScript**: strict on. Cero `any` salvo justificado en comentario.
- **Estilos**: Tailwind + design tokens en `globals.css`. Nunca colores hex inline.
- **Tipografías**: Fraunces (display), Plus Jakarta Sans (body), JetBrains Mono (code).
- **Colores brand**: wine `#A13143`, olive `#4F8A5F`, lila `#E4CDED`. PWA cliente coral `#FF4757`.

## Contacto

- Producto: `hola@deuntoque.com`
- Bugs: GitHub issues
- WhatsApp soporte: ver landing
