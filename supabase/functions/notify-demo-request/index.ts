// PEDAGOGIA DRIVE — Notification e-mail : nouvelle demande de démonstration
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

async function sendDemoNotificationEmail(payload: {
  schoolName: string
  contactName: string
  phone: string
  email: string
  activeStudents: string | null
  message: string | null
}) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return { sent: false, reason: 'missing_resend_api_key' as const }
  }

  const to =
    Deno.env.get('DEMO_NOTIFICATION_EMAIL') ||
    Deno.env.get('CONTACT_EMAIL') ||
    'contact@pedagogia-drive.fr'
  const from = Deno.env.get('ACCESS_EMAIL_FROM') || 'Pedagogia Drive <noreply@pedagogia-drive.fr>'
  const dashboardUrl =
    Deno.env.get('SUPABASE_DASHBOARD_URL') ||
    'https://supabase.com/dashboard/project/watdeahravfccjdoseaf/editor/demo_requests'

  const html = `
    <h2>Nouvelle demande de démonstration</h2>
    <p>Une auto-école a rempli le formulaire sur le site Pedagogia Drive.</p>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><td><strong>Auto-école</strong></td><td>${escapeHtml(payload.schoolName)}</td></tr>
      <tr><td><strong>Contact</strong></td><td>${escapeHtml(payload.contactName)}</td></tr>
      <tr><td><strong>E-mail</strong></td><td><a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></td></tr>
      <tr><td><strong>Téléphone</strong></td><td>${escapeHtml(payload.phone)}</td></tr>
      <tr><td><strong>Élèves actifs</strong></td><td>${escapeHtml(payload.activeStudents || '—')}</td></tr>
      <tr><td><strong>Message</strong></td><td>${escapeHtml(payload.message || '—')}</td></tr>
    </table>
    <p style="margin-top:24px">
      <a href="${dashboardUrl}">Voir les demandes dans Supabase</a>
    </p>
    <p>— Pedagogia Drive</p>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject: `[Pedagogia Drive] Demande démo — ${payload.schoolName}`,
      html,
    }),
  })

  if (res.ok) return { sent: true as const }
  const body = await res.text().catch(() => '')
  console.error('[notify-demo-request] Resend a échoué', res.status, body)
  return { sent: false as const, reason: `resend_${res.status}` }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = await req.json()
    const schoolName = String(body.school_name || body.schoolName || '').trim()
    const contactName = String(body.contact_name || body.contactName || '').trim()
    const phone = String(body.phone || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const activeStudents = String(body.approximate_students || body.activeStudents || '').trim() || null
    const message = String(body.message || '').trim() || null

    if (!schoolName || !contactName || !phone || !email) {
      return json({ error: 'Champs obligatoires manquants.' }, 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'E-mail invalide.' }, 400)
    }

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(url, serviceKey)

    const { data: recent } = await admin
      .from('demo_requests')
      .select('id')
      .eq('email', email)
      .eq('school_name', schoolName)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(1)

    if (!recent?.length) {
      return json({ error: 'Demande introuvable. Réessayez dans un instant.' }, 404)
    }

    const emailResult = await sendDemoNotificationEmail({
      schoolName,
      contactName,
      phone,
      email,
      activeStudents,
      message,
    })

    return json({
      ok: true,
      email_sent: emailResult.sent,
      email_error: emailResult.sent ? null : emailResult.reason ?? null,
    })
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500)
  }
})
