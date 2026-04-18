-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Audit trail por reserva
--
--  Cada transición de estado (check-in, cancelación, edición, no-show, etc.)
--  genera una fila en reservation_events. Esto permite:
--   - Resolver disputas ("yo no fui quien canceló")
--   - Métricas de operación (tiempo promedio para hacer check-in)
--   - Reproducir el histórico completo de una reserva
--
--  Los eventos los insertamos desde código (endpoints) usando service role —
--  no desde DB triggers, para poder incluir metadata de contexto (IP, user-agent)
--  cuando haga falta.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reservation_events (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

  event_type      TEXT        NOT NULL CHECK (event_type IN (
                    'created',         -- la reserva se creó
                    'confirmed',       -- pago aprobado o creación manual
                    'checked_in',      -- cliente llegó
                    'cancelled',       -- alguien la canceló (ver actor_role)
                    'no_show',         -- 15 min tarde sin llegar
                    'edited',          -- table/date/time/party/notes cambiaron
                    'reverted'         -- volvió a 'confirmed' desde no_show/cancelled
                  )),

  -- Quién ejecutó la acción
  actor_user_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role      TEXT        CHECK (actor_role IS NULL OR actor_role IN (
                    'user',            -- el cliente desde la app
                    'staff',           -- el staff desde el panel
                    'system'           -- job automático (expiration, no-show detector)
                  )),

  -- Snapshot de los cambios para eventos 'edited'
  -- Ejemplo: { from: { time_slot: "20:00" }, to: { time_slot: "20:30" } }
  diff_json       JSONB,

  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- La consulta principal: "timeline de una reserva" ordenado por tiempo
CREATE INDEX IF NOT EXISTS idx_reservation_events_res_time
  ON reservation_events(reservation_id, created_at DESC);

-- Para auditoría por venue / operador
CREATE INDEX IF NOT EXISTS idx_reservation_events_venue
  ON reservation_events(venue_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservation_events_actor
  ON reservation_events(actor_user_id)
  WHERE actor_user_id IS NOT NULL;

-- RLS: staff ve los del venue; el user ve los de sus propias reservas.
ALTER TABLE reservation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rev_staff_select ON reservation_events;
CREATE POLICY rev_staff_select ON reservation_events
  FOR SELECT TO authenticated
  USING (auth.is_staff_of(venue_id));

DROP POLICY IF EXISTS rev_user_select ON reservation_events;
CREATE POLICY rev_user_select ON reservation_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = reservation_events.reservation_id
        AND reservations.user_id = auth.uid()
    )
  );

-- No habilitamos INSERT/UPDATE/DELETE desde cliente: sólo service role escribe.
