# UnToque · Estado del proyecto

> **Última actualización:** 2026-04-26
> **Versión live:** commit `059e8b9` en `main`
> **Producción:** https://panel.deuntoque.com
>
> Este documento es la fuente de verdad del estado del proyecto. Lo actualizamos al final de cada sesión de trabajo. Marcá ✅ cuando algo se complete, 🟡 cuando esté en curso, ⚪ cuando esté pendiente.

---

## 📊 Avance global estimado: **~78%**

| Área | Peso | Avance | Aporta |
|---|---|---|---|
| Código features (panel + app) | 40% | 90% | 36.0% |
| Infra / Deploy / Env | 15% | 85% | 12.8% |
| Legal / Compliance | 15% | 35% | 5.3% |
| Mobile (Capacitor) | 10% | 30% | 3.0% |
| Marketing / GTM / SEO | 15% | 75% | 11.3% |
| Branding / Assets | 5% | 75% | 3.8% |
| **TOTAL** | 100% | | **~72-78%** |

---

## ✅ FEATURES IMPLEMENTADAS Y LIVE

### Panel del restaurante (`panel.deuntoque.com`)

**Marketing público** (no requiere auth):
- ✅ `/landing` — rediseño v2 + JSON-LD + hero responsive
- ✅ `/demo` — booking placeholder con WhatsApp + email (Cal.com pending)
- ✅ `/pilot` — programa fundador 50% off 3 meses
- ✅ `/vs-thefork` `/vs-maxirest` `/vs-fudo` — comparativas SEO con disclaimer trademark
- ✅ `/onboarding` — wizard 5 pasos con UI/UX Pro Max design system
- ✅ `/login` — con hydration fix (date/time SSR-safe)
- ✅ `/sitemap.xml` + `/robots.txt` — dinámicos
- ✅ `/og/{default,landing,demo,pilot,vs}` — OG images PNG dinámicas via `next/og`
- ✅ `/icon` `/apple-icon` — favicons dinámicos
- ✅ `/not-found` — 404 page custom con CTAs

**Dashboard interno** (auth required):
- ✅ `/dashboard` — home con KPIs ejecutivos + BarChart
- ✅ `/dashboard/mesas` — grid de mesas con zones + estado en tiempo real + drag floor plan
- ✅ `/dashboard/reservas` — timeline + crear/editar/check-in
- ✅ `/dashboard/crm` — clientes con filtros RFM + customer detail sheet
- ✅ `/dashboard/campaigns` — WhatsApp templates + campaign builder
- ✅ `/dashboard/analytics` — heatmap demanda + RFM segments + KPIs
- ✅ `/dashboard/handoff` — chat staff entre turnos
- ✅ `/dashboard/billing` — suscripción Mercado Pago
- ✅ `/dashboard/config` — venue + horarios + zonas + plano
- ✅ `/dashboard/config/plano` — drag-and-drop floor plan editor
- ✅ `/dashboard/config/fotos` — **NUEVO** logo + cover + galería max 12 con drag reorder
- ✅ `/dashboard/live` — TV mode fullscreen
- ✅ `/dashboard/ayuda` — help center con FAQ + atajos
- ✅ Notificaciones realtime + sound + push (con VAPID configurado)

### App PWA cliente (`deuntoque.com` / `app.deuntoque.com`)
- ✅ Búsqueda de venues + ficha
- ✅ **VenueHero** con cover photo + logo overlay (NUEVO)
- ✅ **VenueGallery** con lightbox + swipe + ESC + ArrowKeys (NUEVO)
- ✅ Wizard de reserva
- ✅ Mis reservas
- ✅ Modo grupo (sala compartida sin login)
- ✅ Pago con Mercado Pago (seña)
- ✅ JWT QR para check-in
- ✅ PWA offline con service worker

### Backend / Infra
- ✅ 15 migrations Supabase (001-015) aplicadas
- ✅ **Migration 016 `venue_images`** aplicada en prod (NUEVO HOY)
- ✅ **Storage bucket `venue-photos`** con RLS por venue_id (NUEVO HOY)
- ✅ RLS multi-tenant (staff_users → venue_id)
- ✅ Mercado Pago webhook con HMAC signature verification
- ✅ Meta WhatsApp Cloud API v21.0 con throttle 5/seg
- ✅ Web Push (VAPID) + service worker
- ✅ Sentry instrumentation (3 configs: client/server/edge) con redact
- ✅ Pino structured logger con request tracing
- ✅ Zod validation schemas
- ✅ Upstash Redis rate limiter con fallback in-memory
- ✅ Vercel Analytics + Speed Insights
- ✅ CI GitHub Actions: type-check + tests + lint
- ✅ 63 tests Vitest passing

### SEO / Marketing
- ✅ Score SEO 96/100 (A) — seomator audit
- ✅ JSON-LD structured data (SoftwareApplication, LocalBusiness, FAQPage)
- ✅ Sitemap + robots dinámicos
- ✅ OG images PNG via next/og
- ✅ Canonical URLs en todas las pages
- ✅ Schema.org en pages clave
- ✅ Soft 404 fixed (middleware no redirige rutas inexistentes)
- ✅ A11y: form labels htmlFor, aria-label, focus visible, touch targets ≥44px
- ✅ Mobile font-size ≥12px en utility classes
- ✅ Semantic HTML (`<main>`, `<header>`, `<article>`, `<nav aria-label>`)
- ✅ Plan SEO + marketing 12 semanas en `docs/seo-strategy.md`

### Branding
- ✅ Dominio `deuntoque.com` (Cloudflare Registrar, paid hasta 2026)
- ✅ 5 emails Resend operativos: no-reply@, hola@, soporte@, facturacion@, ventas@
- ✅ Logo "u" lila pastel + UnToque Fraunces
- ✅ Sistema de diseño dark (Cosy + Editorial) con paleta wine/pastels
- ✅ Tipografías obligatorias: Fraunces + Plus Jakarta + JetBrains Mono
- ✅ 5 OG images PNG dinámicas
- ✅ Favicons + apple-icon dinámicos

---

## 🟡 ACCIONES TUYAS PENDIENTES (externas, no son código)

### Crítico (bloquea producción real con clientes pagos)
- ⚪ **Rotar `service_role` Supabase** — ver `scripts/rotate-supabase-keys.md`
- ⚪ **Generar VAPID keys reales** y setearlas en Vercel
- ⚪ **Configurar `META_WHATSAPP_TOKEN`** + `PHONE_NUMBER_ID` en Vercel
- ⚪ **Configurar `MP_WEBHOOK_SECRET`** en Vercel + Mercado Pago Dashboard
- ⚪ **Crear `RESEND_API_KEY`** en Resend Dashboard + setearla en Vercel
- ⚪ **Sentry DSN** + setearlo en Vercel (gratis: developer plan)
- ⚪ **Upstash Redis URL + Token** (gratis: 10k req/día) + Vercel env
- ⚪ Activar Vercel Analytics + Speed Insights (2 clicks dashboard)

### DNS Cloudflare
- ⚪ **`app.deuntoque.com`** → CNAME `cname.vercel-dns.com` para PWA cliente
- ⚪ **`status.deuntoque.com`** → BetterUptime (cuando configures status page)
- ✅ `panel.deuntoque.com` → Vercel (ya configurado y working)

### Legal Argentina
- ⚪ **Monotributo Cat. A** en AFIP (~ARS 30k/mes)
- ⚪ **AAIP** inscripción base de datos (Ley 25.326, gratis, 1-2 sem aprobación)
- ⚪ **INPI clase 42** (SaaS) — empezar YA, tarda 12-18 meses (ARS 90-120k tasa + agente)
- ⚪ **INPI clase 43** (restaurantes) — recomendada
- ⚪ **INPI clase 9** (apps móviles) — recomendada cuando publiques en stores
- ⚪ **AFIP facturación electrónica** — cuando empiece MRR

### Mobile (cuando quieras publicar apps)
- ⚪ **Apple Developer** USD 99/año
- ⚪ **Google Play** USD 25 una vez
- ⚪ Toolchain Android (JDK 17, Android Studio, SDK 34+)
- ⚪ Toolchain iOS (Mac, Xcode, CocoaPods)
- ⚪ Firmar primer APK + Play Internal
- ⚪ TestFlight build

---

## 🐛 BUGS CONOCIDOS (a chequear/arreglar)

| # | Bug | Severidad | Cómo testearlo | Status |
|---|---|---|---|---|
| 1 | Vistas `user_reputation_*` y `venue_reputation_*` están UNRESTRICTED (sin RLS) | 🔴 seguridad | Supabase Studio → Tables → buscar las marcadas como UNRESTRICTED | ⚪ pendiente |
| 2 | Cal.com 404 en `/demo` | 🟡 UX | abrir `/demo` y verificar placeholder limpio | 🟢 fixed con placeholder + WhatsApp |
| 3 | Soft 404 en rutas inexistentes | 🟡 SEO | `curl -I /pagina-fake` → debe retornar 404 | ✅ fixed |
| 4 | Hydration mismatch en `/login` | 🟡 React | DevTools console → buscar warnings | ✅ fixed |
| 5 | Botones azules + fonts Times en panel | 🔴 visual | abrir panel.deuntoque.com/landing → verificar Fraunces + wine | ✅ fixed |
| 6 | Nav overflow horizontal mobile | 🟡 UX | abrir en 375px → no debe haber scroll horizontal | ✅ fixed |

---

## ⚠️ INCONSISTENCIAS TÉCNICAS DETECTADAS (no bloquean pero conviene resolver)

| # | Issue | Acción recomendada |
|---|---|---|
| 1 | `.env.example` (3 archivos) committed contenían `service_role` real | ✅ ya sanitizado pero rotar la key |
| 2 | CI workflow filtra `@untoque/*` pero hay 7 worktrees con scopes mezclados | Consolidar branches o limpiar worktrees viejos |
| 3 | `vercel.json` no existía — todo config era dashboard-only | ✅ creado con HSTS + redirects |
| 4 | `.github/CODEOWNERS` no existe | Crear cuando entre 2do dev |
| 5 | Migrations divergentes entre worktrees `funny-taussig` (15) y `zen-meninsky` (9) | Decidir cuál es el árbol oficial |
| 6 | Worktree `zen-meninsky` tiene Resend + apps/* pero NO está mergeado | Decidir consolidación a Turborepo + apps/* |
| 7 | Tests solo en panel (63 tests) — sin tests en app PWA | Agregar Playwright E2E |

---

## 🎯 PRÓXIMAS FEATURES (por prioridad)

### 🔥 Tier 1 — Bloqueantes para piloto comercial
- ⚪ **Pilot signup form real** (hoy es mailto, debe persistir leads en Supabase)
- ⚪ **Email automation onboarding** (4 emails post-signup vía cron Vercel + Resend)
- ⚪ **Dashboard auth tour** (primera vez logueado, tour guiado de 5 pasos)
- ⚪ **Reviews backend wire** (ya hay schema, falta UI cliente para escribir review)

### 🎯 Tier 2 — Conversión y retención
- ⚪ **Cal.com integration real** en `/demo` (cuando crees la cuenta)
- ⚪ **Calculadora ROI** lead magnet en `/recursos/calculadora-roi`
- ⚪ **Plantilla CSV migración TheFork** lead magnet
- ⚪ **Checklist apertura restaurante 2026** PDF
- ⚪ **Blog `/blog`** con primer post "Cómo reducir no-shows en restaurantes argentinos 2026"
- ⚪ **Outreach 500 leads scraping** Google Maps + Apify
- ⚪ **Notion CRM template** con 5 vistas

### 🛠️ Tier 3 — Calidad y robustez
- ⚪ **E2E tests Playwright** con 8 flujos críticos
- ⚪ **Login email+password en app cliente** (mergear desde stupefied-matsumoto worktree)
- ⚪ **Status page BetterUptime** (5 monitors gratis)
- ⚪ **Schema validator** correr sobre cada page tras shipping

### 📱 Tier 4 — Mobile
- ⚪ **Capacitor primer APK Android** (ya configurado en `zen-meninsky-807daa/native/`)
- ⚪ **App Store TestFlight build**
- ⚪ **Play Internal release**

---

## 📁 ARCHIVOS CLAVE PARA CONSULTAR

| Archivo | Para qué |
|---|---|
| `docs/STATUS.md` | Este doc — estado general |
| `docs/seo-strategy.md` | Plan SEO + marketing 12 semanas con keywords + competencia + KPIs |
| `docs/setup-venue-photos.md` | Cómo aplicar migration + bucket fotos |
| `docs/dns-cloudflare.md` | DNS records exactos para Cloudflare |
| `docs/migrations-apply-prod.md` | Cómo aplicar migrations en Supabase Studio |
| `docs/iubenda-setup.md` | Setup Iubenda Free para legal docs |
| `docs/cal-com-setup.md` | Setup Cal.com para demos |
| `docs/notion-crm-template.md` | Template Notion CRM con 5 vistas |
| `docs/pricing-strategy.md` | Análisis pricing único vs tiers |
| `docs/status-page-betteruptime.md` | Setup BetterUptime |
| `docs/dev-quickstart.md` | Quickstart para devs |
| `scripts/setup-prod.sh` | Script bash para configurar todas las env vars en Vercel |
| `scripts/rotate-supabase-keys.md` | Checklist 10 pasos para rotar service_role |
| `scripts/SETUP-VENUE-FOTOS-CLEAN.sql` | SQL completo (migration + bucket) sin caracteres unicode |
| `scripts/outreach-templates/` | 5 templates outreach (WhatsApp/email/LinkedIn/followups) |
| `scripts/email-flow-onboarding.md` | Spec 4 emails post-signup |
| `scripts/outreach-scrape.py` | Scraper Google Maps con argparse |
| `scripts/demo-credentials.md` | 20 cuentas restaurante + 10 clientes ficticios |

---

## 🔑 CREDENCIALES DEMO (testing)

URL panel: **https://panel.deuntoque.com/login**
Password universal: `Demo1234!`

| Restaurante | Email | Cocina |
|---|---|---|
| Trattoria Sentori | `owner-01@demo.reservaya.test` | pastas |
| El Fogón del Sur | `owner-05@demo.reservaya.test` | carnes |
| La Pizzería de Almagro | `owner-09@demo.reservaya.test` | pizza |
| Verde de Mercado | `owner-13@demo.reservaya.test` | vegano |
| Niko Sushi Bar | `owner-17@demo.reservaya.test` | sushi |

(20 cuentas total — completas en `scripts/demo-credentials.md`)

Cliente demo PWA: `test@reservaya.test` / `Test1234!`

---

## 📌 PROYECTOS VERCEL ACTIVOS

| Proyecto | Dominio | Repositorio | Status |
|---|---|---|---|
| `reservaya-panel` | `panel.deuntoque.com` | `ezecabrera/ReservaYA` (rama `main`) | ✅ Live |
| `untoque-app` | `deuntoque.com` | mismo repo, otro rootDirectory | 🟡 (verificar config) |
| `app-lab` | `app-lab-khaki.vercel.app` | preview deploy app cliente | 🟡 |
| `emma-app` | `emma-app-ten.vercel.app` | otro proyecto, no tocar | n/a |

⚠️ **Pendiente**: conectar GitHub→Vercel para auto-deploy en push (hoy se hace manual con `vercel deploy --prod`).

---

## 📋 SESSIONS LOG

### Sesión 2026-04-26 (hoy)
- ✅ SEO audit + 6 commits (sitemap, canonical, soft 404, OG PNG, mobile fonts, semantic HTML)
- ✅ Plan estratégico SEO + marketing en `docs/seo-strategy.md`
- ✅ Fix CSS bundle roto (@import google fonts removido)
- ✅ Feature **fotos del local** end-to-end (4 commits): migration 016 + storage bucket + 5 API routes + UI panel + PWA cliente con lightbox
- ✅ Aplicado SQL en Supabase Studio (verificado por el usuario)
- ✅ Deploy production con `vercel deploy --prod`

### Sesión 2026-04-25
- ✅ Auditoría 9 pantallas (landing/onboarding/demo/pilot/vs-*/login)
- ✅ Fix nav overflow mobile, hydration login, Cal.com 404 placeholder
- ✅ Onboarding rediseño UI/UX Pro Max
- ✅ Investigación profunda + memoria proyecto + dominio + emails Resend confirmados
- ✅ Rename packages `@reservaya/*` → `@untoque/*`
- ✅ 5 agentes paralelos: landing v2 + infra prod + legal + sales + SEO+observability
- ✅ Configurada Vercel project root dir vía API REST

### Sesión 2026-04-24
- ✅ Week 4: Meta WhatsApp real + CI GitHub Actions + Upstash rate limit + Import presets + /ayuda

### Sesiones 2026-04-22 a 04-23
- ✅ Tandas B+C+E+F+G: reviews backend + recuperar password + onboarding + PWA offline + push toggle
- ✅ Rebrand ReservaYa → UnToque

---

## 🎬 PROCESO PARA ACTUALIZAR ESTE DOC

Al final de cada sesión:
1. Editar la sección "📋 SESSIONS LOG" agregando entrada nueva con fecha + bullet points concisos
2. Actualizar avance % por área en la tabla del top
3. Marcar features ⚪→🟡→✅ según progreso
4. Agregar bugs nuevos a la tabla "🐛 BUGS CONOCIDOS"
5. Mover items de Tier 1/2/3 entre secciones según prioridad cambie
6. Commit: `docs(status): update [fecha] — [resumen 1 línea]`

**Comando rápido para abrir este doc:**
```bash
code docs/STATUS.md
```
