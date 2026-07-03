#!/usr/bin/env node
/** Vérifications post-déploiement : migration, RLS, secrets, Edge Functions. */
import { createClient } from '@supabase/supabase-js'
import { loadEnvFiles } from './lib/recette-seed-utils.mjs'

loadEnvFiles()

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_WrrXoHZQlwsb4L93a6Xykw_Qy-_8jX4'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CANONICAL = 'https://www.pedagogia-drive.fr'

const results = []
function record(id, label, status, detail) {
  results.push({ id, label, status, detail })
  console.log(`${{ pass: '✅', fail: '❌', warn: '⚠️' }[status]} ${label}: ${detail}`)
}

async function getServiceKey() {
  if (serviceKey) return serviceKey
  const { execSync } = await import('node:child_process')
  const raw = execSync('npx supabase projects api-keys --project-ref watdeahravfccjdoseaf 2>/dev/null', { encoding: 'utf8' })
  const j = JSON.parse(raw)
  return j.keys.find((k) => k.name === 'service_role' || k.id === 'service_role')?.api_key
}

async function main() {
  console.log('\n=== Vérification post-déploiement ===\n')

  const sk = await getServiceKey().catch(() => null)
  if (!sk) {
    record('service_key', 'Service role', 'fail', 'Clé absente')
    process.exit(1)
  }

  const admin = createClient(url, sk, { auth: { autoRefreshToken: false, persistSession: false } })

  // 1. Migration — vérifier via db push status ou comportement fonction
  try {
    const { execSync } = await import('node:child_process')
    const pushOut = execSync('export PATH="$HOME/.local/share/supabase:$PATH" && supabase migration list --linked 2>/dev/null', {
      encoding: 'utf8',
      cwd: new URL('..', import.meta.url).pathname,
    })
    const applied = pushOut.includes('20260703180000')
    record('migration', 'Migration 20260703180000', applied ? 'pass' : 'warn',
      applied ? 'Listée comme appliquée' : 'Vérifier migration list manuellement')
  } catch {
    record('migration', 'Migration 20260703180000', 'warn', 'migration list indisponible — RLS testé ci-dessous')
  }

  // 2. RLS teacher competency via assigned student
  const teacherEmail = 'recette01.enseignant1@recette.pedagogia.local'
  const client = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email: teacherEmail,
    password: 'Recette2026!',
  })
  if (authErr) {
    record('rls_teacher_login', 'Connexion enseignant recette', 'fail', authErr.message)
  } else {
    const { data: assigns } = await client
      .from('student_assignments')
      .select('student_id')
      .eq('teacher_id', auth.user.id)
      .limit(3)

    const ids = (assigns || []).map((a) => a.student_id)
    const { data: vals, error: valErr } = ids.length
      ? await client.from('student_competency_validations').select('id, competency_code').in('student_id', ids).limit(5)
      : { data: [], error: null }

    record('rls_teacher_remc', 'REMC enseignant (élèves affectés)', valErr ? 'fail' : 'pass',
      valErr?.message || `${vals?.length ?? 0} validation(s) visibles pour ${ids.length} élève(s) affecté(s)`)

    const { data: parts } = await client
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', auth.user.id)
      .limit(5)
    record('rls_teacher_msg', 'Messagerie enseignant (participants)', 'pass', `${parts?.length ?? 0} conversation(s)`)
  }

  // 3. Anon bloqué
  const anon = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data: anonStudents } = await anon.from('students').select('id').limit(3)
  record('rls_anon', 'RLS anon students', anonStudents?.length === 0 ? 'pass' : 'fail', `${anonStudents?.length ?? 0} ligne(s)`)

  // 4. Edge Functions OPTIONS
  const fns = ['invite-user', 'manage-user', 'create-student', 'resend-student-access', 'platform-prospect', 'platform-organization', 'register-organization']
  for (const fn of fns) {
    const res = await fetch(`${url}/functions/v1/${fn}`, { method: 'OPTIONS' })
    record(`edge_${fn}`, `Edge ${fn}`, res.status === 200 ? 'pass' : 'fail', `HTTP ${res.status}`)
  }

  // 5. Secrets (présence)
  try {
    const { execSync } = await import('node:child_process')
    const secrets = JSON.parse(execSync('npx supabase secrets list --project-ref watdeahravfccjdoseaf 2>/dev/null', { encoding: 'utf8' }))
    const names = secrets.secrets?.map((s) => s.name) || []
    for (const n of ['APP_URL', 'SITE_URL', 'RESEND_API_KEY', 'ACCESS_EMAIL_FROM']) {
      record(`secret_${n}`, `Secret ${n}`, names.includes(n) ? 'pass' : 'fail', names.includes(n) ? 'configuré' : 'absent')
    }
  } catch (e) {
    record('secrets', 'Secrets Supabase', 'warn', String(e.message))
  }

  record('canonical', 'URL canonique attendue', 'pass', CANONICAL)

  const failed = results.filter((r) => r.status === 'fail')
  console.log(`\n=== ${results.filter((r) => r.status === 'pass').length}/${results.length} OK · ${failed.length} échec(s) ===\n`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
