#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  ReservaYa — Seed demo
//  Crea 20 restaurantes ficticios + cuentas staff + 10 clientes + tester.
//  Idempotente: se puede correr varias veces sin duplicar datos.
//
//  Uso:
//    pnpm seed:demo
//  Variables requeridas (.env / .env.local del root, o .env.example como fallback):
//    NEXT_PUBLIC_SUPABASE_URL
//    SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  DEMO_VENUES,
  DEMO_CLIENTS,
  TESTER_CLIENT,
  DEMO_EMAIL_DOMAIN,
  DEMO_PASSWORD,
  TESTER_EMAIL,
  TESTER_PASSWORD,
} from './demo-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── Env ───────────────────────────────────────────────────────────────────

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

// ─── Utils ─────────────────────────────────────────────────────────────────

async function ensureAuthUser({ email, password, name, phone }) {
  // listUsers paginado para buscar por email (la API no tiene filter por email)
  let page = 1
  while (page < 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase())
    if (hit) {
      // Reseteo de password por si cambió + confirmamos email
      await admin.auth.admin.updateUserById(hit.id, {
        password, email_confirm: true, user_metadata: { name, ...(phone ? { phone } : {}) },
      })
      return hit.id
    }
    if (data.users.length < 200) break
    page++
  }
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name, ...(phone ? { phone } : {}) },
  })
  if (error) throw error
  return data.user.id
}

async function upsertVenue(v) {
  const { error } = await admin.from('venues').upsert({
    id: v.id,
    name: v.name,
    address: v.address,
    phone: v.phone,
    description: v.description,
    image_url: v.image_url,
    config_json: v.config,
    cut_off_minutes: v.config.cut_off_minutes ?? 60,
    is_active: true,
  }, { onConflict: 'id' })
  if (error) throw new Error(`venue ${v.name}: ${error.message}`)
}

async function replaceZonesAndTables(v) {
  // Borro mesas y zonas previas (ON DELETE CASCADE maneja dependencias)
  await admin.from('tables').delete().eq('venue_id', v.id)
  await admin.from('zones').delete().eq('venue_id', v.id)

  let pos = 0
  for (const z of v.zones) {
    const { data: zRow, error: zErr } = await admin
      .from('zones')
      .insert({ venue_id: v.id, name: z.name, prefix: z.prefix })
      .select('id')
      .single()
    if (zErr) throw new Error(`zone ${z.name} (${v.name}): ${zErr.message}`)

    const rows = z.capacities.map((cap, i) => {
      pos += 1
      return {
        venue_id: v.id,
        zone_id: zRow.id,
        label: `${z.prefix}${i + 1}`,
        capacity: cap,
        position_order: pos,
        is_active: true,
      }
    })
    const { error: tErr } = await admin.from('tables').insert(rows)
    if (tErr) throw new Error(`tables ${z.name} (${v.name}): ${tErr.message}`)
  }
}

async function replaceMenu(v) {
  // menu_items se borra en cascada cuando borramos menu_categories
  await admin.from('menu_categories').delete().eq('venue_id', v.id)

  for (let ci = 0; ci < v.menu.length; ci++) {
    const cat = v.menu[ci]
    const { data: cRow, error: cErr } = await admin
      .from('menu_categories')
      .insert({ venue_id: v.id, name: cat.cat, sort_order: ci + 1 })
      .select('id')
      .single()
    if (cErr) throw new Error(`category ${cat.cat} (${v.name}): ${cErr.message}`)

    const rows = cat.items.map(([name, price, desc], idx) => ({
      venue_id: v.id,
      category_id: cRow.id,
      name,
      price,
      description: desc,
      availability_status: idx === cat.items.length - 1 && cat.items.length > 3 ? 'limited' : 'available',
    }))
    const { error: iErr } = await admin.from('menu_items').insert(rows)
    if (iErr) throw new Error(`items ${cat.cat} (${v.name}): ${iErr.message}`)
  }
}

async function upsertStaffOwner(v) {
  const authId = await ensureAuthUser({
    email: v.email, password: DEMO_PASSWORD, name: `Owner ${v.name}`,
  })
  const { error } = await admin.from('staff_users').upsert({
    id: authId,
    venue_id: v.id,
    name: `Owner ${v.name}`,
    role: 'owner',
    email: v.email,
  }, { onConflict: 'id' })
  if (error) throw new Error(`staff_users ${v.name}: ${error.message}`)
}

async function upsertSubscription(v) {
  // Trial vigente para que venue_has_access() == true
  const trialEnds = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  // Primero buscamos si existe
  const { data: existing } = await admin
    .from('venue_subscriptions')
    .select('id')
    .eq('venue_id', v.id)
    .maybeSingle()

  if (existing) {
    const { error } = await admin
      .from('venue_subscriptions')
      .update({ status: 'trial', trial_ends_at: trialEnds, updated_at: new Date().toISOString() })
      .eq('venue_id', v.id)
    if (error) throw new Error(`subscription ${v.name}: ${error.message}`)
  } else {
    const { error } = await admin.from('venue_subscriptions').insert({
      venue_id: v.id, status: 'trial', trial_ends_at: trialEnds, plan_amount: 4999,
    })
    if (error) throw new Error(`subscription ${v.name}: ${error.message}`)
  }
}

async function upsertClient(c) {
  const authId = await ensureAuthUser({
    email: c.email, password: c.password, name: c.name, phone: c.phone,
  })
  const { error } = await admin.from('users').upsert({
    id: authId,
    email: c.email,
    phone: c.phone ?? null,
    name: c.name,
  }, { onConflict: 'id' })
  if (error) throw new Error(`users ${c.email}: ${error.message}`)
  return authId
}

// ─── Run ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seed demo — arrancando')
  console.log(`   Supabase: ${URL}`)
  console.log(`   Venues: ${DEMO_VENUES.length} · Clientes: ${DEMO_CLIENTS.length} + 1 tester\n`)

  for (let i = 0; i < DEMO_VENUES.length; i++) {
    const v = DEMO_VENUES[i]
    const n = String(i + 1).padStart(2, '0')
    process.stdout.write(`  ${n}/20 ${v.name.padEnd(28)} ... `)
    await upsertVenue(v)
    await replaceZonesAndTables(v)
    await replaceMenu(v)
    await upsertStaffOwner(v)
    await upsertSubscription(v)
    console.log('✓')
  }

  console.log('\n👥 Clientes de prueba')
  for (const c of DEMO_CLIENTS) {
    process.stdout.write(`  ${c.email.padEnd(40)} ... `)
    await upsertClient(c)
    console.log('✓')
  }
  process.stdout.write(`  ${TESTER_CLIENT.email.padEnd(40)} ... `)
  await upsertClient(TESTER_CLIENT)
  console.log('✓ (cuenta tester destacada)')

  // ─── Credenciales ────────────────────────────────────────────────────────

  const credsJson = {
    generated_at: new Date().toISOString(),
    tester: {
      email: TESTER_EMAIL,
      password: TESTER_PASSWORD,
      name: TESTER_CLIENT.name,
      note: 'Cuenta cliente lista para login en la PWA (http://localhost:3010/login)',
    },
    staff: DEMO_VENUES.map((v, i) => ({
      n: i + 1,
      venue: v.name,
      cuisine: v.cuisine,
      email: v.email,
      password: DEMO_PASSWORD,
      role: 'owner',
      venue_id: v.id,
      address: v.address,
      phone: v.phone,
    })),
    clients: [
      ...DEMO_CLIENTS.map((c, i) => ({
        n: i + 1, email: c.email, password: c.password, name: c.name, phone: c.phone,
      })),
    ],
  }
  writeFileSync(resolve(__dirname, 'demo-credentials.json'), JSON.stringify(credsJson, null, 2))

  const md = []
  md.push('# Credenciales — entorno de testing\n')
  md.push(`Generado: ${credsJson.generated_at}\n`)
  md.push('> Todas las cuentas son ficticias. Dominio `@demo.reservaya.test` no enruta.\n')
  md.push('\n## 🎯 Cuenta tester (login rápido en la PWA)\n')
  md.push(`- **Email:** \`${TESTER_EMAIL}\``)
  md.push(`- **Password:** \`${TESTER_PASSWORD}\``)
  md.push(`- **Nombre:** ${TESTER_CLIENT.name}`)
  md.push('- **Uso:** Login en http://localhost:3010/login para probar reservas\n')

  md.push('\n## 🏪 Negocios — cuentas staff (owner)\n')
  md.push('| # | Negocio | Cocina | Email | Password | Dirección |')
  md.push('|---|---------|--------|-------|----------|-----------|')
  credsJson.staff.forEach((s) => {
    md.push(`| ${s.n} | ${s.venue} | ${s.cuisine} | \`${s.email}\` | \`${s.password}\` | ${s.address} |`)
  })
  md.push('\n> Login del panel: http://localhost:3011/login\n')

  md.push('\n## 👥 Usuarios cliente (login en PWA)\n')
  md.push('| # | Nombre | Email | Password | Teléfono |')
  md.push('|---|--------|-------|----------|----------|')
  credsJson.clients.forEach((c) => {
    md.push(`| ${c.n} | ${c.name} | \`${c.email}\` | \`${c.password}\` | ${c.phone} |`)
  })

  md.push('\n## 🔁 Cómo resetear\n')
  md.push('```bash\npnpm seed:demo:reset\n```\n')
  md.push('Esto borra todos los datos con UUID `dec0...` y cuentas `@demo.reservaya.test` + la cuenta tester. No toca La Cantina ni datos productivos.\n')

  writeFileSync(resolve(__dirname, 'demo-credentials.md'), md.join('\n'))

  console.log('\n✅ Seed completo.')
  console.log(`   → scripts/demo-credentials.md`)
  console.log(`   → scripts/demo-credentials.json`)
  console.log(`\n🎯 Tester: ${TESTER_EMAIL} / ${TESTER_PASSWORD}`)
}

main().catch((e) => {
  console.error('\n❌ Seed falló:', e.message)
  console.error(e.stack)
  process.exit(1)
})
