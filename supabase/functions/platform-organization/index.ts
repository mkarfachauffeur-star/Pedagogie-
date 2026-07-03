// PEDAGOGIA DRIVE — Super Admin : création / suppression d'auto-école
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

async function assertSuperAdmin(admin: ReturnType<typeof createClient>, userId: string) {
  const { data: sa } = await admin
    .from('super_admins')
    .select('profile_id')
    .eq('profile_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (sa) return true

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  return profile?.role === 'super_admin'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await asCaller.auth.getUser()
    const caller = userData?.user
    if (!caller) return json({ error: 'Non authentifié' }, 401)

    const admin = createClient(url, serviceKey)
    if (!(await assertSuperAdmin(admin, caller.id))) {
      return json({ error: 'Accès réservé au Super Admin' }, 403)
    }

    const body = await req.json()
    const action = String(body.action || '').trim()

    if (action === 'delete') {
      const orgId = String(body.organization_id || '').trim()
      if (!orgId) return json({ error: 'organization_id requis' }, 400)

      const { data: orgRow } = await admin
        .from('organizations')
        .select('id, name')
        .eq('id', orgId)
        .maybeSingle()
      if (!orgRow) {
        return json({ ok: true, message: 'Auto-école déjà supprimée.' })
      }

      const { data: profiles, error: profilesError } = await admin
        .from('profiles')
        .select('id')
        .eq('organization_id', orgId)
      if (profilesError) return json({ error: profilesError.message }, 400)

      for (const profile of profiles || []) {
        const { error: userError } = await admin.auth.admin.deleteUser(profile.id)
        if (userError) {
          return json({ error: `Suppression compte ${profile.id} : ${userError.message}` }, 400)
        }
      }

      const { error: deleteError } = await admin.from('organizations').delete().eq('id', orgId)
      if (deleteError) return json({ error: deleteError.message }, 400)

      return json({ ok: true, message: 'Auto-école supprimée.' })
    }

    return json({ error: 'Action non supportée' }, 400)
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500)
  }
})
