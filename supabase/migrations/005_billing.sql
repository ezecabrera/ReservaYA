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
