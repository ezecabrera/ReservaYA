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
-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Lista de espera (waitlist)
--
--  Para walk-ins que llegan cuando el salón está lleno, o llamadas donde el
--  slot pedido no está disponible pero el cliente acepta esperar.
--
--  Estados:
--    waiting    — activa, esperando mesa
--    notified   — se le avisó que hay mesa (timer manual del host)
--    seated     — lo sentamos (resolved)
--    left       — se fue sin esperar
--    expired    — no se presentó tras notificarlo
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  guest_name      TEXT        NOT NULL,
  guest_phone     TEXT,
  party_size      INTEGER     NOT NULL CHECK (party_size > 0),

  -- Cuándo lo quiere: si es walk-in NOW, ambos son null y se usa created_at.
  -- Si pidió un slot específico que no estaba disponible, se guarda acá.
  requested_date  DATE,
  requested_time  TIME,

  status          TEXT        NOT NULL DEFAULT 'waiting'
                    CHECK (status IN ('waiting', 'notified', 'seated', 'left', 'expired')),

  notes           TEXT,
  notified_at     TIMESTAMPTZ,
  seated_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consulta más frecuente: activos del venue ordenados por llegada
CREATE INDEX IF NOT EXISTS idx_waitlist_venue_status_created
  ON waitlist_entries(venue_id, status, created_at);

-- Búsqueda por teléfono para el CRM futuro (match con guest de reservas)
CREATE INDEX IF NOT EXISTS idx_waitlist_guest_phone
  ON waitlist_entries(guest_phone)
  WHERE guest_phone IS NOT NULL;

-- Publicar cambios para que el panel se actualice en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE waitlist_entries;
-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Rating bidireccional + tracking de cancelaciones unilaterales
--
--  Diferenciador de marca: la única plataforma donde el restaurante también
--  tiene que cumplir. Dos direcciones de rating con derecho a descargo.
--
--  Reglas (V1):
--    - user_to_venue: visible en el perfil público del venue (agregado)
--    - venue_to_user: visible solo internamente (CRM del host)
--    - Máximo 1 rating por dirección por reserva (UNIQUE constraint)
--    - 72hs para disputar tras la creación (campos disputed*, V2 flow)
--    - cancelled_by distingue cancelación del cliente vs unilateral del venue
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Tracking de quién canceló la reserva ──────────────────────────────────
-- 'user'   = el cliente canceló desde la app
-- 'venue'  = el restaurante canceló desde el panel (UNILATERAL — pesa)
-- 'system' = expiración automática (payment timeout, etc.)
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT
    CHECK (cancelled_by IS NULL OR cancelled_by IN ('user', 'venue', 'system'));

-- ─── Tabla de ratings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

  -- Si user_id es null, el rating es sobre un walk-in/llamada identificado
  -- por teléfono. Se guarda el phone snapshot para poder matchear el CRM
  -- aunque el número cambie después.
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  guest_phone     TEXT,

  direction       TEXT        NOT NULL CHECK (direction IN ('user_to_venue', 'venue_to_user')),
  stars           INTEGER     NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment         TEXT,

  -- Flujo de disputa (schema listo, UI en V2)
  disputed            BOOLEAN     NOT NULL DEFAULT FALSE,
  dispute_reason      TEXT,
  dispute_evidence    TEXT,       -- URL a imagen/captura
  dispute_created_at  TIMESTAMPTZ,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_outcome     TEXT        CHECK (dispute_outcome IS NULL
                                    OR dispute_outcome IN ('upheld', 'dismissed', 'hidden')),

  -- Si se oculta tras una disputa ganada, no entra en los agregados públicos
  hidden          BOOLEAN     NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- No se puede dejar dos ratings en la misma dirección para la misma reserva
  UNIQUE (reservation_id, direction)
);

-- ─── Índices ───────────────────────────────────────────────────────────────
-- Lookup principal: agregar ratings de un venue (perfil público)
CREATE INDEX IF NOT EXISTS idx_ratings_venue_direction
  ON ratings(venue_id, direction)
  WHERE hidden = FALSE;

-- Lookup del CRM: todos los ratings recibidos por un comensal
CREATE INDEX IF NOT EXISTS idx_ratings_user_id
  ON ratings(user_id)
  WHERE user_id IS NOT NULL AND hidden = FALSE;

CREATE INDEX IF NOT EXISTS idx_ratings_guest_phone
  ON ratings(guest_phone)
  WHERE guest_phone IS NOT NULL AND hidden = FALSE;

-- Para la consulta "reserva X tiene rating de una dirección?"
CREATE INDEX IF NOT EXISTS idx_ratings_reservation_id
  ON ratings(reservation_id);

-- Para computar % cancelaciones unilaterales de un venue
CREATE INDEX IF NOT EXISTS idx_reservations_venue_cancelled_by
  ON reservations(venue_id, cancelled_by)
  WHERE cancelled_by IS NOT NULL;

-- ─── Realtime ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE ratings;
-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Outbox de notificaciones (WhatsApp + email + SMS futuro)
--
--  Patrón: los flujos críticos (reserva confirmada, check-in, etc.) encolan
--  notificaciones en esta tabla; un worker (/api/cron/notifications) las
--  procesa en lote. Esto garantiza:
--   - Retries seguros con idempotency (status + attempts)
--   - Schedule diferido (reminders 24h/2h antes)
--   - Funciona aunque caiga Meta/Resend momentáneamente
--   - Auditoría completa de qué se mandó y cuándo
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

  -- Identificador del template HSM pre-aprobado por Meta.
  -- Se mapea al template name + language_code en el helper Node.
  template_code   TEXT        NOT NULL CHECK (template_code IN (
                    'reservation_confirmed',
                    'reminder_24h',
                    'reminder_2h',
                    'cancelled_by_venue',
                    'post_visit_review'
                  )),

  channel         TEXT        NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
  to_phone        TEXT,
  to_email        TEXT,

  -- Variables dinámicas del template (e.g. { name, venue, date, time }).
  payload_json    JSONB       NOT NULL DEFAULT '{}'::jsonb,

  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),

  -- Cuándo debe dispararse. Para envío inmediato: NOW(). Para reminders:
  -- reservation_datetime - 24h / 2h.
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at         TIMESTAMPTZ,
  error           TEXT,
  external_id     TEXT,          -- ID del mensaje en Meta / Resend
  attempts        INTEGER     NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Dedupe: no encolar dos veces el mismo template para la misma reserva.
  UNIQUE (reservation_id, template_code)
);

-- Worker busca pending cuyo scheduled_at ya llegó
CREATE INDEX IF NOT EXISTS idx_notifications_pending_due
  ON notifications(scheduled_at)
  WHERE status = 'pending';

-- Consulta "mensajes de esta reserva" (para UI de timeline futura)
CREATE INDEX IF NOT EXISTS idx_notifications_reservation
  ON notifications(reservation_id);

-- Para reintentos: buscar fallidos recientes
CREATE INDEX IF NOT EXISTS idx_notifications_failed
  ON notifications(created_at)
  WHERE status = 'failed';

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — RLS policies para tablas nuevas (waitlist_entries, ratings, notifications)
--
--  Tres tablas agregadas en migrations 007/008/009 que hasta ahora confiaban
--  únicamente en el service role. Agregamos políticas para:
--   - Que el cliente NUNCA vea datos sensibles de otros venues
--   - Que staff sólo vea/edite los de su propio venue
--   - Que los agregados públicos (ratings user_to_venue) sean lecturables por cualquiera
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Habilitar RLS ─────────────────────────────────────────────────────────
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
--  WAITLIST_ENTRIES — sólo staff del venue
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS waitlist_staff_all ON waitlist_entries;
CREATE POLICY waitlist_staff_all ON waitlist_entries
  FOR ALL
  TO authenticated
  USING (auth.is_staff_of(venue_id))
  WITH CHECK (auth.is_staff_of(venue_id));

-- ═══════════════════════════════════════════════════════════════════════════
--  RATINGS
--   - user_to_venue visible públicamente (alimenta perfil del venue en el app)
--   - venue_to_user sólo visible para staff del venue (CRM interno)
--   - Escritura: sólo el dueño del lado correspondiente
-- ═══════════════════════════════════════════════════════════════════════════

-- Lectura: cualquiera puede ver las públicas (user_to_venue, no hidden)
DROP POLICY IF EXISTS ratings_public_select ON ratings;
CREATE POLICY ratings_public_select ON ratings
  FOR SELECT
  TO anon, authenticated
  USING (
    direction = 'user_to_venue'
    AND hidden = false
  );

-- Lectura privada: staff ve todas las ratings del venue (incluyendo venue_to_user)
DROP POLICY IF EXISTS ratings_staff_select ON ratings;
CREATE POLICY ratings_staff_select ON ratings
  FOR SELECT
  TO authenticated
  USING (auth.is_staff_of(venue_id));

-- Lectura privada: el usuario ve las ratings sobre él (si es venue_to_user con user_id)
DROP POLICY IF EXISTS ratings_self_select ON ratings;
CREATE POLICY ratings_self_select ON ratings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Inserción user_to_venue: sólo el dueño de la reserva
DROP POLICY IF EXISTS ratings_user_insert ON ratings;
CREATE POLICY ratings_user_insert ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    direction = 'user_to_venue'
    AND EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservations_id_placeholder_fixed_below()
    )
  );
-- Nota: la policy anterior está rota intencionalmente — la reemplazamos abajo
-- con la versión final. El hack evita un error de "column does not exist" si
-- alguien la testea antes.
DROP POLICY IF EXISTS ratings_user_insert ON ratings;
CREATE POLICY ratings_user_insert ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    direction = 'user_to_venue'
    AND EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = ratings.reservation_id
        AND reservations.user_id = auth.uid()
    )
  );

-- Inserción venue_to_user: sólo staff del venue
DROP POLICY IF EXISTS ratings_staff_insert ON ratings;
CREATE POLICY ratings_staff_insert ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    direction = 'venue_to_user'
    AND auth.is_staff_of(venue_id)
  );

-- Update: sólo para marcar disputas (usuario del lado correspondiente)
DROP POLICY IF EXISTS ratings_dispute_update ON ratings;
CREATE POLICY ratings_dispute_update ON ratings
  FOR UPDATE
  TO authenticated
  USING (
    auth.is_staff_of(venue_id)   -- staff puede disputar las user_to_venue
    OR user_id = auth.uid()      -- user disputa las venue_to_user suyas
    OR (
      direction = 'user_to_venue'
      AND EXISTS (
        SELECT 1 FROM reservations
        WHERE reservations.id = ratings.reservation_id
          AND reservations.user_id = auth.uid()
      )
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
--  NOTIFICATIONS — sólo staff del venue (nunca el cliente ve su propio queue)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS notifications_staff_select ON notifications;
CREATE POLICY notifications_staff_select ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.is_staff_of(venue_id));

-- Los clientes NO pueden leer notifications (sus teléfonos están ahí, podrían
-- extraer data de otros venues). Service role sigue teniendo acceso total.

-- No habilitamos INSERT/UPDATE/DELETE desde cliente — todo va por service role
-- del worker y de los endpoints de enqueue. Esto es intencional: el outbox
-- nunca lo toca un cliente final.

-- ═══════════════════════════════════════════════════════════════════════════
--  NOTA SOBRE REALTIME
--  Las publicaciones a supabase_realtime respetan RLS. Así que un cliente
--  suscripto a la tabla `ratings` solo va a recibir INSERT de ratings que
--  pueda leer según la policy `ratings_public_select`.
-- ═══════════════════════════════════════════════════════════════════════════
-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Audit trail por reserva
--
--  Cada transición de estado (check-in, cancelación, edición, no-show, etc.)
--  genera una fila en reservation_events. Esto permite:
--   - Resolver disputas ("yo no fui quien canceló")
--   - Métricas de operación (tiempo promedio para hacer check-in)
--   - Reproducir el histórico completo de una reserva
--
--  Los eventos los insertamos desde código (endpoints) usando service role —
--  no desde DB triggers, para poder incluir metadata de contexto (IP, user-agent)
--  cuando haga falta.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reservation_events (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id  UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  venue_id        UUID        NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

  event_type      TEXT        NOT NULL CHECK (event_type IN (
                    'created',         -- la reserva se creó
                    'confirmed',       -- pago aprobado o creación manual
                    'checked_in',      -- cliente llegó
                    'cancelled',       -- alguien la canceló (ver actor_role)
                    'no_show',         -- 15 min tarde sin llegar
                    'edited',          -- table/date/time/party/notes cambiaron
                    'reverted'         -- volvió a 'confirmed' desde no_show/cancelled
                  )),

  -- Quién ejecutó la acción
  actor_user_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role      TEXT        CHECK (actor_role IS NULL OR actor_role IN (
                    'user',            -- el cliente desde la app
                    'staff',           -- el staff desde el panel
                    'system'           -- job automático (expiration, no-show detector)
                  )),

  -- Snapshot de los cambios para eventos 'edited'
  -- Ejemplo: { from: { time_slot: "20:00" }, to: { time_slot: "20:30" } }
  diff_json       JSONB,

  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- La consulta principal: "timeline de una reserva" ordenado por tiempo
CREATE INDEX IF NOT EXISTS idx_reservation_events_res_time
  ON reservation_events(reservation_id, created_at DESC);

-- Para auditoría por venue / operador
CREATE INDEX IF NOT EXISTS idx_reservation_events_venue
  ON reservation_events(venue_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservation_events_actor
  ON reservation_events(actor_user_id)
  WHERE actor_user_id IS NOT NULL;

-- RLS: staff ve los del venue; el user ve los de sus propias reservas.
ALTER TABLE reservation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rev_staff_select ON reservation_events;
CREATE POLICY rev_staff_select ON reservation_events
  FOR SELECT TO authenticated
  USING (auth.is_staff_of(venue_id));

DROP POLICY IF EXISTS rev_user_select ON reservation_events;
CREATE POLICY rev_user_select ON reservation_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = reservation_events.reservation_id
        AND reservations.user_id = auth.uid()
    )
  );

-- No habilitamos INSERT/UPDATE/DELETE desde cliente: sólo service role escribe.

-- ═══════════════════════════════════════════════════════════════════════════
--  STAFF USER para test@reservaya.test
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_user_id UUID := '7a8e555f-17ec-4cb6-b036-0e511af07d74';
  v_venue_id UUID;
BEGIN
  SELECT id INTO v_venue_id FROM venues WHERE is_active = true ORDER BY created_at ASC LIMIT 1;
  IF v_venue_id IS NULL THEN
    RAISE NOTICE 'No hay venues activos. Correr seed:demo antes.';
    RETURN;
  END IF;
  INSERT INTO staff_users (id, venue_id, name, role, email)
  VALUES (v_user_id, v_venue_id, 'Test Admin', 'owner', 'test@reservaya.test')
  ON CONFLICT (id) DO UPDATE SET venue_id = EXCLUDED.venue_id, role = EXCLUDED.role;
  RAISE NOTICE 'Staff user % vinculado a venue %', v_user_id, v_venue_id;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Duración estimada de la reserva (migration 012)
--
--  duration_minutes permite al staff cargar reservas más cortas (café, copa)
--  o más largas (eventos, cumpleaños). Default 90 min (cena estándar en AR).
--  El Timeline view usa este valor para calcular el ancho del bloque.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 90
    CHECK (duration_minutes BETWEEN 15 AND 480);

-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Orden manual de platos dentro de categoría (migration 013)
--
--  Permite drag-reorder de items en el MenuManager. Default 0 → todos los
--  items existentes quedan en 0 y el render usa (sort_order ASC, name ASC)
--  como tiebreak estable.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_menu_items_category_sort
  ON menu_items(category_id, sort_order, name);
