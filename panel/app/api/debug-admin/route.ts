import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

// ENDPOINT TEMPORAL DE DIAGNÓSTICO — eliminar después
export async function GET() {
  const admin = createAdminClient()

  // Test 1: query simple
  const { data: rows, error: e1 } = await admin
    .from('staff_users')
    .select('id, email, role')
    .limit(5)

  // Test 2: env vars
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) ?? 'missing'
  const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) ?? 'missing'
  const keyLen = process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0

  return NextResponse.json({
    supabase_url: url,
    service_key_prefix: keyPrefix,
    service_key_len: keyLen,
    rows,
    error: e1 ? { message: e1.message, code: e1.code } : null,
  })
}
