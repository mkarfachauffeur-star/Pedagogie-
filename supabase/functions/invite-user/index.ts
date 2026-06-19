// PEDAGOGIA DRIVE — Edge Function : invite-user
// -----------------------------------------------------------------------------
// Crée un compte utilisateur (Gérant / Secrétaire / Enseignant / Élève) et
// l'invite par e-mail. La création de comptes nécessite la clé service_role :
// elle ne peut donc PAS être faite côté navigateur -> cette fonction serveur.
//
// Simulateurs : compte technique sans invitation e-mail (createUser).
// -----------------------------------------------------------------------------
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_ROLES = ['manager', 'teacher', 'secretary', 'student']

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

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, organization_id')
      .eq('id', caller.id)
      .maybeSingle()

    if (!callerProfile || !['manager', 'secretary'].includes(callerProfile.role)) {
      return json({ error: 'Action réservée au gérant ou au secrétariat' }, 403)
    }

    const body = await req.json()
    const role = String(body.role || '')
    const fullName = String(body.full_name || '').trim()
    const resourceType = String(body.resource_type || 'teacher').trim().toLowerCase()
    const isSimulator = resourceType === 'simulator'
    let email = String(body.email || '').trim().toLowerCase()

    if (!ALLOWED_ROLES.includes(role)) {
      return json({ error: 'Paramètres invalides (role)' }, 400)
    }

    if (isSimulator) {
      if (!fullName) {
        return json({ error: 'Le nom du simulateur est obligatoire.' }, 400)
      }
      if (!email) {
        email = `simulator.${crypto.randomUUID()}@resources.pedagogia-drive.app`
      }

      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          organization_id: callerProfile.organization_id,
          role,
          full_name: fullName,
          resource_type: 'simulator',
        },
      })
      if (error) return json({ error: error.message }, 400)

      return json({ ok: true, user_id: data.user?.id, email })
    }

    if (!email) {
      return json({ error: 'Paramètres invalides (email, role)' }, 400)
    }

    const appUrl = (Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || 'http://localhost:5173')
      .replace(/\/$/, '')
    const redirectTo = `${appUrl}/accept-invite`

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: callerProfile.organization_id,
        role,
        full_name: fullName,
      },
      redirectTo,
    })
    if (error) return json({ error: error.message }, 400)

    return json({ ok: true, user_id: data.user?.id })
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
