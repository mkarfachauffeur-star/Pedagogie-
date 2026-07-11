import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { emailLog, escapeHtml, normalizeResendKey } from '../_shared/email-utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

async function sendAccessExpiringEmail(to: string, fullName: string, expiresAt: string) {
  const apiKey = normalizeResendKey(Deno.env.get('RESEND_API_KEY'))
  const from = Deno.env.get('RESEND_FROM') || 'Pedagogia Drive <noreply@pedagogia-drive.fr>'
  if (!apiKey || !to) return { sent: false, reason: 'missing_config' }

  const safeName = escapeHtml(fullName || 'Élève')
  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'bientôt'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: '⏳ Votre accès Pedagogia Drive expire bientôt',
      html: `<p>Bonjour ${safeName},</p><p>Votre accès Pedagogia Drive expirera dans 15 jours (${expiryLabel}).</p><p>Consultez votre livret numérique et téléchargez vos attestations avant cette date.</p><p>L'équipe Pedagogia Drive</p>`,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    emailLog('check-student-access-expiry', 'error', 'Resend failed', { status: res.status, body })
    return { sent: false, reason: body }
  }
  return { sent: true, reason: null }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  const requestSecret = req.headers.get('x-cron-secret')
  if (cronSecret && requestSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await admin.rpc('run_student_access_expiry_checks')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let emailsSent = 0
  const warnEmails = Array.isArray(data?.warn_emails) ? data.warn_emails : []
  for (const row of warnEmails) {
    if (!row?.email) continue
    const result = await sendAccessExpiringEmail(row.email, row.full_name, row.access_expires_at)
    if (result.sent) emailsSent += 1
  }

  return new Response(JSON.stringify({ ok: true, ...data, emails_sent: emailsSent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
