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
