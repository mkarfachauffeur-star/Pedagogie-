// PEDAGOGIA DRIVE — Super Admin : accepter un prospect (transaction + invitation Supabase)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type AdminClient = ReturnType<typeof createClient>

type AuthInviteResult = {
  userId: string
  created: boolean
  activateLink: string
}

type PriorProfile = {
  id: string
  organization_id: string | null
  role: string
  full_name: string | null
  email: string | null
  is_active: boolean | null
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

function formatFrDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR')
  } catch {
    return iso
  }
}

async function assertSuperAdmin(admin: AdminClient, userId: string): Promise<boolean> {
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

async function findUserByEmail(admin: AdminClient, email: string) {
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
  trialStartedAt: string
  trialEndsAt: string
}) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    throw new Error('RESEND_API_KEY non configurée — envoi e-mail impossible.')
  }

  const from =
    Deno.env.get('ACCESS_EMAIL_FROM') || 'Pedagogia Drive <noreply@pedagogia-drive.fr>'

  const html = `
    <h2>Bienvenue sur Pedagogia Drive</h2>
    <p>Bonjour ${escapeHtml(payload.contactName)},</p>
    <p>Votre demande de démonstration pour <strong>${escapeHtml(payload.schoolName)}</strong> a été acceptée.</p>
    <p>Votre essai gratuit <strong>Starter</strong> de 30 jours est activé du <strong>${escapeHtml(formatFrDate(payload.trialStartedAt))}</strong> au <strong>${escapeHtml(formatFrDate(payload.trialEndsAt))}</strong>.</p>
    <p>Pour accéder à votre espace gérant, définissez votre mot de passe via le lien sécurisé Supabase ci-dessous :</p>
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

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[platform-prospect] Resend failed', res.status, body)
    throw new Error(`Envoi e-mail Resend échoué (${res.status}).`)
  }
}

async function createManagerAuthInvite(
  admin: AdminClient,
  params: { email: string; contactName: string; orgId?: string },
): Promise<AuthInviteResult> {
  const { email, contactName } = params
  const redirectTo = `${appBaseUrl()}/accept-invite`
  const metadata = {
    organization_id: params.orgId ?? null,
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

  return { userId, created: true, activateLink }
}

async function rollbackAuthUser(
  admin: AdminClient,
  authResult: AuthInviteResult,
  priorProfile: PriorProfile | null,
) {
  if (authResult.created) {
    const { error } = await admin.auth.admin.deleteUser(authResult.userId)
    if (error) console.error('[platform-prospect] deleteUser rollback failed', error.message)
    return
  }

  if (priorProfile) {
    await admin.from('profiles').upsert({
      id: priorProfile.id,
      organization_id: priorProfile.organization_id,
      role: priorProfile.role,
      full_name: priorProfile.full_name,
      email: priorProfile.email,
      is_active: priorProfile.is_active ?? true,
    })
  }
}

async function rollbackAcceptance(
  admin: AdminClient,
  asCaller: AdminClient,
  params: {
    prospectId: string
    orgId: string | null
    authResult: AuthInviteResult
    priorProfile: PriorProfile | null
  },
) {
  if (params.orgId) {
    const { error } = await asCaller.rpc('platform_rollback_demo_acceptance', {
      p_prospect_id: params.prospectId,
      p_org_id: params.orgId,
    })
    if (error) console.error('[platform-prospect] SQL rollback failed', error.message)
  }

  await rollbackAuthUser(admin, params.authResult, params.priorProfile)
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
      if (prospect.status === 'Acceptée') {
        return json({ error: 'Cette demande a déjà été acceptée.' }, 400)
      }

      let authResult: AuthInviteResult
      let priorProfile: PriorProfile | null = null

      try {
        const existing = await findUserByEmail(admin, prospect.email)
        if (existing) {
          const { data } = await admin
            .from('profiles')
            .select('id, organization_id, role, full_name, email, is_active')
            .eq('id', existing.id)
            .maybeSingle()
          priorProfile = data ?? null
        }

        authResult = await createManagerAuthInvite(admin, {
          email: prospect.email,
          contactName: prospect.contact_name,
        })
      } catch (authErr) {
        return json({ error: String(authErr?.message || authErr) }, 400)
      }

      const { data: acceptData, error: acceptError } = await asCaller.rpc('platform_accept_demo_request', {
        p_prospect_id: prospectId,
        p_manager_user_id: authResult.userId,
        p_manager_email: prospect.email,
        p_manager_name: prospect.contact_name,
      })

      if (acceptError || !acceptData) {
        await rollbackAuthUser(admin, authResult, priorProfile)
        return json({ error: acceptError?.message || 'Création auto-école impossible.' }, 400)
      }

      const orgId = String(acceptData.organization_id || '')
      const trialStartedAt = String(acceptData.trial_started_at || '')
      const trialEndsAt = String(acceptData.trial_ends_at || '')

      await admin.auth.admin.updateUserById(authResult.userId, {
        app_metadata: { role: 'manager' },
        user_metadata: {
          organization_id: orgId,
          role: 'manager',
          full_name: prospect.contact_name,
        },
      })

      try {
        await sendWelcomeEmail({
          to: prospect.email,
          contactName: prospect.contact_name,
          schoolName: prospect.school_name,
          loginUrl: `${appBaseUrl()}/login`,
          email: prospect.email,
          activateLink: authResult.activateLink,
          trialStartedAt,
          trialEndsAt,
        })
      } catch (emailErr) {
        await rollbackAcceptance(admin, asCaller, {
          prospectId,
          orgId,
          authResult,
          priorProfile,
        })
        return json({ error: String(emailErr?.message || emailErr) }, 502)
      }

      return json({
        ok: true,
        organization_id: orgId,
        manager_user_id: authResult.userId,
        manager_created: authResult.created,
        trial_started_at: trialStartedAt,
        trial_ends_at: trialEndsAt,
        status: 'Acceptée',
        email_sent: true,
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
