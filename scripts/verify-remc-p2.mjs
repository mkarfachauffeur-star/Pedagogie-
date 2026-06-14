#!/usr/bin/env node
/**
 * Vérifie que la migration P2 REMC (20260612130000) est appliquée en production.
 * Usage: npm run verify:remc-p2
 */
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_WrrXoHZQlwsb4L93a6Xykw_Qy-_8jX4'

async function probeColumn(table, column) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${column}&limit=0`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  })
  const body = await res.text()
  if (body.includes('"code":"42P01"')) return 'table_missing'
  if (body.includes('"code":"42703"')) return 'column_missing'
  return res.ok || body === '[]' ? 'ok' : 'error'
}

async function probeRpc(name, body = {}) {
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
  return res.ok ? 'ok' : 'error'
}

const checks = [
  {
    id: 'table_item_progress',
    label: 'Table student_remc_item_progress',
    fn: () => probeColumn('student_remc_item_progress', 'item_id'),
  },
  {
    id: 'table_history',
    label: 'Table student_remc_history',
    fn: () => probeColumn('student_remc_history', 'record_type'),
  },
  {
    id: 'column_status',
    label: 'Colonne status (Non commencé / En cours / Validé)',
    fn: () => probeColumn('student_remc_item_progress', 'status'),
  },
  {
    id: 'rpc_student_stats',
    label: 'RPC get_remc_student_stats',
    fn: () =>
      probeRpc('get_remc_student_stats', {
        p_student_id: '00000000-0000-0000-0000-000000000001',
      }),
  },
  {
    id: 'rpc_org_stats',
    label: 'RPC get_remc_organization_stats',
    fn: () =>
      probeRpc('get_remc_organization_stats', {
        p_organization_id: '00000000-0000-0000-0000-000000000001',
      }),
  },
  {
    id: 'competency_validations',
    label: 'Table student_competency_validations (prérequis C1–C4)',
    fn: () => probeColumn('student_competency_validations', 'competency_code'),
  },
]

async function main() {
  console.log('\n=== Vérification migration P2 REMC ===\n')
  console.log(`Projet : ${url}\n`)

  let allOk = true
  for (const check of checks) {
    const result = await check.fn()
    const ok = result === 'ok'
    const icon = ok ? '✅' : '❌'
    const detail = ok ? '' : ` (${result})`
    console.log(`${icon} ${check.label}${detail}`)
    if (!ok) allOk = false
  }

  console.log(
    allOk
      ? '\n✅ Migration P2 REMC détectée. Poursuivez les tests fonctionnels (enseignant → élève).\n'
      : '\n❌ Migration P2 REMC manquante. Exécutez scripts/sql/20260612130000_remc_sub_competencies.sql dans Supabase SQL Editor.\n',
  )
  process.exit(allOk ? 0 : 1)
}

main()
