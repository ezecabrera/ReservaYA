// ═══════════════════════════════════════════════════════════════════════════
//  Datos ficticios para entorno de testing — Un Toque
//  Restaurantes variados SOLO dentro de las cocinas que hoy filtra la app
//  (ver chips en app/app/page.tsx: Pastas, Carnes, Pizza, Vegano, Sushi).
//
//  Todos los UUIDs empiezan con "dec0..." para identificarlos como demo
//  y poder borrarlos sin tocar datos reales (ej. La Cantina).
// ═══════════════════════════════════════════════════════════════════════════

export const DEMO_VENUE_UUID_PREFIX = 'dec0'
export const DEMO_EMAIL_DOMAIN = 'demo.untoque.test'
export const DEMO_PASSWORD = 'Demo1234!'

// Cuenta especial de prueba para entrar rápido a la PWA cliente
export const TESTER_EMAIL = 'test@untoque.test'
export const TESTER_PASSWORD = 'Test1234!'
export const TESTER_NAME = 'Tester ReservaYA'

function vid(n) {
  // UUID v4 formato válido, prefijo dec0 para marcarlo como demo
  const hex = String(n).padStart(4, '0')
  return `dec0${hex}-0000-4000-a000-000000000000`
}

// Horarios típicos
const LUNCH_DINNER = [
  { day_of_week: 1, opens_at: '12:00', closes_at: '15:30', is_open: true },
  { day_of_week: 1, opens_at: '20:00', closes_at: '23:30', is_open: true },
  { day_of_week: 2, opens_at: '12:00', closes_at: '15:30', is_open: true },
  { day_of_week: 2, opens_at: '20:00', closes_at: '23:30', is_open: true },
  { day_of_week: 3, opens_at: '12:00', closes_at: '15:30', is_open: true },
  { day_of_week: 3, opens_at: '20:00', closes_at: '23:30', is_open: true },
  { day_of_week: 4, opens_at: '12:00', closes_at: '15:30', is_open: true },
  { day_of_week: 4, opens_at: '20:00', closes_at: '23:30', is_open: true },
  { day_of_week: 5, opens_at: '12:00', closes_at: '15:30', is_open: true },
  { day_of_week: 5, opens_at: '20:00', closes_at: '00:00', is_open: true },
  { day_of_week: 6, opens_at: '12:00', closes_at: '15:30', is_open: true },
  { day_of_week: 6, opens_at: '20:00', closes_at: '00:00', is_open: true },
  { day_of_week: 0, opens_at: '12:00', closes_at: '16:00', is_open: true },
]

const DINNER_ONLY = [
  { day_of_week: 2, opens_at: '19:30', closes_at: '23:30', is_open: true },
  { day_of_week: 3, opens_at: '19:30', closes_at: '23:30', is_open: true },
  { day_of_week: 4, opens_at: '19:30', closes_at: '23:30', is_open: true },
  { day_of_week: 5, opens_at: '19:30', closes_at: '00:00', is_open: true },
  { day_of_week: 6, opens_at: '19:30', closes_at: '00:00', is_open: true },
  { day_of_week: 0, opens_at: '19:30', closes_at: '23:30', is_open: true },
]

const ROTACION_ALTA = [
  { day_of_week: 1, opens_at: '11:30', closes_at: '16:00', is_open: true },
  { day_of_week: 1, opens_at: '19:30', closes_at: '00:00', is_open: true },
  { day_of_week: 2, opens_at: '11:30', closes_at: '16:00', is_open: true },
  { day_of_week: 2, opens_at: '19:30', closes_at: '00:00', is_open: true },
  { day_of_week: 3, opens_at: '11:30', closes_at: '16:00', is_open: true },
  { day_of_week: 3, opens_at: '19:30', closes_at: '00:00', is_open: true },
  { day_of_week: 4, opens_at: '11:30', closes_at: '16:00', is_open: true },
  { day_of_week: 4, opens_at: '19:30', closes_at: '00:00', is_open: true },
  { day_of_week: 5, opens_at: '11:30', closes_at: '16:00', is_open: true },
  { day_of_week: 5, opens_at: '19:30', closes_at: '01:00', is_open: true },
  { day_of_week: 6, opens_at: '11:30', closes_at: '16:00', is_open: true },
  { day_of_week: 6, opens_at: '19:30', closes_at: '01:00', is_open: true },
  { day_of_week: 0, opens_at: '11:30', closes_at: '17:00', is_open: true },
]

function baseConfig(overrides = {}) {
  return {
    service_hours: LUNCH_DINNER,
    cut_off_minutes: 60,
    deposit_type: 'fixed',
    deposit_amount: 2000,
    cancellation_grace_hours: 2,
    cancellation_refund_percentage: 100,
    reminder_hours_before: 3,
    zones_enabled: true,
    ...overrides,
  }
}

// ─── Plantillas de menú por cocina ────────────────────────────────────────

const MENU_PASTAS = [
  { cat: 'Entradas', items: [
    ['Burrata con tomates secos', 3200, 'Burrata cremosa con tomates secos, albahaca y aceite de oliva extra virgen'],
    ['Carpaccio de lomo', 3400, 'Finas láminas de lomo crudo con rúcula, parmesano y limón'],
    ['Provoleta al horno', 2800, 'Provolone con orégano y chimichurri, al horno'],
    ['Vitel toné', 3100, 'Peceto cocido lento con salsa de atún y alcaparras'],
  ]},
  { cat: 'Pastas frescas', items: [
    ['Tagliatelle al ragú', 3600, 'Pasta fresca al huevo con ragú de osobuco 6hs'],
    ['Ravioles de ricota y espinaca', 3400, 'Con manteca, nuez y parmesano añejo'],
    ['Sorrentinos de jamón y muzza', 3500, 'Salsa fileto o crema a elección'],
    ['Gnocchi al pesto genovese', 3200, 'Ñoquis caseros con pesto, piñones y parmesano'],
    ['Pappardelle funghi', 3700, 'Con mix de hongos, vino blanco y crema'],
    ['Lasagna boloñesa de la casa', 3800, 'Capas de pasta fresca, ragú, bechamel y parmesano'],
  ]},
  { cat: 'Principales', items: [
    ['Ossobuco con risotto', 4900, 'Osobuco braseado con risotto al azafrán'],
    ['Milanesa napolitana', 3600, 'Con papas a la provenzal'],
  ]},
  { cat: 'Postres', items: [
    ['Tiramisú', 1800, 'Receta tradicional con mascarpone y café espresso'],
    ['Panna cotta de vainilla', 1600, 'Con coulis de frutos rojos'],
    ['Affogato al caffè', 1500, 'Helado de crema con espresso'],
  ]},
  { cat: 'Bebidas', items: [
    ['Agua mineral 500ml', 700, 'Con o sin gas'],
    ['Copa de Malbec', 2400, 'Bodega seleccionada de Mendoza'],
    ['Copa de Chardonnay', 2300, 'Corte de altura, Valle de Uco'],
    ['Limonada de jengibre', 1100, 'Con menta y jengibre fresco'],
  ]},
]

const MENU_CARNES = [
  { cat: 'Entradas', items: [
    ['Provoleta con tomates asados', 2900, 'A la parrilla con orégano y aceite de oliva'],
    ['Empanadas de carne cortada a cuchillo', 1500, 'Horno de barro — 2 unidades'],
    ['Mollejas crocantes', 4200, 'Con limón y sal parrillera'],
    ['Tabla de fiambres', 3600, 'Selección de fiambres, quesos y encurtidos'],
  ]},
  { cat: 'Parrilla', items: [
    ['Bife de chorizo 400g', 5800, 'A las brasas, jugoso'],
    ['Ojo de bife 350g', 6200, 'Corte premium madurado'],
    ['Entraña a la parrilla', 4900, 'Corte entero con chimichurri de la casa'],
    ['Vacío', 4700, 'Corte fino con costra crocante'],
    ['Asado de tira', 5100, '3 costillas anchas a las brasas'],
    ['Mollejas, chinchulines y morcilla', 4800, 'Parrillada para compartir'],
    ['Parrillada completa para 2', 9800, 'Asado, vacío, entraña, chorizo y morcilla'],
  ]},
  { cat: 'Guarniciones', items: [
    ['Papas a la provenzal', 1700, 'Con ajo, perejil y aceite de oliva'],
    ['Ensalada mixta', 1500, 'Lechuga, tomate y cebolla'],
    ['Papas rústicas al horno', 1900, 'Con romero y sal gruesa'],
    ['Verduras grilladas', 2000, 'Zapallitos, berenjenas, morrones y cebolla'],
  ]},
  { cat: 'Postres', items: [
    ['Flan casero con dulce de leche', 1600, 'Con crema batida'],
    ['Panqueque de dulce de leche', 1700, 'Flambeado con cognac'],
    ['Helado artesanal 2 bochas', 1500, 'Sabores del día'],
  ]},
  { cat: 'Bebidas', items: [
    ['Malbec — Copa', 2400, 'Bodega Mendocina seleccionada'],
    ['Cabernet Sauvignon — Copa', 2500, 'Corte de altura'],
    ['Cerveza Stout 500ml', 1400, 'Artesanal local'],
    ['Agua mineral 750ml', 900, 'Con o sin gas'],
    ['Gaseosa', 800, 'Línea Coca-Cola'],
  ]},
]

const MENU_PIZZA = [
  { cat: 'Entradas', items: [
    ['Fainá', 1400, 'Porción con orégano y aceite de oliva'],
    ['Empanadas al horno', 1500, 'Carne, jamón y queso o humita — 2 unidades'],
    ['Rabas a la romana', 3200, 'Con limón y mayonesa casera'],
  ]},
  { cat: 'Pizzas clásicas', items: [
    ['Muzzarella chica', 2400, '8 porciones, salsa, muzza y aceitunas'],
    ['Muzzarella grande', 3200, '12 porciones'],
    ['Napolitana', 3400, 'Salsa, muzza, tomate en rodajas y ajo'],
    ['Fugazzeta rellena', 3900, 'Jamón, muzza y cebolla'],
    ['Calabresa', 3400, 'Muzza, longaniza y morrones'],
    ['Cuatro quesos', 3700, 'Muzza, roquefort, parmesano y provolone'],
  ]},
  { cat: 'Pizzas especiales', items: [
    ['Rúcula, crudo y parmesano', 4100, 'Con aceite de oliva'],
    ['Panceta ahumada y cebolla morada', 3800, 'Con confitura de cebolla'],
    ['Hongos portobello y salvia', 3900, 'Con muzza y aceite trufado'],
    ['Pizza del día', 3600, 'Consultar al mozo'],
  ]},
  { cat: 'Postres', items: [
    ['Flan mixto', 1500, 'Dulce de leche y crema'],
    ['Helado 2 bochas', 1400, 'Sabores del día'],
  ]},
  { cat: 'Bebidas', items: [
    ['Cerveza Lager 500ml', 1300, 'Tirada, artesanal'],
    ['Cerveza IPA 500ml', 1400, 'Lúpulo intenso'],
    ['Gaseosa', 700, 'Línea Coca-Cola'],
    ['Agua saborizada', 800, 'Pomelo, lima-limón o naranja'],
  ]},
]

const MENU_VEGANO = [
  { cat: 'Entradas', items: [
    ['Hummus de remolacha', 2400, 'Con crudités y pan de masa madre'],
    ['Ceviche vegano de coliflor', 2800, 'Con leche de tigre de palta y coco'],
    ['Bastones de berenjena crocantes', 2300, 'Con mayo de castañas y lima'],
    ['Guacamole con semillas', 2200, 'Con totopos de maíz azul'],
  ]},
  { cat: 'Bowls', items: [
    ['Buddha bowl', 3400, 'Quinoa, garbanzos, palta, kale, zanahoria y tahini'],
    ['Bowl mediterráneo', 3300, 'Cous-cous, tomate cherry, aceitunas, hummus y rúcula'],
    ['Bowl thai', 3500, 'Arroz jazmín, tofu crocante, mango, maní y salsa de coco'],
    ['Poke bowl vegano', 3600, 'Arroz sushi, edamame, palta, mango y algas'],
  ]},
  { cat: 'Principales', items: [
    ['Milanesa de seitán', 3200, 'Con puré de zanahoria y jengibre'],
    ['Risotto de hongos', 3400, 'Arroz arborio, mix de hongos y parmesano vegano'],
    ['Lasagna de berenjena', 3300, 'Sin TACC, con queso vegano y albahaca'],
  ]},
  { cat: 'Postres', items: [
    ['Brownie de cacao y dátiles', 1700, 'Sin azúcar refinada, con helado de coco'],
    ['Cheesecake de castañas', 1800, 'Base de dátil y nuez, relleno crudo'],
    ['Fruta de estación con granola', 1500, 'Miel de agave y semillas'],
  ]},
  { cat: 'Bebidas', items: [
    ['Kombucha de jengibre', 1400, 'De producción local'],
    ['Jugo detox verde', 1600, 'Manzana, pepino, jengibre, limón y espinaca'],
    ['Matcha latte con leche de almendras', 1500, 'Sin azúcar o con miel'],
    ['Agua saborizada casera', 700, 'Pepino-menta o frutos rojos'],
  ]},
]

const MENU_SUSHI = [
  { cat: 'Entradas', items: [
    ['Gyozas de cerdo', 2400, '5 unidades, con salsa ponzu'],
    ['Edamame al vapor', 1500, 'Con sal marina'],
    ['Tataki de atún', 3800, 'Con sésamo, jengibre y reducción de soja'],
    ['Sopa miso', 1300, 'Caldo de alga wakame, tofu y cebolla de verdeo'],
  ]},
  { cat: 'Rolls clásicos', items: [
    ['California roll', 2800, 'Kanikama, palta, pepino — 8 piezas'],
    ['Philadelphia roll', 3100, 'Salmón, queso crema, cebolla de verdeo — 8 piezas'],
    ['Ebi tempura roll', 3300, 'Camarón tempura, palta, salsa teriyaki — 8 piezas'],
    ['Salmon skin roll', 2900, 'Piel crocante, pepino, teriyaki — 8 piezas'],
  ]},
  { cat: 'Rolls de autor', items: [
    ['Spicy tuna roll', 3600, 'Atún picante, sésamo y cebollín — 8 piezas'],
    ['Volcán roll', 3700, 'Salmón, queso crema, cebolla crocante — 8 piezas'],
    ['Rainbow roll', 4100, 'Mix de salmón, atún y pez blanco sobre california — 8 piezas'],
    ['Tempura crunch', 3800, 'Langostino tempura con crunch y teriyaki'],
  ]},
  { cat: 'Combinados', items: [
    ['Combinado 15 piezas', 5900, 'Mix de rolls, nigiri y sashimi'],
    ['Combinado 30 piezas', 9800, 'Para compartir — selección del chef'],
  ]},
  { cat: 'Bebidas', items: [
    ['Té verde', 600, 'Sencha servido caliente'],
    ['Sake caliente 180ml', 2800, 'Junmai'],
    ['Cerveza Asahi 500ml', 1500, 'Importada'],
    ['Agua mineral', 700, 'Con o sin gas'],
  ]},
]

// ─── 20 venues ────────────────────────────────────────────────────────────

// Cada venue:
//   id, name, cuisine (para chip), neighborhood, address, phone, email,
//   description, zones [], tables (capacities list per zone), menu template,
//   config overrides (horario especial), image_seed
export const DEMO_VENUES = [
  // ── PASTAS (4) ───────────────────────────────────────────────────────────
  {
    id: vid(1), name: 'Trattoria Sentori', cuisine: 'pastas',
    address: 'Thames 1845, Palermo, CABA', phone: '+54 11 4831-5501',
    description: 'Trattoria de pasta artesanal y cocina italiana tradicional en Palermo Soho.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 6] },
      { name: 'Patio', prefix: 'P', capacities: [2, 4, 4] },
    ],
    menu: MENU_PASTAS, image_seed: 'trattoria-sentori',
    config: baseConfig(),
  },
  {
    id: vid(2), name: 'Pasta Madre', cuisine: 'pastas',
    address: 'Murillo 770, Villa Crespo, CABA', phone: '+54 11 4857-2043',
    description: 'Pasta fresca al molde y cocina de trattoria contemporánea.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 2, 4, 4, 6, 6] },
    ],
    menu: MENU_PASTAS, image_seed: 'pasta-madre',
    config: baseConfig({ deposit_amount: 1500 }),
  },
  {
    id: vid(3), name: 'Nonna Beatrice', cuisine: 'pastas',
    address: 'Defensa 980, San Telmo, CABA', phone: '+54 11 4307-9862',
    description: 'Trattoria familiar con horno a leña y recetas italianas de la Nonna.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 4, 4, 6] },
      { name: 'Reservado', prefix: 'R', capacities: [8] },
    ],
    menu: MENU_PASTAS, image_seed: 'nonna-beatrice',
    config: baseConfig(),
  },
  {
    id: vid(4), name: 'Fuoco & Farina', cuisine: 'pastas',
    address: 'Av. Forest 1124, Colegiales, CABA', phone: '+54 11 4553-3271',
    description: 'Pasta fresca del día + parrilla a la leña en ambiente moderno.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 6] },
      { name: 'Terraza', prefix: 'T', capacities: [2, 4, 4] },
    ],
    menu: MENU_PASTAS, image_seed: 'fuoco-farina',
    config: baseConfig({ deposit_amount: 2500 }),
  },

  // ── CARNES (4) ───────────────────────────────────────────────────────────
  {
    id: vid(5), name: 'El Fogón del Sur', cuisine: 'carnes',
    address: 'Av. Callao 1345, Recoleta, CABA', phone: '+54 11 4813-2290',
    description: 'Parrilla tradicional porteña con cortes de carne premium y carta de vinos.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 6, 8] },
    ],
    menu: MENU_CARNES, image_seed: 'fogon-del-sur',
    config: baseConfig({ deposit_amount: 3000 }),
  },
  {
    id: vid(6), name: 'Bodegón Los Álamos', cuisine: 'carnes',
    address: 'Av. Boedo 876, Boedo, CABA', phone: '+54 11 4931-1108',
    description: 'Bodegón porteño clásico con milanesas XL y parrilla de barrio.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 2, 4, 4, 4, 6, 6, 8] },
    ],
    menu: MENU_CARNES, image_seed: 'bodegon-alamos',
    config: baseConfig({ deposit_amount: 1500, service_hours: ROTACION_ALTA }),
  },
  {
    id: vid(7), name: 'Cortes del 9', cuisine: 'carnes',
    address: 'Olga Cossettini 1551, Puerto Madero, CABA', phone: '+54 11 4313-7788',
    description: 'Steakhouse moderno con cortes madurados en seco y carta premium.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 6] },
      { name: 'Privado', prefix: 'V', capacities: [10] },
    ],
    menu: MENU_CARNES, image_seed: 'cortes-del-9',
    config: baseConfig({ deposit_amount: 4000, service_hours: DINNER_ONLY }),
  },
  {
    id: vid(8), name: 'Asador Don Ramiro', cuisine: 'carnes',
    address: 'Cabildo 2345, Belgrano, CABA', phone: '+54 11 4784-6521',
    description: 'Asado al asador criollo con terraza abierta y chef parrillero.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 4, 4, 6] },
      { name: 'Terraza', prefix: 'T', capacities: [2, 4, 4, 6] },
    ],
    menu: MENU_CARNES, image_seed: 'don-ramiro',
    config: baseConfig({ deposit_amount: 2500 }),
  },

  // ── PIZZA (4) ────────────────────────────────────────────────────────────
  {
    id: vid(9), name: 'La Pizzería de Almagro', cuisine: 'pizza',
    address: 'Av. Medrano 820, Almagro, CABA', phone: '+54 11 4862-4401',
    description: 'Pizza al molde porteña al mejor estilo de barrio, muzza extra.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 4, 4, 6, 6, 8] },
    ],
    menu: MENU_PIZZA, image_seed: 'pizzeria-almagro',
    config: baseConfig({ deposit_amount: 1000, service_hours: ROTACION_ALTA }),
  },
  {
    id: vid(10), name: 'Napoli Forno', cuisine: 'pizza',
    address: 'Av. Triunvirato 3980, Villa Urquiza, CABA', phone: '+54 11 4521-9974',
    description: 'Pizza napolitana auténtica cocida en horno a leña a 450°.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 4] },
      { name: 'Terraza', prefix: 'T', capacities: [2, 4] },
    ],
    menu: MENU_PIZZA, image_seed: 'napoli-forno',
    config: baseConfig({ deposit_amount: 1500 }),
  },
  {
    id: vid(11), name: 'Piedra Viva', cuisine: 'pizza',
    address: 'Av. Rivadavia 4890, Caballito, CABA', phone: '+54 11 4902-5518',
    description: 'Pizza a la piedra fina y crocante, masa madre de 48hs.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 6, 6] },
    ],
    menu: MENU_PIZZA, image_seed: 'piedra-viva',
    config: baseConfig({ deposit_amount: 1200 }),
  },
  {
    id: vid(12), name: 'Fugazzeta Reina', cuisine: 'pizza',
    address: 'Av. Álvarez Thomas 1220, Chacarita, CABA', phone: '+54 11 4553-7700',
    description: 'Muzza y fugazzeta al molde con cebolla caramelizada de la casa.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 6] },
    ],
    menu: MENU_PIZZA, image_seed: 'fugazzeta-reina',
    config: baseConfig({ deposit_amount: 1000 }),
  },

  // ── VEGANO (4) ───────────────────────────────────────────────────────────
  {
    id: vid(13), name: 'Verde de Mercado', cuisine: 'vegano',
    address: 'Honduras 5530, Palermo Soho, CABA', phone: '+54 11 4833-2244',
    description: 'Cocina plant-based de mercado con producto de estación y fermentos.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 6] },
      { name: 'Patio', prefix: 'P', capacities: [2, 2, 4] },
    ],
    menu: MENU_VEGANO, image_seed: 'verde-mercado',
    config: baseConfig({ deposit_amount: 1800 }),
  },
  {
    id: vid(14), name: 'Bowl Verde', cuisine: 'vegano',
    address: 'Scalabrini Ortiz 1055, Villa Crespo, CABA', phone: '+54 11 4776-8820',
    description: 'Bowl bar plant-based rápido y saludable, cocina visible.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 2, 4, 4] },
    ],
    menu: MENU_VEGANO, image_seed: 'bowl-verde',
    config: baseConfig({ deposit_amount: 1000, service_hours: ROTACION_ALTA }),
  },
  {
    id: vid(15), name: 'Raíz Vegana', cuisine: 'vegano',
    address: 'Congreso 3220, Coghlan, CABA', phone: '+54 11 4544-3391',
    description: 'Cocina vegana de autor, ingredientes orgánicos y pastas sin TACC.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 4, 4, 6] },
    ],
    menu: MENU_VEGANO, image_seed: 'raiz-vegana',
    config: baseConfig({ deposit_amount: 1800 }),
  },
  {
    id: vid(16), name: 'Crudo y Wok', cuisine: 'vegano',
    address: 'Av. Cabildo 3890, Núñez, CABA', phone: '+54 11 4702-1156',
    description: 'Cocina raw + wok asiático 100% vegetal, sin lácteos ni huevo.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 6] },
      { name: 'Barra', prefix: 'B', capacities: [1, 1, 1, 1] },
    ],
    menu: MENU_VEGANO, image_seed: 'crudo-wok',
    config: baseConfig({ deposit_amount: 1500 }),
  },

  // ── SUSHI (4) ────────────────────────────────────────────────────────────
  {
    id: vid(17), name: 'Niko Sushi Bar', cuisine: 'sushi',
    address: 'Gorriti 5680, Palermo Hollywood, CABA', phone: '+54 11 4775-9930',
    description: 'Sushi bar tradicional con barra de chef y combinados generosos.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 6] },
      { name: 'Barra', prefix: 'B', capacities: [1, 1, 1, 1, 1, 1] },
    ],
    menu: MENU_SUSHI, image_seed: 'niko-sushi',
    config: baseConfig({ deposit_amount: 2000 }),
  },
  {
    id: vid(18), name: 'Omakase Kintaro', cuisine: 'sushi',
    address: 'Guido 1820, Recoleta, CABA', phone: '+54 11 4809-3357',
    description: 'Omakase premium con selección del chef y pescados del día.',
    zones: [
      { name: 'Barra omakase', prefix: 'O', capacities: [1, 1, 1, 1, 1, 1, 1, 1] },
      { name: 'Privado', prefix: 'V', capacities: [6] },
    ],
    menu: MENU_SUSHI, image_seed: 'omakase-kintaro',
    config: baseConfig({ deposit_amount: 5000, service_hours: DINNER_ONLY }),
  },
  {
    id: vid(19), name: 'Rolls Fusión Cabildo', cuisine: 'sushi',
    address: 'Av. Cabildo 2680, Belgrano, CABA', phone: '+54 11 4782-4412',
    description: 'Rolls de fusión moderna con ingredientes argentinos y técnica japonesa.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 6, 6] },
    ],
    menu: MENU_SUSHI, image_seed: 'rolls-cabildo',
    config: baseConfig({ deposit_amount: 1800 }),
  },
  {
    id: vid(20), name: 'Sushi & Ramen Ao', cuisine: 'sushi',
    address: 'Av. Acoyte 340, Caballito, CABA', phone: '+54 11 4902-7793',
    description: 'Sushi tradicional + ramen casero con caldo de 12hs.',
    zones: [
      { name: 'Salón', prefix: 'S', capacities: [2, 2, 4, 4, 4, 6] },
      { name: 'Barra', prefix: 'B', capacities: [1, 1, 1, 1] },
    ],
    menu: MENU_SUSHI, image_seed: 'sushi-ao',
    config: baseConfig({ deposit_amount: 1500, service_hours: ROTACION_ALTA }),
  },
]

// Inyectar cuisine dentro de config_json para poder filtrar en el futuro
// sin romper el schema actual (no hay columna dedicada todavía).
for (const v of DEMO_VENUES) {
  v.config.cuisine = v.cuisine
  v.email = `owner-${String(DEMO_VENUES.indexOf(v) + 1).padStart(2, '0')}@${DEMO_EMAIL_DOMAIN}`
  v.image_url = `https://picsum.photos/seed/${v.image_seed}/1200/800`
}

// ─── Usuarios cliente (10 + 1 tester destacado) ───────────────────────────

const CLIENT_NAMES = [
  'Martina Álvarez', 'Joaquín Pereyra', 'Sofía Ledesma', 'Lucas Bermúdez',
  'Camila Ibáñez', 'Nicolás Ferraro', 'Valentina Ruíz', 'Matías Quintana',
  'Julieta Soriano', 'Tomás Espinosa',
]

export const DEMO_CLIENTS = CLIENT_NAMES.map((name, i) => ({
  email: `cliente-${String(i + 1).padStart(2, '0')}@${DEMO_EMAIL_DOMAIN}`,
  password: DEMO_PASSWORD,
  name,
  phone: `+54 11 4${String(100 + i).padStart(3, '0')}-${String(1000 + i).padStart(4, '0')}`,
}))

export const TESTER_CLIENT = {
  email: TESTER_EMAIL,
  password: TESTER_PASSWORD,
  name: TESTER_NAME,
  phone: '+54 11 5555-0000',
}
