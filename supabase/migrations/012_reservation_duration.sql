-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Duración estimada de la reserva
--
--  Hasta ahora el Timeline view dibujaba los bloques con una duración fija
--  hardcoded de 90 min. Con este campo el staff puede cargar reservas más
--  cortas (café, copa) o más largas (eventos, cumpleaños) y la UI los refleja.
--
--  Diseño:
--   - duration_minutes: entero NOT NULL con default 90 (cena estándar en AR)
--   - Rango permitido: 15 min a 8hs (480 min). Evita valores absurdos
--     por typos del staff.
--   - Nullable = no (default cubre toda la historia)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 90
    CHECK (duration_minutes BETWEEN 15 AND 480);
