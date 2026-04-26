-- ════════════════════════════════════════════════════════════════════════════
-- 016 — Venue images (logo / cover / gallery)
--
-- Tabla que persiste metadata de las imágenes del local. Los archivos viven
-- en el bucket de Storage `venue-photos` (creado vía scripts/supabase-setup-storage.sql).
--
-- ▸ Storage bucket esperado: `venue-photos` (público, max 5MB upload,
--   mime types: image/jpeg, image/png, image/webp).
-- ▸ Path pattern: `{venue_id}/{kind}/{uuid}.{ext}` (p. ej.
--   `9b2…/gallery/abc123.webp`). El primer segmento permite policies de RLS
--   en storage.objects basadas en venue_id.
-- ▸ Reglas de cardinalidad:
--      • logo    → max 1 por venue   (unique partial index)
--      • cover   → max 1 por venue   (unique partial index)
--      • gallery → max 12 por venue  (trigger BEFORE INSERT)
-- ▸ `alt_text` es NOT NULL DEFAULT '' por compatibilidad con migraciones
--   existentes; la app valida que sea no-vacío al crear desde el panel.
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS venue_images (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id      UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  kind          TEXT        NOT NULL CHECK (kind IN ('logo', 'cover', 'gallery')),
  /** URL pública resuelta del bucket (idempotente para el frontend) */
  url           TEXT        NOT NULL,
  /** Path interno en bucket: {venue_id}/{kind}/{uuid}.{ext} */
  storage_path  TEXT        NOT NULL,
  /** Alt text obligatorio para a11y + SEO. Default '' permite migrations sin romper. */
  alt_text      TEXT        NOT NULL DEFAULT '',
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  width         INTEGER,
  height        INTEGER,
  bytes         INTEGER,
  mime_type     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Cardinalidad ───────────────────────────────────────────────────────────
-- Unique partial indexes: garantizan a nivel DB que solo exista 1 logo y 1 cover por venue.
CREATE UNIQUE INDEX IF NOT EXISTS venue_images_one_logo
  ON venue_images(venue_id) WHERE kind = 'logo';

CREATE UNIQUE INDEX IF NOT EXISTS venue_images_one_cover
  ON venue_images(venue_id) WHERE kind = 'cover';

-- ─── Indexes de listado ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_venue_images_venue_kind_sort
  ON venue_images(venue_id, kind, sort_order);

CREATE INDEX IF NOT EXISTS idx_venue_images_venue_created
  ON venue_images(venue_id, created_at DESC);

-- ─── Trigger: max 12 imágenes en gallery por venue ──────────────────────────
CREATE OR REPLACE FUNCTION venue_images_enforce_gallery_max()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.kind = 'gallery' THEN
    IF (SELECT COUNT(*) FROM venue_images
        WHERE venue_id = NEW.venue_id AND kind = 'gallery') >= 12 THEN
      RAISE EXCEPTION 'venue_images: límite de 12 imágenes en gallery para venue %', NEW.venue_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_venue_images_gallery_max ON venue_images;
CREATE TRIGGER trg_venue_images_gallery_max
  BEFORE INSERT ON venue_images
  FOR EACH ROW
  EXECUTE FUNCTION venue_images_enforce_gallery_max();

-- ─── Trigger: updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_venue_images_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_venue_images_updated_at ON venue_images;
CREATE TRIGGER trg_venue_images_updated_at
  BEFORE UPDATE ON venue_images
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_images_updated_at();

-- ─── Helper: ¿el usuario autenticado puede modificar esta imagen? ──────────
CREATE OR REPLACE FUNCTION venue_image_can_modify(image_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM venue_images vi
    JOIN staff_users su ON su.venue_id = vi.venue_id
    WHERE vi.id = image_id
      AND su.id = auth.uid()
  );
$$;

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE venue_images ENABLE ROW LEVEL SECURITY;

-- SELECT: público. Las URLs ya son públicas vía storage; cuando exista
-- venues.published se podrá restringir aquí sin romper compatibilidad.
DROP POLICY IF EXISTS "venue_images_select_public" ON venue_images;
CREATE POLICY "venue_images_select_public"
  ON venue_images FOR SELECT
  USING (TRUE);

-- INSERT: solo staff del venue
DROP POLICY IF EXISTS "venue_images_staff_insert" ON venue_images;
CREATE POLICY "venue_images_staff_insert"
  ON venue_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = venue_images.venue_id
    )
  );

-- UPDATE: solo staff del venue
DROP POLICY IF EXISTS "venue_images_staff_update" ON venue_images;
CREATE POLICY "venue_images_staff_update"
  ON venue_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = venue_images.venue_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = venue_images.venue_id
    )
  );

-- DELETE: solo staff del venue
DROP POLICY IF EXISTS "venue_images_staff_delete" ON venue_images;
CREATE POLICY "venue_images_staff_delete"
  ON venue_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
        AND venue_id = venue_images.venue_id
    )
  );

COMMIT;

COMMENT ON TABLE venue_images IS
  'Imágenes del local (logo / cover / gallery). Archivos en bucket venue-photos. Migración 016.';
COMMENT ON COLUMN venue_images.storage_path IS
  'Path interno en bucket: {venue_id}/{kind}/{uuid}.{ext}';
COMMENT ON FUNCTION venue_image_can_modify(UUID) IS
  'Helper: true si auth.uid() es staff del venue dueño de la imagen.';
