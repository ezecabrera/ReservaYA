-- =============================================================
-- UnToque - Setup completo "Fotos del local" (UNA SOLA QUERY)
--
-- Pega TODO esto en Supabase SQL Editor y dale Run.
-- Idempotente: podes correrlo varias veces sin romper.
--
-- Crea:
--   1. Tabla venue_images con RLS, indexes, triggers
--   2. Funcion helper venue_image_can_modify(image_id)
--   3. Bucket de Storage venue-photos (publico, 5MB max)
--   4. Policies de storage.objects para upload/update/delete por staff
-- =============================================================

BEGIN;

-- =============================================================
-- PARTE 1: Tabla venue_images
-- =============================================================

CREATE TABLE IF NOT EXISTS venue_images (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id      UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  kind          TEXT        NOT NULL CHECK (kind IN ('logo', 'cover', 'gallery')),
  url           TEXT        NOT NULL,
  storage_path  TEXT        NOT NULL,
  alt_text      TEXT        NOT NULL DEFAULT '',
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  width         INTEGER,
  height        INTEGER,
  bytes         INTEGER,
  mime_type     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS venue_images_one_logo
  ON venue_images(venue_id) WHERE kind = 'logo';

CREATE UNIQUE INDEX IF NOT EXISTS venue_images_one_cover
  ON venue_images(venue_id) WHERE kind = 'cover';

CREATE INDEX IF NOT EXISTS idx_venue_images_venue_kind_sort
  ON venue_images(venue_id, kind, sort_order);

CREATE INDEX IF NOT EXISTS idx_venue_images_venue_created
  ON venue_images(venue_id, created_at DESC);

-- Trigger: max 12 imagenes en gallery por venue
CREATE OR REPLACE FUNCTION venue_images_enforce_gallery_max()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.kind = 'gallery' THEN
    IF (SELECT COUNT(*) FROM venue_images
        WHERE venue_id = NEW.venue_id AND kind = 'gallery') >= 12 THEN
      RAISE EXCEPTION 'venue_images: limite de 12 imagenes en gallery para venue %', NEW.venue_id
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

-- Trigger: updated_at auto
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

-- Helper: verifica si auth.uid() puede modificar la imagen
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

-- RLS
ALTER TABLE venue_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venue_images_select_public" ON venue_images;
CREATE POLICY "venue_images_select_public"
  ON venue_images FOR SELECT
  USING (TRUE);

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

-- =============================================================
-- PARTE 2: Storage bucket venue-photos
-- =============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-photos',
  'venue-photos',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "venue-photos-public-read" ON storage.objects;
CREATE POLICY "venue-photos-public-read"
ON storage.objects FOR SELECT
USING (bucket_id = 'venue-photos');

DROP POLICY IF EXISTS "venue-photos-staff-upload" ON storage.objects;
CREATE POLICY "venue-photos-staff-upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'venue-photos'
  AND auth.uid() IS NOT NULL
  AND (string_to_array(name, '/'))[1]::uuid IN (
    SELECT venue_id FROM staff_users WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "venue-photos-staff-update" ON storage.objects;
CREATE POLICY "venue-photos-staff-update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'venue-photos'
  AND auth.uid() IS NOT NULL
  AND (string_to_array(name, '/'))[1]::uuid IN (
    SELECT venue_id FROM staff_users WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "venue-photos-staff-delete" ON storage.objects;
CREATE POLICY "venue-photos-staff-delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'venue-photos'
  AND auth.uid() IS NOT NULL
  AND (string_to_array(name, '/'))[1]::uuid IN (
    SELECT venue_id FROM staff_users WHERE id = auth.uid()
  )
);

-- =============================================================
-- DONE. Verificacion en Supabase Dashboard:
--   1. Table Editor -> debe aparecer venue_images
--   2. Storage -> debe aparecer bucket venue-photos (Public)
-- =============================================================
