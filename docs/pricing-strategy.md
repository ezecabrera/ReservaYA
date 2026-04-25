# Pricing strategy — UnToque 2026

Análisis y recomendación para el modelo de pricing en el primer año post-launch.

---

## 1. Plan único vs tiers — análisis

### Opción A: Plan único ARS 30.000/mes (current)

**Pros**
- **Mensaje claro y memorable:** "ARS 30k/mes flat, todo incluido". Una landing puede comunicarlo en 5 segundos. No hay que "elegir el plan".
- **Vendible por WhatsApp:** sin comparación de columnas, el cierre es directo.
- **Sin sandbagging interno:** todos los features están vivos para todos. No hay que mantener ramas de "esto sólo Pro" en el código.
- **Anchoring favorable contra TheFork:** "TheFork puede sacarte hasta ARS 30k/mes en comisiones por 100 reservas, nosotros mismo precio fijo y sin tope."
- **Fricción mínima en signup:** un solo CTA, un solo precio.

**Cons**
- Pérdida de upside con cuentas grandes (multi-sucursal, ticket alto, alto volumen) que pagarían más.
- Imagen "barata" frente a competencia premium si el target sube.
- No hay versión "lite" para conversión de Tier C (cafés chicos, < 1k followers).

### Opción B: Tres tiers (Starter / Pro / Enterprise)

Ejemplo:
- **Starter** ARS 18k/mes → hasta 30 mesas, sin campañas WhatsApp, soporte email.
- **Pro** ARS 30k/mes → todo lo de Starter + campañas + analytics + soporte WhatsApp.
- **Enterprise** ARS 75k/mes → multi-venue, SLA 4h, API POS, manager dedicado.

**Pros**
- Captura mejor el upside con cuentas grandes.
- "Escalera" psicológica: el cliente "sube" a Pro y se siente premium.
- Permite atacar Tier C sin comer margen.

**Cons**
- Complejidad de marketing: tabla de comparación, FAQs, "¿qué plan me conviene?".
- Complejidad de código: feature flags por plan, billing branching.
- En SaaS B2B AR temprano, tiers tempranos suelen confundir más que convertir.
- Riesgo "Starter parking": cuentas se quedan en Starter forever en vez de upgrade.

---

## 2. Recomendación 2026

### Fase 1 (Q1-Q3 2026): Plan único ARS 30k/mes

Rationale:
- Hasta los **primeros 50 customers**, el plan único es más fácil de vender, comunicar y mantener.
- Ahorra ciclos de discusión de "¿qué hay en cada plan?".
- Permite enfocar producto en un único journey.

### Fase 2 (Q4 2026, post-50 customers): agregar Enterprise

Cuando crucemos 50 customers Y aparezcan ≥ 5 oportunidades multi-sucursal en pipeline:

- **Mantener:** plan único ARS 30k → renombrar a "Standard".
- **Agregar:** "Enterprise" ARS 75-120k/mes para cuentas con:
  - 2+ sucursales con consolidación.
  - SLA 4h respuesta soporte.
  - Acceso a API + integración con POS (Maxirest, Fudo).
  - Customer success manager dedicado.
  - Onboarding hands-on incluido sin cargo extra.

NO crear "Starter" en 2026. La discriminación por tamaño la maneja el descuento pilot, no un plan separado.

---

## 3. Anchoring competitivo en la landing

Texto sugerido al lado del precio:

> ARS 30.000/mes · todo incluido
>
> _Comparado con TheFork: hasta ARS 30.000/mes en comisiones por 100 reservas a EUR 2.50 c/u. Y con UnToque tus clientes son tuyos._

Variantes para distintas audiencias:
- **Tier A (volumen alto):** "TheFork te puede sacar ARS 50-80k/mes en comisiones cuando tu volumen sube. Nosotros, los mismos 30k siempre."
- **Tier B/C (volumen medio-bajo):** "Maxirest cobra licencias + módulos + soporte. UnToque: 30k todo adentro, sin sumar líneas."

---

## 4. Discount strategies

### a) Anual prepago — 10% off

Cliente paga 12 meses por adelantado: ARS 324.000 (= ARS 27.000/mes effective).

- **Pros:** mejora cash flow, reduce churn (compromiso anual), captura cuentas que prefieren pagar de una.
- **Cons:** riesgo de refunds si producto no entrega. Mitigación: cláusula de pro-rata refund por meses no usados (sin penalty).

Ofrecer activamente desde mes 4 de relación (cuando ya hay validación).

### b) Pilot 50% off 3 meses

Ya documentado en `/pilot`. Cap de 10 cuentas.

- ARS 15.000/mes meses 1-3.
- ARS 30.000/mes meses 4-6 (compromiso).
- Sin penalty por baja anticipada, pero pierde el descuento de meses no consumidos.

### c) Refer-a-friend — 1 mes free por cada referido pagado

- Cliente refiere a otro restaurante.
- Si el referido firma y paga al menos 1 mes → el referente recibe 1 mes free (crédito a próximo cobro).
- Tope: máximo 6 meses free acumulados por año por cliente.
- Tracking: campo `referred_by` en tabla `venues`. Implementar en Q2 2026.

### d) Founding member badge (no money)

Los primeros 10 (= los pilots) reciben:
- Badge "Founding Member" en su perfil público.
- Acceso permanente al precio congelado durante 12 meses.
- Mención en página `/founding-members` (opcional).

Cuesta cero, refuerza retención.

---

## 5. Currency hedge — cláusula IPC trimestral

ARS pricing tiene riesgo macro alto. Mitigación contractual:

### Cláusula sugerida en TOS

> "El precio mensual está expresado en pesos argentinos y será ajustado trimestralmente conforme al Índice de Precios al Consumidor (IPC) publicado por el INDEC, con un tope máximo de ajuste del 15% por trimestre. UnToque comunicará el nuevo precio con al menos 30 días de anticipación. El cliente podrá rescindir sin penalty dentro de los 15 días siguientes a la notificación si el ajuste no le conviene."

### Operativa

- **Q1 ajuste:** primer día de abril.
- **Q2 ajuste:** primer día de julio.
- **Q3 ajuste:** primer día de octubre.
- **Q4 ajuste:** primer día de enero.

Tope 15% protege al cliente contra hiperinflación percibida y mantiene el messaging de "previsible".

### Comunicación a clientes

Email 30 días antes con:
- Nuevo precio.
- Cuál fue la inflación del trimestre.
- Cuánto del tope se aplicó.
- Botón "rescindir sin penalty" (link a form, no autoservicio).

---

## 6. Roadmap de revisión

| Trigger | Acción |
|---------|--------|
| 25 customers | Revisar churn rate. Si > 8%/mes → revisar pricing y producto. |
| 50 customers | Lanzar Enterprise tier. Cerrar pilot program. |
| 100 customers | Considerar Starter tier (ARS 18-20k) si > 30% del pipeline son cafés/bares chicos. |
| Ajuste IPC > 50% interanual | Considerar pricing en USD blue + conversión al alta (no recurrente). |
| Competencia local lanza algo similar | Revisar todo. |

---

## 7. Lo que NO hacemos en 2026

- **Free forever tier.** Mata margen y atrae no-fit.
- **Pricing por seat.** Confunde y no escala bien con restaurantes (mozos rotan). El plan es por venue.
- **Pricing por cubierto / per-reserva.** Ese es exactamente el modelo TheFork del que nos diferenciamos.
- **Setup fees.** Suma fricción y resta convertir desde tier B/C.
- **Contratos a 12 meses obligatorios.** Suma fricción al alta. Mensual con descuento anual opcional alcanza.

---

## 8. KPIs de pricing a trackear

- **MRR total** (mensual)
- **ARPU** (= MRR / customers activos)
- **Churn rate mensual** (target < 5%)
- **Pilot → paid conversion** (target ≥ 70% pasa de pilot a standard)
- **% revenue de descuentos activos** (alerta si > 30%)
- **NRR (Net Revenue Retention) cohorte** (medir desde el sexto cohort)

Reporte mensual en `/dashboard/billing` con estos números, exportable.
