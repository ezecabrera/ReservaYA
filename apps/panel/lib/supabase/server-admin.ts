import { createServerClient } from '@supabase/ssr'

/**
 * Cliente Supabase con service role key (bypassa RLS).
 * Usa createServerClient de @supabase/ssr para máxima compatibilidad
 * con Next.js App Router (Server Components + API routes).
 * Nunca exponer al browser.
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  )
}
