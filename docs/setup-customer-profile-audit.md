# Setup: Customer Profile Tags + Reservation Audit Log

Este documento explica como aplicar las migrations `017` (customer_tags) y `018` (reservation_events + trigger) en el entorno productivo de Supabase.

## Que crea

1. Tabla `customer_tags` con CRUD por staff (alergias, dietas, VIP, etc).
2. Tabla `reservation_events` append-only (audit log de cambios en `reservations`).
3. Trigger `trg_reservations_audit_log` que registra automaticamente INSERT / UPDATE / DELETE sobre `reservations`.
4. Helper `customer_get_tags(venue_id, phone)` para obtener todas las tags de un cliente ordenadas.

## Pasos para aplicar en Supabase Studio

1. Ingresa al proyecto en https://supabase.com/dashboard.
2. Abre **SQL Editor**.
3. Crea un nuevo query y pega el contenido completo de:
   ```
   scripts/SETUP-CUSTOMER-PROFILE-AUDIT-CLEAN.sql
   ```
   El script es idempotente (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `CREATE OR REPLACE`), se puede correr varias veces sin romper nada.
4. Click en **Run**.
5. Verifica:
   ```sql
   SELECT count(*) FROM customer_tags;
   SELECT count(*) FROM reservation_events;
   SELECT tgname FROM pg_trigger WHERE tgname = 'trg_reservations_audit_log';
   ```

## Como registrar el actor real desde la app (panel)

El trigger lee tres GUC con `current_setting(..., true)`. Antes de cada UPDATE/DELETE sobre `reservations` desde el panel, ejecutar (en la misma transaccion):

```sql
SET LOCAL "app.actor_type"  = 'staff';
SET LOCAL "app.actor_id"    = '<uuid del staff_user>';
SET LOCAL "app.actor_label" = 'Lucia M.';
```

Si no se setean, el trigger asume `actor_type = 'system'` con `actor_label = 'System'`.

Para cambios desde la app cliente:

```sql
SET LOCAL "app.actor_type"  = 'customer';
SET LOCAL "app.actor_label" = 'Maria Garcia';
```

## RLS

- `customer_tags`: SELECT/INSERT/UPDATE/DELETE solo para staff del venue.
- `reservation_events`: SELECT/INSERT solo para staff del venue. **No hay policies de UPDATE / DELETE** (el log es inmutable bajo RLS; solo el service-role puede saltarse esto).

## Rollback

Si necesitas revertir:

```sql
DROP TRIGGER IF EXISTS trg_reservations_audit_log ON reservations;
DROP FUNCTION IF EXISTS log_reservation_event();
DROP TABLE IF EXISTS reservation_events;

DROP FUNCTION IF EXISTS customer_get_tags(UUID, TEXT);
DROP FUNCTION IF EXISTS update_customer_tags_updated_at();
DROP TABLE IF EXISTS customer_tags;
```

## Tipos TypeScript asociados

- `panel/lib/shared/types/customer-tag.ts`
- `panel/lib/shared/types/reservation-event.ts`
- `app/lib/shared/types/customer-tag.ts`
- `app/lib/shared/types/reservation-event.ts`

Exportados desde el barrel `index.ts` de cada paquete (`@/lib/shared/types`).
