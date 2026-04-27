-- ============================================================================
-- 018 - Reservation events (audit log inmutable de cambios en reservations)
--
-- Cada cambio en `reservations` (INSERT/UPDATE/DELETE) genera 1 fila aqui.
-- El log es append-only: NO se permite UPDATE ni DELETE via RLS.
--
-- actor_type:
--   - customer : cambio iniciado desde la app cliente
--   - staff    : cambio iniciado desde el panel (staff_users.id en actor_id)
--   - system   : cambio automatico (cron, webhook, default del trigger)
--
-- Para registrar el actor real en cambios via panel, la app debe ejecutar
-- antes del UPDATE:
--   SET LOCAL "app.actor_id" = '<uuid>';
--   SET LOCAL "app.actor_label" = '<nombre>';
--   SET LOCAL "app.actor_type" = 'staff'; -- o 'customer'
--
-- Si esos GUC no estan seteados, el trigger asume actor_type='system'.
--
-- Indexes:
--   - (reservation_id, created_at DESC) para timeline por reserva
--   - (venue_id, created_at DESC)       para audit global del venue
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS reservation_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  actor_type      TEXT        NOT NULL CHECK (actor_type IN ('customer','staff','system')),
  actor_id        UUID,
  -- Texto humano (siempre presente). Ej: "Maria Garcia" / "Lucia M." / "Auto-confirm".
  actor_label     TEXT        NOT NULL,
  event_type      TEXT        NOT NULL CHECK (
                              event_type IN (
                                'created','updated','status_changed','table_changed',
                                'time_changed','party_size_changed','tags_changed',
                                'deleted','check_in','no_show','cancelled'
                              )
                              ),
  before_data     JSONB,
  after_data      JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --- Indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reservation_events_reservation_created
  ON reservation_events(reservation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservation_events_venue_created
  ON reservation_events(venue_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservation_events_event_type
  ON reservation_events(venue_id, event_type, created_at DESC);

-- --- Trigger automatico sobre reservations ----------------------------------
-- Genera diff inteligente: detecta status / table / time / party_size changes
-- y resuelve eventos derivados (check_in / no_show / cancelled) por status target.
CREATE OR REPLACE FUNCTION log_reservation_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor_type   TEXT;
  v_actor_id     UUID;
  v_actor_label  TEXT;
  v_event_type   TEXT;
  v_before       JSONB := NULL;
  v_after        JSONB := NULL;
  v_new_status   TEXT;
BEGIN
  -- Resolver actor desde GUC (set local). Si no esta seteado -> system.
  BEGIN
    v_actor_type := NULLIF(current_setting('app.actor_type', true), '');
  EXCEPTION WHEN OTHERS THEN v_actor_type := NULL;
  END;
  BEGIN
    v_actor_id := NULLIF(current_setting('app.actor_id', true), '')::UUID;
  EXCEPTION WHEN OTHERS THEN v_actor_id := NULL;
  END;
  BEGIN
    v_actor_label := NULLIF(current_setting('app.actor_label', true), '');
  EXCEPTION WHEN OTHERS THEN v_actor_label := NULL;
  END;

  IF v_actor_type IS NULL OR v_actor_type NOT IN ('customer','staff','system') THEN
    v_actor_type := 'system';
  END IF;
  IF v_actor_label IS NULL THEN
    v_actor_label := CASE v_actor_type
                       WHEN 'system' THEN 'System'
                       WHEN 'staff' THEN 'Staff'
                       ELSE 'Customer'
                     END;
  END IF;

  -- Resolver event_type + diffs segun operacion
  IF (TG_OP = 'INSERT') THEN
    v_event_type := 'created';
    v_after := jsonb_build_object(
      'status', NEW.status,
      'date', NEW.date,
      'time_slot', NEW.time_slot,
      'party_size', NEW.party_size,
      'table_id', NEW.table_id,
      'guest_name', NEW.guest_name,
      'guest_phone', NEW.guest_phone
    );

    INSERT INTO reservation_events (
      reservation_id, venue_id, actor_type, actor_id, actor_label,
      event_type, before_data, after_data
    ) VALUES (
      NEW.id, NEW.venue_id, v_actor_type, v_actor_id, v_actor_label,
      v_event_type, v_before, v_after
    );
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    v_event_type := 'deleted';
    v_before := jsonb_build_object(
      'status', OLD.status,
      'date', OLD.date,
      'time_slot', OLD.time_slot,
      'party_size', OLD.party_size,
      'table_id', OLD.table_id,
      'guest_name', OLD.guest_name,
      'guest_phone', OLD.guest_phone
    );

    INSERT INTO reservation_events (
      reservation_id, venue_id, actor_type, actor_id, actor_label,
      event_type, before_data, after_data
    ) VALUES (
      OLD.id, OLD.venue_id, v_actor_type, v_actor_id, v_actor_label,
      v_event_type, v_before, v_after
    );
    RETURN OLD;

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Resolver event_type por prioridad
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_new_status := NEW.status;
      -- Mapear status target a evento canonico cuando aplique
      IF v_new_status IN ('checked_in','seated') THEN
        v_event_type := 'check_in';
      ELSIF v_new_status = 'no_show' THEN
        v_event_type := 'no_show';
      ELSIF v_new_status = 'cancelled' THEN
        v_event_type := 'cancelled';
      ELSE
        v_event_type := 'status_changed';
      END IF;
      v_before := jsonb_build_object('status', OLD.status);
      v_after  := jsonb_build_object('status', NEW.status);

    ELSIF OLD.table_id IS DISTINCT FROM NEW.table_id THEN
      v_event_type := 'table_changed';
      v_before := jsonb_build_object('table_id', OLD.table_id);
      v_after  := jsonb_build_object('table_id', NEW.table_id);

    ELSIF OLD.time_slot IS DISTINCT FROM NEW.time_slot OR OLD.date IS DISTINCT FROM NEW.date THEN
      v_event_type := 'time_changed';
      v_before := jsonb_build_object('date', OLD.date, 'time_slot', OLD.time_slot);
      v_after  := jsonb_build_object('date', NEW.date, 'time_slot', NEW.time_slot);

    ELSIF OLD.party_size IS DISTINCT FROM NEW.party_size THEN
      v_event_type := 'party_size_changed';
      v_before := jsonb_build_object('party_size', OLD.party_size);
      v_after  := jsonb_build_object('party_size', NEW.party_size);

    ELSE
      -- Cambio "menor" (notes, customer_notes, deposit_paid, etc.)
      v_event_type := 'updated';
      v_before := jsonb_build_object(
        'status', OLD.status,
        'table_id', OLD.table_id,
        'date', OLD.date,
        'time_slot', OLD.time_slot,
        'party_size', OLD.party_size
      );
      v_after := jsonb_build_object(
        'status', NEW.status,
        'table_id', NEW.table_id,
        'date', NEW.date,
        'time_slot', NEW.time_slot,
        'party_size', NEW.party_size
      );
    END IF;

    INSERT INTO reservation_events (
      reservation_id, venue_id, actor_type, actor_id, actor_label,
      event_type, before_data, after_data
    ) VALUES (
      NEW.id, NEW.venue_id, v_actor_type, v_actor_id, v_actor_label,
      v_event_type, v_before, v_after
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservations_audit_log ON reservations;
CREATE TRIGGER trg_reservations_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION log_reservation_event();

-- --- RLS --------------------------------------------------------------------
ALTER TABLE reservation_events ENABLE ROW LEVEL SECURITY;

-- SELECT: staff del venue
DROP POLICY IF EXISTS "reservation_events_staff_select" ON reservation_events;
CREATE POLICY "reservation_events_staff_select"
  ON reservation_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = reservation_events.venue_id
    )
  );

-- INSERT: staff del venue (para inserciones manuales tipo "tags_changed").
-- El trigger usa SECURITY INVOKER por default; cuando se invoca via service-role
-- (admin client) la RLS no aplica. Para usuarios autenticados, exigir staff.
DROP POLICY IF EXISTS "reservation_events_staff_insert" ON reservation_events;
CREATE POLICY "reservation_events_staff_insert"
  ON reservation_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = reservation_events.venue_id
    )
  );

-- NO UPDATE / NO DELETE: audit log inmutable. Ausencia de policy = denegado bajo RLS.

COMMIT;

COMMENT ON TABLE reservation_events IS
  'Audit log append-only de cambios en reservations. Migracion 018.';
COMMENT ON COLUMN reservation_events.actor_type IS
  'Origen del cambio: customer | staff | system.';
COMMENT ON COLUMN reservation_events.actor_label IS
  'Nombre humano del actor (Maria Garcia, Lucia M., Auto-confirm).';
COMMENT ON FUNCTION log_reservation_event() IS
  'Trigger AFTER INSERT/UPDATE/DELETE en reservations: serializa cambio + actor desde GUC app.actor_*.';
