#!/usr/bin/env node
/**
 * Validation fonctionnelle production (service_role + smoke HTTP).
 * Usage: npm run validate:production
 * Requiert SUPABASE_SERVICE_ROLE_KEY (via .env / .env.local ou export).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const name of ['.env', '.env.local']) {
  try {
    const text = readFileSync(join(root, name), 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // absent
  }
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const frontUrl = process.env.VITE_APP_URL || 'https://pedagogia-drive.vercel.app'

const results = []

function record(id, label, status, detail = '') {
  results.push({ id, label, status, detail })
  const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : status === 'skip' ? '⏭️' : '❌'
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ''}`)
}

async function smokeRoute(path, expectStatus = 200) {
  const res = await fetch(`${frontUrl}${path}`, { redirect: 'follow' })
  return res.status === expectStatus || (expectStatus === 200 && res.status < 400)
}

async function validateWithAdmin(admin) {
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, role, full_name, email, is_active, organization_id')
    .order('role')

  if (profilesError) {
    record('profiles', 'Profils en base', 'fail', profilesError.message)
    return
  }

  const byRole = {}
  for (const role of ['manager', 'secretary', 'teacher', 'student']) {
    byRole[role] = profiles.filter((p) => p.role === role && p.is_active !== false)
  }

  for (const role of ['manager', 'secretary', 'teacher', 'student']) {
    const count = byRole[role]?.length ?? 0
    record(
      `auth_${role}`,
      `Comptes ${role} actifs`,
      count > 0 ? 'pass' : 'fail',
      count > 0 ? `${count} compte(s)` : 'aucun compte actif',
    )
  }

  const { data: assignments, error: assignError } = await admin
    .from('student_assignments')
    .select(`
      student_id,
      teacher_id,
      is_referent,
      student:student_id(id, first_name, last_name, profile_id),
      teacher:teacher_id(id, full_name, profile_id)
    `)

  if (assignError) {
    record('assignments', 'Affectations enseignant ↔ élève', 'fail', assignError.message)
  } else {
    const referent = (assignments || []).filter((a) => a.is_referent)
    record(
      'assignments',
      'Affectations enseignant ↔ élève',
      referent.length > 0 ? 'pass' : 'warn',
      `${referent.length} référent(s) / ${assignments?.length ?? 0} affectation(s)`,
    )
    for (const row of referent.slice(0, 5)) {
      console.log(`     → ${row.teacher?.full_name ?? '?'} → ${row.student?.first_name} ${row.student?.last_name}`)
    }
    const imeneSalma = referent.find(
      (row) =>
        /imène|imene/i.test(row.teacher?.full_name || '')
        && /salma/i.test(row.student?.first_name || ''),
    )
    record(
      'assign_imene_salma',
      'Affectation Imène → Salma',
      imeneSalma ? 'pass' : 'warn',
      imeneSalma ? 'confirmée en base' : 'non trouvée (vérifier manuellement)',
    )
  }

  const { count: apptCount, error: apptError } = await admin
    .from('appointments')
    .select('id', { count: 'exact', head: true })
  record(
    'planning',
    'Planning (appointments)',
    apptError ? 'fail' : apptCount > 0 ? 'pass' : 'warn',
    apptError ? apptError.message : `${apptCount ?? 0} rendez-vous en base (gérant AdminPlanningPage)`,
  )

  const { data: assessments, error: assessError } = await admin
    .from('student_initial_assessments')
    .select('id, status, recommended_hours_response')
    .limit(10)
  if (assessError) {
    record('assessment', 'Évaluation de départ', 'fail', assessError.message)
  } else {
    const completed = (assessments || []).filter((a) => ['completed', 'in_progress'].includes(a.status))
    record(
      'assessment',
      'Évaluation de départ',
      completed.length > 0 ? 'pass' : 'warn',
      `${completed.length} évaluation(s) active(s) / ${assessments?.length ?? 0} total`,
    )
  }

  const { count: staffContracts, error: staffContractError } = await admin
    .from('staff_employment_contracts')
    .select('id', { count: 'exact', head: true })
  const { count: studentContracts, error: studentContractError } = await admin
    .from('contracts')
    .select('id', { count: 'exact', head: true })

  if (staffContractError || studentContractError) {
    record('contracts', 'Contrats', 'fail', staffContractError?.message || studentContractError?.message)
  } else {
    record(
      'contracts',
      'Contrats',
      studentContracts > 0 || staffContracts > 0 ? 'pass' : 'warn',
      `${studentContracts ?? 0} contrat(s) élève · ${staffContracts ?? 0} contrat(s) staff`,
    )
  }

  const { count: paymentsCount, error: paymentsError } = await admin
    .from('payments')
    .select('id', { count: 'exact', head: true })
  const { data: paymentSample } = await admin
    .from('payments')
    .select('receipt_number, payment_reference')
    .limit(1)
  if (paymentsError) {
    record('payments', 'Paiements', 'fail', paymentsError.message)
  } else {
    const hasReceiptCols = paymentSample?.length
      ? paymentSample[0].receipt_number !== undefined
      : true
    record(
      'payments',
      'Paiements',
      paymentsCount > 0 && hasReceiptCols ? 'pass' : paymentsCount > 0 ? 'warn' : 'warn',
      `${paymentsCount ?? 0} paiement(s) · colonnes reçu ${hasReceiptCols ? 'OK' : 'manquantes'}`,
    )
  }

  const { count: convCount } = await admin.from('conversations').select('id', { count: 'exact', head: true })
  const { count: msgCount } = await admin.from('messages').select('id', { count: 'exact', head: true })
  record(
    'messaging',
    'Messagerie',
    convCount > 0 && msgCount > 0 ? 'pass' : convCount > 0 ? 'warn' : 'warn',
    `${convCount ?? 0} conversation(s) · ${msgCount ?? 0} message(s)`,
  )

  const { count: notifCount } = await admin.from('notifications').select('id', { count: 'exact', head: true })
  record(
    'notifications',
    'Notifications (messagerie)',
    notifCount > 0 ? 'pass' : 'warn',
    `${notifCount ?? 0} notification(s)`,
  )

  const exportTables = ['students', 'teachers', 'payments', 'contracts', 'vehicles', 'student_lesson_observations']
  let exportOk = true
  for (const table of exportTables) {
    const { error } = await admin.from(table).select('id').limit(1)
    if (error) exportOk = false
  }
  record(
    'export',
    'Export réglementaire (tables sources)',
    exportOk ? 'pass' : 'fail',
    exportOk ? 'toutes les tables exportables lisibles' : 'table manquante ou inaccessible',
  )
}

async function validateAnonSmoke() {
  console.log('\n--- Smoke front (sans authentification) ---\n')

  const routes = [
    ['/', 'Page d\'accueil'],
    ['/login', 'Page connexion'],
    ['/manager/dashboard', 'Route gérant (redirige ou charge SPA)'],
    ['/teacher/students', 'Route enseignant'],
    ['/student/dashboard', 'Route élève'],
  ]

  for (const [path, label] of routes) {
    try {
      const ok = await smokeRoute(path)
      record(`front${path.replace(/\//g, '_')}`, label, ok ? 'pass' : 'fail', ok ? 'HTTP OK' : 'erreur HTTP')
    } catch (error) {
      record(`front${path.replace(/\//g, '_')}`, label, 'fail', error.message)
    }
  }

  if (anonKey) {
    const res = await fetch(`${url}/rest/v1/students?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    })
    const blocked = res.ok && (await res.json()).length === 0
    record('rls_students', 'RLS élèves (anon bloqué)', blocked ? 'pass' : 'warn', blocked ? '0 ligne sans auth' : 'accès inattendu')
  }
}

async function main() {
  console.log('\n=== Validation fonctionnelle production ===')
  console.log(`Supabase: ${url}`)
  console.log(`Front:    ${frontUrl}\n`)

  await validateAnonSmoke()

  if (!serviceKey) {
    console.log('\n--- Données métier (service_role) ---\n')
    record('service_role', 'Audit données métier', 'skip', 'SUPABASE_SERVICE_ROLE_KEY absente — exportez la clé puis relancez')
    printSummary()
    process.exit(1)
  }

  console.log('\n--- Données métier (service_role) ---\n')
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  await validateWithAdmin(admin)

  printSummary()
}

function printSummary() {
  const failed = results.filter((r) => r.status === 'fail')
  const warned = results.filter((r) => r.status === 'warn')
  const passed = results.filter((r) => r.status === 'pass')

  console.log('\n=== Synthèse ===')
  console.log(`✅ ${passed.length}  ⚠️ ${warned.length}  ❌ ${failed.length}  ⏭️ ${results.filter((r) => r.status === 'skip').length}`)
  if (failed.length) {
    console.log('\nÉchecs :')
    failed.forEach((r) => console.log(`  - ${r.label}: ${r.detail}`))
  }
  if (warned.length) {
    console.log('\nAvertissements (test manuel recommandé) :')
    warned.forEach((r) => console.log(`  - ${r.label}: ${r.detail}`))
  }
  console.log('')
  process.exit(failed.length ? 1 : warned.length ? 0 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
