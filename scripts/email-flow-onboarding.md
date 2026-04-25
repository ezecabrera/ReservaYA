# Email automation onboarding — UnToque

Spec del flow de bienvenida post-signup. **No-implementación**, sólo diseño. Cuando se implemente: cron daily en Vercel + tabla `email_flow_state` en Supabase con columnas (`venue_id`, `email`, `signup_at`, `last_email_sent`, `next_due_at`, `paused`).

Sender: `hola@deuntoque.com` (alias Resend ya activo).
Reply-to: WhatsApp del founder (mismo dominio responde a personal inbox).

---

## Email 1 — Bienvenida (instantáneo, t=0)

**Subject:** Bienvenido a UnToque, {{nombre}}

**Preview text:** Configurás tu venue en 10 minutos y listo. Te dejo el camino más corto.

**Copy completo:**

Hola {{nombre}},

Buenísimo tenerte adentro. Soy Eze, founder de UnToque. Te escribo personalmente porque los primeros 50 venues los acompaño yo.

Lo más importante en estos 10 primeros minutos es que tu panel quede operativo. Tenés 3 cosas para configurar y listo:

1. **Tu venue** (nombre, horarios, foto). 3 minutos.
2. **Tus mesas** (cantidad, capacidad, zonas). 4 minutos. Si tenés un Excel, te lo importamos.
3. **WhatsApp Business** (número y mensaje de bienvenida). 3 minutos.

→ [**Configurá tu venue ahora**](https://app.deuntoque.com/onboarding) (10min)

Si te trabás en cualquier paso, mandame WhatsApp directo: +54 9 11 XXXX XXXX. Respondo yo.

Eze
founder UnToque

---

**CTA principal:** "Configurá tu venue ahora" → `/onboarding`
**Métrica de éxito:** % de cuentas que completan onboarding en las primeras 24h. Target: ≥ 60%.

---

## Email 2 — ¿Cargaste tus mesas? (día 2, t=48h)

**Trigger condition:** sólo enviar si `tables_count = 0` al día 2.

**Subject:** ¿Te trabaste con las mesas?

**Preview text:** Vi que el setup quedó a medio camino. Te tiro una mano.

**Copy completo:**

Hola {{nombre}},

Pasaron 2 días desde que entraste y veo que las mesas todavía no están cargadas. No es drama — pasa todo el tiempo.

Si lo que te frenó es la carga manual, tenemos un importador CSV que come Excel directo:

[GIF — 6 segundos del importador funcionando: CSV → drag → preview → confirmar]

→ [**Importá desde CSV**](https://app.deuntoque.com/dashboard/tables/import) (2min)

O si preferís el wizard guiado, va por acá:

→ [**Cargá una por una**](https://app.deuntoque.com/dashboard/tables/new)

¿Qué sistema venís usando? Maxirest, Fudo, TheFork, Excel, libreta a mano — decímelo respondiendo este mail y te paso una plantilla de CSV específica para ese sistema.

Eze

---

**CTA principal:** "Importá desde CSV" → `/dashboard/tables/import`
**Métrica de éxito:** % que cargan mesas en las 48h posteriores al email. Target: ≥ 35%.

---

## Email 3 — Caso de uso (día 5, t=120h)

**Trigger condition:** enviar a todos (haya o no completado setup). Storytelling sobre el primer fin de semana real.

**Subject:** Lo que hace un porteño en su primer finde con UnToque

**Preview text:** Una historia corta sobre cómo se ve la cosa cuando arranca.

**Copy completo:**

Hola {{nombre}},

Te cuento cómo se vive un viernes-sábado-domingo típico de un restaurante porteño que arrancó con UnToque hace 2 meses.

**Viernes 19h.** Suena un toast en el celu del salón: "Reserva nueva — María, 4 personas, 21:30". El mozo abre el panel, ve la mesa 7 sugerida automáticamente y confirma. María recibe WhatsApp: "Listo María, te esperamos a las 21:30 en mesa 7. Si no podés venir, mandame *NO* y libero la mesa."

**Sábado 13h.** El dueño abre el dashboard mientras desayuna. Ve que el sábado a la noche está al 92% de capacidad y todavía faltan 7 horas. Arma una storie de IG con "quedan 3 mesas" y la sube. Llena.

**Domingo 22h, cierre.** Abre la pestaña de Analytics: 78 cubiertos servidos, ticket promedio ARS 14.200, no-shows 4% (uno solo). Manda un WhatsApp masivo segmento "Primera visita" con un descuento del 10% para volver dentro de los 30 días.

Eso es UnToque andando. Sin esfuerzo, sin libreta, sin Excel.

→ [**Volvé al panel**](https://app.deuntoque.com/dashboard) y armá tu primer fin de semana así.

¿Tenés alguna duda específica sobre cómo armar tu setup para el próximo finde? Respondé este mail.

Eze

---

**CTA principal:** "Volvé al panel" → `/dashboard`
**Métrica de éxito:** clicks al panel desde este email + replies. Target: CTR ≥ 18%, reply rate ≥ 5%.

---

## Email 4 — Probá una campaña winback (día 10, t=240h)

**Trigger condition:** enviar a venues con `customers_count >= 5`. Si no llegan a 5 clientes, postergar 5 días más.

**Subject:** Tenés clientes dormidos, despertalos

**Preview text:** 3 clicks para mandar un WhatsApp masivo al segmento "no volvieron en 60 días".

**Copy completo:**

Hola {{nombre}},

Tu CRM ya tiene clientes cargados. Buenísimo. Ahora la pregunta: **¿cuántos no volvieron en los últimos 60 días?**

Casi siempre la respuesta es: la mitad. Y casi siempre, basta un mensaje bien escrito para recuperar al 15-20% de ellos.

Te dejo el template pre-cargado para que pegues un toque y mandes una campaña en 3 clicks:

→ [**Abrir campaña winback**](https://app.deuntoque.com/dashboard/campaigns/new?segment=dormidos&template=winback-default)

El template viene así (lo podés editar):

> Hola {{cliente}}, soy {{venue}}. Hace tiempo que no te vemos por acá y te queríamos invitar de vuelta. Esta semana tenemos {{plato_destacado}} en carta — si reservás antes del domingo, te invitamos el café de cierre. ¿Te tiramos mesa?

Si lo lanzás esta semana, te pongo en una llamada con vos para revisar los resultados juntos. Sólo tenés que responderme con "lancé" cuando lo mandes.

Eze

---

**CTA principal:** "Abrir campaña winback" → `/dashboard/campaigns/new?segment=dormidos&template=winback-default`
**Métrica de éxito:** % de venues que mandan al menos 1 campaña en los 14 días post-email. Target: ≥ 25%.

---

## Implementación cuando se haga (resumen técnico)

```sql
-- supabase/migrations/email_flow_state.sql
create table email_flow_state (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id) on delete cascade,
  email text not null,
  signup_at timestamptz not null default now(),
  last_email_sent text, -- 'welcome' | 'tables_nudge' | 'storytelling' | 'winback'
  last_email_at timestamptz,
  next_due_at timestamptz,
  paused boolean default false,
  unique (venue_id)
);
```

Cron Vercel diario (UTC 13:00 = 10:00 ART):
- Buscar `email_flow_state` con `paused=false` y `next_due_at <= now()`.
- Decidir próximo email según `last_email_sent` y condiciones de trigger.
- Llamar Resend API (alias hola@deuntoque.com).
- Update `last_email_sent`, `last_email_at`, `next_due_at`.

Pause manual: cuando cliente responde cualquier email, marcar `paused=true` para evitar mandar el siguiente del flow mientras hay conversación humana viva.

Tracking: cada link con `?utm_source=onboarding-flow&utm_campaign=email-{1|2|3|4}`.
