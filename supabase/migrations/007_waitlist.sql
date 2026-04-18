-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Lista de espera (waitlist)
--
--  Para walk-ins que llegan cuando el salón está lleno, o llamadas donde el
--  slot pedido no está disponible pero el cliente acepta esperar.
--
--  Estados:
--    waiting    — activa, esperando mesa
--    notified   — se le avisó que hay mesa (timer manual del host)
--    seated     — lo sentamos (resolved)
--    left       — se fue sin esperar
--    expired    — no se presentó tras notificarlo
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  guest_name      TEXT        NOT NULL,
  guest_phone     TEXT,
  party_size      INTEGER     NOT NULL CHECK (party_size > 0),

  -- Cuándo lo quiere: si es walk-in NOW, ambos son null y se usa created_at.
  -- Si pidió un slot específico que no estaba disponible, se guarda acá.
  requested_date  DATE,
  requested_time  TIME,

  status          TEXT        NOT NULL DEFAULT 'waiting'
                    CHECK (status IN ('waiting', 'notified', 'seated', 'left', 'expired')),

  notes           TEXT,
  notified_at     TIMESTAMPTZ,
  seated_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consulta más frecuente: activos del venue ordenados por llegada
CREATE INDEX IF NOT EXISTS idx_waitlist_venue_status_created
  ON waitlist_entries(venue_id, status, created_at);

-- Búsqueda por teléfono para el CRM futuro (match con guest de reservas)
CREATE INDEX IF NOT EXISTS idx_waitlist_guest_phone
  ON waitlist_entries(guest_phone)
  WHERE guest_phone IS NOT NULL;

-- Publicar cambios para que el panel se actualice en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE waitlist_entries;
