-- ════════════════════════════════════════════════════════════════════════════
-- Supabase Storage setup — bucket `venue-photos`
--
-- ⚠️ Correr UNA SOLA VEZ en Supabase Studio → SQL Editor.
-- No es una migration porque toca el esquema `storage` (gestionado por Supabase),
-- y las políticas sobre `storage.objects` no se versionan junto con el resto.
--
-- Idempotente: usa ON CONFLICT y DROP POLICY IF EXISTS, así se puede re-correr sin romper.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Bucket público con límite de 5MB y mime types restringidos ────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-photos',
  'venue-photos',
  TRUE,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── RLS policies sobre storage.objects ────────────────────────────────────

-- Lectura pública (idem que `public = true` del bucket, redundante por seguridad)
DROP POLICY IF EXISTS "venue-photos-public-read" ON storage.objects;
CREATE POLICY "venue-photos-public-read"
ON storage.objects FOR SELECT
USING (bucket_id = 'venue-photos');

-- Upload: solo staff del venue cuyo id figura como primer segmento del path
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

-- Update (overwrite): mismo criterio que upload
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

-- Delete: staff del venue
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
