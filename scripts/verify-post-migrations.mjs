#!/usr/bin/env node
/**
 * Vérifie que les migrations 33 et 20260612 sont appliquées (clé anon).
 * Usage: npm run verify:post-migrations
 */
const url = process.env.VITE_SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WrrXoHZQlwsb4L93a6Xykw_Qy-_8jX4'

async function probe(table, column) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${column}&limit=0`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  })
  const body = await res.text()
  if (body.includes('"code":"42703"')) return false
  return res.ok || body === '[]'
}

async function probeRpc(name) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_assessment_id: '00000000-0000-0000-0000-000000000001',
      p_response: 'accepted',
    }),
  })
  const text = await res.text()
  return !text.includes('PGRST202')
}

const checks = [
  { id: 'migration_33', label: 'Évaluation — recommended_hours_response', fn: () => probe('student_initial_assessments', 'recommended_hours_response') },
  { id: 'migration_33_rpc', label: 'RPC student_respond_recommended_hours', fn: () => probeRpc('student_respond_recommended_hours') },
  { id: 'migration_20260612_contracts', label: 'Contrats — status', fn: () => probe('contracts', 'status') },
  { id: 'migration_20260612_payments', label: 'Paiements — receipt_number + payment_reference', fn: async () =>
    (await probe('payments', 'receipt_number')) && (await probe('payments', 'payment_reference')) },
]

async function main() {
  console.log('\n=== Vérification post-migrations ===\n')
  let allOk = true
  for (const check of checks) {
    const ok = await check.fn()
    console.log(`${ok ? '✅' : '❌'} ${check.label}`)
    if (!ok) allOk = false
  }
  console.log(allOk ? '\n✅ Exports + finalisation évaluation débloqués côté schéma.\n' : '\n❌ Exécutez scripts/sql/apply-missing-migrations-production.sql\n')
  process.exit(allOk ? 0 : 1)
}

main()
