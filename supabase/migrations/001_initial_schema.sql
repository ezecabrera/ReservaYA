-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Schema inicial
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
