// PEDAGOGIA DRIVE — Super Admin : accepter un prospect (org + gérant + invitation Supabase)
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function appBaseUrl() {
  return (Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || 'https://www.pedagogia-drive.fr')
    .replace(/\/$/, '')
}

async function assertSuperAdmin(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
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

async function findUserByEmail(admin: ReturnType<typeof createClient>, email: string) {
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = (data.users || []).find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) return match
    if ((data.users || []).length < 200) return null
    page += 1
  }
}

async function sendWelcomeEmail(payload: {
  to: string
  contactName: string
  schoolName: string
  email: string
  activateLink: string
  loginUrl: string
}) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return { sent: false, reason: 'missing_resend_api_key' as const }

  const from =
    Deno.env.get('ACCESS_EMAIL_FROM') || 'Pedagogia Drive <noreply@pedagogia-drive.fr>'

  const html = `
    <h2>Bienvenue sur Pedagogia Drive</h2>
    <p>Bonjour ${escapeHtml(payload.contactName)},</p>
    <p>Votre demande de démonstration pour <strong>${escapeHtml(payload.schoolName)}</strong> a été acceptée.</p>
    <p>Votre essai gratuit de <strong>30 jours</strong> (plan Starter) est activé.</p>
    <p>Pour accéder à votre espace gérant, définissez votre mot de passe via le lien sécurisé ci-dessous :</p>
    <p><a href="${escapeHtml(payload.activateLink)}" style="display:inline-block;padding:12px 24px;background:#0891b2;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Définir mon mot de passe</a></p>
    <p style="font-size:13px;color:#64748b">Identifiant : ${escapeHtml(payload.email)}</p>
    <p style="font-size:13px;color:#64748b">Une fois votre mot de passe défini, connectez-vous sur <a href="${escapeHtml(payload.loginUrl)}">${escapeHtml(payload.loginUrl)}</a>.</p>
    <p>— L'équipe Pedagogia Drive</p>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: `[Pedagogia Drive] Bienvenue — activez votre compte gérant (${payload.schoolName})`,
      html,
    }),
  })

  if (res.ok) return { sent: true as const }
  const body = await res.text().catch(() => '')
  console.error('[platform-prospect] Resend failed', res.status, body)
  return { sent: false as const, reason: `resend_${res.status}` }
}

async function inviteManagerAccount(
  admin: ReturnType<typeof createClient>,
  params: { email: string; contactName: string; orgId: string },
) {
  const { email, contactName, orgId } = params
  const redirectTo = `${appBaseUrl()}/accept-invite`
  const metadata = {
    organization_id: orgId,
    role: 'manager',
    full_name: contactName,
  }

  const existing = await findUserByEmail(admin, email)

  if (existing) {
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', existing.id)
      .maybeSingle()

    if (profile?.role === 'super_admin') {
      throw new Error('Cette adresse e-mail est réservée au Super Admin de la plateforme.')
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })
    if (linkError) throw linkError

    const activateLink = linkData?.properties?.action_link
    if (!activateLink) throw new Error('Lien d\'activation introuvable.')

    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      app_metadata: { role: 'manager' },
      user_metadata: {
        ...(existing.user_metadata || {}),
        ...metadata,
        must_change_password: undefined,
      },
    })
    if (updateError) throw updateError

    await admin.from('profiles').upsert({
      id: existing.id,
      organization_id: orgId,
      role: 'manager',
      full_name: contactName,
      email,
      is_active: true,
    })

    return { userId: existing.id, created: false, activateLink }
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: metadata,
      redirectTo,
    },
  })
  if (linkError) throw linkError

  const userId = linkData?.user?.id
  const activateLink = linkData?.properties?.action_link
  if (!userId || !activateLink) {
    throw new Error('Invitation gérant impossible (lien Supabase manquant).')
  }

  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'manager' },
    user_metadata: metadata,
  })

  await admin.from('profiles').upsert({
    id: userId,
    organization_id: orgId,
    role: 'manager',
    full_name: contactName,
    email,
    is_active: true,
  })

  return { userId, created: true, activateLink }
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

    if (action === 'accept_prospect' || action === 'create_organization') {
      const prospectId = String(body.prospect_id || '').trim()
      if (!prospectId) return json({ error: 'prospect_id requis' }, 400)

      const { data: prospect, error: prospectError } = await admin
        .from('demo_requests')
        .select('*')
        .eq('id', prospectId)
        .single()
      if (prospectError || !prospect) {
        return json({ error: 'Prospect introuvable.' }, 404)
      }
      if (prospect.organization_id) {
        return json({ error: 'Une auto-école est déjà associée à ce prospect.' }, 400)
      }
      if (prospect.status === 'Refusée') {
        return json({ error: 'Impossible d\'accepter une demande refusée.' }, 400)
      }

      const { data: orgId, error: orgError } = await admin.rpc('platform_create_organization', {
        p_name: prospect.school_name,
        p_email: prospect.email,
        p_phone: prospect.phone,
      })
      if (orgError || !orgId) {
        return json({ error: orgError?.message || 'Création auto-école impossible.' }, 400)
      }

      let managerResult
      try {
        managerResult = await inviteManagerAccount(admin, {
          email: prospect.email,
          contactName: prospect.contact_name,
          orgId,
        })
      } catch (authErr) {
        await admin.from('organizations').delete().eq('id', orgId)
        return json({ error: String(authErr?.message || authErr) }, 400)
      }

      const loginUrl = `${appBaseUrl()}/login`
      const emailResult = await sendWelcomeEmail({
        to: prospect.email,
        contactName: prospect.contact_name,
        schoolName: prospect.school_name,
        loginUrl,
        email: prospect.email,
        activateLink: managerResult.activateLink,
      })

      const noteLine = `[${new Date().toISOString()}] Acceptée — org ${orgId}, gérant ${managerResult.userId}${emailResult.sent ? ', invitation envoyée' : ', e-mail non envoyé'}`
      await admin
        .from('demo_requests')
        .update({
          status: 'Essai gratuit',
          organization_id: orgId,
          updated_at: new Date().toISOString(),
          internal_notes: prospect.internal_notes
            ? `${prospect.internal_notes}\n${noteLine}`
            : noteLine,
        })
        .eq('id', prospectId)

      await admin.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: caller.id,
        actor_role: 'super_admin',
        action: 'create',
        entity_type: 'organizations',
        entity_id: orgId,
        entity_label: prospect.school_name,
        metadata: { source: 'prospect_accept', prospect_id: prospectId },
      })

      return json({
        ok: true,
        organization_id: orgId,
        manager_user_id: managerResult.userId,
        manager_created: managerResult.created,
        email_sent: emailResult.sent,
        email_error: emailResult.sent ? null : emailResult.reason ?? null,
      })
    }

    if (action === 'send_email') {
      const resendKey = Deno.env.get('RESEND_API_KEY')
      if (!resendKey) return json({ error: 'RESEND_API_KEY non configurée.' }, 503)

      const to = String(body.to || '').trim()
      const subject = String(body.subject || '').trim()
      const html = String(body.html || body.message || '').trim()
      if (!to || !subject || !html) {
        return json({ error: 'to, subject et message requis.' }, 400)
      }

      const from =
        Deno.env.get('ACCESS_EMAIL_FROM') || 'Pedagogia Drive <noreply@pedagogia-drive.fr>'

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [to], subject, html }),
      })

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        return json({ error: `Envoi e-mail échoué (${res.status}) ${errBody}` }, 502)
      }

      return json({ ok: true, email_sent: true })
    }

    return json({ error: 'Action non supportée' }, 400)
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500)
  }
})
