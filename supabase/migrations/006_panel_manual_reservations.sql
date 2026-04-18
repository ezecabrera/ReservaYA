-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Reservas manuales desde el panel
--
--  Permite que el staff cargue reservas de walk-ins o llamadas telefónicas
--  sin necesidad de que el comensal tenga cuenta en la app.
--
--  Diseño:
--  - user_id pasa a NULLABLE: la reserva puede no tener usuario registrado
--  - guest_name / guest_phone: datos del comensal sin cuenta
--  - source: canal de origen (app | panel | walkin | phone)
--  - notes: comentarios del host (alergias, cumpleaños, mesa preferida, etc.)
--  - CHECK: toda reserva tiene al menos user_id o guest_name
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Hacer user_id nullable ────────────────────────────────────────────────
ALTER TABLE reservations
  ALTER COLUMN user_id DROP NOT NULL;

-- ─── Agregar columnas nuevas ───────────────────────────────────────────────
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS guest_name  TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT,
  ADD COLUMN IF NOT EXISTS source      TEXT NOT NULL DEFAULT 'app'
                             CHECK (source IN ('app', 'panel', 'walkin', 'phone')),
  ADD COLUMN IF NOT EXISTS notes       TEXT;

-- ─── Invariante: toda reserva tiene comensal identificado ──────────────────
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_guest_or_user_present;
ALTER TABLE reservations
  ADD CONSTRAINT reservations_guest_or_user_present
  CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL);

-- ─── Índice para búsquedas por teléfono en CRM futuro ──────────────────────
CREATE INDEX IF NOT EXISTS idx_reservations_guest_phone
  ON reservations(guest_phone)
  WHERE guest_phone IS NOT NULL;
