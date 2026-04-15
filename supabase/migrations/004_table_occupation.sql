-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Estado de ocupación manual de mesas
--  El staff del panel marca presenciales con is_occupied = true.
--  El check-in de reservas digitales también lo pone en true.
--  Liberar mesa lo pone en false.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE tables ADD COLUMN IF NOT EXISTS is_occupied BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN tables.is_occupied IS
  'True cuando el staff marcó la mesa como ocupada (presencial o check-in). '
  'El estado de "Reservada" se computa desde reservations, no de este campo.';

-- Política RLS: el staff puede actualizar is_occupied de su venue
CREATE POLICY "tables_staff_update_occupation" ON tables
  FOR UPDATE USING (auth.is_staff_of(venue_id));
