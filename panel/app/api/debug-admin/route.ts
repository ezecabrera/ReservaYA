import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { createClient } from '@/lib/supabase/server'

// ENDPOINT TEMPORAL DE DIAGNÓSTICO — eliminar después
export async function GET(request: NextRequest) {
  const admin = createAdminClient()
  const supabase = await createClient()

  // Quién es el usuario autenticado en ESTA request
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Query directa con el ID del usuario autenticado
  let staffByUser = null
  let staffByUserError = null
  if (user) {
    const { data, error } = await admin
      .from('staff_users')
      .select('id, email, role, venue_id')
      .eq('id', user.id)
      .single()
    staffByUser = data
    staffByUserError = error ? { message: error.message, code: error.code } : null
  }

  // Todos los staff (para comparar)
  const { data: allStaff } = await admin
    .from('staff_users')
    .select('id, email, role')
    .limit(10)

  return NextResponse.json({
    auth_user: user ? { id: user.id, email: user.email } : null,
    auth_error: authError?.message ?? null,
    staff_by_user_id: staffByUser,
    staff_by_user_error: staffByUserError,
    all_staff: allStaff,
    service_key_len: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
  })
}
