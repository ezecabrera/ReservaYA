-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Orden manual de platos dentro de cada categoría
--
--  Hasta ahora los menu_items se listaban alfabéticamente por name. Con
--  sort_order el staff puede reordenar manualmente vía drag-drop en el
--  panel (POST /api/menu/items/reorder), haciendo match con el orden
--  de las categorías.
--
--  Default 0: los items existentes quedan todos en "0" y el render del
--  panel los ordena por sort_order ASC luego name ASC (tiebreak estable).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Index compuesto para el listado ordenado eficiente
CREATE INDEX IF NOT EXISTS idx_menu_items_category_sort
  ON menu_items(category_id, sort_order, name);
