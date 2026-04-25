# Notion CRM — Template UnToque

Estructura de la base de datos personal del founder para gestionar pipeline de outreach + customers.

URL workspace: privada (Notion personal, ezedigital2021@gmail.com).

---

## 1. Database principal: `Leads UnToque`

### Properties

| Property | Type | Detalle |
|----------|------|---------|
| Restaurante | Title | Nombre del local. |
| Tipo | Select | Restaurante / Bar / Café / Bistró / Cantina / Pizzería / Otro |
| Ciudad | Select | CABA / GBA / Rosario / Mendoza / Córdoba / Mar del Plata / La Plata / Otro |
| Tier | Select | A (>5k IG) / B (1-5k) / C (<1k) |
| Status | Select | Cold / Reached / Demo Booked / Demo Done / Pilot Signed / Customer / Lost |
| Owner | Person | Quién lo trabaja (founder por defecto) |
| Email | Email | Mail principal |
| Teléfono | Phone | WhatsApp preferentemente |
| IG | URL | Link al perfil IG |
| Última Actividad | Date | Cuándo fue el último touch |
| Próxima Acción | Date | Cuándo hay que volver a tocar |
| Notas | Text | Free-form. Insights, objeciones, fragmentos de calls. |
| Fuente | Select | Outreach scraping / Referido / Inbound web / Evento / Cold IG DM |
| MRR | Number (currency ARS) | Sólo cuando pasa a Customer. |
| Lost Reason | Select | Precio / Tiempo / Compite con TheFork / Sin volumen / Sin respuesta / Otro |
| Demo Date | Date | Si tiene demo agendada en Cal.com |

### Status flow esperado

```
Cold → Reached → Demo Booked → Demo Done → Pilot Signed → Customer
                                              ↘
                                              Lost (con Lost Reason)
```

---

## 2. Vistas

### V1 — Pipeline (board by Status)
- Columnas: Cold | Reached | Demo Booked | Demo Done | Pilot Signed | Customer | Lost
- Card muestra: Restaurante (title), Tier (badge color), Próxima Acción.
- Sort dentro de cada columna: Próxima Acción asc.
- Uso: vista del founder cada mañana para mover cosas.

### V2 — Daily (filter Próxima Acción = today)
- Filtro: `Próxima Acción is today` AND `Status != Lost`.
- Sort: Tier desc (A primero).
- Uso: lo que hay que tocar hoy. Si esto está vacío, te llevás libre la mañana.

### V3 — Demo Calendar (calendar by Demo Date)
- Vista calendario semanal sincronizada con Cal.com.
- Filtro: `Demo Date is not empty`.
- Uso: ver el panorama de demos al mes.

### V4 — Lost Reasons (board by Lost Reason)
- Filtro: `Status = Lost`.
- Agrupado por `Lost Reason`.
- Uso: análisis trimestral de por qué pierdo deals. Si "Precio" sube → revisar pricing. Si "Compite con TheFork" sube → revisar messaging.

### V5 — Customer LTV (table)
- Filtro: `Status = Customer`.
- Columnas visibles: Restaurante, Ciudad, MRR, Fecha Customer (rollup), Notas.
- Sum de MRR al pie.
- Uso: ver MRR total + churn manual.

---

## 3. Automations Notion (gratis)

Las automations de Notion en plan free son limitadas pero alcanzan:

1. **Status = Demo Booked → notif al founder**
   - Trigger: cuando `Status` cambia a `Demo Booked`.
   - Acción: enviar email a `ezedigital2021@gmail.com` con link al lead.
   - Implementación: Notion native automation (Database → Automations → New).

2. **Status = Pilot Signed → setear Próxima Acción**
   - Trigger: cuando `Status` cambia a `Pilot Signed`.
   - Acción: setear `Próxima Acción` a `today + 7 días` (call de feedback semana 1).

3. **Status = Lost → archivar de vista Pipeline**
   - Trigger: cuando `Status` cambia a `Lost`.
   - Acción: filtrar fuera de Pipeline view automáticamente (vía filter, no automation).

Si se quiere algo más rico (Slack, recordatorios push, sync bidireccional con Cal.com): usar Zapier/Make tier free hasta 100 ops/mes.

---

## 4. Sincronización con outreach scraping

- **Import semanal:** correr `scripts/outreach-scrape.py` lunes 9hs ART. Output CSV.
- **Bulk import a Notion:** Notion permite drag-and-drop CSV directo a la base. Mapear columnas:
  - `name` → Restaurante
  - `city` → Ciudad
  - `type` → Tipo
  - `instagram` → IG
  - `email` → Email
  - `phone` → Teléfono
  - `gmaps_url` → Notas (concat)
  - `tier` → Tier
  - `status` → Status (siempre "Cold" al importar)
- **Dedupe:** Notion no dedupea solo. Antes de importar, chequear `Restaurante` contra los existentes con un export rápido. Si querés, usar [csvtools.online](https://csvtools.online) para diff.

---

## 5. Backup

- **Export semanal:** Notion → ⋯ → Export as CSV. Guardar en `~/UnToque/crm-backups/leads-YYYY-MM-DD.csv`.
- Subir copia a Drive personal cada lunes (recordatorio en Cal.com).
- En 6 meses, cuando crucemos los 50 customers, evaluar migración a Hubspot free o Pipedrive (Notion ya no escala bien con > 500 leads activos).

---

## 6. Templates de página por Status

Cada lead puede tener una página interna con un template precargado según status. Ejemplos rápidos:

### Template "Demo Done"
```
## Resumen de la demo
- Fecha:
- Asistentes (cliente):
- Sistema actual:
- Pain points top 3:
  1.
  2.
  3.
- Reacciones a UnToque:
- Objeciones que aparecieron:
- Próximo paso compromiso (qué + cuándo):
- Probabilidad estimada de cerrar (%):
```

### Template "Customer"
```
## Onboarding
- Fecha de signup:
- Plan: Pilot / Standard / Enterprise
- MRR firmado: ARS
- Compromiso hasta:
- Punto de contacto principal:
- WhatsApp del dueño:

## Calls de feedback
- [ ] Mes 1 — fecha:
- [ ] Mes 2 — fecha:
- [ ] Mes 3 — fecha:

## Casos de éxito acumulados
-
```
