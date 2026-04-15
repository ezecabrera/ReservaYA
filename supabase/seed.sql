-- ═══════════════════════════════════════════════════════════════════════════
--  ReservaYa — Seed de desarrollo
--  Crea un venue de prueba, zonas, mesas y un staff user.
--  Ejecutar DESPUÉS de las migraciones, solo en desarrollo.
-- ═══════════════════════════════════════════════════════════════════════════

-- Venue de prueba
INSERT INTO venues (id, name, address, phone, description, config_json, cut_off_minutes)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'La Cantina',
  'Av. Corrientes 1234, CABA',
  '+54 11 4567-8901',
  'Restaurante de pastas y carnes en el corazón de Corrientes.',
  '{
    "service_hours": [
      { "day_of_week": 1, "opens_at": "12:00", "closes_at": "15:30", "is_open": true },
      { "day_of_week": 1, "opens_at": "20:00", "closes_at": "23:30", "is_open": true },
      { "day_of_week": 2, "opens_at": "12:00", "closes_at": "15:30", "is_open": true },
      { "day_of_week": 2, "opens_at": "20:00", "closes_at": "23:30", "is_open": true },
      { "day_of_week": 3, "opens_at": "12:00", "closes_at": "15:30", "is_open": true },
      { "day_of_week": 3, "opens_at": "20:00", "closes_at": "23:30", "is_open": true },
      { "day_of_week": 4, "opens_at": "12:00", "closes_at": "15:30", "is_open": true },
      { "day_of_week": 4, "opens_at": "20:00", "closes_at": "23:30", "is_open": true },
      { "day_of_week": 5, "opens_at": "12:00", "closes_at": "15:30", "is_open": true },
      { "day_of_week": 5, "opens_at": "20:00", "closes_at": "00:00", "is_open": true },
      { "day_of_week": 6, "opens_at": "12:00", "closes_at": "15:30", "is_open": true },
      { "day_of_week": 6, "opens_at": "20:00", "closes_at": "00:00", "is_open": true },
      { "day_of_week": 0, "opens_at": "12:00", "closes_at": "16:00", "is_open": true }
    ],
    "cut_off_minutes": 60,
    "deposit_type": "fixed",
    "deposit_amount": 2000,
    "cancellation_grace_hours": 2,
    "cancellation_refund_percentage": 100,
    "reminder_hours_before": 3,
    "zones_enabled": true
  }',
  60
);

-- Zonas
INSERT INTO zones (id, venue_id, name, prefix) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Salón', 'S'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Terraza', 'T');

-- Mesas — Salón (S1–S6)
INSERT INTO tables (venue_id, zone_id, label, capacity, position_order) VALUES
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'S1', 2, 1),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'S2', 2, 2),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'S3', 4, 3),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'S4', 4, 4),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'S5', 6, 5),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'S6', 8, 6);

-- Mesas — Terraza (T1–T4)
INSERT INTO tables (venue_id, zone_id, label, capacity, position_order) VALUES
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'T1', 2, 7),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'T2', 4, 8),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'T3', 4, 9),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'T4', 6, 10);

-- Categorías del menú
INSERT INTO menu_categories (id, venue_id, name, sort_order) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Entradas', 1),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pastas', 2),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Carnes', 3),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Postres', 4),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Bebidas', 5);

-- Ítems del menú
INSERT INTO menu_items (venue_id, category_id, name, price, description, availability_status) VALUES
  -- Entradas
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Tabla de quesos y fiambres', 2800, 'Selección de quesos artesanales y fiambres de la casa', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Bruschetta al pomodoro', 1600, 'Pan tostado con tomate fresco, albahaca y aceite de oliva', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Carpaccio de lomo', 3200, 'Finas láminas de lomo crudo, rúcula, parmesano y limón', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Sopa de cebolla gratinada', 1900, 'Caldo de res con cebolla caramelizada y queso gratinado', 'limited'),
  -- Pastas
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Tagliatelle al ragú', 3200, 'Pasta fresca con ragú de carne vacuna y panceta', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Gnocchi al pesto', 2900, 'Gnocchi caseros con pesto de albahaca y piñones', 'limited'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Ravioles de ricota y espinaca', 3100, 'Ravioles artesanales con salsa fileto y albahaca fresca', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Fettuccine a la crema', 2800, 'Pasta con crema, champignones y jamón cocido', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Lasagna de la casa', 3400, 'Capas de pasta fresca, ragú, bechamel y parmesano', 'available'),
  -- Carnes
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Bife de chorizo', 4800, '400g a las brasas con papas rústicas', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Entraña a la parrilla', 4200, 'Corte entero con chimichurri casero y ensalada', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Milanesa napolitana', 3600, 'Milanesa de ternera con salsa, jamón y muzzarella, papas fritas', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Pollo al limón', 3100, 'Suprema a la plancha con reducción de limón y hierbas', 'available'),
  -- Postres
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Tiramisú', 1600, 'Receta tradicional con mascarpone y café espresso', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Panacotta de vainilla', 1400, 'Con coulis de frutos rojos', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Budín de pan', 1200, 'Con salsa de caramelo y helado de crema', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Tabla de helados', 1800, 'Tres bochas a elección con toppings', 'limited'),
  -- Bebidas
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'Agua mineral', 600, '500ml con o sin gas', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'Vino de la casa', 2200, 'Copa de tinto o blanco de la bodega seleccionada', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'Cerveza artesanal', 1400, 'Rubia o roja de producción local, 500ml', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'Gaseosa', 700, 'Coca-Cola, Seven-Up o Sprite', 'available'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'Jugo natural', 900, 'Naranja, manzana o pomelo exprimido en el momento', 'available');

-- NOTA: El staff user se crea via Supabase Auth Dashboard o via API.
-- Después de crearlo en auth.users, insertar manualmente en staff_users:
--
-- INSERT INTO staff_users (id, venue_id, name, role, email) VALUES
--   ('<auth_user_id>', '00000000-0000-0000-0000-000000000001', 'Admin', 'owner', 'admin@lacantina.com');
