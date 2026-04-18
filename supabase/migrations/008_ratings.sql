-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Rating bidireccional + tracking de cancelaciones unilaterales
--
--  Diferenciador de marca: la única plataforma donde el restaurante también
--  tiene que cumplir. Dos direcciones de rating con derecho a descargo.
--
--  Reglas (V1):
--    - user_to_venue: visible en el perfil público del venue (agregado)
--    - venue_to_user: visible solo internamente (CRM del host)
--    - Máximo 1 rating por dirección por reserva (UNIQUE constraint)
--    - 72hs para disputar tras la creación (campos disputed*, V2 flow)
--    - cancelled_by distingue cancelación del cliente vs unilateral del venue
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Tracking de quién canceló la reserva ──────────────────────────────────
-- 'user'   = el cliente canceló desde la app
-- 'venue'  = el restaurante canceló desde el panel (UNILATERAL — pesa)
-- 'system' = expiración automática (payment timeout, etc.)
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT
    CHECK (cancelled_by IS NULL OR cancelled_by IN ('user', 'venue', 'system'));

-- ─── Tabla de ratings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

  -- Si user_id es null, el rating es sobre un walk-in/llamada identificado
  -- por teléfono. Se guarda el phone snapshot para poder matchear el CRM
  -- aunque el número cambie después.
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  guest_phone     TEXT,

  direction       TEXT        NOT NULL CHECK (direction IN ('user_to_venue', 'venue_to_user')),
  stars           INTEGER     NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment         TEXT,

  -- Flujo de disputa (schema listo, UI en V2)
  disputed            BOOLEAN     NOT NULL DEFAULT FALSE,
  dispute_reason      TEXT,
  dispute_evidence    TEXT,       -- URL a imagen/captura
  dispute_created_at  TIMESTAMPTZ,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_outcome     TEXT        CHECK (dispute_outcome IS NULL
                                    OR dispute_outcome IN ('upheld', 'dismissed', 'hidden')),

  -- Si se oculta tras una disputa ganada, no entra en los agregados públicos
  hidden          BOOLEAN     NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- No se puede dejar dos ratings en la misma dirección para la misma reserva
  UNIQUE (reservation_id, direction)
);

-- ─── Índices ───────────────────────────────────────────────────────────────
-- Lookup principal: agregar ratings de un venue (perfil público)
CREATE INDEX IF NOT EXISTS idx_ratings_venue_direction
  ON ratings(venue_id, direction)
  WHERE hidden = FALSE;

-- Lookup del CRM: todos los ratings recibidos por un comensal
CREATE INDEX IF NOT EXISTS idx_ratings_user_id
  ON ratings(user_id)
  WHERE user_id IS NOT NULL AND hidden = FALSE;

CREATE INDEX IF NOT EXISTS idx_ratings_guest_phone
  ON ratings(guest_phone)
  WHERE guest_phone IS NOT NULL AND hidden = FALSE;

-- Para la consulta "reserva X tiene rating de una dirección?"
CREATE INDEX IF NOT EXISTS idx_ratings_reservation_id
  ON ratings(reservation_id);

-- Para computar % cancelaciones unilaterales de un venue
CREATE INDEX IF NOT EXISTS idx_reservations_venue_cancelled_by
  ON reservations(venue_id, cancelled_by)
  WHERE cancelled_by IS NOT NULL;

-- ─── Realtime ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE ratings;
