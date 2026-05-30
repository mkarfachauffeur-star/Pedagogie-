// PEDAGOGIA DRIVE — Edge Function : invite-user
// -----------------------------------------------------------------------------
// Crée un compte utilisateur (Gérant / Secrétaire / Enseignant / Élève) et
// l'invite par e-mail. La création de comptes nécessite la clé service_role :
// elle ne peut donc PAS être faite côté navigateur -> cette fonction serveur.
//
// Sécurité :
//  - Le demandeur doit être authentifié (JWT) ET avoir le rôle 'manager' ou
//    'secretary' DANS son organisation.
//  - Le nouvel utilisateur est rattaché à l'organisation du demandeur.
//
// Déploiement : `supabase functions deploy invite-user`
// Secrets requis : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (configurés par
// Supabase automatiquement pour les Edge Functions).
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

    // Client "as caller" pour identifier le demandeur via son JWT.
    const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await asCaller.auth.getUser()
    const caller = userData?.user
    if (!caller) return json({ error: 'Non authentifié' }, 401)

    // Client admin (service role) pour les opérations privilégiées.
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
    const email = String(body.email || '').trim().toLowerCase()
    const role = String(body.role || '')
    const fullName = String(body.full_name || '')
    if (!email || !ALLOWED_ROLES.includes(role)) {
      return json({ error: 'Paramètres invalides (email, role)' }, 400)
    }

    // Invitation par e-mail + métadonnées (org + rôle) -> profil créé par trigger.
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: callerProfile.organization_id,
        role,
        full_name: fullName,
      },
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
