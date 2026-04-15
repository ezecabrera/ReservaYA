import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service role key.
 * Bypassa RLS — usar SOLO en Server Components y API routes,
 * nunca exponer al browser.
 * Necesario porque las políticas RLS de staff_users tienen recursión
 * infinita cuando se usa la anon key + JWT de staff.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
