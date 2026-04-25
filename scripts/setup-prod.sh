#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  UnToque — Setup de producción en Vercel
#  Idempotente: podés correrlo varias veces; usa `vercel env rm` antes de add.
#
#  Uso:
#    1) Llenar `.env.prod.local` (gitignored) con los valores reales — ver
#       el bloque ENV_VARS más abajo. Si falta una var, el script la pide
#       interactivamente.
#    2) bash scripts/setup-prod.sh
#    3) vercel deploy --prod
#
#  Dónde obtener cada secreto:
#    - SUPABASE_*           → supabase.com → Project Settings → API
#    - MERCADOPAGO_*        → mercadopago.com.ar → Tu negocio → Credenciales
#    - MP_WEBHOOK_SECRET    → MP Dashboard → Webhooks → Secret
#    - META_WHATSAPP_*      → developers.facebook.com → Meta Business Suite
#                             → WhatsApp → API Setup
#    - VAPID_*              → npx web-push generate-vapid-keys
#    - SENTRY_*             → sentry.io → Settings → Auth Tokens (org+project)
#    - RESEND_API_KEY       → resend.com → API Keys (cuenta ezedigital2021@gmail.com)
#    - RESEND_TEST_SECRET   → string aleatorio para validar requests internos
#    - CRON_SECRET          → openssl rand -base64 32
#    - QR_JWT_SECRET        → openssl rand -base64 32
#    - UPSTASH_REDIS_*      → upstash.com → Redis Database → REST API
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Pre-checks ────────────────────────────────────────────────────────────────
if ! command -v vercel >/dev/null 2>&1; then
  echo "✗ Vercel CLI no encontrada. Instalá con: npm i -g vercel"
  exit 1
fi

vercel --version >/dev/null || { echo "✗ vercel --version falló"; exit 1; }

if ! vercel whoami >/dev/null 2>&1; then
  echo "✗ No estás logueado en Vercel. Corré: vercel login"
  exit 1
fi

echo "✓ Vercel CLI OK ($(vercel --version)) — usuario: $(vercel whoami)"
echo

# ── Cargar .env.prod.local si existe ──────────────────────────────────────────
ENV_FILE=".env.prod.local"
if [[ -f "$ENV_FILE" ]]; then
  echo "→ Cargando valores desde $ENV_FILE"
  # shellcheck disable=SC1090
  set -o allexport
  source "$ENV_FILE"
  set +o allexport
else
  echo "ℹ $ENV_FILE no encontrado — se pedirá cada valor interactivamente."
fi
echo

# ── Variables a configurar ────────────────────────────────────────────────────
# Pares NAME=DEFAULT (DEFAULT puede estar vacío). Se hace override con env si la
# var ya está exportada.
ENV_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL="
  "NEXT_PUBLIC_SUPABASE_ANON_KEY="
  "SUPABASE_SERVICE_ROLE_KEY="
  "QR_JWT_SECRET="
  "MERCADOPAGO_ACCESS_TOKEN="
  "MERCADOPAGO_PUBLIC_KEY="
  "MP_WEBHOOK_SECRET="
  "META_WHATSAPP_TOKEN="
  "META_WHATSAPP_PHONE_NUMBER_ID="
  "META_WHATSAPP_BUSINESS_ACCOUNT_ID="
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY="
  "VAPID_PRIVATE_KEY="
  "VAPID_SUBJECT=mailto:no-reply@deuntoque.com"
  "NEXT_PUBLIC_SENTRY_DSN="
  "SENTRY_ORG=untoque"
  "SENTRY_PROJECT=panel"
  "SENTRY_AUTH_TOKEN="
  "RESEND_API_KEY="
  "RESEND_TEST_SECRET="
  "CRON_SECRET="
  "UPSTASH_REDIS_REST_URL="
  "UPSTASH_REDIS_REST_TOKEN="
  "NEXT_PUBLIC_APP_URL=https://app.deuntoque.com"
  "NEXT_PUBLIC_PANEL_URL=https://panel.deuntoque.com"
)

ENVIRONMENTS=("production" "preview" "development")

# ── Helpers ───────────────────────────────────────────────────────────────────
prompt_value() {
  local name="$1"
  local default="$2"
  local value="${!name:-}"

  if [[ -n "$value" ]]; then
    echo "$value"
    return
  fi

  if [[ -n "$default" ]]; then
    read -r -p "  $name [$default]: " value
    value="${value:-$default}"
  else
    read -r -s -p "  $name (oculto): " value
    echo >&2
  fi
  echo "$value"
}

set_env_var() {
  local name="$1"
  local value="$2"

  for env in "${ENVIRONMENTS[@]}"; do
    # Idempotencia: rm si existe (silenciar error si no existía).
    vercel env rm "$name" "$env" --yes >/dev/null 2>&1 || true
    printf '%s' "$value" | vercel env add "$name" "$env" >/dev/null
    echo "    ✓ $name → $env"
  done
}

# ── Loop principal ────────────────────────────────────────────────────────────
echo "→ Configurando ${#ENV_VARS[@]} variables en ${#ENVIRONMENTS[@]} entornos..."
echo

for entry in "${ENV_VARS[@]}"; do
  name="${entry%%=*}"
  default="${entry#*=}"
  echo "  • $name"
  value="$(prompt_value "$name" "$default")"

  if [[ -z "$value" ]]; then
    echo "    ⚠ skip — valor vacío"
    continue
  fi

  set_env_var "$name" "$value"
done

echo
echo "✓ All env vars configured. Run: vercel deploy --prod"
