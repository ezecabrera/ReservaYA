# Iubenda — Guía de setup para UnToque

> Documento operativo para activar Iubenda en UnToque cuando se cumplan las
> condiciones de migración. Mientras la sociedad esté en trámite y el MRR sea
> bajo, mantener el copy custom actual de `/terms`, `/privacy` y `/cookies`,
> que ya cumple Ley 25.326 + Ley 24.240 (Argentina).

---

## 1. Cuándo migrar

Activar Iubenda cuando se cumplan **las tres** condiciones siguientes:

1. **Razón social inscripta** (Monotributo, SAS o S.R.L.) — necesaria para
   firmar el contrato con Iubenda y para que el documento legal nombre al
   responsable real (no un placeholder).
2. **CUIT activo** — para emitir factura B/A/C contra Iubenda y deducir el
   gasto.
3. **MRR > USD 200 / mes** — el plan Pro de Iubenda ronda los EUR 9 / mes
   por sitio. Por debajo de ese MRR, el plan Free es funcional y suficiente.

Síntomas adicionales que aceleran la migración:

- Ingreso de tráfico recurrente desde la Unión Europea (Analytics > 5 % UE).
- Necesidad de probar consentimiento ante una solicitud de la AAIP o un DPA
  europeo.
- Onboarding de un cliente B2B que pide due-diligence formal de privacidad.

---

## 2. Plan Free — alcance y limitaciones

El plan **Iubenda Free** cubre lo siguiente:

- Privacy Policy y Cookie Policy generadas a partir de un wizard.
- Hosting de los documentos en `iubenda.com/privacy-policy/<id>`.
- Embebido vía link o iframe.
- Actualización automática del texto cuando cambian leyes referenciadas
  (Ley 25.326 Argentina, GDPR EU, CCPA California).

Lo que el Free **NO** cubre y obliga a Pro:

- Cookie Solution (banner de consentimiento granular).
- Consent Database (CDB) — prueba documentada del consentimiento, requerida
  por GDPR art. 7.4.
- Internal Privacy Management (registro de actividades de tratamiento — RAT).
- Términos y Condiciones generados (no solo privacy/cookies).

Para arrancar mientras el MRR es bajo, el plan Free es suficiente para
**privacy + cookies**. Mantenemos el copy custom de **terms** porque Iubenda
Free no genera T&C.

---

## 3. Setup paso a paso — Plan Free

### 3.1. Crear cuenta

1. Ir a [iubenda.com](https://www.iubenda.com/) y registrarse con
   `hola@deuntoque.com`.
2. Verificar el email.
3. Completar datos de la empresa con la **razón social inscripta** y el CUIT.

### 3.2. Generar Privacy Policy

1. Dashboard → **+ Privacy Policy**.
2. Sitio: `https://app.deuntoque.com` (o el dominio definitivo).
3. Idioma: **Español (Argentina)**.
4. Marcos legales activados:
   - Argentina (Ley 25.326).
   - GDPR (Unión Europea).
   - CCPA (California, opcional para tráfico US).
5. Servicios — agregar exactamente los siguientes (search por nombre):
   - Mercado Pago.
   - Resend (email).
   - Meta WhatsApp Cloud API (si no aparece, usar "WhatsApp Business").
   - Vercel Analytics.
   - Vercel Hosting.
   - Supabase.
   - Sentry.
6. Datos personales tratados — marcar: nombre, apellido, teléfono, email,
   datos de uso, cookies, dirección IP, identificadores únicos.
7. Finalidades — marcar: gestión de contactos y envío de mensajes,
   gestión de pagos, hosting e infraestructura, analítica, monitoreo de
   errores.
8. Derechos del titular — Iubenda los completa automáticamente para AR + EU.
9. Datos de contacto del responsable: usar `soporte@deuntoque.com`.
10. **Generar y publicar.**

### 3.3. Generar Cookie Policy

1. Dashboard → **+ Cookie Policy** (gratis si ya tenés Privacy Policy).
2. Sitio: mismo dominio.
3. Iubenda escanea automáticamente el sitio y detecta cookies.
4. Revisar y categorizar (debería matchear con la tabla de
   `app/app/cookies/page.tsx`).
5. **Generar y publicar.**

### 3.4. Embeber en UnToque

Reemplazar el contenido de las páginas legales por un link al documento
hosteado por Iubenda **o** por un iframe embebido.

Ejemplo `app/app/privacy/page.tsx` (variante link directo):

```tsx
import Link from 'next/link'
import { LegalShell } from '@/components/legal/LegalShell'

const IUBENDA_PRIVACY_URL = 'https://www.iubenda.com/privacy-policy/<TU_ID>'

export default function PrivacyPage() {
  return (
    <LegalShell title="Política de privacidad" updated="2026-XX-XX">
      <p>
        Nuestra política de privacidad se encuentra alojada en Iubenda y se
        actualiza automáticamente con cambios regulatorios.
      </p>
      <p>
        <a href={IUBENDA_PRIVACY_URL} target="_blank" rel="noopener noreferrer">
          Leer la política de privacidad completa →
        </a>
      </p>
    </LegalShell>
  )
}
```

Conservar `LegalContact` y `IubendaPlaceholder` aunque se migre a Iubenda
para mantener visibles los datos AR (AAIP, CUIT, etc.) que Iubenda no
muestra siempre con el énfasis necesario.

---

## 4. Setup paso a paso — Plan Pro

Activar cuando MRR ≥ USD 200 / mes.

### 4.1. Cookie Solution (banner)

1. Dashboard → **Cookie Solution** → activar.
2. Configurar comportamiento:
   - Bloqueo previo de cookies no esenciales (`prior blocking`).
   - Re-consent cada 12 meses.
   - Idiomas: español + inglés.
3. Copiar el snippet generado (formato `<script>`).
4. Pegar en `app/app/layout.tsx` dentro del `<head>` o usar `next/script`
   con `strategy="beforeInteractive"`.

```tsx
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <Script
          id="iubenda-cs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `var _iub = _iub || []; _iub.csConfiguration = { ... };`,
          }}
        />
        <Script
          src="//cdn.iubenda.com/cs/iubenda_cs.js"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 4.2. Consent Database

Una vez activa la Cookie Solution, los consentimientos se almacenan
automáticamente en la CDB de Iubenda. Para invocarla desde un formulario
custom (registro, suscripción), usar el SDK `iubenda_cons_sdk.js` y enviar
los preferences al endpoint `/api/consent`.

### 4.3. Internal Privacy Management (RAT)

1. Dashboard → **Internal Privacy Management** → crear registro.
2. Mapear actividades:
   - Reservas → tratamiento principal.
   - Suscripciones B2B → tratamiento principal.
   - Marketing email → tratamiento accesorio con consentimiento.
   - Logs Sentry → tratamiento accesorio con interés legítimo.
3. Mantener el RAT actualizado cada vez que se sume un proveedor o cambie
   la finalidad.

### 4.4. Términos y Condiciones (Pro)

Iubenda Pro sí genera T&C. Si se quiere unificar, regenerar `terms` desde
el wizard de Iubenda activando módulos:

- E-commerce / SaaS.
- Suscripciones recurrentes.
- Argentina (Ley 24.240 — botón de arrepentimiento).
- Defensa del consumidor.

Sin embargo, el copy actual de `app/app/terms/page.tsx` es robusto y
adaptado a UnToque. **Recomendación: mantener T&C custom** y solo migrar
privacy + cookies a Iubenda. La integración con el botón de arrepentimiento
(`CancellationButton`) es difícil de replicar en Iubenda.

---

## 5. Checklist post-migración

- [ ] Documentos Iubenda publicados y accesibles vía URL pública.
- [ ] Páginas `/privacy` y `/cookies` apuntan al documento Iubenda.
- [ ] `LegalContact` y datos AAIP siguen visibles.
- [ ] Banner de Cookie Solution aparece en el primer ingreso.
- [ ] Test E2E: rechazar cookies → verificar que Vercel Analytics no
      establece cookies.
- [ ] CDB recibe consents y se pueden auditar desde el dashboard.
- [ ] `IubendaPlaceholder` se elimina o se cambia su prop `visible` para
      que no aparezca en producción.
- [ ] Equipo de soporte sabe cómo responder a un DSAR (Data Subject Access
      Request) usando la integración de Iubenda + nuestro flujo manual.

---

## 6. Costos estimados

| Plan       | Costo aproximado | Cubre                                               |
| ---------- | ---------------- | --------------------------------------------------- |
| Free       | USD 0            | Privacy + Cookie Policy (texto)                     |
| Essentials | USD 5 / mes      | Above + Cookie Solution básico                      |
| Advanced   | USD 9 / mes      | Above + Consent DB + multidominio                   |
| Ultra      | USD 35 / mes     | Above + RAT + DPA library + soporte priority         |

Recomendación de upgrade path:

1. **Mes 0** — Free (privacy + cookies textual).
2. **MRR USD 200** — Advanced (banner + CDB).
3. **MRR USD 1.000** — Ultra (RAT + soporte legal).

---

## 7. Contacto

- Soporte legal interno: `soporte@deuntoque.com`.
- Soporte Iubenda: `support@iubenda.com`.
- Asesoramiento legal AR: pendiente de contratación de estudio externo.
