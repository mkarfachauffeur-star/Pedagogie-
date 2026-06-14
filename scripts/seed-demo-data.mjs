#!/usr/bin/env node
/**
 * Jeu de données de démonstration — 2 auto-écoles complètes.
 *
 * Usage :
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo-data.mjs
 *   node scripts/seed-demo-data.mjs --reset   # supprime puis recrée
 */
import { createClient } from '@supabase/supabase-js'
import {
  DEMO_EMAIL_DOMAIN,
  STUDENT_FIRST_NAMES,
  STUDENT_LAST_NAMES,
  buildDemoOrgsConfig,
  demoEmail,
  generateFileNumber,
  generateTempPassword,
  printCredentialsTable,
  requireSupabaseAdmin,
  roleLabel,
  writeCredentialsReport,
} from './lib/demo-seed-utils.mjs'

const RESET = process.argv.includes('--reset')

async function listDemoAuthUsers(admin) {
  const users = []
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    users.push(...(data.users || []))
    if ((data.users || []).length < 200) break
    page += 1
  }
  return users.filter((user) => user.email?.endsWith(`@${DEMO_EMAIL_DOMAIN}`))
}

async function resetDemoData(admin) {
  console.log('Suppression des données demo existantes…')
  const demoUsers = await listDemoAuthUsers(admin)
  for (const user of demoUsers) {
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) console.warn(`  ⚠ Suppression auth ${user.email}: ${error.message}`)
    else console.log(`  ✓ Auth supprimé : ${user.email}`)
  }

  const orgNames = buildDemoOrgsConfig().map((org) => org.name)
  const { data: orgs } = await admin.from('organizations').select('id, name').in('name', orgNames)
  for (const org of orgs || []) {
    const { error } = await admin.from('organizations').delete().eq('id', org.id)
    if (error) console.warn(`  ⚠ Suppression org ${org.name}: ${error.message}`)
    else console.log(`  ✓ Organisation supprimée : ${org.name}`)
  }
}

async function createOrganization(admin, config) {
  const { data: org, error } = await admin
    .from('organizations')
    .insert({
      name: config.name,
      email: demoEmail(config.key, 'manager'),
      phone: '0100000000',
      address: `12 avenue de la Conduite`,
      postal_code: '69001',
      city: config.city,
      siret: config.siret,
      prefecture_approval: config.prefectureApproval,
      status: 'trial',
    })
    .select('id, name')
    .single()

  if (error) throw new Error(`Organisation ${config.name}: ${error.message}`)

  const { data: trialPlan } = await admin.from('plans').select('id, trial_days').eq('code', 'trial').single()
  if (!trialPlan) throw new Error('Plan trial introuvable — appliquez les migrations Supabase.')

  const trialEnds = new Date()
  trialEnds.setDate(trialEnds.getDate() + (trialPlan.trial_days || 30))

  await admin.from('subscriptions').insert({
    organization_id: org.id,
    plan_id: trialPlan.id,
    status: 'active',
    trial_ends_at: trialEnds.toISOString(),
    current_period_start: new Date().toISOString(),
    current_period_end: trialEnds.toISOString(),
  })

  await admin.rpc('seed_default_packages', { p_org_id: org.id })

  return org
}

async function createAuthUser(admin, {
  email,
  password,
  orgId,
  role,
  firstName,
  lastName,
  phone = null,
}) {
  const fullName = `${firstName} ${lastName}`.trim()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      organization_id: orgId,
      role,
      full_name: fullName,
    },
  })

  if (error) throw new Error(`Compte ${email}: ${error.message}`)

  const userId = data.user.id
  await admin.from('profiles').upsert({
    id: userId,
    organization_id: orgId,
    role,
    full_name: fullName,
    email,
    phone,
  }, { onConflict: 'id' })

  if (role === 'teacher') {
    await admin.from('teachers').upsert({ profile_id: userId, organization_id: orgId }, { onConflict: 'profile_id' })
  }
  if (role === 'secretary') {
    await admin.from('secretaries').upsert({ profile_id: userId, organization_id: orgId }, { onConflict: 'profile_id' })
  }

  return userId
}

async function enrichTeacher(admin, profileId, orgKey, index) {
  await admin.from('teachers').update({
    authorization_number: `AUT-${orgKey.toUpperCase()}-${index}-${new Date().getFullYear()}`,
    authorization_expires_at: '2028-12-31',
    authorized_categories: ['B'],
    license_categories: ['B'],
  }).eq('profile_id', profileId)
}

async function createStudentRecord(admin, {
  orgId,
  teacherId,
  orgKey,
  index,
  password,
}) {
  const firstName = STUDENT_FIRST_NAMES[index - 1]
  const lastName = STUDENT_LAST_NAMES[index - 1]
  const email = demoEmail(orgKey, 'student', index)
  const fullName = `${firstName} ${lastName}`

  const userId = await createAuthUser(admin, {
    email,
    password,
    orgId,
    role: 'student',
    firstName,
    lastName,
    phone: `060000${String(index).padStart(2, '0')}0`,
  })

  const fileNumber = await generateFileNumber(admin, orgId, lastName, firstName, index)

  const { data: pkg } = await admin
    .from('pricing_packages')
    .select('id, name, price_ttc, admin_fee_ttc, exam_presentation_ttc, exam_presentation_included, extra_hour_price_ttc')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('sort_order')
    .limit(1)
    .maybeSingle()

  const registrationDate = new Date()
  registrationDate.setDate(registrationDate.getDate() - (30 - index))

  const { data: student, error: studentError } = await admin
    .from('students')
    .insert({
      organization_id: orgId,
      profile_id: userId,
      file_number: fileNumber,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: `060000${String(index).padStart(2, '0')}0`,
      birth_date: `200${index % 5}-0${(index % 8) + 1}-15`,
      birth_place: 'France',
      street_number: String(index),
      street: 'Rue de la République',
      postal_code: '69001',
      city: 'Lyon',
      neph: `NEPH${orgKey.toUpperCase()}${String(index).padStart(4, '0')}`,
      license_category: 'Permis B',
      package_id: pkg?.id || null,
      package_name: pkg?.name || 'Permis B 20h + Code',
      formation_type: pkg?.name || 'Permis B 20h + Code',
      code_status: index % 2 === 0 ? 'Obtenu' : 'Non obtenu',
      status: index <= 2 ? 'En attente' : 'En formation',
      registration_date: registrationDate.toISOString().slice(0, 10),
    })
    .select('id')
    .single()

  if (studentError) {
    await admin.auth.admin.deleteUser(userId)
    throw new Error(`Élève ${email}: ${studentError.message}`)
  }

  const contractTotal = pkg
    ? Number(pkg.price_ttc || 0) + Number(pkg.admin_fee_ttc || 0)
    : 1200

  await admin.from('contracts').insert({
    organization_id: orgId,
    student_id: student.id,
    package_id: pkg?.id || null,
    package_price_ttc: pkg?.price_ttc || null,
    admin_fee_ttc: pkg?.admin_fee_ttc || null,
    exam_presentation_ttc: pkg?.exam_presentation_included ? pkg.exam_presentation_ttc : 0,
    contract_total: contractTotal,
    signed_at: registrationDate.toISOString().slice(0, 10),
  })

  await admin.from('payments').insert({
    organization_id: orgId,
    student_id: student.id,
    amount: Math.round(contractTotal * 0.3),
    method: index % 2 === 0 ? 'Carte bancaire' : 'Espèces',
    nature: 'Inscription',
    comment: 'Acompte inscription demo',
  })

  await admin.from('student_assignments').insert({
    student_id: student.id,
    teacher_id: teacherId,
    is_referent: true,
  })

  if (index <= 6) {
    const lessonDate = new Date()
    lessonDate.setDate(lessonDate.getDate() - index)
    await admin.from('student_lesson_observations').insert({
      organization_id: orgId,
      student_id: student.id,
      teacher_id: teacherId,
      lesson_date: lessonDate.toISOString().slice(0, 10),
      lesson_time: '10:00',
      duration: '1h',
      status: index % 3 === 0 ? 'Terminé' : 'En cours',
      observations: 'Observation demo — progression satisfaisante.',
      skills: ['C1.1', 'C2.3'],
      shared_with_student: index % 2 === 0,
      opened_by: 'Enseignant demo',
    })
  }

  return { studentId: student.id, userId, email, firstName, lastName }
}

async function seedVehicles(admin, orgId, orgKey) {
  const vehicles = [
    { brand: 'Renault', model: 'Clio V', plate: `${orgKey.toUpperCase()}-101-AA`, energy: 'essence' },
    { brand: 'Peugeot', model: '208', plate: `${orgKey.toUpperCase()}-202-BB`, energy: 'diesel' },
  ]

  for (const vehicle of vehicles) {
    await admin.from('vehicles').insert({
      organization_id: orgId,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      energy: vehicle.energy,
      details: {
        firstRegistrationDate: '2019-06-15',
        insuranceCompany: 'Assurance Demo',
        insuranceExpiry: '2027-01-31',
        technicalControl: '2026-09-30',
      },
    })
  }
}

async function seedOrganization(admin, config, accounts) {
  console.log(`\n--- ${config.name} ---`)
  const org = await createOrganization(admin, config)

  const staffEntries = [
    { role: 'manager', person: config.manager },
    { role: 'secretary', person: config.secretary },
    ...config.teachers.map((person, index) => ({ role: 'teacher', person, index: index + 1 })),
  ]

  const teacherIds = []

  for (const entry of staffEntries) {
    const password = generateTempPassword()
    const email = entry.role === 'teacher'
      ? demoEmail(config.key, 'teacher', entry.index)
      : demoEmail(config.key, entry.role)

    await createAuthUser(admin, {
      email,
      password,
      orgId: org.id,
      role: entry.role,
      firstName: entry.person.firstName,
      lastName: entry.person.lastName,
      phone: '0102030405',
    })

    if (entry.role === 'teacher') {
      const { data: profile } = await admin.from('profiles').select('id').eq('email', email).single()
      teacherIds.push(profile.id)
      await enrichTeacher(admin, profile.id, config.key, entry.index)
    }

    accounts.push({
      firstName: entry.person.firstName,
      lastName: entry.person.lastName,
      email,
      role: entry.role,
      roleLabel: roleLabel(entry.role),
      organization: config.name,
      password,
      organizationId: org.id,
    })
  }

  for (let index = 1; index <= 10; index += 1) {
    const password = generateTempPassword()
    const teacherId = teacherIds[index <= 5 ? 0 : 1]
    const student = await createStudentRecord(admin, {
      orgId: org.id,
      teacherId,
      orgKey: config.key,
      index,
      password,
    })

    accounts.push({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      role: 'student',
      roleLabel: roleLabel('student'),
      organization: config.name,
      password,
      organizationId: org.id,
      studentId: student.studentId,
      teacherId,
    })
  }

  await seedVehicles(admin, org.id, config.key)
  console.log(`✓ ${config.name} : 14 comptes, 10 élèves, 2 véhicules`)
  return org.id
}

async function main() {
  const { url, serviceKey } = requireSupabaseAdmin()
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (RESET) await resetDemoData(admin)

  const accounts = []
  const orgIds = []

  for (const config of buildDemoOrgsConfig()) {
    const existing = await admin.from('organizations').select('id').eq('name', config.name).maybeSingle()
    if (existing.data?.id) {
      console.warn(`⚠ ${config.name} existe déjà — utilisez --reset pour recréer.`)
      continue
    }
    const orgId = await seedOrganization(admin, config, accounts)
    orgIds.push(orgId)
  }

  if (!accounts.length) {
    console.log('\nAucun compte créé.')
    process.exit(0)
  }

  const paths = writeCredentialsReport(accounts, { organizationIds: orgIds })
  printCredentialsTable(accounts)
  console.log(`\nFichiers générés :\n  - ${paths.mdPath}\n  - ${paths.jsonPath}`)
  console.log('\nÉtape suivante : node scripts/verify-demo-rls.mjs')
}

main().catch((error) => {
  console.error('\n❌ Échec du seed :', error.message)
  process.exit(1)
})
