import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/venues/[id]/reviews
 *
 * Devuelve las reseñas públicas del venue, con el nombre del autor (users.name)
 * si está disponible. Ordenadas por fecha descendente.
 *
 * Limit opcional vía ?limit=N (default 20, max 100).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '20', 10))

  const { data, error } = await supabase
    .from('reviews')
    .select('id, score, comment, created_at, user:users (name)')
    .eq('venue_id', params.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    // Migration 007 pendiente → devolver array vacío (no 503 para no romper
    // el detalle del venue, que acepta "sin reseñas" como estado válido)
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('does not exist') || msg.includes('relation')) {
      return NextResponse.json([], { headers: { 'X-Reviews-Unavailable': 'migration-pending' } })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Reshape: user.name → author
  const reshaped = (data ?? []).map((r) => ({
    id: r.id,
    score: r.score,
    comment: r.comment,
    created_at: r.created_at,
    author: (r.user as unknown as { name?: string } | null)?.name ?? 'Anónimo',
  }))
  return NextResponse.json(reshaped)
}
