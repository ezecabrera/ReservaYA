-- ═══════════════════════════════════════════════════════════════════════════
--  Un Toque — Row Level Security (RLS)
--  Multi-tenancy por venue_id: cada negocio solo ve sus datos.
--  Roles: cliente (auth via phone OTP), staff (auth via email/password),
--         servicio (service_role key — sin restricciones, solo server-side).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
--  Habilitar RLS en todas las tablas
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE venues         ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_locks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_rooms    ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_guests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users    ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
--  Funciones helper (SECURITY DEFINER para evitar recursión en RLS)
-- ─────────────────────────────────────────────────────────────────────────────

-- venue_id del staff autenticado actualmente
CREATE OR REPLACE FUNCTION auth.staff_venue_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT venue_id FROM staff_users WHERE id = auth.uid() LIMIT 1;
$$;

-- ¿El usuario autenticado es staff del venue vid?
CREATE OR REPLACE FUNCTION auth.is_staff_of(vid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_users WHERE id = auth.uid() AND venue_id = vid
  );
$$;

-- ¿El usuario autenticado es owner del venue vid?
CREATE OR REPLACE FUNCTION auth.is_owner_of(vid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_users
    WHERE id = auth.uid() AND venue_id = vid AND role = 'owner'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
--  VENUES
-- ─────────────────────────────────────────────────────────────────────────────
-- Cualquiera puede ver los venues activos (para el Home de la PWA)
CREATE POLICY "venues_public_read" ON venues
  FOR SELECT USING (is_active = true);

-- Staff solo puede ver su propio venue
CREATE POLICY "venues_staff_read" ON venues
  FOR SELECT USING (auth.is_staff_of(id));

-- Solo owners pueden actualizar su venue
CREATE POLICY "venues_owner_update" ON venues
  FOR UPDATE USING (auth.is_owner_of(id));

-- ─────────────────────────────────────────────────────────────────────────────
--  ZONES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "zones_public_read" ON zones
  FOR SELECT USING (true);

CREATE POLICY "zones_staff_manage" ON zones
  USING (auth.is_staff_of(venue_id));

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLES
-- ─────────────────────────────────────────────────────────────────────────────
-- Cualquiera puede ver las mesas activas (para selección de mesa en la PWA)
CREATE POLICY "tables_public_read" ON tables
  FOR SELECT USING (is_active = true);

-- Staff puede gestionar las mesas de su venue
CREATE POLICY "tables_staff_manage" ON tables
  USING (auth.is_staff_of(venue_id));

-- ─────────────────────────────────────────────────────────────────────────────
--  USERS (clientes)
-- ─────────────────────────────────────────────────────────────────────────────
-- El usuario puede leer y modificar su propio perfil
CREATE POLICY "users_self_read" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_self_update" ON users
  FOR UPDATE USING (id = auth.uid());

-- El trigger de auth lo inserta — INSERT está manejado por service_role
-- Los staff pueden ver los datos del cliente para una reserva en su venue
CREATE POLICY "users_staff_read" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.user_id = users.id
        AND auth.is_staff_of(r.venue_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
--  RESERVATIONS
-- ─────────────────────────────────────────────────────────────────────────────
-- El cliente puede ver sus propias reservas
CREATE POLICY "reservations_user_read" ON reservations
  FOR SELECT USING (user_id = auth.uid());

-- El cliente puede crear reservas (el user_id debe ser su propio id)
CREATE POLICY "reservations_user_insert" ON reservations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- El cliente puede cancelar su propia reserva (solo si está pending o confirmed)
CREATE POLICY "reservations_user_cancel" ON reservations
  FOR UPDATE USING (
    user_id = auth.uid()
    AND status IN ('pending_payment', 'confirmed')
  );

-- Staff puede ver y gestionar todas las reservas de su venue
CREATE POLICY "reservations_staff_manage" ON reservations
  USING (auth.is_staff_of(venue_id));

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE_LOCKS
-- ─────────────────────────────────────────────────────────────────────────────
-- Cualquiera puede leer los locks para verificar disponibilidad
CREATE POLICY "table_locks_public_read" ON table_locks
  FOR SELECT USING (true);

-- Usuarios autenticados pueden crear locks (se valida en la API route)
CREATE POLICY "table_locks_auth_insert" ON table_locks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Staff puede limpiar locks de su venue
CREATE POLICY "table_locks_staff_manage" ON table_locks
  USING (
    EXISTS (
      SELECT 1 FROM tables t
      WHERE t.id = table_locks.table_id
        AND auth.is_staff_of(t.venue_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
--  MENU_CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "menu_categories_public_read" ON menu_categories
  FOR SELECT USING (true);

CREATE POLICY "menu_categories_staff_manage" ON menu_categories
  USING (auth.is_staff_of(venue_id));

-- ─────────────────────────────────────────────────────────────────────────────
--  MENU_ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "menu_items_staff_manage" ON menu_items
  USING (auth.is_staff_of(venue_id));

-- ─────────────────────────────────────────────────────────────────────────────
--  ORDERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "orders_user_read" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = orders.reservation_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "orders_user_insert" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "orders_staff_manage" ON orders
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = orders.reservation_id
        AND auth.is_staff_of(r.venue_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
--  ORDER_ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "order_items_user_read" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN reservations r ON r.id = o.reservation_id
      WHERE o.id = order_items.order_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_user_insert" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN reservations r ON r.id = o.reservation_id
      WHERE o.id = order_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_staff_manage" ON order_items
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN reservations r ON r.id = o.reservation_id
      WHERE o.id = order_items.order_id
        AND auth.is_staff_of(r.venue_id)
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
--  PAYMENTS
-- ─────────────────────────────────────────────────────────────────────────────
-- Cliente puede ver sus pagos
CREATE POLICY "payments_user_read" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = payments.reservation_id AND r.user_id = auth.uid()
    )
  );

-- Staff puede ver pagos de su venue
CREATE POLICY "payments_staff_read" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = payments.reservation_id
        AND auth.is_staff_of(r.venue_id)
    )
  );

-- INSERT y UPDATE de payments solo via service_role (webhook server-side)

-- ─────────────────────────────────────────────────────────────────────────────
--  GROUP_ROOMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "group_rooms_public_read" ON group_rooms
  FOR SELECT USING (true);

CREATE POLICY "group_rooms_user_manage" ON group_rooms
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = group_rooms.reservation_id AND r.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
--  GROUP_GUESTS — Sesión anónima, cualquiera puede leer/crear
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "group_guests_public_read" ON group_guests
  FOR SELECT USING (true);

CREATE POLICY "group_guests_public_insert" ON group_guests
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
--  STAFF_USERS
-- ─────────────────────────────────────────────────────────────────────────────
-- Cada staff puede ver su propio perfil
CREATE POLICY "staff_users_self_read" ON staff_users
  FOR SELECT USING (id = auth.uid());

-- Owners pueden ver y gestionar todo el staff de su venue
CREATE POLICY "staff_users_owner_manage" ON staff_users
  USING (
    id = auth.uid()
    OR auth.is_owner_of(venue_id)
  );
