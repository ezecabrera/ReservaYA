-- ============================================================================
-- SETUP CUSTOMER PROFILE + AUDIT LOG (idempotente)
--
-- Combina migrations:
--   017_customer_tags.sql
--   018_reservation_events.sql + trigger sobre reservations
--
-- Pegar tal cual en Supabase Studio > SQL Editor y ejecutar.
-- Solo caracteres ASCII en comentarios.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1) customer_tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_tags (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  customer_phone  TEXT        NOT NULL,
  kind            TEXT        NOT NULL CHECK (
                              kind IN ('allergy','dietary','restriction','preference','celebration','note','vip')
                              ),
  value           TEXT        NOT NULL,
  notes           TEXT,
  created_by      UUID        REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_tags_unique_value UNIQUE (venue_id, customer_phone, kind, value)
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_venue_phone
  ON customer_tags(venue_id, customer_phone);

CREATE INDEX IF NOT EXISTS idx_customer_tags_venue_kind
  ON customer_tags(venue_id, kind);

CREATE OR REPLACE FUNCTION update_customer_tags_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_tags_updated_at ON customer_tags;
CREATE TRIGGER trg_customer_tags_updated_at
  BEFORE UPDATE ON customer_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_tags_updated_at();

CREATE OR REPLACE FUNCTION customer_get_tags(p_venue_id UUID, p_phone TEXT)
RETURNS SETOF customer_tags
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM customer_tags
  WHERE venue_id = p_venue_id
    AND customer_phone = p_phone
  ORDER BY kind ASC, value ASC;
$$;

ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_tags_staff_select" ON customer_tags;
CREATE POLICY "customer_tags_staff_select"
  ON customer_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid() AND venue_id = customer_tags.venue_id
    )
  );

DROP POLICY IF EXISTS "customer_tags_staff_insert" ON customer_tags;
CREATE POLICY "customer_tags_staff_insert"
  ON customer_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid() AND venue_id = customer_tags.venue_id
    )
  );

DROP POLICY IF EXISTS "customer_tags_staff_update" ON customer_tags;
CREATE POLICY "customer_tags_staff_update"
  ON customer_tags FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid() AND venue_id = customer_tags.venue_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid() AND venue_id = customer_tags.venue_id)
  );

DROP POLICY IF EXISTS "customer_tags_staff_delete" ON customer_tags;
CREATE POLICY "customer_tags_staff_delete"
  ON customer_tags FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM staff_users WHERE id = auth.uid() AND venue_id = customer_tags.venue_id)
  );

COMMENT ON TABLE customer_tags IS
  'Etiquetas operativas por cliente (alergias, dietas, VIP, preferencias). Migracion 017.';

-- ============================================================================
-- 2) reservation_events
-- ============================================================================
CREATE TABLE IF NOT EXISTS reservation_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  actor_type      TEXT        NOT NULL CHECK (actor_type IN ('customer','staff','system')),
  actor_id        UUID,
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

CREATE INDEX IF NOT EXISTS idx_reservation_events_reservation_created
  ON reservation_events(reservation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservation_events_venue_created
  ON reservation_events(venue_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservation_events_event_type
  ON reservation_events(venue_id, event_type, created_at DESC);

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

  IF (TG_OP = 'INSERT') THEN
    v_event_type := 'created';
    v_after := jsonb_build_object(
      'status', NEW.status, 'date', NEW.date, 'time_slot', NEW.time_slot,
      'party_size', NEW.party_size, 'table_id', NEW.table_id,
      'guest_name', NEW.guest_name, 'guest_phone', NEW.guest_phone
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
      'status', OLD.status, 'date', OLD.date, 'time_slot', OLD.time_slot,
      'party_size', OLD.party_size, 'table_id', OLD.table_id,
      'guest_name', OLD.guest_name, 'guest_phone', OLD.guest_phone
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
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_new_status := NEW.status;
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
      v_event_type := 'updated';
      v_before := jsonb_build_object(
        'status', OLD.status, 'table_id', OLD.table_id, 'date', OLD.date,
        'time_slot', OLD.time_slot, 'party_size', OLD.party_size
      );
      v_after := jsonb_build_object(
        'status', NEW.status, 'table_id', NEW.table_id, 'date', NEW.date,
        'time_slot', NEW.time_slot, 'party_size', NEW.party_size
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

ALTER TABLE reservation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reservation_events_staff_select" ON reservation_events;
CREATE POLICY "reservation_events_staff_select"
  ON reservation_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid() AND venue_id = reservation_events.venue_id
    )
  );

DROP POLICY IF EXISTS "reservation_events_staff_insert" ON reservation_events;
CREATE POLICY "reservation_events_staff_insert"
  ON reservation_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid() AND venue_id = reservation_events.venue_id
    )
  );

-- NO UPDATE / NO DELETE: log inmutable.

COMMENT ON TABLE reservation_events IS
  'Audit log append-only de cambios en reservations. Migracion 018.';

COMMIT;

-- ============================================================================
-- Verificacion (opcional, ejecutar despues):
--   SELECT count(*) FROM customer_tags;
--   SELECT count(*) FROM reservation_events;
--   SELECT tgname FROM pg_trigger WHERE tgname = 'trg_reservations_audit_log';
-- ============================================================================
