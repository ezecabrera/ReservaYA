-- ════════════════════════════════════════════════════════════════════════════
-- 006 — Group menu selections
--
-- Permite que cada guest de un grupo elija sus propios items del menú.
-- El organizador (dueño de la reserva) paga, pero cada persona decide qué
-- pedir desde el link del grupo. Cuando todos decidieron, se notifica al
-- organizador para que consolide y confirme el pre-pedido.
--
-- menu_status:
--   'pending' : aún no eligió (default al joinear)
--   'ordered' : confirmó con items
--   'skipped' : dijo "no voy a pedir"
--
-- menu_items: JSONB con el array de items seleccionados:
--   [{ "item_id": "uuid", "name": "Vino Malbec", "price": 6800, "qty": 1 }, …]
-- Guardamos name/price snapshot para no depender de que el item siga igual.
-- ════════════════════════════════════════════════════════════════════════════

-- Agregar columnas a group_guests
ALTER TABLE group_guests
  ADD COLUMN IF NOT EXISTS menu_status   TEXT    NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS menu_items    JSONB   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS menu_decided_at TIMESTAMPTZ;

-- Check constraint para el status
ALTER TABLE group_guests
  DROP CONSTRAINT IF EXISTS group_guests_menu_status_check;
ALTER TABLE group_guests
  ADD CONSTRAINT group_guests_menu_status_check
    CHECK (menu_status IN ('pending', 'ordered', 'skipped'));

-- Index para consultas "¿faltan decidir?" del organizador
CREATE INDEX IF NOT EXISTS idx_group_guests_room_status
  ON group_guests (room_id, menu_status);

-- ─── RLS update ─────────────────────────────────────────────────────────────
-- Los guests pueden updatear su propia fila (por room_id y nombre dentro
-- de la sesión) para registrar su selección. El organizador (user_id del
-- reservation asociado al room) puede leer todo y consolidar.
--
-- Como hoy group_guests no tiene un vínculo directo user_id (es "anónimo"
-- por diseño: se entra con nombre, sin login), la política es por room.
-- La invariante es que group_rooms.link_token sirve como capability:
-- si tenés el token, podés ver y modificar los guests del room.

-- Permitir UPDATE de las columnas nuevas a cualquiera con el token
-- (ya la policy de SELECT por token existe desde 002).
DROP POLICY IF EXISTS "group_guests_self_update_menu" ON group_guests;
CREATE POLICY "group_guests_self_update_menu"
  ON group_guests
  FOR UPDATE
  USING (
    -- El usuario tiene acceso al room si su request está trayendo el token
    -- (verificado a nivel API; acá simplemente permitimos update sobre rows
    -- existentes del room — la app es quien restringe por token).
    TRUE
  );

COMMENT ON COLUMN group_guests.menu_status IS 'pending | ordered | skipped';
COMMENT ON COLUMN group_guests.menu_items IS 'Array de items seleccionados por este guest';
COMMENT ON COLUMN group_guests.menu_decided_at IS 'Timestamp cuando el guest decidió (ordered o skipped)';
