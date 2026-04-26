# UnToque — SEO Strategy + Marketing Plan

> Última actualización: 2026-04-26
> Owner: founder · Revisión trimestral

---

## 1. Audit por página (estimación heurística)

| URL | Score est. | Top issue | Fix de +5 pts |
|---|---|---|---|
| `/landing` | 68 → ~85 | Falta H1 único orientado a keyword AR | Title con "Sistema de reservas para restaurantes en Argentina" |
| `/login` | 55 → ~75 | Auth sin `noindex` (drena crawl budget) | `noindex` en layout (ya aplicado) |
| `/demo` | 62 → ~80 | Sin schema `SoftwareApplication` | JSON-LD con `aggregateRating` |
| `/onboarding` | 50 → ~75 | Página gateada indexable | `noindex` (ya aplicado) |
| `/pilot` | 64 → ~82 | Falta prueba social y FAQ schema | FAQ + testimonios primeros 3 pilotos |
| `/vs-thefork` | 72 → ~88 | Comparativa sin tabla estructurada (SERP feature) | `<table>` semántica + JSON-LD `Article` |
| `/vs-maxirest` | 70 → ~85 | Falta diferencial de migración en hero | Hero "Migrá de Maxirest en 24hs" + bullets |
| `/vs-fudo` | 70 → ~85 | Confusión de intención (Fudo es POS) | Aclarar "UnToque (reservas) + Fudo (POS) se complementan" |

---

## 2. Top keywords AR (volumen mensual estimado)

| Keyword | Vol. est. | Intención | Dificultad |
|---|---|---|---|
| sistema de reservas restaurantes | 1.300 | Comercial | Alta |
| software gestión restaurante argentina | 880 | Comercial | Media |
| reservas online restaurante | 720 | Comercial | Alta |
| **alternativa thefork** | 210 | Comercial-comparativa | **Baja** |
| **reducir no shows restaurante** | 170 | Informacional | **Baja** |
| **seña reserva restaurante mercadopago** | 140 | Transaccional | **Muy baja** |
| fudo vs | 320 | Comparativa | Media |
| maxirest opiniones | 260 | Comparativa | Baja |
| woki reservas | 480 | Marca | Alta (sin chance) |
| **panel reservas restaurante** | 90 | Comercial | **Muy baja** |

**Long-tail wins (atacar primero):**

1. cómo cobrar seña en reservas de restaurante
2. exportar reservas thefork csv
3. panel reservas con whatsapp argentina
4. check-in digital restaurante qr
5. calculadora no-show restaurante
6. reservas restaurante sin comisión por cubierto
7. pwa restaurante reservas offline
8. schema reservas Google Maps restaurante

---

## 3. Competidores rankeando hoy

| Competidor | Fuerza | Debilidad | Cómo atacar |
|---|---|---|---|
| **TheFork** | DA alto, backlinks TripAdvisor, pages locales por ciudad | UX legacy, comisión por cubierto, datos del cliente no son tuyos | "Alternativa argentina sin comisión" + páginas /vs |
| **Fudo** | Blog activo, bien rankeado en "software restaurante" | POS-first, no compite directo en reservas | Posicionar como complemento (no competidor) |
| **Maxirest** | Ranking legacy en "sistema gastronómico" | Sitio antiguo, mal Core Web Vitals | Superar en performance + UX moderna |
| **Woki** | Rankea "reservas online", target consumer | Debilidad B2B | Foco panel del negocio (no del comensal) |

---

## 4. Calendario editorial 12 semanas

| Sem | Título | KW principal | Length | Internal links |
|---|---|---|---|---|
| 1 | Cómo reducir no-shows en restaurantes argentinos: guía 2026 | reducir no shows restaurante | 2.500 | `/landing`, `/pilot` |
| 2 | TheFork vs UnToque: comparativa real para Argentina | alternativa thefork argentina | 1.800 | `/vs-thefork`, `/demo` |
| 3 | Cómo cobrar seña por MercadoPago en tu restaurante | seña reserva mercadopago | 1.600 | `/landing` |
| 4 | Migrar de Maxirest a un panel moderno en 24hs | migrar maxirest | 1.400 | `/vs-maxirest`, `/pilot` |
| 5 | Plantilla CSV: importá tu base de TheFork a cualquier panel | exportar thefork csv | 1.200 + lead magnet | `/vs-thefork` |
| 6 | Check-in digital con QR: cómo agilizar la entrada | check-in qr restaurante | 1.500 | `/landing` |
| 7 | Fudo + UnToque: stack completo (POS + reservas) | fudo y reservas | 1.400 | `/vs-fudo` |
| 8 | Calculadora ROI: cuánto te cuesta cada no-show | costo no show calcular | 1.000 + tool | sem 1, `/demo` |
| 9 | Las 7 métricas que todo dueño de restaurante debe trackear | métricas restaurante | 2.000 | `/landing` |
| 10 | Cómo armar política de cancelación que clientes acepten | política cancelación restaurante | 1.300 | sem 1, sem 3 |
| 11 | Apertura de restaurante en CABA 2026: checklist completo | abrir restaurante argentina | 2.500 + lead magnet | sem 9 |
| 12 | Caso real: cómo [piloto] redujo 40% sus no-shows | caso éxito reservas | 1.200 | `/pilot`, sem 1 |

### Estructura `/blog` propuesta

```
panel/app/blog/
├── page.tsx                    (índice paginado)
├── [slug]/page.tsx             (dynamic, MDX)
├── categoria/[cat]/page.tsx    (no-shows, migracion, gestion, casos)
├── _content/                   (MDX files con frontmatter)
└── feed.xml/route.ts           (RSS)
```

---

## 5. Lead magnets

| Lead magnet | Landing | Captura |
|---|---|---|
| Plantilla CSV migración TheFork → UnToque | `/recursos/migrar-thefork` | email + nombre restaurante |
| Checklist apertura restaurante 2026 (PDF 12pp) | `/recursos/abrir-restaurante` | email + ciudad |
| Calculadora ROI panel reservas (web tool) | `/recursos/calculadora-roi` | resultado por email gateado |

---

## 6. Estrategia link building (20 sitios target)

| # | Sitio | Tipo | Prioridad | Approach |
|---|---|---|---|---|
| 1 | AHRCC.org.ar | Asociación | Alta | Membership + nota técnica |
| 2 | FEHGRA.org.ar | Asociación | Alta | Sponsored content "tech para socios" |
| 3 | Cocineros Argentinos | Medio | Alta | Guest post no-shows |
| 4 | Joy.com.ar | Medio gastro | Alta | Review producto |
| 5 | Sommelier.com.ar | Medio | Media | Mención herramienta |
| 6 | LaNacion Bar y Cocina | Medio Tier 1 | Alta | Press release lanzamiento |
| 7 | Clarín Gourmet | Medio Tier 1 | Alta | Press release |
| 8 | Infobae Tendencias | Medio Tier 1 | Media | Pitch tendencia 2026 |
| 9 | Apertura.com | Negocios | Alta | Caso emprendedor |
| 10 | Iproup | Tech | Media | "Startup AR a seguir" |
| 11 | Forbes AR | Negocios | Media | Founder profile |
| 12 | IAG (Inst. Arg. Gastronomía) | Escuela | Alta | Workshop estudiantes |
| 13 | Mausi Sebess | Escuela | Media | Curso integrado |
| 14 | Gato Dumas | Escuela | Media | Sponsor egresados |
| 15 | Restorando blog (legacy) | Comunidad | Baja | Comment + outreach |
| 16 | Reddit r/argentina (gastro threads) | Comunidad | Media | Aporte orgánico |
| 17 | LinkedIn (grupos AHT) | Social | Alta | Posts founder |
| 18 | Instagram @paladarnegro / @gastroar | Influencer | Alta | Colab review |
| 19 | YouTube "Locos x el Asado" | Influencer | Media | Sponsorship |
| 20 | Capterra LATAM | Directorio SaaS | Alta | Listing + reviews push |

**Press release lanzamiento**: PR Newswire LATAM + envío directo a redactores Tier 1. Hook: *"Startup argentina lanza alternativa local a TheFork sin comisión por cubierto"*.

---

## 7. Local SEO

- **Google Business Profile** para UnToque (categoría "Software company") con sede CABA.
- Schema `LocalBusiness` no aplica al SaaS, pero **publicar guía** "Cómo configurar tu LocalBusiness schema" como lead magnet.
- **Citations**: Capterra LATAM, GetApp, Software Advice, AppvenAR.

---

## 8. Idiomas

**es-AR prioritario.** Hreflang `es-AR` con fallback `es`. **No abrir es-MX/es-ES** hasta tener tracción local — diluye autoridad. Copy con voseo en blog (no en docs técnicas).

---

## 9. KPIs y tracking

### KPIs prioritarios

1. **Impressions orgánicas** (Search Console)
2. **Clicks orgánicos** + CTR avg
3. **Position avg** para top 10 keywords trackeadas
4. **Conversiones a `/demo`** desde tráfico orgánico
5. **Conversiones a `/pilot`** desde tráfico orgánico

### Metas

| Métrica | Mes 1 | Mes 3 | Mes 6 |
|---|---|---|---|
| Impressions/mes | 2.000 | 15.000 | 60.000 |
| Clicks/mes | 80 | 600 | 3.000 |
| CTR avg | 4% | 4% | 5% |
| Position avg (top 10 KW) | 35 | 22 | 12 |
| Demo signups orgánicos | 5 | 30 | 120 |
| Pilot signups orgánicos | 2 | 12 | 45 |

### Setup técnico (semana 1)

- **Google Search Console**: verificar `panel.deuntoque.com` por DNS TXT en Cloudflare.
- **Sitemap**: ya creado en `panel/app/sitemap.ts` — submit en GSC.
- **GA4 events**: `demo_request`, `pilot_signup`, `lead_magnet_download`, `comparison_view`.
- **Plausible** (opcional): dashboard público compartido, mismos goals.
- **Bing Webmaster Tools**: import desde GSC (5 min, gana 3% tráfico extra).
- **Schema validator**: correr `validator.schema.org` sobre cada página tras shipping.

---

## 10. Próximos pasos sugeridos (orden ejecución)

1. **Esta semana**: re-audit con seomator después de fixes recientes.
2. **Sem 2**: GSC + sitemap submission + GA4 events setup.
3. **Sem 3**: arrancar `/blog` con post 1 (no-shows) — mayor ROI inmediato.
4. **Sem 4-6**: lanzar 3 lead magnets + outreach a Tier 1 (AHRCC, La Nación, Apertura).
5. **Sem 8**: review métricas GSC, ajustar calendario según queries reales.
