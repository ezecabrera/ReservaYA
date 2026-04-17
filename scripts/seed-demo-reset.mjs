#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  ReservaYa — Reset seed demo
//  Borra SOLO datos ficticios:
//    - venues con UUID que empieza con "dec0..."
//    - staff_users y usuarios auth con email @demo.reservaya.test
//    - cuenta tester test@reservaya.test
//    - usuarios cliente en public.users asociados
//  No toca La Cantina (00000000-0000-0000-0000-000000000001) ni datos reales.
//
//  Uso:
//    pnpm seed:demo:reset
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { DEMO_VENUES, DEMO_EMAIL_DOMAIN, TESTER_EMAIL } from './demo-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function loadEnv() {
  const candidates = ['.env.local', '.env', '.env.example'].map((f) => resolve(ROOT, f))
  for (const file of candidates) {
    if (!existsSync(file)) continue
    const body = readFileSync(file, 'utf8')
    for (const raw of body.split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  }
}

loadEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(URL, KEY, { auth: { persistSession: false } })

async function main() {
  console.log('🧹 Reset seed demo — arrancando\n')

  // 1) Borrar venues demo (cascada: zones, tables, menu_categories, menu_items,
  //    venue_subscriptions, staff_users). Lista fija desde demo-data.
  const demoIds = DEMO_VENUES.map((v) => v.id)
  const { data: demoVenues, error: lvErr } = await admin
    .from('venues').select('id, name').in('id', demoIds)
  if (lvErr) throw lvErr

  console.log(`  Venues demo encontrados: ${demoVenues?.length ?? 0}`)
  if (demoVenues?.length) {
    const { error } = await admin.from('venues').delete().in('id', demoIds)
    if (error) throw new Error(`delete venues: ${error.message}`)
    console.log('  ✓ venues + zones + tables + menú + subscripciones borrados')
  }

  // 2) Borrar cuentas auth.users demo (staff + clientes + tester)
  //    La API admin no tiene filtro por dominio → iteramos páginas.
  let page = 1
  const toDelete = []
  while (page < 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    for (const u of data.users) {
      const email = (u.email ?? '').toLowerCase()
      if (email.endsWith('@' + DEMO_EMAIL_DOMAIN) || email === TESTER_EMAIL.toLowerCase()) {
        toDelete.push({ id: u.id, email })
      }
    }
    if (data.users.length < 200) break
    page++
  }
  console.log(`  Cuentas auth demo: ${toDelete.length}`)
  for (const u of toDelete) {
    // Borrar fila en public.users si existe (clientes)
    await admin.from('users').delete().eq('id', u.id)
    // staff_users ya se borró en cascada con el venue
    await admin.auth.admin.deleteUser(u.id)
  }
  if (toDelete.length) console.log('  ✓ cuentas auth borradas')

  console.log('\n✅ Reset completo.')
}

main().catch((e) => {
  console.error('\n❌ Reset falló:', e.message)
  console.error(e.stack)
  process.exit(1)
})
