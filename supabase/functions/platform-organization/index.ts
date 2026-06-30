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
  const { data, error } = await admin
    .from('super_admins')
    .select('profile_id')
    .eq('profile_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  if (!data) return false
  return true
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

      const { data: profiles } = await admin.from('profiles').select('id').eq('organization_id', orgId)
      for (const profile of profiles || []) {
        await admin.auth.admin.deleteUser(profile.id)
      }

      const { error: deleteError } = await admin.from('organizations').delete().eq('id', orgId)
      if (deleteError) return json({ error: deleteError.message }, 400)

      await admin.from('audit_logs').insert({
        actor_id: caller.id,
        actor_role: 'super_admin',
        action: 'delete',
        entity_type: 'organizations',
        entity_id: orgId,
        metadata: { source: 'platform_super_admin' },
      })

      return json({ ok: true, message: 'Auto-école supprimée.' })
    }

    return json({ error: 'Action non supportée' }, 400)
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500)
  }
})
