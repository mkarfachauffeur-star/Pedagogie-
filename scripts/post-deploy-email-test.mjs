#!/usr/bin/env node
/** Tests email post-déploiement — Gmail + iCloud avec redirect canonique. */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WrrXoHZQlwsb4L93a6Xykw_Qy-_8jX4'
const CANONICAL = 'https://www.pedagogia-drive.fr'
const redirectTo = `${CANONICAL}/accept-invite`

const TARGETS = [
  { provider: 'Gmail', email: process.env.TEST_GMAIL || 'imene.mansour2606@gmail.com' },
  { provider: 'iCloud', email: process.env.TEST_ICLOUD || 'imene.mansour@icloud.com' },
]

async function main() {
  console.log('\n=== Tests email post-déploiement ===\n')
  console.log(`Redirect: ${redirectTo}\n`)

  const client = createClient(url, anonKey, { auth: { persistSession: false } })
  const results = []

  for (const { provider, email } of TARGETS) {
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo })
    const ok = !error
    results.push({ provider, email, ok, detail: error?.message || 'E-mail de reset demandé (HTTP 200)' })
    console.log(`${ok ? '✅' : '❌'} ${provider} (${email}): ${error?.message || 'Reset demandé'}`)
  }

  console.log('\n--- Vérifications manuelles ---')
  console.log('1. Ouvrir Gmail et iCloud')
  console.log('2. Chercher e-mail Supabase / Pedagogia Drive (vérifier spams)')
  console.log('3. Cliquer le lien → doit arriver sur https://www.pedagogia-drive.fr/accept-invite')
  console.log('4. Le lien NE doit PAS contenir vercel.app ni localhost\n')

  const { writeFileSync, mkdirSync } = await import('node:fs')
  const { join, dirname } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const out = join(dirname(fileURLToPath(import.meta.url)), 'output')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'email-test-results.json'), `${JSON.stringify({ testedAt: new Date().toISOString(), redirectTo, results }, null, 2)}\n`)

  process.exit(results.some((r) => !r.ok) ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
