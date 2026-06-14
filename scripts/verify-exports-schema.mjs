#!/usr/bin/env node
/**
 * Vérifie que les requêtes exports (contrats, paiements, évaluations) passent côté API.
 * Usage: npm run verify:exports-schema
 */
const url = process.env.VITE_SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WrrXoHZQlwsb4L93a6Xykw_Qy-_8jX4'

async function query(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  })
  const text = await res.text()
  return { ok: res.ok && !text.includes('"code":"42703"'), status: res.status, body: text.slice(0, 120) }
}

const checks = [
  {
    name: 'Export paiements — select receipt_number, payment_reference',
    path: 'payments?select=id,amount,paid_at,method,comment,receipt_number,payment_reference,student:student_id(first_name,last_name)&limit=1',
  },
  {
    name: 'Export contrats — select status',
    path: 'contracts?select=id,contract_total,signed_at,updated_at,status,student:student_id(first_name,last_name),package:package_id(name)&limit=1',
  },
  {
    name: 'Évaluation départ — select recommended_hours_response',
    path: 'student_initial_assessments?select=id,status,recommended_hours_min,recommended_hours_max,recommended_hours_response,completed_at&limit=1',
  },
]

async function main() {
  console.log('\n=== Vérification schéma exports & évaluation ===\n')
  let allOk = true
  for (const check of checks) {
    const result = await query(check.path)
    console.log(`${result.ok ? '✅' : '❌'} ${check.name}`)
    if (!result.ok) {
      console.log(`   HTTP ${result.status} — ${result.body}`)
      allOk = false
    }
  }
  console.log(allOk
    ? '\n✅ Requêtes exports/évaluation compatibles avec le schéma production.\n'
    : '\n❌ Schéma incompatible — vérifier les migrations.\n')
  process.exit(allOk ? 0 : 1)
}

main()
