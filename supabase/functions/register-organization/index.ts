// PEDAGOGIA DRIVE — Inscription auto-école (auto-activation + essai 30j)
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(url, serviceKey)

    const body = await req.json()
    const orgName = String(body.org_name || '').trim()
    const managerFirst = String(body.manager_first_name || '').trim()
    const managerLast = String(body.manager_last_name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const password = String(body.password || '')
    const address = String(body.address || '').trim()
    const postalCode = String(body.postal_code || '').trim()
    const city = String(body.city || '').trim()
    const siret = String(body.siret || '').trim()
    const prefectureApproval = String(body.prefecture_approval || '').trim()
    const logoBase64 = body.logo_base64 ? String(body.logo_base64) : null
    const logoMime = body.logo_mime ? String(body.logo_mime) : 'image/png'

    if (!orgName || !managerFirst || !managerLast || !email || !password) {
      return json({ error: 'Nom auto-école, gérant, e-mail et mot de passe sont obligatoires.' }, 400)
    }
    if (password.length < 8) {
      return json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Adresse e-mail invalide.' }, 400)
    }

    const fullName = `${managerFirst} ${managerLast}`.trim()

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: orgName,
        email,
        phone: phone || null,
        address: address || null,
        postal_code: postalCode || null,
        city: city || null,
        siret: siret || null,
        prefecture_approval: prefectureApproval || null,
        status: 'trial',
      })
      .select('id')
      .single()

    if (orgError || !org) return json({ error: orgError?.message || 'Création organisation impossible.' }, 400)

    const orgId = org.id

    const { data: trialPlan } = await admin.from('plans').select('id, trial_days, max_students').eq('code', 'trial').single()
    if (!trialPlan) return json({ error: 'Plan essai non configuré.' }, 500)

    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + (trialPlan.trial_days || 30))

    await admin.from('subscriptions').insert({
      organization_id: orgId,
      plan_id: trialPlan.id,
      status: 'active',
      trial_ends_at: trialEnds.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEnds.toISOString(),
    })

    await admin.rpc('seed_default_packages', { p_org_id: orgId })

    await admin.from('billing_history').insert({
      organization_id: orgId,
      event_type: 'trial_started',
      new_value: { trial_ends_at: trialEnds.toISOString(), max_students: trialPlan.max_students },
      notes: 'Inscription auto-école',
    })

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        organization_id: orgId,
        role: 'manager',
        full_name: fullName,
      },
    })

    if (authError) {
      await admin.from('organizations').delete().eq('id', orgId)
      const message = authError.message?.includes('already')
        ? 'Un compte existe déjà avec cet e-mail.'
        : authError.message
      return json({ error: message }, 400)
    }

    const userId = authData.user?.id
    if (!userId) return json({ error: 'Création compte gérant impossible.' }, 500)

    await admin.from('profiles').update({ phone: phone || null, full_name: fullName }).eq('id', userId)

    let logoPath: string | null = null
    if (logoBase64) {
      try {
        const ext = logoMime.includes('jpeg') || logoMime.includes('jpg') ? 'jpg' : logoMime.includes('webp') ? 'webp' : 'png'
        const bytes = Uint8Array.from(atob(logoBase64.replace(/^data:[^;]+;base64,/, '')), (c) => c.charCodeAt(0))
        logoPath = `${orgId}/logo.${ext}`
        await admin.storage.from('org-assets').upload(logoPath, bytes, { contentType: logoMime, upsert: true })
        await admin.from('organizations').update({ logo_storage_path: logoPath }).eq('id', orgId)
      } catch {
        // Logo non bloquant
      }
    }

    await admin.from('audit_logs').insert({
      organization_id: orgId,
      actor_id: userId,
      actor_role: 'manager',
      actor_email: email,
      action: 'signup',
      entity_type: 'organizations',
      entity_id: orgId,
      entity_label: orgName,
      new_data: { name: orgName, status: 'trial' },
    })

    return json({
      ok: true,
      organization_id: orgId,
      user_id: userId,
      trial_ends_at: trialEnds.toISOString(),
      max_students: trialPlan.max_students,
    })
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500)
  }
})
