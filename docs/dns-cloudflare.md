# DNS — Cloudflare (deuntoque.com)

> Registrar: **Cloudflare** (dominio ya pago, gestionado en la cuenta de
> `ezedigital2021@gmail.com`).
> Hosting: **Vercel Hobby**.
> Status page: **BetterUptime**.
>
> ⚠ **Cloudflare proxy OFF en todos los CNAME que apuntan a Vercel** — el
> proxy naranja (orange-cloud) **no es compatible** con la verificación TLS
> de Vercel. Asegurate del ícono gris (DNS-only) en cada record marcado
> como "Proxy: OFF" abajo.

## Records a cargar / verificar

| # | Tipo  | Nombre                      | Valor / Target                | Proxy | TTL  | Notas |
|---|-------|-----------------------------|-------------------------------|-------|------|-------|
| 1 | A     | `deuntoque.com` (apex)      | `76.76.21.21`                 | OFF   | Auto | IP oficial de Vercel para apex. Alternativamente usar `ALIAS`/`CNAME flattening` apuntando a `cname.vercel-dns.com`. |
| 2 | CNAME | `www`                       | `cname.vercel-dns.com`        | OFF   | Auto | Redirige a apex vía `vercel.json` (configurado). |
| 3 | CNAME | `app`                       | `cname.vercel-dns.com`        | OFF   | Auto | PWA cliente — proyecto Vercel `app`. |
| 4 | CNAME | `panel`                     | `cname.vercel-dns.com`        | OFF   | Auto | Panel restaurante — proyecto Vercel `panel`. |
| 5 | CNAME | `status`                    | `<betteruptime-target>`       | OFF   | Auto | BetterUptime te da el target exacto al crear la status page (ej. `statuspage.betteruptime.com`). |
| 6 | TXT   | `_vercel`                   | `vc-domain-verify=...`        | —     | Auto | **PLACEHOLDER** — Vercel te da el valor cuando agregás `deuntoque.com` al proyecto. Pegalo acá. |

### Records de email (NO TOCAR — ya cargados, validados con Resend)

| # | Tipo  | Nombre                      | Valor                                      | Notas |
|---|-------|-----------------------------|--------------------------------------------|-------|
| 7 | MX   | `send.deuntoque.com`         | `feedback-smtp.us-east-1.amazonses.com` (priority 10) | Resend bounce/feedback. **No tocar.** |
| 8 | TXT  | `send.deuntoque.com`         | `v=spf1 include:amazonses.com ~all`        | SPF para subdominio `send`. **No tocar.** |
| 9 | TXT  | `resend._domainkey`          | `p=<DKIM_PUBLIC_KEY>`                      | DKIM Resend. **No tocar.** |
|10 | TXT  | `_dmarc`                     | `v=DMARC1; p=quarantine; rua=mailto:soporte@deuntoque.com` | DMARC. **No tocar.** |
|11 | TXT  | `deuntoque.com` (apex)       | `v=spf1 include:amazonses.com ~all`        | SPF apex (si lo cargaste). **No tocar.** |

## Pasos en Vercel

1. **Project `app`** (PWA cliente):
   - Settings → Domains → Add `app.deuntoque.com`.
   - Vercel valida vía CNAME (record #3 ya creado).
2. **Project `panel`** (panel restaurante):
   - Settings → Domains → Add `panel.deuntoque.com`.
   - Valida vía CNAME (record #4).
3. **Project landing/marketing** (si está separado, sino usar `app`):
   - Settings → Domains → Add `deuntoque.com` y `www.deuntoque.com`.
   - Apex valida vía A record (#1) + TXT `_vercel` (#6).
4. Forzar HTTPS en cada proyecto (Vercel lo hace automático con Let's Encrypt).

## Pasos en BetterUptime

1. Crear status page → te da un target tipo `xxx.betteruptime.com`.
2. Pegar ese target en el record #5.
3. Esperar propagación DNS (5-15 min).
4. En BetterUptime, click "Verify domain".

## Verificación post-propagación

```bash
# Apex
dig +short deuntoque.com A
# → 76.76.21.21

# Subdominios
dig +short app.deuntoque.com CNAME
dig +short panel.deuntoque.com CNAME
# → ambos: cname.vercel-dns.com

# TLS
curl -I https://app.deuntoque.com   # → HTTP/2 200, header HSTS presente
curl -I https://panel.deuntoque.com # idem

# Email (que SPF/DKIM/DMARC sigan OK después de tocar otros records)
dig +short send.deuntoque.com MX
dig +short resend._domainkey.deuntoque.com TXT
```

## Troubleshooting

- **"Invalid configuration" en Vercel** → casi siempre es proxy ON en Cloudflare.
  Pasalo a DNS-only (gris).
- **Apex no resuelve** → algunos registrars no permiten A en apex; en Cloudflare
  sí, pero podés usar también un CNAME flattening apuntando a
  `cname.vercel-dns.com` (Cloudflare lo soporta).
- **Email roto después de cambios** → revisar que ningún record SPF/DKIM/DMARC
  haya sido modificado. Resend tiene un botón de "re-verify domain" en su
  dashboard.
