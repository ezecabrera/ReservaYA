# Aplicar migrations en Supabase prod

> Proyecto: `nmrvoonkxekogxrhlays.supabase.co`
> Total migrations: **15** (`001`→`015`).
> Estado actual: `001`-`007` aplicadas; **`008`-`015` pendientes**.

## Pre-checks

```sql
-- 1) Versión de Postgres (debe ser 15+)
SELECT version();

-- 2) Snapshot del estado actual
SELECT count(*) AS venues       FROM venues;
SELECT count(*) AS reservations FROM reservations;
SELECT count(*) AS users        FROM auth.users;
```

Anotá los counts — los vamos a comparar al final.

## Backup pre-migración (obligatorio)

```bash
# Reemplazar por la connection string del proyecto (Project Settings → Database).
pg_dump \
  "postgresql://postgres.nmrvoonkxekogxrhlays:<PASSWORD>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" \
  --no-owner --no-privileges --clean --if-exists \
  -f "backup-pre-008-$(date +%Y%m%d-%H%M).sql"
```

Guardar el dump en un lugar seguro (Drive privado, no en el repo).

## Camino A — Si NUNCA aplicaron `008`+ (recomendado)

Hay un bundle idempotente que cubre `008`-`014`:

1. Abrir Supabase Studio → SQL Editor → New query.
2. Pegar el contenido completo de `supabase/APPLY_PILOT.sql`.
3. Run. Esperá el "Success".
4. Aplicar `015_review_responses.sql` (no está en el bundle):
   - SQL Editor → New query → pegar contenido de
     `supabase/migrations/015_review_responses.sql` → Run.

## Camino B — Aplicar una por una (si A no funciona o querés control fino)

Orden y descripción 1-línea de cada migration:

| # | Archivo                              | Qué hace |
|---|--------------------------------------|----------|
| 008 | `008_zones_enhance.sql`            | Agrega columnas (capacidad, color, prioridad) y constraints a `zones`. |
| 009 | `009_reservations_operational.sql` | Estados operacionales (`seated`, `no_show`, `walk_in`), tracking de tiempos. |
| 010 | `010_waitlist.sql`                 | Tabla `waitlist` + RLS para gestión de lista de espera. |
| 011 | `011_migration_toolkit.sql`        | Tablas auxiliares para importar desde TheFork/Maxirest/Fudo. |
| 012 | `012_penalties_deposits.sql`       | `penalties` + `deposits` para no-shows con depósito. |
| 013 | `013_campaigns.sql`                | Email/Push campaigns (segmentos RFM, A/B). |
| 014 | `014_push_subscriptions.sql`       | `push_subscriptions` (Web Push / VAPID). |
| 015 | `015_review_responses.sql`         | Respuestas del comercio a reviews + RLS. |

Para cada una en Studio → SQL Editor → pegar archivo → Run. **Frenar en el primer
error**, leer mensaje, corregir antes de seguir.

## Post-checks

```sql
-- 1) Counts no rompieron nada (mismas filas + las nuevas tablas vacías)
SELECT count(*) FROM venues;
SELECT count(*) FROM reservations;

-- 2) Tablas nuevas existen y RLS activo
SELECT
  tablename,
  rowsecurity AS rls_on
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('waitlist','penalties','deposits','campaigns',
                    'push_subscriptions','review_responses');
-- Esperado: 6 filas, todas con rls_on = true.

-- 3) Smoke de funciones nuevas (si existen)
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname LIKE '%campaign%' OR proname LIKE '%push%';
```

## Smoke test desde la app

1. `panel.deuntoque.com/dashboard` → debe cargar reservas existentes sin 500.
2. `panel.deuntoque.com/dashboard/analytics` → debe mostrar overview RFM
   (consume `008`+`013`).
3. Crear una reserva de prueba en `app.deuntoque.com/{venueId}` →
   debe aparecer en panel con estado `pending`/`confirmed`.

## Rollback

Restaurar el dump del paso "Backup":

```bash
psql "<CONNECTION_STRING>" < backup-pre-008-YYYYMMDD-HHMM.sql
```

⚠ Esto borra todo lo escrito desde el backup. Hacelo solo si la migración deja
la base inconsistente.
