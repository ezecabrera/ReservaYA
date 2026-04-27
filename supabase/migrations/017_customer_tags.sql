-- ============================================================================
-- 017 - Customer tags (allergies / dietary / preferences / vip flags)
--
-- Tabla por venue+phone que persiste etiquetas operativas del cliente:
--   - allergy     : alergias (mariscos, frutos secos, ...)
--   - dietary     : regimen alimentario (vegano, celiaco, kosher, ...)
--   - restriction : restricciones medicas / movilidad reducida / etc
--   - preference  : preferencias (mesa cerca de la ventana, sin musica, ...)
--   - celebration : ocasion especial (cumpleanios, aniversario, ...)
--   - note        : nota libre del staff
--   - vip         : flag booleano serializado como value='true'
--
-- Cardinalidad esperada: pocas decenas de tags por cliente como maximo.
-- Index principal: (venue_id, customer_phone) para query por reserva.
-- Unique (venue_id, customer_phone, kind, value) evita duplicados exactos.
-- Comentarios en ASCII puro para evitar corrupcion de copy/paste en Studio.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS customer_tags (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  -- Match con reservations.guest_phone. Normalizar en la app (E.164) si es posible.
  customer_phone  TEXT        NOT NULL,
  kind            TEXT        NOT NULL CHECK (
                              kind IN ('allergy','dietary','restriction','preference','celebration','note','vip')
                              ),
  -- Valor canonico de la etiqueta. Para vip, usar 'true' / 'false'.
  value           TEXT        NOT NULL,
  -- Detalle largo opcional (ej. "alergia leve, ok cocinado").
  notes           TEXT,
  created_by      UUID        REFERENCES staff_users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_tags_unique_value UNIQUE (venue_id, customer_phone, kind, value)
);

-- --- Indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customer_tags_venue_phone
  ON customer_tags(venue_id, customer_phone);

CREATE INDEX IF NOT EXISTS idx_customer_tags_venue_kind
  ON customer_tags(venue_id, kind);

-- --- Trigger updated_at ------------------------------------------------------
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

-- --- Helper: get tags ordenadas (para inyectar en endpoint reserva) ---------
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

-- --- RLS --------------------------------------------------------------------
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;

-- SELECT: solo staff del venue
DROP POLICY IF EXISTS "customer_tags_staff_select" ON customer_tags;
CREATE POLICY "customer_tags_staff_select"
  ON customer_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = customer_tags.venue_id
    )
  );

-- INSERT: solo staff del venue
DROP POLICY IF EXISTS "customer_tags_staff_insert" ON customer_tags;
CREATE POLICY "customer_tags_staff_insert"
  ON customer_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = customer_tags.venue_id
    )
  );

-- UPDATE: solo staff del venue
DROP POLICY IF EXISTS "customer_tags_staff_update" ON customer_tags;
CREATE POLICY "customer_tags_staff_update"
  ON customer_tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = customer_tags.venue_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = customer_tags.venue_id
    )
  );

-- DELETE: solo staff del venue
DROP POLICY IF EXISTS "customer_tags_staff_delete" ON customer_tags;
CREATE POLICY "customer_tags_staff_delete"
  ON customer_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = customer_tags.venue_id
    )
  );

COMMIT;

COMMENT ON TABLE customer_tags IS
  'Etiquetas operativas por cliente (alergias, dietas, VIP, preferencias). Migracion 017.';
COMMENT ON COLUMN customer_tags.kind IS
  'Tipo de tag: allergy | dietary | restriction | preference | celebration | note | vip.';
COMMENT ON COLUMN customer_tags.value IS
  'Valor canonico. Para kind=vip usar value=true.';
COMMENT ON COLUMN customer_tags.notes IS
  'Detalle largo opcional escrito por el staff.';
COMMENT ON FUNCTION customer_get_tags(UUID, TEXT) IS
  'Devuelve todas las tags del cliente (venue, phone) ordenadas por kind, value.';
