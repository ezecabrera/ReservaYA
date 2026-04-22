import { createServerClient } from '@supabase/ssr'

/**
 * Cliente Supabase con service role key (bypassa RLS).
 * Nunca exponer al browser — solo usar en Server Components y API routes.
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
