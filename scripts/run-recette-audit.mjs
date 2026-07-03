#!/usr/bin/env node
/**
 * Audit recette complet — tests API + smoke front + rapport de stabilité.
 *
 * Usage :
 *   node scripts/run-recette-audit.mjs
 *   FRONT_URL=https://www.pedagogia-drive.fr node scripts/run-recette-audit.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  RECETTE_PASSWORD,
  loadEnvFiles,
  requireSupabaseAdmin,
} from './lib/recette-seed-utils.mjs'

loadEnvFiles()

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const frontUrl = (process.env.FRONT_URL || process.env.VITE_APP_URL || 'https://www.pedagogia-drive.fr').replace(/\/$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'm.karfa@hotmail.com'
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'scripts', 'output')
mkdirSync(outDir, { recursive: true })

/** @type {Array<{category:string, id:string, label:string, status:'pass'|'warn'|'fail'|'skip', detail:string, sqlError?:string, consoleError?:string}>} */
const results = []
const bugs = []
const warnings = []
const sqlErrors = []
const consoleErrors = []
const brokenPages = []
const brokenLinks = []
const responsiveIssues = []
const edgeFunctionErrors = []

function record(category, id, label, status, detail, extra = {}) {
  results.push({ category, id, label, status, detail, ...extra })
  const line = `[${category}] ${label}: ${detail}`
  if (status === 'fail') bugs.push(line)
  if (status === 'warn') warnings.push(line)
  if (extra.sqlError) sqlErrors.push(extra.sqlError)
  if (extra.consoleError) consoleErrors.push(extra.consoleError)
}

function loadCredentials() {
  const path = join(outDir, 'recette-credentials.json')
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function pickAccount(creds, role) {
  if (!creds?.accounts?.length) return null
  return creds.accounts.find((a) => a.role === role) || null
}

async function signIn(email, password) {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) return { client, error, session: null }
  return { client, error: null, session: data.session }
}

async function smokeRoute(path) {
  const res = await fetch(`${frontUrl}${path}`, { redirect: 'follow' })
  const text = await res.text()
  const isSpa = res.ok && (text.includes('id="root"') || text.includes('Pedagogia') || text.includes('pedagogia'))
  return { ok: res.ok && isSpa, status: res.status, hasRoot: text.includes('id="root"'), hasViewport: text.includes('viewport') }
}

async function probeEdgeFunction(name) {
  const res = await fetch(`${url}/functions/v1/${name}`, { method: 'OPTIONS' })
  return res.status
}

async function probeEdgePost(name, token, body) {
  const headers = { apikey: anonKey, 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${url}/functions/v1/${name}`, { method: 'POST', headers, body: JSON.stringify(body) })
  const text = await res.text()
  return { status: res.status, body: text.slice(0, 300) }
}

async function testAuth(creds) {
  const manager = pickAccount(creds, 'manager')
  const student = pickAccount(creds, 'student')

  if (manager) {
    const { client, error, session } = await signIn(manager.email, manager.password || RECETTE_PASSWORD)
    record('AUTH', 'login', 'Connexion gérant', error ? 'fail' : 'pass', error?.message || `Session ${session?.user?.email}`)

    if (session) {
      const { error: signOutErr } = await client.auth.signOut()
      record('AUTH', 'logout', 'Déconnexion', signOutErr ? 'fail' : 'pass', signOutErr?.message || 'OK')
    }
  } else {
    record('AUTH', 'login', 'Connexion gérant', 'skip', 'Compte recette absent — lancez seed-recette-data.mjs')
    record('AUTH', 'logout', 'Déconnexion', 'skip', 'N/A')
  }

  if (student) {
    const { error } = await signIn(student.email, student.password || RECETTE_PASSWORD)
    record('AUTH', 'login_student', 'Connexion élève', error ? 'fail' : 'pass', error?.message || student.email)
  }

  const resetClient = createClient(url, anonKey, { auth: { persistSession: false } })
  const resetEmail = manager?.email || 'test-reset@recette.pedagogia.local'
  const { error: resetErr } = await resetClient.auth.resetPasswordForEmail(resetEmail, {
    redirectTo: `${frontUrl}/accept-invite`,
  })
  record(
    'AUTH',
    'forgot_password',
    'Mot de passe oublié (API)',
    resetErr ? 'warn' : 'pass',
    resetErr?.message || `Demande envoyée pour ${resetEmail} (vérifiez Resend/SMTP)`,
  )

  if (manager && serviceKey) {
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    const inviteProbe = await probeEdgePost('invite-user', null, {
      email: 'probe@recette.pedagogia.local',
      role: 'teacher',
      organization_id: manager.organizationId,
    })
    record(
      'AUTH',
      'invitation',
      'Invitation (edge sans JWT)',
      inviteProbe.status === 401 || inviteProbe.status === 403 ? 'pass' : 'warn',
      `POST invite-user → HTTP ${inviteProbe.status} (401/403 attendu sans token)`,
    )

    const { session } = await signIn(manager.email, manager.password || RECETTE_PASSWORD)
    if (session?.access_token) {
      const inviteAuth = await probeEdgePost('invite-user', session.access_token, {
        email: `invite-test-${Date.now()}@recette.pedagogia.local`,
        role: 'teacher',
        first_name: 'Test',
        last_name: 'Invite',
        organization_id: manager.organizationId,
      })
      const ok = inviteAuth.status >= 200 && inviteAuth.status < 300
      record(
        'AUTH',
        'invitation_auth',
        'Invitation (edge avec JWT gérant)',
        ok ? 'pass' : 'warn',
        `HTTP ${inviteAuth.status} — ${inviteAuth.body.slice(0, 120)}`,
      )
    }

    const { error: pwdErr } = await admin.auth.admin.updateUserById(
      (await admin.from('profiles').select('id').eq('email', manager.email).single()).data?.id,
      { password: RECETTE_PASSWORD },
    )
    record('AUTH', 'change_password', 'Changement mot de passe (admin API)', pwdErr ? 'warn' : 'pass', pwdErr?.message || 'OK')
  } else {
    record('AUTH', 'invitation', 'Invitation', 'skip', 'Service role ou comptes recette absents')
    record('AUTH', 'change_password', 'Changement mot de passe', 'skip', 'N/A')
  }
}

async function testSuperAdmin(admin) {
  if (!superAdminPassword) {
    record('SUPER_ADMIN', 'auth', 'Connexion Super Admin', 'skip', 'SUPER_ADMIN_PASSWORD non défini dans .env')
    return
  }

  const { error, session } = await signIn(superAdminEmail, superAdminPassword)
  record('SUPER_ADMIN', 'login', 'Connexion Super Admin', error ? 'fail' : 'pass', error?.message || superAdminEmail)

  if (!session) return

  const { data: orgs, error: orgErr } = await admin.from('organizations').select('id, name, status').limit(5)
  record('SUPER_ADMIN', 'list_orgs', 'Liste auto-écoles', orgErr ? 'fail' : 'pass', orgErr?.message || `${orgs?.length ?? 0} org(s)`)

  const testName = `Recette Audit Org ${Date.now()}`
  const { data: created, error: createErr } = await admin
    .from('organizations')
    .insert({
      name: testName,
      email: `audit-${Date.now()}@recette.pedagogia.local`,
      status: 'trial',
      city: 'Paris',
      postal_code: '75001',
    })
    .select('id')
    .single()

  if (createErr) {
    record('SUPER_ADMIN', 'create_org', 'Création auto-école', 'fail', createErr.message, { sqlError: createErr.message })
  } else {
    record('SUPER_ADMIN', 'create_org', 'Création auto-école', 'pass', `ID ${created.id}`)

    const { error: suspendErr } = await admin.from('organizations').update({ status: 'suspended' }).eq('id', created.id)
    record('SUPER_ADMIN', 'suspend', 'Suspension', suspendErr ? 'fail' : 'pass', suspendErr?.message || 'status=suspended')

    const { error: reactivateErr } = await admin.from('organizations').update({ status: 'active' }).eq('id', created.id)
    record('SUPER_ADMIN', 'reactivate', 'Réactivation', reactivateErr ? 'fail' : 'pass', reactivateErr?.message || 'status=active')

    const { error: deleteErr } = await admin.from('organizations').delete().eq('id', created.id)
    record('SUPER_ADMIN', 'delete', 'Suppression auto-école', deleteErr ? 'fail' : 'pass', deleteErr?.message || 'OK')
  }
}

async function testManager(creds) {
  const manager = pickAccount(creds, 'manager')
  if (!manager) {
    record('GERANT', 'all', 'Tests gérant', 'skip', 'Compte recette absent')
    return
  }
  const { client, session, error } = await signIn(manager.email, manager.password || RECETTE_PASSWORD)
  if (error || !session) {
    record('GERANT', 'login', 'Connexion gérant', 'fail', error?.message || 'Pas de session')
    return
  }

  const orgId = manager.organizationId
  const checks = [
    ['teachers', 'Création enseignant (lecture teachers)', 'teachers', 'profile_id'],
    ['secretaries', 'Création secrétaire (lecture secretaries)', 'secretaries', 'profile_id'],
    ['students', 'Création élève (lecture students)', 'students', 'id'],
  ]

  for (const [id, label, table, pk] of checks) {
    const { data, error: qErr } = await client.from(table).select(pk).eq('organization_id', orgId).limit(5)
    record('GERANT', id, label, qErr ? 'fail' : (data?.length ? 'pass' : 'warn'), qErr?.message || `${data?.length ?? 0} enregistrement(s)`)
  }
}

async function testSecretary(creds) {
  const sec = creds?.accounts?.find((a) => a.role === 'secretary')
  if (!sec) {
    record('SECRETAIRE', 'all', 'Tests secrétaire', 'skip', 'Compte absent')
    return
  }
  const { client, session, error } = await signIn(sec.email, sec.password || RECETTE_PASSWORD)
  if (error || !session) {
    record('SECRETAIRE', 'login', 'Connexion secrétaire', 'fail', error?.message || 'Pas de session')
    return
  }

  const { data: appts, error: apptErr } = await client
    .from('appointments')
    .select('id, starts_at, status')
    .eq('organization_id', sec.organizationId)
    .limit(10)
  record('SECRETAIRE', 'planning', 'Gestion planning', apptErr ? 'fail' : 'pass', apptErr?.message || `${appts?.length ?? 0} RDV`)

  const { data: assigns, error: assignErr } = await client
    .from('student_assignments')
    .select('student_id, teacher_id')
    .limit(10)
  record('SECRETAIRE', 'assignment', 'Affectation élève/enseignant', assignErr ? 'fail' : (assigns?.length ? 'pass' : 'warn'), assignErr?.message || `${assigns?.length ?? 0} affectation(s)`)
}

async function testTeacher(creds) {
  const teacher = pickAccount(creds, 'teacher')
  if (!teacher) {
    record('ENSEIGNANT', 'all', 'Tests enseignant', 'skip', 'Compte absent')
    return
  }
  const { client, session, error } = await signIn(teacher.email, teacher.password || RECETTE_PASSWORD)
  if (error || !session) {
    record('ENSEIGNANT', 'login', 'Connexion enseignant', 'fail', error?.message || 'Pas de session')
    return
  }

  const { data: assigns } = await client
    .from('student_assignments')
    .select('student_id')
    .eq('teacher_id', session.user.id)
    .limit(10)

  const studentIds = (assigns || []).map((a) => a.student_id)
  const { data: validations, error: valErr } = studentIds.length
    ? await client
      .from('student_competency_validations')
      .select('id, competency_code')
      .in('student_id', studentIds)
      .limit(5)
    : { data: [], error: null }
  record('ENSEIGNANT', 'competencies', 'Validation compétences', valErr ? 'warn' : (validations?.length ? 'pass' : 'warn'), valErr?.message || `${validations?.length ?? 0} validation(s) (élèves affectés)`)

  const { data: parts } = await client
    .from('conversation_participants')
    .select('conversation_id')
    .eq('profile_id', session.user.id)
    .limit(5)

  const convIds = (parts || []).map((p) => p.conversation_id)
  const { data: convs, error: convErr } = convIds.length
    ? await client.from('conversations').select('id').in('id', convIds).limit(5)
    : { data: [], error: null }
  record('ENSEIGNANT', 'messaging', 'Messagerie enseignant', convErr ? 'fail' : 'pass', convErr?.message || `${convs?.length ?? 0} conversation(s)`)

  const { data: docs, error: docErr } = await client.from('documents').select('id').eq('organization_id', teacher.organizationId).limit(5)
  record('ENSEIGNANT', 'documents', 'Documents (lecture)', docErr ? 'warn' : 'pass', docErr?.message || `${docs?.length ?? 0} document(s)`)
}

async function testStudent(creds) {
  const student = pickAccount(creds, 'student')
  if (!student) {
    record('ELEVE', 'all', 'Tests élève', 'skip', 'Compte absent')
    return
  }
  const { client, session, error } = await signIn(student.email, student.password || RECETTE_PASSWORD)
  record('ELEVE', 'login', 'Connexion élève', error ? 'fail' : 'pass', error?.message || student.email)
  if (!session) return

  const { data: progress, error: progErr } = await client
    .from('student_remc_item_progress')
    .select('item_id')
    .limit(5)
  record('ELEVE', 'progress', 'Progression REMC', progErr ? 'warn' : 'pass', progErr?.message || `${progress?.length ?? 0} item(s)`)

  const { data: assessments, error: assessErr } = await client
    .from('student_initial_assessments')
    .select('id, status')
    .limit(3)
  record('ELEVE', 'qcm', 'QCM / évaluation initiale', assessErr ? 'warn' : 'pass', assessErr?.message || `${assessments?.length ?? 0} évaluation(s)`)

  const { data: docs, error: docErr } = await client.from('documents').select('id, storage_bucket').limit(5)
  record('ELEVE', 'documents', 'Téléchargement documents (liste)', docErr ? 'warn' : 'pass', docErr?.message || `${docs?.length ?? 0} doc(s)`)
}

async function testMessaging(creds, admin) {
  const manager = pickAccount(creds, 'manager')
  if (!manager) {
    record('MESSAGERIE', 'all', 'Tests messagerie', 'skip', 'Comptes absents')
    return
  }

  const { count: convCount } = await admin.from('conversations').select('id', { count: 'exact', head: true })
  const { count: msgCount } = await admin.from('messages').select('id', { count: 'exact', head: true })
  record('MESSAGERIE', 'data', 'Conversations / messages seed', convCount > 0 ? 'pass' : 'warn', `${convCount ?? 0} conv · ${msgCount ?? 0} msg`)

  const { client, session } = await signIn(manager.email, manager.password || RECETTE_PASSWORD)
  if (session) {
    const body = `Test recette ${new Date().toISOString()}`
    const { data: conv } = await admin.from('conversations').select('id').eq('organization_id', manager.organizationId).limit(1).maybeSingle()
    if (conv) {
      const { error: sendErr } = await client.from('messages').insert({
        conversation_id: conv.id,
        organization_id: manager.organizationId,
        sender_id: session.user.id,
        body,
      })
      record('MESSAGERIE', 'send', 'Envoi message', sendErr ? 'fail' : 'pass', sendErr?.message || 'Message inséré')
    }
  }

  const { count: notifCount } = await admin.from('notifications').select('id', { count: 'exact', head: true })
  record('MESSAGERIE', 'notifications', 'Notifications', notifCount > 0 ? 'pass' : 'warn', `${notifCount ?? 0} notification(s)`)
}

async function testDocuments(admin) {
  const { data: docs, error } = await admin.from('documents').select('id, storage_bucket, storage_path').limit(5)
  record('DOCUMENTS', 'list', 'Liste documents (admin)', error ? 'fail' : 'pass', error?.message || `${docs?.length ?? 0} document(s)`)

  const buckets = ['student-documents', 'message-attachments', 'teacher-documents']
  for (const bucket of buckets) {
    const res = await fetch(`${url}/storage/v1/bucket/${bucket}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${serviceKey || anonKey}` },
    })
    record('DOCUMENTS', `storage_${bucket}`, `Storage bucket ${bucket}`, res.ok ? 'pass' : 'warn', `HTTP ${res.status}`)
  }
}

async function testSubscriptions(admin, creds) {
  const plans = ['trial', 'starter', 'premium']
  for (const code of plans) {
    const { data: plan, error } = await admin.from('plans').select('id, code, name, price_cents').eq('code', code).maybeSingle()
    record('ABONNEMENTS', code, `Plan ${code}`, error || !plan ? 'fail' : 'pass', error?.message || `${plan.name} — ${plan.price_cents / 100}€`)
  }

  if (creds?.accounts) {
    const byPlan = { trial: 0, starter: 0, premium: 0 }
    creds.accounts.filter((a) => a.role === 'manager').forEach((m) => {
      if (byPlan[m.planCode] !== undefined) byPlan[m.planCode] += 1
    })
    record('ABONNEMENTS', 'seed_plans', 'Répartition seed recette', 'pass', JSON.stringify(byPlan))
  }
}

async function testResend() {
  const resendKey = process.env.RESEND_API_KEY
  record('RESEND', 'config', 'Clé Resend configurée', resendKey ? 'pass' : 'warn', resendKey ? 'RESEND_API_KEY présente' : 'Variable absente — emails non testés')

  const prospect = await probeEdgePost('platform-prospect', null, {})
  const inviteOpts = await probeEdgeFunction('invite-user')
  record('RESEND', 'invite_fn', 'Edge invite-user déployée', inviteOpts === 200 ? 'pass' : 'fail', `OPTIONS HTTP ${inviteOpts}`)
  if (inviteOpts !== 200) edgeFunctionErrors.push(`invite-user OPTIONS → ${inviteOpts}`)

  record('RESEND', 'reset_flow', 'Reset password (Supabase Auth email)', 'warn', 'Vérification manuelle boîte mail requise (iCloud peut filtrer)')
}

async function testSupabase(admin) {
  const rlsTables = ['organizations', 'profiles', 'students', 'teachers', 'payments', 'conversations', 'messages']
  const anonClient = createClient(url, anonKey, { auth: { persistSession: false } })

  for (const table of rlsTables) {
    const pk = table === 'teachers' || table === 'secretaries' ? 'profile_id' : 'id'
    const { data, error } = await anonClient.from(table).select(pk).limit(3)
    const blocked = !error && Array.isArray(data) && data.length === 0
    record('SUPABASE', `rls_${table}`, `RLS ${table} (anon)`, blocked ? 'pass' : 'warn', error?.message || `${data?.length ?? '?'} ligne(s) visibles`)
  }

  const realtimeTables = ['messages', 'notifications', 'students']
  for (const table of realtimeTables) {
    const { error } = await admin.from(table).select('id').limit(1)
    record('SUPABASE', `realtime_${table}`, `Realtime table ${table}`, error ? 'warn' : 'pass', error?.message || 'Table accessible (publication à vérifier manuellement)')
  }

  const edgeFns = ['invite-user', 'create-student', 'manage-user', 'platform-organization', 'platform-prospect', 'register-organization']
  for (const fn of edgeFns) {
    const status = await probeEdgeFunction(fn)
    const ok = status === 200
    record('SUPABASE', `edge_${fn}`, `Edge Function ${fn}`, ok ? 'pass' : 'fail', `OPTIONS HTTP ${status}`)
    if (!ok) edgeFunctionErrors.push(`${fn} → HTTP ${status}`)
  }
}

async function testFrontRoutes() {
  const routes = [
    ['/', 'Accueil'],
    ['/login', 'Connexion'],
    ['/blog', 'Blog'],
    ['/contact', 'Contact'],
    ['/accept-invite', 'Acceptation invitation'],
    ['/manager/dashboard', 'Dashboard gérant'],
    ['/manager/planning', 'Planning gérant'],
    ['/secretary/planning', 'Planning secrétaire'],
    ['/teacher/students', 'Élèves enseignant'],
    ['/teacher/messages', 'Messages enseignant'],
    ['/student/dashboard', 'Dashboard élève'],
    ['/student/progress', 'Progression élève'],
    ['/student/documents', 'Documents élève'],
    ['/student/practice-exams', 'QCM élève'],
    ['/platform/dashboard', 'Super Admin'],
  ]

  for (const [path, label] of routes) {
    try {
      const { ok, status, hasViewport } = await smokeRoute(path)
      record('FRONT', path, label, ok ? 'pass' : 'fail', `HTTP ${status}`)
      if (!ok) brokenPages.push(`${path} (${label}) — HTTP ${status}`)
      if (ok && !hasViewport) responsiveIssues.push(`${path} — balise viewport absente`)
    } catch (error) {
      record('FRONT', path, label, 'fail', error.message)
      brokenPages.push(`${path}: ${error.message}`)
    }
  }

  const links = ['/mentions-legales', '/confidentialite', '/blog/inscription-auto-ecole-permis']
  for (const path of links) {
    const { ok, status } = await smokeRoute(path)
    if (!ok) brokenLinks.push(`${path} → HTTP ${status}`)
    record('FRONT', `link${path}`, `Lien ${path}`, ok ? 'pass' : 'fail', `HTTP ${status}`)
  }
}

function computeStability() {
  const scored = results.filter((r) => r.status !== 'skip')
  if (!scored.length) return 0
  const weights = { pass: 1, warn: 0.5, fail: 0 }
  const sum = scored.reduce((acc, r) => acc + (weights[r.status] ?? 0), 0)
  return Math.round((sum / scored.length) * 1000) / 10
}

function buildReport(stability) {
  const passed = results.filter((r) => r.status === 'pass')
  const warned = results.filter((r) => r.status === 'warn')
  const failed = results.filter((r) => r.status === 'fail')
  const skipped = results.filter((r) => r.status === 'skip')

  const byCategory = {}
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = { pass: 0, warn: 0, fail: 0, skip: 0 }
    byCategory[r.category][r.status] += 1
  }

  const md = [
    '# Rapport de recette — Pedagogia Drive',
    '',
    `**Date :** ${new Date().toLocaleString('fr-FR')}`,
    `**Front :** ${frontUrl}`,
    `**Supabase :** ${url}`,
    '',
    '## Score de stabilité',
    '',
    `# ${stability}%`,
    '',
    `> Calcul : pass=100%, warn=50%, fail=0% (${passed.length} pass · ${warned.length} warn · ${failed.length} fail · ${skipped.length} skip)`,
    '',
    '## Synthèse par domaine',
    '',
    '| Domaine | ✅ | ⚠️ | ❌ | ⏭️ |',
    '| --- | ---: | ---: | ---: | ---: |',
  ]

  for (const [cat, counts] of Object.entries(byCategory)) {
    md.push(`| ${cat} | ${counts.pass} | ${counts.warn} | ${counts.fail} | ${counts.skip} |`)
  }

  md.push('', '## Bugs (échecs)', '')
  if (bugs.length) bugs.forEach((b) => md.push(`- ${b}`))
  else md.push('_Aucun bug bloquant détecté automatiquement._')

  md.push('', '## Warnings', '')
  if (warnings.length) warnings.forEach((w) => md.push(`- ${w}`))
  else md.push('_Aucun warning._')

  md.push('', '## Erreurs SQL', '')
  if (sqlErrors.length) sqlErrors.forEach((e) => md.push(`- \`${e}\``))
  else md.push('_Aucune erreur SQL capturée._')

  md.push('', '## Edge Functions en erreur', '')
  if (edgeFunctionErrors.length) edgeFunctionErrors.forEach((e) => md.push(`- ${e}`))
  else md.push('_Toutes les Edge Functions répondent (OPTIONS 200)._')

  md.push('', '## Pages cassées', '')
  if (brokenPages.length) brokenPages.forEach((p) => md.push(`- ${p}`))
  else md.push('_Toutes les routes testées renvoient HTTP 200 + SPA._')

  md.push('', '## Liens cassés', '')
  if (brokenLinks.length) brokenLinks.forEach((l) => md.push(`- ${l}`))
  else md.push('_Liens internes OK._')

  md.push('', '## Responsive (smoke)', '')
  if (responsiveIssues.length) responsiveIssues.forEach((r) => md.push(`- ${r}`))
  else md.push('_Balise viewport présente sur les pages testées._')

  md.push('', '## Détail des tests', '')
  md.push('')
  md.push('| Domaine | Test | Statut | Détail |')
  md.push('| --- | --- | --- | --- |')
  for (const r of results) {
    const icon = { pass: '✅', warn: '⚠️', fail: '❌', skip: '⏭️' }[r.status]
    md.push(`| ${r.category} | ${r.label} | ${icon} | ${r.detail.replace(/\|/g, '\\|')} |`)
  }

  md.push('', '---', '', '## Recommandations avant production', '')
  if (stability >= 90) md.push('- Application **prête pour recette utilisateur** avec tests manuels Resend/iCloud.')
  else if (stability >= 75) md.push('- Corriger les échecs ci-dessus puis relancer `npm run recette:audit`.')
  else md.push('- **Ne pas mettre en production** — stabilité insuffisante.')

  return md.join('\n')
}

async function main() {
  console.log('\n=== Audit recette Pedagogia Drive ===\n')
  console.log(`Front: ${frontUrl}`)
  console.log(`Supabase: ${url}\n`)

  const creds = loadCredentials()
  if (creds) {
    console.log(`Comptes recette chargés : ${creds.accounts?.length ?? 0}`)
  } else {
    console.warn('⚠ recette-credentials.json absent — certains tests seront ignorés')
  }

  let admin = null
  if (serviceKey) {
    admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  } else {
    console.warn('⚠ SUPABASE_SERVICE_ROLE_KEY absente — tests admin limités')
  }

  await testAuth(creds)
  if (admin) await testSuperAdmin(admin)
  await testManager(creds)
  await testSecretary(creds)
  await testTeacher(creds)
  await testStudent(creds)
  if (admin) {
    await testMessaging(creds, admin)
    await testDocuments(admin)
    await testSubscriptions(admin, creds)
    await testSupabase(admin)
  }
  await testResend()
  await testFrontRoutes()

  const stability = computeStability()
  const reportJson = {
    auditedAt: new Date().toISOString(),
    frontUrl,
    supabaseUrl: url,
    stabilityPercent: stability,
    summary: {
      pass: results.filter((r) => r.status === 'pass').length,
      warn: results.filter((r) => r.status === 'warn').length,
      fail: results.filter((r) => r.status === 'fail').length,
      skip: results.filter((r) => r.status === 'skip').length,
    },
    bugs,
    warnings,
    sqlErrors,
    consoleErrors,
    edgeFunctionErrors,
    brokenPages,
    brokenLinks,
    responsiveIssues,
    results,
  }

  const jsonPath = join(outDir, 'recette-report.json')
  const mdPath = join(outDir, 'recette-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(reportJson, null, 2)}\n`)
  writeFileSync(mdPath, `${buildReport(stability)}\n`)

  console.log(`\n=== Stabilité : ${stability}% ===`)
  console.log(`Rapport : ${mdPath}`)
  console.log(`JSON    : ${jsonPath}\n`)

  process.exit(results.some((r) => r.status === 'fail') ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
