// PEDAGOGIA DRIVE — Renvoyer l'e-mail d'accès élève avec mot de passe provisoire
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loginUrl } from '../_shared/app-url.ts'
import { emailLog, escapeHtml } from '../_shared/email-utils.ts'

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

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const arr = new Uint8Array(12)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => chars[b % chars.length]).join('')
}

async function sendAccessEmail(
  email: string,
  fullName: string,
  tempPassword: string,
  orgName: string,
) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return { sent: false, reason: 'missing_resend_api_key' as const }
  }

  const appUrl = loginUrl()
  const from = Deno.env.get('ACCESS_EMAIL_FROM') || 'Pedagogia Drive <noreply@pedagogia-drive.fr>'

  const html = `
    <p>Bonjour ${escapeHtml(fullName)},</p>
    <p>Un nouveau mot de passe provisoire a été généré pour votre compte élève chez <strong>${escapeHtml(orgName)}</strong>.</p>
    <p><strong>Identifiant :</strong> ${escapeHtml(email)}<br/>
    <strong>Mot de passe provisoire :</strong> ${escapeHtml(tempPassword)}</p>
    <p>Connectez-vous sur <a href="${appUrl}">${appUrl}</a> puis modifiez votre mot de passe dès que possible.</p>
    <p>— Pedagogia Drive</p>
  `

  emailLog('resend-student-access', 'info', 'send_access_email', { email, appUrl })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `Nouvel accès élève — ${orgName}`,
      html,
    }),
  })

  if (res.ok) return { sent: true as const }
  const body = await res.text().catch(() => '')
  console.error('[resend-student-access] Resend a échoué', res.status, body)
  return { sent: false as const, reason: `resend_${res.status}` }
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

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, organization_id')
      .eq('id', caller.id)
      .maybeSingle()

    if (!callerProfile || !['manager', 'secretary'].includes(callerProfile.role)) {
      return json({ error: 'Action réservée au gérant ou au secrétariat' }, 403)
    }

    const body = await req.json()
    const studentId = String(body.student_id || '').trim()
    if (!studentId) return json({ error: 'Élève introuvable.' }, 400)

    const { data: student, error: studentError } = await admin
      .from('students')
      .select('id, profile_id, email, first_name, last_name, organization_id')
      .eq('id', studentId)
      .eq('organization_id', callerProfile.organization_id)
      .maybeSingle()

    if (studentError || !student) return json({ error: 'Élève introuvable.' }, 404)
    if (!student.profile_id) return json({ error: 'Cet élève n\'a pas encore de compte applicatif.' }, 400)

    const email = String(student.email || '').trim().toLowerCase()
    if (!email) return json({ error: 'Aucune adresse e-mail enregistrée pour cet élève.' }, 400)

    const { data: org } = await admin
      .from('organizations')
      .select('name, status')
      .eq('id', callerProfile.organization_id)
      .maybeSingle()

    if (!org || ['suspended', 'cancelled'].includes(org.status)) {
      return json({ error: 'Organisation en lecture seule.' }, 403)
    }

    const fullName = `${student.last_name || ''} ${student.first_name || ''}`.trim() || email
    const tempPassword = generateTempPassword()

    const { error: passwordError } = await admin.auth.admin.updateUserById(student.profile_id, {
      password: tempPassword,
      user_metadata: { must_change_password: true },
    })
    if (passwordError) return json({ error: passwordError.message }, 400)

    const emailResult = await sendAccessEmail(email, fullName, tempPassword, org.name || 'votre auto-école')

    return json({
      ok: true,
      email,
      temp_password: tempPassword,
      email_sent: emailResult.sent,
      email_error: emailResult.sent ? null : emailResult.reason ?? null,
      message: emailResult.sent
        ? 'E-mail d\'accès renvoyé avec un nouveau mot de passe provisoire.'
        : emailResult.reason === 'missing_resend_api_key'
          ? `Nouveau mot de passe provisoire : ${tempPassword} (service e-mail non configuré).`
          : `Nouveau mot de passe provisoire : ${tempPassword} (envoi e-mail échoué).`,
    })
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500)
  }
})
