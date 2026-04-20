-- ════════════════════════════════════════════════════════════════════════════
-- 007 — Reviews
--
-- Tabla de reseñas de usuarios sobre venues. Cerrar el loop del ReviewModal
-- que hasta ahora guardaba en localStorage.
--
-- Regla: sólo se puede dejar review si la reservation asociada pertenece al
-- user y su status es 'checked_in' (efectivamente fue al lugar).
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reviews (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  score           SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Una reseña por reservation
  CONSTRAINT reviews_one_per_reservation UNIQUE (reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_venue   ON reviews (venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews (user_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Lectura pública: cualquiera puede ver reseñas de cualquier venue
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
CREATE POLICY "reviews_select_public"
  ON reviews FOR SELECT
  USING (TRUE);

-- Insertar: sólo el dueño de la reservation, y sólo si la reserva está en
-- 'checked_in'. Un trigger sería más elegante pero con policy es suficiente.
DROP POLICY IF EXISTS "reviews_insert_owner_checked_in" ON reviews;
CREATE POLICY "reviews_insert_owner_checked_in"
  ON reviews FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reviews.reservation_id
        AND r.user_id = auth.uid()
        AND r.status = 'checked_in'
        AND r.venue_id = reviews.venue_id
    )
  );

-- Update: owner puede editar comment/score dentro de 24hs; después queda fijo
DROP POLICY IF EXISTS "reviews_update_owner_24h" ON reviews;
CREATE POLICY "reviews_update_owner_24h"
  ON reviews FOR UPDATE
  USING (
    user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Delete: el usuario puede borrar su review
DROP POLICY IF EXISTS "reviews_delete_owner" ON reviews;
CREATE POLICY "reviews_delete_owner"
  ON reviews FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE reviews IS 'Reseñas post-visita del cliente al venue. 1 por reservation.';
COMMENT ON COLUMN reviews.score IS '1-5 estrellas';
