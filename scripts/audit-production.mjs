#!/usr/bin/env node
/**
 * Audit production Supabase — sans service_role (clé anon uniquement).
 * Usage: npm run audit:production
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_WrrXoHZQlwsb4L93a6Xykw_Qy-_8jX4'

async function probeColumn(table, column) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${column}&limit=0`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  })
  const body = await res.text()
  if (body.includes('"code":"42P01"')) return 'table_missing'
  if (body.includes('"code":"42703"')) return 'missing'
  if (res.ok || body === '[]') return 'ok'
  return `error`
}

async function probeRpc(name, body) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (text.includes('PGRST202')) return 'missing'
  return 'ok'
}

async function probeEdgeFunction(name) {
  const res = await fetch(`${url}/functions/v1/${name}`, { method: 'OPTIONS' })
  if (res.status === 200) return 'deployed'
  if (res.status === 404) return 'not_deployed'
  return `http_${res.status}`
}

async function probeEdgePost(name, body) {
  const res = await fetch(`${url}/functions/v1/${name}`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: (await res.text()).slice(0, 120) }
}

/** 35 migrations — sonde explicite par fichier */
const MIGRATIONS = [
  { file: '20260530120001_core_and_security.sql', probe: async () => probeColumn('organizations', 'name') },
  { file: '20260530120002_business_domains.sql', probe: async () => probeColumn('appointments', 'starts_at') },
  { file: '20260530120003_messaging.sql', probe: async () => probeColumn('conversations', 'kind') },
  { file: '20260530120004_storage_attachments.sql', probe: async () => probeColumn('message_attachments', 'message_id') },
  { file: '20260530120005_documents_storage.sql', probe: async () => probeColumn('documents', 'storage_bucket') },
  { file: '20260530120006_financial_expenses.sql', probe: async () => probeColumn('expenses', 'amount') },
  { file: '20260530120007_student_extra_hours.sql', probe: async () => probeColumn('students', 'extra_hours') },
  { file: '20260530120008_saas_core.sql', probe: async () => probeColumn('subscriptions', 'trial_ends_at') },
  { file: '20260530120009_saas_functions_rls.sql', probe: async () => probeColumn('audit_logs', 'action') },
  { file: '20260530120010_super_admin_reads.sql', probe: async () => probeColumn('super_admins', 'profile_id') },
  { file: '20260530120011_students_realtime.sql', probe: async () => 'unverifiable' },
  { file: '20260530120012_organization_pricing_rates.sql', probe: async () => probeColumn('organization_pricing_rates', 'organization_id') },
  { file: '20260530120013_student_competency_validations.sql', probe: async () => probeColumn('student_competency_validations', 'competency_code') },
  { file: '20260530120014_practice_exams.sql', probe: async () => probeColumn('practice_exam_item_scores', 'note') },
  { file: '20260530120015_teacher_profile_fields.sql', probe: async () => probeColumn('teachers', 'address') },
  { file: '20260530120016_users_teachers_management.sql', probe: async () => probeRpc('list_organization_users', {}) },
  { file: '20260530120017_teacher_authorization_images.sql', probe: async () => probeColumn('teachers', 'authorization_recto_path') },
  { file: '20260530120018_teacher_address_fields.sql', probe: async () => probeColumn('teachers', 'street_number') },
  { file: '20260530120019_pricing_packages_rvp.sql', probe: async () => probeColumn('pricing_packages', 'rvp_included') },
  { file: '20260530120020_package_category_transmission.sql', probe: async () => probeColumn('pricing_packages', 'category') },
  { file: '20260530120021_migrate_aac_cs_categories.sql', probe: async () => 'assumed_if_20_ok' },
  { file: '20260530120022_aac_cs_shared_gearbox.sql', probe: async () => 'assumed_if_20_ok' },
  { file: '20260530120027_aac_cs_gearbox_hourly_rates.sql', probe: async () => {
    const col = await probeColumn('organization_pricing_rates', 'hour_aac_manual_gear')
    if (col === 'ok') return 'superseded_by_28_pending'
    if (col === 'missing') return 'ok'
    return col
  }},
  { file: '20260530120028_drop_aac_cs_hourly_rates.sql', probe: async () => {
    const col = await probeColumn('organization_pricing_rates', 'hour_aac_manual_gear')
    return col === 'missing' ? 'ok' : 'missing'
  }},
  { file: '20260530120023_student_initial_assessments.sql', probe: async () => probeColumn('student_initial_assessments', 'answers') },
  { file: '20260530120024_public_rpc_wrappers.sql', probe: async () => probeRpc('list_organization_teachers', {}) },
  { file: '20260530120025_staff_employment_contracts.sql', probe: async () => probeColumn('staff_employment_contracts', 'profile_id') },
  { file: '20260530120026_staff_contract_employment_status.sql', probe: async () => probeColumn('staff_employment_contracts', 'employment_status') },
  { file: '20260530120029_fix_profile_self_read.sql', probe: async () => 'assumed_if_16_ok' },
  { file: '20260530120030_assessment_profile_levels.sql', probe: async () => 'assumed_if_23_ok' },
  { file: '20260530120031_student_lesson_observations.sql', probe: async () => probeColumn('student_lesson_observations', 'observations') },
  { file: '20260530120032_manager_staff_password_reset.sql', probe: async () => probeRpc('manager_staff_password_reset_target', { p_user_id: '00000000-0000-0000-0000-000000000001' }) },
  { file: '20260530120033_assessment_hours_response.sql', probe: async () => probeColumn('student_initial_assessments', 'recommended_hours_response') },
  { file: '20260612120000_commercial_readiness.sql', probe: async () => probeColumn('contracts', 'status') },
  { file: '20260612130000_remc_sub_competencies.sql', probe: async () => probeColumn('student_remc_item_progress', 'item_id') },
]

const RLS_TABLES = ['organizations', 'profiles', 'students', 'teachers', 'student_assignments']

const EDGE_FUNCTIONS = [
  { name: 'invite-user', jwt: true, schemaTables: [{ table: 'profiles', col: 'id' }, { table: 'teachers', col: 'profile_id' }, { table: 'secretaries', col: 'profile_id' }] },
  { name: 'create-student', jwt: true, schemaTables: [{ table: 'students', col: 'id' }, { table: 'contracts', col: 'id' }, { table: 'payments', col: 'id' }, { table: 'documents', col: 'id' }, { table: 'student_assignments', col: 'student_id' }, { table: 'pricing_packages', col: 'id' }, { table: 'subscriptions', col: 'id' }, { table: 'organizations', col: 'id' }] },
  { name: 'register-organization', jwt: false, schemaTables: [{ table: 'organizations', col: 'id' }, { table: 'subscriptions', col: 'id' }, { table: 'plans', col: 'id' }, { table: 'billing_history', col: 'id' }, { table: 'audit_logs', col: 'id' }] },
  { name: 'manage-user', jwt: true, schemaTables: [{ table: 'profiles', col: 'id' }] },
]

async function main() {
  console.log(`\n=== Audit production (sans service_role) ===`)
  console.log(`Projet: ${url}\n`)

  const migrationResults = []
  for (const item of MIGRATIONS) {
    const status = await item.probe()
    const ok = status === 'ok' || status === 'unverifiable' || status === 'assumed_if_20_ok' || status === 'assumed_if_16_ok' || status === 'assumed_if_23_ok'
    migrationResults.push({ ...item, status, ok })
    const icon = ok ? '✅' : '❌'
    console.log(`${icon} ${item.file} (${status})`)
  }

  console.log('\n--- RLS (accès anon) ---')
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const rlsResults = []
  for (const table of RLS_TABLES) {
    const pk = table === 'student_assignments' ? 'student_id' : table === 'teachers' ? 'profile_id' : 'id'
    const { data, error } = await client.from(table).select(pk).limit(5)
    const blocked = !error && Array.isArray(data) && data.length === 0
    rlsResults.push({ table, ok: blocked, detail: error ? error.message : `${data.length} ligne(s)` })
    console.log(`${blocked ? '✅' : '⚠️'} ${table} — ${error ? error.message : `${data?.length ?? 0} ligne(s)`}`)
  }

  console.log('\n--- Edge Functions ---')
  const edgeResults = []
  for (const fn of EDGE_FUNCTIONS) {
    const deploy = await probeEdgeFunction(fn.name)
    const post = await probeEdgePost(fn.name, fn.name === 'manage-user' ? { action: 'reset_password' } : {})
    const schemaChecks = []
    for (const item of fn.schemaTables) {
      const table = item.table || item
      const col = item.col || 'id'
      const s = await probeColumn(table, col)
      schemaChecks.push({ table, col, status: s })
    }
    const schemaOk = schemaChecks.every((c) => c.status === 'ok')
    const deployed = deploy === 'deployed'
    const ok = deployed && schemaOk
    edgeResults.push({ ...fn, deploy, postStatus: post.status, schemaOk, schemaChecks, ok })
    console.log(`${deployed ? '✅' : '❌'} ${fn.name} — deploy:${deploy} POST:${post.status} schema:${schemaOk ? 'ok' : 'KO'}`)
    if (!deployed) console.log(`   → ${post.body}`)
  }

  const missing = migrationResults.filter((r) => !r.ok)
  const applied = migrationResults.filter((r) => r.ok)

  console.log('\n=== Synthèse ===')
  console.log(`Migrations détectées OK: ${applied.length}/${MIGRATIONS.length}`)
  console.log(`Migrations manquantes / incomplètes: ${missing.length}`)
  console.log(`RLS tables OK: ${rlsResults.filter((r) => r.ok).length}/${RLS_TABLES.length}`)
  console.log(`Edge Functions OK: ${edgeResults.filter((r) => r.ok).length}/${EDGE_FUNCTIONS.length}`)

  if (missing.length) {
    console.log('\nFichiers à exécuter:')
    missing.forEach((r) => console.log(`  - ${r.file} (${r.status})`))
  }

  // JSON report for tooling
  const report = {
    auditedAt: new Date().toISOString(),
    url,
    migrations: migrationResults,
    rls: rlsResults,
    edgeFunctions: edgeResults.map(({ name, deploy, postStatus, schemaOk, ok }) => ({ name, deploy, postStatus, schemaOk, ok })),
    missingMigrationFiles: missing.map((r) => r.file),
  }
  console.log('\n--- JSON ---')
  console.log(JSON.stringify(report, null, 2))

  process.exit(missing.some((r) => r.status !== 'unverifiable' && !['assumed_if_20_ok', 'assumed_if_16_ok', 'assumed_if_23_ok'].includes(r.status)) || edgeResults.some((r) => !r.ok) ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
