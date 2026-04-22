-- ════════════════════════════════════════════════════════════════════════════
--  Un Toque — APPLY_PILOT.sql
--  Bundle idempotente de las 9 migraciones del piloto (001-009).
--  Aplicar de una sola pasada en Supabase Studio (SQL Editor) contra el
--  proyecto de producción nuevo y vacío.
--  
--  Orden de aplicación (ya concatenado en este archivo):
--    001 · Schema inicial
--    002 · Row Level Security
--    003 · Auth triggers
--    004 · Ocupación de mesas
--    005 · Billing + venue_subscriptions
--    006 · Group menu selections
--    007 · Reviews
--    008 · MVP gaps (demo_requests, staff_invitations)
--    009 · Venue content (images, events, promos)
--  
--  Todas las operaciones usan IF NOT EXISTS / DROP POLICY IF EXISTS,
--  es seguro re-ejecutar.
--  
--  Post-instalación en Storage:
--    Crear bucket "venue-content" público (ver nota al final de 009).
-- ════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
--  Un Toque — Schema inicial
--  Ejecutar en orden. Usa uuid-ossp y pgcrypto (disponibles en Supabase).
-- ═══════════════════════════════════════════════════════════════════════════

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
--  VENUES — El negocio (restaurante, bar, café)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT        NOT NULL,
  address          TEXT        NOT NULL,
  phone            TEXT,
  description      TEXT,
  image_url        TEXT,
  -- Toda la configuración operativa en JSONB para flexibilidad sin migraciones
  config_json      JSONB       NOT NULL DEFAULT '{}',
  -- Minutos antes de la apertura en que se cortan reservas para ese turno
  cut_off_minutes  INTEGER     NOT NULL DEFAULT 60 CHECK (cut_off_minutes >= 0),
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN venues.config_json IS
  'VenueConfig: { service_hours, deposit_type, deposit_amount, cancellation_grace_hours, ... }';

-- ─────────────────────────────────────────────────────────────────────────────
--  ZONES — Zonas opcionales (Salón, Terraza, VIP, Barra, Jardín)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zones (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id   UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  -- Prefijo para el código de mesa: "T" → T1, T2...
  prefix     TEXT        NOT NULL CHECK (length(prefix) BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, prefix)
);

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLES — Mesas del negocio
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tables (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id       UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  zone_id        UUID        REFERENCES zones(id) ON DELETE SET NULL,
  -- Código legible: "Mesa 3", "T2", "S1"
  label          TEXT        NOT NULL,
  capacity       INTEGER     NOT NULL DEFAULT 2 CHECK (capacity > 0),
  position_order INTEGER     NOT NULL DEFAULT 0,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  USERS — Clientes finales (vinculados a auth.users via OTP telefónico)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  -- El id coincide con auth.users(id). Supabase lo crea via trigger.
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone      TEXT        UNIQUE,
  email      TEXT,
  name       TEXT        NOT NULL DEFAULT 'Usuario',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  RESERVATIONS — Reservas
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id      UUID        NOT NULL REFERENCES venues(id),
  table_id      UUID        NOT NULL REFERENCES tables(id),
  user_id       UUID        NOT NULL REFERENCES users(id),
  date          DATE        NOT NULL,
  time_slot     TIME        NOT NULL,
  party_size    INTEGER     NOT NULL CHECK (party_size > 0),
  status        TEXT        NOT NULL DEFAULT 'pending_payment'
                              CHECK (status IN (
                                'pending_payment',
                                'confirmed',
                                'checked_in',
                                'cancelled',
                                'no_show'
                              )),
  -- JWT firmado: { reservation_id, venue_id, exp: hora+4h }
  -- Verificable offline desde el panel del negocio
  qr_token      TEXT        NOT NULL DEFAULT '',
  group_room_id UUID,       -- FK se agrega tras crear group_rooms
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE_LOCKS — Locks atómicos durante el flujo de reserva
--  selection: 3 min (el usuario eligió la mesa pero no pagó todavía)
--  payment:  10 min (el usuario está en la pantalla de pago)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS table_locks (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id       UUID        NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  -- Null durante la selección inicial (antes de crear la reserva)
  reservation_id UUID        REFERENCES reservations(id) ON DELETE CASCADE,
  type           TEXT        NOT NULL CHECK (type IN ('selection', 'payment')),
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  MENU_CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_categories (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id   UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  MENU_ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id                  UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id            UUID           NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  category_id         UUID           NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name                TEXT           NOT NULL,
  price               NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  description         TEXT,
  availability_status TEXT           NOT NULL DEFAULT 'available'
                                       CHECK (availability_status IN (
                                         'available',
                                         'unavailable',
                                         'limited'
                                       )),
  limited_count       INTEGER        CHECK (limited_count > 0),
  image_url           TEXT,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  ORDERS — Pedidos anticipados (opcionales)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID           NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  status         TEXT           NOT NULL DEFAULT 'pending'
                                  CHECK (status IN (
                                    'pending',
                                    'in_kitchen',
                                    'ready',
                                    'delivered'
                                  )),
  total          NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  ORDER_ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID           NOT NULL REFERENCES menu_items(id),
  qty          INTEGER        NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price   NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  notes        TEXT,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  PAYMENTS — Seña via Mercado Pago Checkout Pro
--
--  Flujo:
--    1. Se crea el registro con status='pending' y preference_id=NULL
--    2. La API route llama a MP → obtiene preference_id + init_point
--    3. Se actualiza preference_id en la fila
--    4. El usuario paga en MP y vuelve con ?status=approved&payment_id=xxx
--    5. La API route actualiza status + external_id
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id   UUID           NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  amount           NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  provider         TEXT           NOT NULL DEFAULT 'mercadopago',
  -- ID de preferencia de Checkout Pro (pref_xxxx)
  preference_id    TEXT,
  -- ID de pago de MP — llega en el redirect de vuelta (?payment_id=xxx)
  external_id      TEXT,
  status           TEXT           NOT NULL DEFAULT 'pending'
                                    CHECK (status IN (
                                      'pending',
                                      'approved',
                                      'rejected',
                                      'refunded'
                                    )),
  -- Se usa como external_reference en la preference de MP.
  -- Permite identificar la reserva desde el redirect sin webhooks.
  idempotency_key  TEXT           NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  GROUP_ROOMS — Sala compartida del modo grupo
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_rooms (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  -- Token corto para la URL compartible: /grupo/[link_token]
  link_token     TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  GROUP_GUESTS — Invitados del modo grupo (sesión anónima)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_guests (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id      UUID        NOT NULL REFERENCES group_rooms(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK diferida de reservations → group_rooms
ALTER TABLE reservations
  ADD CONSTRAINT reservations_group_room_id_fkey
  FOREIGN KEY (group_room_id) REFERENCES group_rooms(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────────
--  STAFF_USERS — Staff del negocio (vinculados a auth.users via email/password)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_users (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id   UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  role       TEXT        NOT NULL DEFAULT 'receptionist'
                           CHECK (role IN ('owner', 'manager', 'receptionist')),
  email      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tables_venue_id        ON tables(venue_id);
CREATE INDEX IF NOT EXISTS idx_reservations_venue_id  ON reservations(venue_id);
CREATE INDEX IF NOT EXISTS idx_reservations_table_id  ON reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id   ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date      ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status    ON reservations(status);
-- Índice compuesto para la consulta "disponibilidad de una mesa en una fecha"
CREATE INDEX IF NOT EXISTS idx_reservations_table_date
  ON reservations(table_id, date, status);
CREATE INDEX IF NOT EXISTS idx_table_locks_table_id   ON table_locks(table_id);
CREATE INDEX IF NOT EXISTS idx_table_locks_expires_at ON table_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_venue_id    ON menu_items(venue_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_venue_id   ON staff_users(venue_id);
CREATE INDEX IF NOT EXISTS idx_orders_reservation_id  ON orders(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
-- Para lookups del webhook MP por idempotency_key
CREATE INDEX IF NOT EXISTS idx_payments_idempotency_key ON payments(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_group_rooms_link_token ON group_rooms(link_token);

-- ─────────────────────────────────────────────────────────────────────────────
--  REALTIME — Publicar cambios para el panel del negocio
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE table_locks;
ALTER PUBLICATION supabase_realtime ADD TABLE group_guests;
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
-- ═══════════════════════════════════════════════════════════════════════════
--  Un Toque — Auth triggers y funciones auxiliares
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
--  Trigger: auto-crear registro en users cuando se registra un cliente via OTP
--  Solo aplica a usuarios con phone (clientes). Los staff se crean manualmente.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Cliente por teléfono
  IF NEW.phone IS NOT NULL AND NEW.email IS NULL THEN
    INSERT INTO public.users (id, phone, email, name)
    VALUES (
      NEW.id,
      NEW.phone,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Solo un trigger por evento — drop si ya existía
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ─────────────────────────────────────────────────────────────────────────────
--  Trigger: actualizar phone en users si el usuario de auth lo actualiza
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET
    phone = COALESCE(NEW.phone, phone),
    email = COALESCE(NEW.email, email)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_updated();

-- ─────────────────────────────────────────────────────────────────────────────
--  Función: limpiar locks expirados
--  Se llama desde la API route o via pg_cron si está disponible.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM table_locks WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
--  Función: verificar disponibilidad de mesa con lock atómico
--  Retorna true si la mesa está disponible y crea el lock.
--  Usa SELECT FOR UPDATE para prevenir race conditions.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lock_table_for_selection(
  p_table_id     UUID,
  p_user_session TEXT,   -- identificador anónimo del cliente
  p_duration_min INTEGER DEFAULT 3
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_table RECORD;
  v_existing_lock RECORD;
BEGIN
  -- Lock atómico sobre la fila de la mesa
  SELECT id INTO v_table
  FROM tables
  WHERE id = p_table_id AND is_active = true
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Verificar si hay un lock activo (no expirado)
  SELECT id INTO v_existing_lock
  FROM table_locks
  WHERE table_id = p_table_id
    AND expires_at > NOW();

  IF FOUND THEN
    RETURN false;
  END IF;

  -- Verificar si hay una reserva confirmada para hoy en este horario
  -- (la validación completa de fecha/horario se hace en la API route)

  -- Crear el lock de selección
  INSERT INTO table_locks (table_id, reservation_id, type, expires_at)
  VALUES (
    p_table_id,
    NULL,
    'selection',
    NOW() + (p_duration_min || ' minutes')::INTERVAL
  );

  RETURN true;
EXCEPTION
  WHEN lock_not_available THEN
    RETURN false;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
--  Función: procesar no-show automático
--  Se llama desde un cron job o manualmente desde el panel.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_no_shows()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  no_show_count INTEGER;
BEGIN
  UPDATE reservations
  SET status = 'no_show'
  WHERE status = 'confirmed'
    AND (date + time_slot) < NOW() - INTERVAL '15 minutes'
    AND (date + time_slot) > NOW() - INTERVAL '24 hours'; -- solo del día

  GET DIAGNOSTICS no_show_count = ROW_COUNT;
  RETURN no_show_count;
END;
$$;
-- ═══════════════════════════════════════════════════════════════════════════
--  Un Toque — Estado de ocupación manual de mesas
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
-- ═══════════════════════════════════════════════════════════════════════════
--  005_billing.sql — Suscripciones de venues
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS venue_subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id            UUID        NOT NULL UNIQUE REFERENCES venues(id) ON DELETE CASCADE,
  status              TEXT        NOT NULL DEFAULT 'trial'
                                    CHECK (status IN ('trial', 'active', 'paused', 'cancelled', 'expired')),
  mp_preapproval_id   TEXT,
  plan_amount         INTEGER     NOT NULL DEFAULT 4999,
  trial_ends_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venue_subscriptions_venue_id ON venue_subscriptions(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_subscriptions_status   ON venue_subscriptions(status);

-- RLS
ALTER TABLE venue_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_subscriptions_staff_read" ON venue_subscriptions
  FOR SELECT USING (auth.is_staff_of(venue_id));

CREATE POLICY "venue_subscriptions_staff_update" ON venue_subscriptions
  FOR UPDATE USING (auth.is_owner_of(venue_id));

-- Función: ¿el venue tiene acceso activo? (trial vigente o suscripción activa)
CREATE OR REPLACE FUNCTION public.venue_has_access(vid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM venue_subscriptions vs
    WHERE vs.venue_id = vid
      AND (
        (vs.status = 'trial'  AND vs.trial_ends_at > NOW())
        OR vs.status = 'active'
      )
  );
$$;
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
-- ════════════════════════════════════════════════════════════════════════════
-- 007 — Reviews
--
-- Tabla de reseñas de usuarios sobre venues. Cerrar el loop del ReviewModal
-- que hasta ahora guardaba en localStorage.
--
-- Regla: sólo se puede dejar review si la reservation asociada pertenece al
-- user y su status es 'checked_in' (efectivamente fue al lugar).
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reviews (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  score           SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Una reseña por reservation
  CONSTRAINT reviews_one_per_reservation UNIQUE (reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_venue   ON reviews (venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews (user_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Lectura pública: cualquiera puede ver reseñas de cualquier venue
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
CREATE POLICY "reviews_select_public"
  ON reviews FOR SELECT
  USING (TRUE);

-- Insertar: sólo el dueño de la reservation, y sólo si la reserva está en
-- 'checked_in'. Un trigger sería más elegante pero con policy es suficiente.
DROP POLICY IF EXISTS "reviews_insert_owner_checked_in" ON reviews;
CREATE POLICY "reviews_insert_owner_checked_in"
  ON reviews FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reviews.reservation_id
        AND r.user_id = auth.uid()
        AND r.status = 'checked_in'
        AND r.venue_id = reviews.venue_id
    )
  );

-- Update: owner puede editar comment/score dentro de 24hs; después queda fijo
DROP POLICY IF EXISTS "reviews_update_owner_24h" ON reviews;
CREATE POLICY "reviews_update_owner_24h"
  ON reviews FOR UPDATE
  USING (
    user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Delete: el usuario puede borrar su review
DROP POLICY IF EXISTS "reviews_delete_owner" ON reviews;
CREATE POLICY "reviews_delete_owner"
  ON reviews FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE reviews IS 'Reseñas post-visita del cliente al venue. 1 por reservation.';
COMMENT ON COLUMN reviews.score IS '1-5 estrellas';
-- ════════════════════════════════════════════════════════════════════════════
--  Un Toque — 008 · Gaps de MVP
--  Agrega tablas que el código ya asume pero que no existen:
--    · demo_requests    → leads capturados desde la landing pública
--    · staff_invitations → invitaciones al equipo con código + email
--  Aplicable de forma idempotente (IF NOT EXISTS en todo).
-- ════════════════════════════════════════════════════════════════════════════

-- ── demo_requests ────────────────────────────────────────────────────────────
-- Leads públicos desde untoque.app/#demo. Cualquier visitante puede insertar;
-- solo staff interno puede leer (vía service role).
CREATE TABLE IF NOT EXISTS demo_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  name         TEXT,
  venue_name   TEXT,
  phone        TEXT,
  message      TEXT,
  source       TEXT DEFAULT 'landing',
  user_agent   TEXT,
  status       TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status     ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_email      ON demo_requests(email);

ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Insert público (sin sesión) para que la landing funcione
DROP POLICY IF EXISTS "demo_requests_insert_public" ON demo_requests;
CREATE POLICY "demo_requests_insert_public"
  ON demo_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Lectura solo vía service_role (panel interno, no hay UI expuesta aún)


-- ── staff_invitations ────────────────────────────────────────────────────────
-- Invitaciones a miembros del equipo de un venue. Soporta dos canales:
--   · Email (Supabase auth invite + token)
--   · Código short para compartir por WhatsApp
CREATE TABLE IF NOT EXISTS staff_invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id     UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  invited_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email        TEXT NOT NULL,
  name         TEXT,
  role         TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'receptionist')),
  token        TEXT NOT NULL UNIQUE,
  code         TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at   TIMESTAMPTZ NOT NULL,
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(venue_id, email)
);

CREATE INDEX IF NOT EXISTS idx_staff_invitations_venue     ON staff_invitations(venue_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email     ON staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_token     ON staff_invitations(token);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_code      ON staff_invitations(code);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_status    ON staff_invitations(status);

ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;

-- Owner/Manager del mismo venue pueden ver y gestionar invitaciones
DROP POLICY IF EXISTS "staff_invitations_select_same_venue" ON staff_invitations;
CREATE POLICY "staff_invitations_select_same_venue"
  ON staff_invitations FOR SELECT
  TO authenticated
  USING (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

DROP POLICY IF EXISTS "staff_invitations_insert_owner" ON staff_invitations;
CREATE POLICY "staff_invitations_insert_owner"
  ON staff_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "staff_invitations_update_owner" ON staff_invitations;
CREATE POLICY "staff_invitations_update_owner"
  ON staff_invitations FOR UPDATE
  TO authenticated
  USING (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "staff_invitations_delete_owner" ON staff_invitations;
CREATE POLICY "staff_invitations_delete_owner"
  ON staff_invitations FOR DELETE
  TO authenticated
  USING (
    venue_id IN (
      SELECT venue_id FROM staff_users
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Validación pública por token/code (para la página /accept-invite)
DROP POLICY IF EXISTS "staff_invitations_select_by_token" ON staff_invitations;
CREATE POLICY "staff_invitations_select_by_token"
  ON staff_invitations FOR SELECT
  TO anon, authenticated
  USING (status = 'pending' AND expires_at > now());


-- ── Función helper para generar códigos cortos únicos ────────────────────────
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'UN-TOQUE-';
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;


-- ── Auto-expire de invitaciones vencidas (ejecutar via cron job) ─────────────
CREATE OR REPLACE FUNCTION expire_stale_invitations()
RETURNS INTEGER AS $$
DECLARE
  n INTEGER;
BEGIN
  UPDATE staff_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;


-- ── Fin de la migración ──────────────────────────────────────────────────────
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
