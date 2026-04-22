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
