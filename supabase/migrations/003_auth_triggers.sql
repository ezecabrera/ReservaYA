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
