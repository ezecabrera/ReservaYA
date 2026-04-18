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
