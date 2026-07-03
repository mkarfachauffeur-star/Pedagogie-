#!/usr/bin/env node
/**
 * Vérification pipeline email pré-production.
 * Usage: node scripts/preprod-email-check.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFiles } from './lib/recette-seed-utils.mjs'

loadEnvFiles()

const CANONICAL = 'https://www.pedagogia-drive.fr'
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const frontUrl = (process.env.FRONT_URL || CANONICAL).replace(/\/$/, '')

const outDir = join(dirname(fileURLToPath(import.meta.url)), 'output')
mkdirSync(outDir, { recursive: true })

const checks = []

function log(id, label, status, detail) {
  checks.push({ id, label, status, detail, ts: new Date().toISOString() })
  const icon = { pass: '✅', warn: '⚠️', fail: '❌' }[status]
  console.log(`${icon} ${label}: ${detail}`)
}

async function main() {
  console.log('\n=== Phase 1 — Email pré-production ===\n')
  console.log(`Front canonique : ${CANONICAL}`)
  console.log(`Front test      : ${frontUrl}\n`)

  log('canonical', 'Domaine canonique', frontUrl.includes('pedagogia-drive.fr') ? 'pass' : 'warn', frontUrl)

  const resendKey = process.env.RESEND_API_KEY
  log('resend_key', 'RESEND_API_KEY locale', resendKey?.startsWith('re_') ? 'pass' : 'warn',
    resendKey ? 'présente' : 'absente — test envoi réel via Edge Functions uniquement')

  const from = process.env.ACCESS_EMAIL_FROM || 'Pedagogia Drive <noreply@pedagogia-drive.fr>'
  log('from', 'Expéditeur', from.includes('pedagogia-drive.fr') ? 'pass' : 'warn', from)

  if (anonKey) {
    const testEmail = process.env.PREPROD_TEST_EMAIL || 'test-preprod@gmail.com'
    const client = createClient(url, anonKey, { auth: { persistSession: false } })
    const redirectTo = `${CANONICAL}/accept-invite`
    const { error } = await client.auth.resetPasswordForEmail(testEmail, { redirectTo })
    log('reset_api', 'API resetPasswordForEmail', error ? 'warn' : 'pass',
      error?.message || `Demande OK pour ${testEmail} → ${redirectTo}`)
  }

  const edgeFns = ['invite-user', 'manage-user', 'create-student', 'resend-student-access', 'platform-prospect']
  for (const fn of edgeFns) {
    const res = await fetch(`${url}/functions/v1/${fn}`, { method: 'OPTIONS' })
    log(`edge_${fn}`, `Edge ${fn}`, res.status === 200 ? 'pass' : 'fail', `OPTIONS HTTP ${res.status}`)
  }

  if (serviceKey) {
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    log('service_role', 'Service role', !error ? 'pass' : 'fail', error?.message || `${data?.users?.length ?? 0} user(s) listés`)
  }

  const providers = ['Gmail', 'Outlook', 'iCloud', 'Yahoo', 'Orange', 'Free']
  console.log('\n--- Test manuel requis (fournisseurs) ---')
  for (const p of providers) {
    console.log(`  ☐ ${p} — invitation + reset + lien ${CANONICAL}/accept-invite`)
  }

  console.log('\n--- Redirect URLs à vérifier dans Supabase Dashboard → Auth → URL Configuration ---')
  console.log(`  Site URL : ${CANONICAL}`)
  console.log(`  Redirect : ${CANONICAL}/accept-invite`)
  console.log(`  Secret Edge APP_URL : ${CANONICAL}`)

  const report = {
    checkedAt: new Date().toISOString(),
    canonical: CANONICAL,
    checks,
    manualProviders: providers,
  }
  const path = join(outDir, 'preprod-email-check.json')
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`\nRapport : ${path}\n`)

  process.exit(checks.some((c) => c.status === 'fail') ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
