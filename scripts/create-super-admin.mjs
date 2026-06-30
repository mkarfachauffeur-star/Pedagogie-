#!/usr/bin/env node
/**
 * Crée ou met à jour le compte Super Admin Pedagogia Drive.
 * Ce compte n'est rattaché à aucune auto-école (organization_id = NULL).
 *
 * Usage :
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   SUPER_ADMIN_EMAIL=admin@pedagogia-drive.fr \
 *   SUPER_ADMIN_PASSWORD='MotDePasseSecurise123!' \
 *   SUPER_ADMIN_FULL_NAME='Admin Pedagogia Drive' \
 *   node scripts/create-super-admin.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.SUPER_ADMIN_PASSWORD
const fullName = process.env.SUPER_ADMIN_FULL_NAME?.trim() || 'Super Admin Pedagogia Drive'

function fail(message) {
  console.error(`[create-super-admin] ${message}`)
  process.exit(1)
}

if (!url || !serviceKey) {
  fail('Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.')
}
if (!email) fail('Variable SUPER_ADMIN_EMAIL requise.')
if (!password || password.length < 8) {
  fail('Variable SUPER_ADMIN_PASSWORD requise (8 caractères minimum).')
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(targetEmail) {
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = (data.users || []).find((user) => user.email?.toLowerCase() === targetEmail)
    if (match) return match
    if ((data.users || []).length < 200) return null
    page += 1
  }
}

async function ensureAuthUser() {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'super_admin' },
    user_metadata: { role: 'super_admin', full_name: fullName },
  })

  if (!error && data.user) {
    console.log(`[create-super-admin] Compte Auth créé : ${email}`)
    return data.user
  }

  const duplicate =
    error?.message?.toLowerCase().includes('already') ||
    error?.message?.toLowerCase().includes('registered')
  if (!duplicate) throw error

  const existing = await findUserByEmail(email)
  if (!existing) throw new Error(`Compte existant introuvable pour ${email}`)

  const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata: { role: 'super_admin' },
    user_metadata: { role: 'super_admin', full_name: fullName },
  })
  if (updateError) throw updateError

  console.log(`[create-super-admin] Compte Auth mis à jour : ${email}`)
  return existing
}

async function ensureProfile(userId) {
  const { error } = await admin.from('profiles').upsert(
    {
      id: userId,
      organization_id: null,
      role: 'super_admin',
      full_name: fullName,
      email,
      is_active: true,
    },
    { onConflict: 'id' },
  )
  if (error) throw error
  console.log('[create-super-admin] Profil super_admin sans auto-école configuré.')
}

async function ensureSuperAdminRow(userId) {
  const { error } = await admin.from('super_admins').upsert(
    {
      profile_id: userId,
      is_active: true,
      granted_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' },
  )
  if (error) throw error
  console.log('[create-super-admin] Entrée super_admins active.')
}

try {
  const user = await ensureAuthUser()
  await ensureProfile(user.id)
  await ensureSuperAdminRow(user.id)

  console.log('')
  console.log('Super Admin prêt.')
  console.log(`  E-mail      : ${email}`)
  console.log(`  Connexion   : https://www.pedagogia-drive.fr/login`)
  console.log(`  Plateforme  : https://www.pedagogia-drive.fr/platform/dashboard`)
  console.log('')
  console.log('Accès :')
  console.log('  • Toutes les auto-écoles (/platform/organizations)')
  console.log('  • Abonnements et essais (/platform/subscriptions)')
  console.log('  • Journaux d’audit (/platform/audit)')
  console.log('  • Demandes démo (table demo_requests dans Supabase)')
} catch (error) {
  fail(error?.message || String(error))
}
