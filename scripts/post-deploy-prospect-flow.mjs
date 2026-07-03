#!/usr/bin/env node
/** Vérifie le parcours Prospect → Acceptation (API + données). */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WrrXoHZQlwsb4L93a6Xykw_Qy-_8jX4'
const CANONICAL = 'https://www.pedagogia-drive.fr'

async function getServiceKey() {
  const { execSync } = await import('node:child_process')
  const raw = execSync('npx supabase projects api-keys --project-ref watdeahravfccjdoseaf 2>/dev/null', { encoding: 'utf8' })
  return JSON.parse(raw).keys.find((k) => k.name === 'service_role')?.api_key
}

async function main() {
  console.log('\n=== Parcours Prospect (vérification API) ===\n')
  const results = []

  const sk = await getServiceKey()
  const admin = createClient(url, sk, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: prospects, error: pErr } = await admin
    .from('demo_requests')
    .select('id, school_name, contact_name, email, status, organization_id, updated_at')
    .order('created_at', { ascending: false })
    .limit(5)

  results.push({
    step: 'Prospects en base',
    ok: !pErr && (prospects?.length ?? 0) > 0,
    detail: pErr?.message || `${prospects?.length ?? 0} prospect(s) — dernier: ${prospects?.[0]?.email || 'N/A'}`,
  })

  const accepted = prospects?.filter((p) => p.organization_id || /accept/i.test(p.status || '')) || []
  results.push({
    step: 'Prospects acceptés',
    ok: accepted.length > 0,
    detail: `${accepted.length} accepté(s)`,
  })

  if (accepted[0]) {
    const email = accepted[0].email
    const orgId = accepted[0].organization_id
    const { data: org } = orgId
      ? await admin.from('organizations').select('id, name, status').eq('id', orgId).maybeSingle()
      : { data: null }
    const { data: profile } = await admin.from('profiles').select('id, role, email').eq('email', email).maybeSingle()
    const { data: sub } = profile
      ? await admin.from('subscriptions').select('status, trial_ends_at, plan:plan_id(code)').eq('organization_id', profile.organization_id).maybeSingle()
      : { data: null }

    results.push({ step: 'Organisation créée', ok: !!org, detail: org?.name || 'N/A' })
    results.push({ step: 'Manager (profile)', ok: profile?.role === 'manager', detail: profile ? `${profile.email} (${profile.role})` : 'absent' })
    results.push({ step: 'Essai gratuit', ok: sub?.status === 'active', detail: sub ? `${sub.status} · trial ${sub.trial_ends_at?.slice(0, 10) || 'N/A'}` : 'N/A' })
  }

  const res = await fetch(`${CANONICAL}/accept-invite`)
  results.push({ step: 'Page /accept-invite', ok: res.ok, detail: `HTTP ${res.status}` })

  const resDash = await fetch(`${CANONICAL}/manager/dashboard`)
  results.push({ step: 'Route dashboard gérant (SPA)', ok: resDash.ok, detail: `HTTP ${resDash.status}` })

  const edge = await fetch(`${url}/functions/v1/platform-prospect`, { method: 'OPTIONS' })
  results.push({ step: 'Edge platform-prospect', ok: edge.status === 200, detail: `HTTP ${edge.status}` })

  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.step}: ${r.detail}`)
  }

  const { writeFileSync, mkdirSync } = await import('node:fs')
  const { join, dirname } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const out = join(dirname(fileURLToPath(import.meta.url)), 'output')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'prospect-flow-results.json'), `${JSON.stringify({ testedAt: new Date().toISOString(), results }, null, 2)}\n`)

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} étapes OK\n`)
  process.exit(failed.length > 2 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
