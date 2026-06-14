#!/usr/bin/env node
/**
 * Vérifie l'isolation RLS du jeu de données demo.
 *
 * Usage :
 *   node scripts/verify-demo-rls.mjs
 *   (lit scripts/output/demo-credentials.json)
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { requireSupabaseAdmin } from './lib/demo-seed-utils.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadCredentials() {
  const path = join(root, 'scripts/output/demo-credentials.json')
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    throw new Error('Fichier demo-credentials.json introuvable. Lancez d\'abord : node scripts/seed-demo-data.mjs')
  }
}

async function signIn(url, anonKey, email, password) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`${email}: ${error.message}`)
  return client
}

async function countStudents(client) {
  const { count, error } = await client
    .from('students')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count || 0
}

async function listStudentIds(client) {
  const { data, error } = await client.from('students').select('id, organization_id, first_name, last_name')
  if (error) throw error
  return data || []
}

async function countAccessibleProfiles(client) {
  const { count, error } = await client
    .from('profiles')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count || 0
}

function pickAccount(accounts, orgName, role, extra = {}) {
  return accounts.find((account) =>
    account.organization === orgName
    && account.role === role
    && Object.entries(extra).every(([key, value]) => account[key] === value))
}

async function runCheck(label, fn) {
  try {
    const result = await fn()
    console.log(`✅ ${label}`)
    return { label, ok: true, ...result }
  } catch (error) {
    console.log(`❌ ${label} — ${error.message}`)
    return { label, ok: false, error: error.message }
  }
}

async function main() {
  const { url, serviceKey } = requireSupabaseAdmin()
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!anonKey) throw new Error('VITE_SUPABASE_ANON_KEY manquante')

  const { accounts } = loadCredentials()
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const orgAlpha = 'Auto-École Alpha (Demo)'
  const orgBeta = 'Auto-École Beta (Demo)'
  const results = []

  const alphaManager = pickAccount(accounts, orgAlpha, 'manager')
  const alphaSecretary = pickAccount(accounts, orgAlpha, 'secretary')
  const alphaStudent = pickAccount(accounts, orgAlpha, 'student')
  const betaManager = pickAccount(accounts, orgBeta, 'manager')
  const alphaTeacherAccount = accounts.find((a) => a.email === 'alpha.enseignant1@demo.pedagogia.local')
  const betaTeacherAccount = accounts.find((a) => a.email === 'beta.enseignant1@demo.pedagogia.local')
  if (!alphaManager || !alphaSecretary || !alphaStudent || !betaManager || !alphaTeacherAccount || !betaTeacherAccount) {
    throw new Error('Comptes demo incomplets dans demo-credentials.json')
  }

  results.push(await runCheck('Gérant Alpha voit 10 élèves', async () => {
    const client = await signIn(url, anonKey, alphaManager.email, alphaManager.password)
    const count = await countStudents(client)
    if (count !== 10) throw new Error(`attendu 10, obtenu ${count}`)
    return { count }
  }))

  results.push(await runCheck('Enseignant Alpha voit uniquement ses élèves (5)', async () => {
    const client = await signIn(url, anonKey, alphaTeacherAccount.email, alphaTeacherAccount.password)
    const rows = await listStudentIds(client)
    if (rows.length !== 5) throw new Error(`attendu 5, obtenu ${rows.length}`)
    return { count: rows.length }
  }))

  results.push(await runCheck('Secrétaire Alpha voit 10 élèves', async () => {
    const client = await signIn(url, anonKey, alphaSecretary.email, alphaSecretary.password)
    const count = await countStudents(client)
    if (count !== 10) throw new Error(`attendu 10, obtenu ${count}`)
    return { count }
  }))

  results.push(await runCheck('Élève Alpha voit uniquement son dossier', async () => {
    const client = await signIn(url, anonKey, alphaStudent.email, alphaStudent.password)
    const rows = await listStudentIds(client)
    if (rows.length !== 1) throw new Error(`attendu 1, obtenu ${rows.length}`)
    return { count: rows.length }
  }))

  results.push(await runCheck('Isolation inter-organisations (gérant Alpha)', async () => {
    const client = await signIn(url, anonKey, alphaManager.email, alphaManager.password)
    const rows = await listStudentIds(client)
    const betaRows = rows.filter((row) => row.organization_id === pickAccount(accounts, orgBeta, 'manager')?.organizationId)
    if (betaRows.length > 0) throw new Error('des élèves Beta visibles depuis Alpha')
    return { alphaCount: rows.length }
  }))

  results.push(await runCheck('Gérant Beta voit 10 élèves', async () => {
    const client = await signIn(url, anonKey, betaManager.email, betaManager.password)
    const count = await countStudents(client)
    if (count !== 10) throw new Error(`attendu 10, obtenu ${count}`)
    return { count }
  }))

  results.push(await runCheck('Enseignant Beta isolé de Alpha', async () => {
    const client = await signIn(url, anonKey, betaTeacherAccount.email, betaTeacherAccount.password)
    const rows = await listStudentIds(client)
    const alphaOrgId = pickAccount(accounts, orgAlpha, 'manager')?.organizationId
    const leak = rows.some((row) => row.organization_id === alphaOrgId)
    if (leak) throw new Error('fuite de dossiers Alpha vers Beta')
    if (rows.length !== 5) throw new Error(`attendu 5 élèves Beta, obtenu ${rows.length}`)
    return { count: rows.length }
  }))

  results.push(await runCheck('Service role — 20 élèves demo au total', async () => {
    const { count, error } = await admin
      .from('students')
      .select('id', { count: 'exact', head: true })
      .like('email', `%@${'demo.pedagogia.local'}`)
    if (error) throw error
    if ((count || 0) < 20) throw new Error(`attendu ≥20, obtenu ${count}`)
    return { count }
  }))

  const passed = results.filter((row) => row.ok).length
  const failed = results.length - passed

  console.log(`\n=== Bilan RLS : ${passed}/${results.length} tests OK ===`)
  if (failed > 0) process.exit(1)
}

main().catch((error) => {
  console.error('\n❌ Vérification impossible :', error.message)
  process.exit(1)
})
