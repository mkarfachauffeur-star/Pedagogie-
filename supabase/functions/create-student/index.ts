// PEDAGOGIA DRIVE — Edge Function : create-student
// Crée un compte élève (Auth + profile + dossier students + affectation optionnelle).
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

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 10; i += 1) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${pwd}!9`
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
    const firstName = String(body.first_name || '').trim()
    const lastName = String(body.last_name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const birthDate = body.birth_date ? String(body.birth_date) : null
    const address = String(body.address || '').trim()
    const packageName = String(body.package_name || '').trim()
    const teacherId = body.teacher_id ? String(body.teacher_id) : null

    if (!firstName || !lastName || !email) {
      return json({ error: 'Nom, prénom et e-mail sont obligatoires.' }, 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Adresse e-mail invalide.' }, 400)
    }

    const orgId = callerProfile.organization_id
    const fullName = `${firstName} ${lastName}`.trim()
    const tempPassword = generateTempPassword()

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        organization_id: orgId,
        role: 'student',
        full_name: fullName,
      },
    })

    if (authError) {
      const message = authError.message?.includes('already')
        ? 'Un compte existe déjà avec cet e-mail.'
        : authError.message
      return json({ error: message }, 400)
    }

    const userId = authData.user?.id
    if (!userId) return json({ error: 'Création du compte impossible.' }, 500)

    await admin
      .from('profiles')
      .update({ full_name: fullName, email, phone: phone || null })
      .eq('id', userId)

    const fileNumber = await generateFileNumber(admin, orgId, lastName, firstName)

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
        street: address || null,
        package_name: packageName || null,
        status: 'En attente',
      })
      .select(
        'id, file_number, first_name, last_name, email, phone, birth_date, package_name, status, registration_date',
      )
      .single()

    if (studentError) {
      await admin.auth.admin.deleteUser(userId)
      return json({ error: studentError.message }, 400)
    }

    if (teacherId) {
      const { data: teacher } = await admin
        .from('teachers')
        .select('profile_id')
        .eq('profile_id', teacherId)
        .eq('organization_id', orgId)
        .maybeSingle()

      if (teacher?.profile_id) {
        await admin.from('student_assignments').insert({
          student_id: student.id,
          teacher_id: teacherId,
          is_referent: true,
        })
      }
    }

    return json({
      ok: true,
      student,
      temp_password: tempPassword,
      email,
      full_name: fullName,
    })
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500)
  }
})
