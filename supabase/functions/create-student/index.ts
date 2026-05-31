// PEDAGOGIA DRIVE — Création élève par invitation e-mail
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

function formatNamePart(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function generateFileNumber(
  admin: ReturnType<typeof createClient>,
  orgId: string,
  lastName: string,
  firstName: string,
) {
  const year = new Date().getFullYear()
  const { count } = await admin
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const seq = String((count || 0) + 1).padStart(3, '0')
  const base = `PD-${year}-${seq}`
  const parts = [base, formatNamePart(lastName), formatNamePart(firstName)].filter(Boolean)
  let candidate = parts.join('-')

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existing } = await admin
      .from('students')
      .select('id')
      .eq('organization_id', orgId)
      .eq('file_number', candidate)
      .maybeSingle()
    if (!existing) return candidate
    candidate = `${base}-${String(attempt + 2).padStart(2, '0')}`
  }
  return `${base}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

async function canCreateStudent(admin: ReturnType<typeof createClient>, orgId: string) {
  const { data: org } = await admin.from('organizations').select('status').eq('id', orgId).single()
  if (!org || ['suspended', 'cancelled'].includes(org.status)) return { ok: false, reason: 'Organisation en lecture seule.' }

  const { data: sub } = await admin
    .from('subscriptions')
    .select('status, trial_ends_at, plan:plan_id(max_students)')
    .eq('organization_id', orgId)
    .single()

  if (sub?.status && ['suspended', 'expired', 'cancelled'].includes(sub.status)) {
    return { ok: false, reason: 'Abonnement inactif.' }
  }
  if (org.status === 'trial' && sub?.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) {
    return { ok: false, reason: 'Essai gratuit expiré.' }
  }

  const maxStudents = (sub?.plan as { max_students?: number })?.max_students
  if (maxStudents != null) {
    const { count } = await admin.from('students').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
    if ((count || 0) >= maxStudents) {
      return { ok: false, reason: `Limite de ${maxStudents} élèves atteinte pendant l'essai.` }
    }
  }
  return { ok: true }
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

    const orgId = callerProfile.organization_id
    const gate = await canCreateStudent(admin, orgId)
    if (!gate.ok) return json({ error: gate.reason }, 403)

    const body = await req.json()
    const firstName = String(body.first_name || '').trim()
    const lastName = String(body.last_name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const birthDate = body.birth_date ? String(body.birth_date) : null
    const streetNumber = String(body.street_number || '').trim()
    const street = String(body.street || '').trim()
    const packageId = body.package_id ? String(body.package_id) : null
    const teacherId = body.teacher_id ? String(body.teacher_id) : null
    const extraHours = Math.max(0, Math.floor(Number(body.extra_hours) || 0))

    if (!firstName || !lastName || !email) {
      return json({ error: 'Nom, prénom et e-mail sont obligatoires.' }, 400)
    }

    const fullName = `${firstName} ${lastName}`.trim()

    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { organization_id: orgId, role: 'student', full_name: fullName },
    })

    if (inviteError) {
      const message = inviteError.message?.includes('already')
        ? 'Un compte existe déjà avec cet e-mail.'
        : inviteError.message
      return json({ error: message }, 400)
    }

    const userId = inviteData.user?.id
    if (!userId) return json({ error: 'Invitation impossible.' }, 500)

    await admin.from('profiles').update({ full_name: fullName, phone: phone || null }).eq('id', userId)

    const fileNumber = await generateFileNumber(admin, orgId, lastName, firstName)

    let packageName: string | null = null
    let pkg: Record<string, unknown> | null = null
    if (packageId) {
      const { data } = await admin.from('pricing_packages').select('*').eq('id', packageId).eq('organization_id', orgId).maybeSingle()
      pkg = data
      packageName = data?.name || null
    }

    const { data: student, error: studentError } = await admin
      .from('students')
      .insert({
        organization_id: orgId,
        profile_id: userId,
        file_number: fileNumber,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        birth_date: birthDate || null,
        street_number: streetNumber || null,
        street: street || null,
        package_id: packageId,
        package_name: packageName,
        extra_hours: extraHours,
        status: 'En attente',
      })
      .select('id, file_number, first_name, last_name, email, status')
      .single()

    if (studentError) {
      await admin.auth.admin.deleteUser(userId)
      return json({ error: studentError.message }, 400)
    }

    if (pkg) {
      const examTtc = pkg.exam_presentation_included ? Number(pkg.exam_presentation_ttc || 0) : 0
      const extraAmount = extraHours * Number(pkg.extra_hour_price_ttc || 0)
      await admin.from('contracts').insert({
        organization_id: orgId,
        student_id: student.id,
        package_id: packageId,
        package_price_ttc: Number(pkg.price_ttc || 0),
        admin_fee_ttc: Number(pkg.admin_fee_ttc || 0),
        exam_presentation_ttc: examTtc,
        extra_hours: extraHours,
        extra_hours_amount_ttc: extraAmount,
        signed_at: new Date().toISOString().slice(0, 10),
      })
    }

    if (teacherId) {
      await admin.from('student_assignments').insert({
        student_id: student.id,
        teacher_id: teacherId,
        is_referent: true,
      })
    }

    return json({
      ok: true,
      student,
      email,
      full_name: fullName,
      invited: true,
      message: 'Invitation envoyée par e-mail. L\'élève pourra définir son mot de passe via le lien reçu.',
    })
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500)
  }
})
