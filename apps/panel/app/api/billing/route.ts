import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/** GET /api/billing — estado de la suscripción del venue */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', user.id)
    .single()

  if (!staffUser) return NextResponse.json({ error: 'Sin venue' }, { status: 403 })

  const { data: sub } = await admin
    .from('venue_subscriptions')
    .select('*')
    .eq('venue_id', staffUser.venue_id)
    .single()

  if (!sub) return NextResponse.json({ status: 'no_subscription' })

  const now = new Date()
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000))
    : 0

  return NextResponse.json({
    status: sub.status,
    trialEndsAt: sub.trial_ends_at,
    trialDaysLeft,
    currentPeriodEnd: sub.current_period_end,
    planAmount: sub.plan_amount,
    mpPreapprovalId: sub.mp_preapproval_id,
    isOwner: staffUser.role === 'owner',
  })
}
