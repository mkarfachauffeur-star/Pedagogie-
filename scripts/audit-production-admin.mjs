#!/usr/bin/env node
/**
 * Audit admin (service_role) — usage ponctuel, ne pas committer la clé.
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/audit-production-admin.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY requise (variable d\'environnement uniquement).')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const COLUMN_CHECKS = [
  ['student_initial_assessments', 'recommended_hours_response'],
  ['student_initial_assessments', 'recommended_hours_responded_at'],
  ['contracts', 'status'],
  ['payments', 'receipt_number'],
  ['payments', 'payment_reference'],
]

const TABLE_COUNTS = [
  'organizations', 'profiles', 'students', 'teachers', 'student_assignments',
  'student_initial_assessments', 'student_competency_validations',
  'student_remc_item_progress', 'student_remc_history',
  'student_lesson_observations', 'conversations', 'messages', 'payments', 'contracts',
]

async function probeColumn(table, column) {
  const { error } = await admin.from(table).select(column).limit(0)
  if (!error) return 'ok'
  if (error.code === '42703' || error.message?.includes('does not exist')) return 'missing'
  return `error:${error.message}`
}

async function probeRpc(name, body) {
  const { error } = await admin.rpc(name, body)
  if (!error) return 'ok'
  if (error.code === 'PGRST202') return 'missing'
  return `ok_or_expected:${error.message?.slice(0, 60)}`
}

async function main() {
  console.log('\n=== Audit admin (service_role, lecture seule) ===\n')

  console.log('--- Colonnes migrations récentes ---')
  for (const [table, col] of COLUMN_CHECKS) {
    const status = await probeColumn(table, col)
    console.log(`${status === 'ok' ? '✅' : '❌'} ${table}.${col} — ${status}`)
  }

  console.log('\n--- RPC ---')
  for (const [name, body] of [
    ['student_respond_recommended_hours', { p_assessment_id: '00000000-0000-0000-0000-000000000001', p_response: 'accepted' }],
    ['manager_staff_password_reset_target', { p_user_id: '00000000-0000-0000-0000-000000000001' }],
    ['list_organization_users', {}],
    ['seed_default_packages', { p_org_id: '00000000-0000-0000-0000-000000000001' }],
  ]) {
    const status = await probeRpc(name, body)
    console.log(`${status.includes('missing') ? '❌' : '✅'} rpc/${name} — ${status}`)
  }

  console.log('\n--- Volumétrie (données réelles) ---')
  for (const table of TABLE_COUNTS) {
    const pk = table === 'student_assignments' ? 'student_id' : table === 'teachers' ? 'profile_id' : 'id'
    const { count, error } = await admin.from(table).select(pk, { count: 'exact', head: true })
    if (error) console.log(`⚠️  ${table} — ${error.message}`)
    else console.log(`   ${table}: ${count ?? 0} ligne(s)`)
  }

  console.log('\n--- Échantillon affectations enseignant ---')
  const { data: assignments } = await admin
    .from('student_assignments')
    .select('student_id, teacher_id, is_referent, student:student_id(first_name, last_name), teacher:teacher_id(full_name)')
    .limit(5)
  for (const row of assignments || []) {
    console.log(`   ${row.teacher?.full_name ?? row.teacher_id} → ${row.student?.first_name} ${row.student?.last_name}`)
  }

  console.log('\n--- Évaluations de départ ---')
  const { data: assessments } = await admin
    .from('student_initial_assessments')
    .select('id, status, recommended_hours_min, recommended_hours_max, recommended_hours_response')
    .limit(5)
  if (!assessments?.length) console.log('   (aucune)')
  else assessments.forEach((a) => console.log(`   ${a.id.slice(0, 8)}… status=${a.status} hours=${a.recommended_hours_min}-${a.recommended_hours_max} response=${a.recommended_hours_response ?? 'COLONNE ABSENTE'}`))

  console.log('\n=== Fin audit admin ===\n')
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
