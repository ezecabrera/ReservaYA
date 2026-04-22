-- ════════════════════════════════════════════════════════════════════════════
--  Un Toque — 009 · Venue content (fotos, eventos, promos)
--  Agrega las tablas necesarias para el tab "Tu local" del panel.
-- ════════════════════════════════════════════════════════════════════════════

-- ── venue_images ─────────────────────────────────────────────────────────────
-- Galería de fotos del restaurante. La primera en sort_order es la portada.
CREATE TABLE IF NOT EXISTS venue_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id      UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL, -- path dentro del bucket 'venue-content'
  caption       TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venue_images_venue ON venue_images(venue_id, sort_order);

ALTER TABLE venue_images ENABLE ROW LEVEL SECURITY;

-- Lectura pública (para que aparezcan en el perfil del venue en la app cliente)
DROP POLICY IF EXISTS "venue_images_select_public" ON venue_images;
CREATE POLICY "venue_images_select_public"
  ON venue_images FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura solo staff del venue
DROP POLICY IF EXISTS "venue_images_modify_staff" ON venue_images;
CREATE POLICY "venue_images_modify_staff"
  ON venue_images FOR ALL
  TO authenticated
  USING (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );


-- ── venue_events ─────────────────────────────────────────────────────────────
-- Shows, DJ sets, noches temáticas. Aparecen destacados en la app cliente.
CREATE TABLE IF NOT EXISTS venue_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  event_date      DATE NOT NULL,
  event_time      TIME NOT NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN ('show', 'dj', 'karaoke', 'teatro', 'gastronomia', 'otro')),
  cover_charge    INTEGER,  -- en pesos, null = gratis
  image_path      TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venue_events_venue_date ON venue_events(venue_id, event_date);
CREATE INDEX IF NOT EXISTS idx_venue_events_published  ON venue_events(is_published, event_date);

ALTER TABLE venue_events ENABLE ROW LEVEL SECURITY;

-- Lectura pública solo de eventos publicados y futuros
DROP POLICY IF EXISTS "venue_events_select_public" ON venue_events;
CREATE POLICY "venue_events_select_public"
  ON venue_events FOR SELECT
  TO anon, authenticated
  USING (is_published = true AND event_date >= CURRENT_DATE);

-- Staff del venue ve todos (incluso no publicados e históricos)
DROP POLICY IF EXISTS "venue_events_select_staff" ON venue_events;
CREATE POLICY "venue_events_select_staff"
  ON venue_events FOR SELECT
  TO authenticated
  USING (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager', 'receptionist')
    )
  );

DROP POLICY IF EXISTS "venue_events_modify_staff" ON venue_events;
CREATE POLICY "venue_events_modify_staff"
  ON venue_events FOR ALL
  TO authenticated
  USING (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );


-- ── venue_promos ─────────────────────────────────────────────────────────────
-- Ofertas del restaurante (happy hour, menú ejecutivo, etc.)
CREATE TABLE IF NOT EXISTS venue_promos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id          UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  discount_pct      INTEGER CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  discount_amount   INTEGER CHECK (discount_amount IS NULL OR discount_amount >= 0), -- pesos
  valid_from        DATE NOT NULL,
  valid_until       DATE NOT NULL,
  days_of_week      INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}', -- 0=Dom, 6=Sáb
  image_path        TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until >= valid_from),
  CHECK (discount_pct IS NULL OR discount_amount IS NULL)  -- uno u otro, no ambos
);

CREATE INDEX IF NOT EXISTS idx_venue_promos_venue_active ON venue_promos(venue_id, is_active, valid_until);

ALTER TABLE venue_promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venue_promos_select_public" ON venue_promos;
CREATE POLICY "venue_promos_select_public"
  ON venue_promos FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND valid_until >= CURRENT_DATE);

DROP POLICY IF EXISTS "venue_promos_select_staff" ON venue_promos;
CREATE POLICY "venue_promos_select_staff"
  ON venue_promos FOR SELECT
  TO authenticated
  USING (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager', 'receptionist')
    )
  );

DROP POLICY IF EXISTS "venue_promos_modify_staff" ON venue_promos;
CREATE POLICY "venue_promos_modify_staff"
  ON venue_promos FOR ALL
  TO authenticated
  USING (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );


-- ── Triggers de updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_venue_events_updated_at ON venue_events;
CREATE TRIGGER tr_venue_events_updated_at
  BEFORE UPDATE ON venue_events
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS tr_venue_promos_updated_at ON venue_promos;
CREATE TRIGGER tr_venue_promos_updated_at
  BEFORE UPDATE ON venue_promos
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════
-- NOTA sobre Storage bucket:
-- Después de aplicar esta migración, crear el bucket 'venue-content' en
-- Supabase Storage con:
--   · Público: ON (las imágenes se sirven via URL pública)
--   · Allowed MIME types: image/jpeg, image/png, image/webp
--   · Max file size: 5 MB
--   · Policy: insert/update/delete solo a staff authenticated del venue
--     (usando un trigger o una convención en el storage_path)
-- ══════════════════════════════════════════════════════════════════════════════
