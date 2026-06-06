import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ACTIONS = ['reset_password', 'resend_invite', 'disable', 'enable', 'delete'] as const

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

    if (!callerProfile || callerProfile.role !== 'manager') {
      return json({ error: 'Action réservée au gérant' }, 403)
    }

    const body = await req.json()
    const action = String(body.action || '')
    const userId = String(body.user_id || '')

    if (!ACTIONS.includes(action as typeof ACTIONS[number])) {
      return json({ error: 'Action invalide' }, 400)
    }
    if (!userId) return json({ error: 'Utilisateur requis' }, 400)
    if (userId === caller.id && action === 'delete') {
      return json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }, 400)
    }

    const { data: targetProfile } = await admin
      .from('profiles')
      .select('id, email, role, organization_id, is_active')
      .eq('id', userId)
      .maybeSingle()

    if (!targetProfile || targetProfile.organization_id !== callerProfile.organization_id) {
      return json({ error: 'Utilisateur introuvable' }, 404)
    }
    if (!['manager', 'teacher', 'secretary'].includes(targetProfile.role)) {
      return json({ error: 'Ce compte ne peut pas être géré ici' }, 400)
    }

    const appUrl = (Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || 'http://localhost:5173')
      .replace(/\/$/, '')
    const redirectTo = `${appUrl}/accept-invite`

    if (action === 'disable') {
      await admin.from('profiles').update({ is_active: false }).eq('id', userId)
      if (targetProfile.role === 'teacher') {
        await admin.from('teachers').update({ is_active: false }).eq('profile_id', userId)
      }
      return json({ ok: true, message: 'Compte désactivé.' })
    }

    if (action === 'enable') {
      await admin.from('profiles').update({ is_active: true }).eq('id', userId)
      if (targetProfile.role === 'teacher') {
        await admin.from('teachers').update({ is_active: true }).eq('profile_id', userId)
      }
      return json({ ok: true, message: 'Compte réactivé.' })
    }

    if (action === 'delete') {
      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true, message: 'Compte supprimé.' })
    }

    const email = targetProfile.email
    if (!email) return json({ error: 'E-mail introuvable pour cet utilisateur' }, 400)

    if (action === 'reset_password') {
      const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true, message: 'E-mail de réinitialisation envoyé.' })
    }

    if (action === 'resend_invite') {
      const { data: authUser } = await admin.auth.admin.getUserById(userId)
      const meta = authUser.user?.user_metadata || {}
      const { error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          organization_id: targetProfile.organization_id,
          role: targetProfile.role,
          full_name: meta.full_name || '',
        },
        redirectTo,
      })
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true, message: 'Invitation renvoyée.' })
    }

    return json({ error: 'Action non prise en charge' }, 400)
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
