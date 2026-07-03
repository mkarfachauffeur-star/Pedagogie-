#!/usr/bin/env node
/**
 * Jeu de données recette — 20 auto-écoles, 740 comptes staff + 600 élèves.
 *
 * Usage :
 *   node scripts/seed-recette-data.mjs
 *   node scripts/seed-recette-data.mjs --reset
 *   node scripts/seed-recette-data.mjs --orgs=5   # sous-ensemble
 */
import { createClient } from '@supabase/supabase-js'
import {
  RECETTE_EMAIL_DOMAIN,
  RECETTE_ORG_PREFIX,
  RECETTE_PASSWORD,
  STUDENT_FIRST,
  STUDENT_LAST,
  buildRecetteOrgsConfig,
  recetteEmail,
  requireSupabaseAdmin,
  roleLabel,
  runPool,
  writeRecetteCredentialsReport,
} from './lib/recette-seed-utils.mjs'
import { formatNamePart, generateFileNumber } from './lib/demo-seed-utils.mjs'

const RESET = process.argv.includes('--reset')
const orgArg = process.argv.find((a) => a.startsWith('--orgs='))
const ORG_COUNT = orgArg ? Number(orgArg.split('=')[1]) : 20
const STUDENT_CONCURRENCY = 3

async function listRecetteAuthUsers(admin) {
  const users = []
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    users.push(...(data.users || []))
    if ((data.users || []).length < 200) break
    page += 1
  }
  return users.filter((user) => user.email?.endsWith(`@${RECETTE_EMAIL_DOMAIN}`))
}

async function resetRecetteData(admin) {
  console.log('Suppression des données recette existantes…')
  const recetteUsers = await listRecetteAuthUsers(admin)
  for (const user of recetteUsers) {
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) console.warn(`  ⚠ Suppression auth ${user.email}: ${error.message}`)
  }
  console.log(`  ✓ ${recetteUsers.length} comptes auth supprimés`)

  const { data: orgs } = await admin
    .from('organizations')
    .select('id, name')
    .like('name', `${RECETTE_ORG_PREFIX}%`)

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
      email: recetteEmail(config.key, 'manager'),
      phone: `04${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      address: `${10 + (config.key.charCodeAt(config.key.length - 1) % 80)} rue de la République`,
      postal_code: config.postalCode,
      city: config.city,
      siret: config.siret,
      prefecture_approval: config.prefectureApproval,
      status: config.planCode === 'trial' ? 'trial' : 'active',
    })
    .select('id, name')
    .single()

  if (error) throw new Error(`Organisation ${config.name}: ${error.message}`)

  const { data: plan } = await admin.from('plans').select('id, trial_days').eq('code', config.planCode).single()
  if (!plan) throw new Error(`Plan ${config.planCode} introuvable`)

  const periodStart = new Date()
  const periodEnd = new Date()
  if (config.planCode === 'trial') {
    periodEnd.setDate(periodEnd.getDate() + (plan.trial_days || 30))
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  }

  await admin.from('subscriptions').insert({
    organization_id: org.id,
    plan_id: plan.id,
    status: 'active',
    trial_ends_at: config.planCode === 'trial' ? periodEnd.toISOString() : null,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
  })

  await admin.rpc('seed_default_packages', { p_org_id: org.id })
  return org
}

async function createAuthUser(admin, {
  email, orgId, role, firstName, lastName, phone = null,
}) {
  const fullName = `${firstName} ${lastName}`.trim()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: RECETTE_PASSWORD,
    email_confirm: true,
    user_metadata: { organization_id: orgId, role, full_name: fullName },
  })
  if (error) throw new Error(`Compte ${email}: ${error.message}`)

  const userId = data.user.id
  await admin.from('profiles').upsert({
    id: userId, organization_id: orgId, role, full_name: fullName, email, phone,
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
    address: `${index * 3} avenue Jean Jaurès`,
    city: 'France',
  }).eq('profile_id', profileId)
}

async function createStudentRecord(admin, { orgId, teacherId, orgKey, index, city, postalCode }) {
  const firstName = STUDENT_FIRST[(index - 1) % STUDENT_FIRST.length]
  const lastName = STUDENT_LAST[(index - 1) % STUDENT_LAST.length]
  const email = recetteEmail(orgKey, 'student', index)

  const userId = await createAuthUser(admin, {
    email, orgId, role: 'student', firstName, lastName,
    phone: `06${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
  })

  const fileNumber = await generateFileNumber(admin, orgId, lastName, firstName, index)
  const { data: pkg } = await admin
    .from('pricing_packages')
    .select('id, name, price_ttc, admin_fee_ttc, exam_presentation_ttc, exam_presentation_included')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('sort_order')
    .limit(1)
    .maybeSingle()

  const registrationDate = new Date()
  registrationDate.setDate(registrationDate.getDate() - (60 - index))

  const { data: student, error: studentError } = await admin
    .from('students')
    .insert({
      organization_id: orgId,
      profile_id: userId,
      file_number: fileNumber,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: `06${String(index).padStart(8, '0')}`.slice(0, 10),
      birth_date: `200${(index % 5)}-${String((index % 12) + 1).padStart(2, '0')}-15`,
      birth_place: city,
      street_number: String(index),
      street: 'Rue Victor Hugo',
      postal_code: postalCode,
      city,
      neph: `${formatNamePart(lastName).slice(0, 4)}${String(index).padStart(6, '0')}`,
      license_category: 'Permis B',
      package_id: pkg?.id || null,
      package_name: pkg?.name || 'Permis B 20h + Code',
      formation_type: pkg?.name || 'Permis B 20h + Code',
      code_status: index % 3 === 0 ? 'Obtenu' : 'Non obtenu',
      status: index <= 3 ? 'En attente' : 'En formation',
      registration_date: registrationDate.toISOString().slice(0, 10),
    })
    .select('id')
    .single()

  if (studentError) {
    await admin.auth.admin.deleteUser(userId)
    throw new Error(`Élève ${email}: ${studentError.message}`)
  }

  const contractTotal = pkg ? Number(pkg.price_ttc || 0) + Number(pkg.admin_fee_ttc || 0) : 1200
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
    amount: Math.round(contractTotal * (0.2 + (index % 5) * 0.1)),
    method: ['Carte bancaire', 'Espèces', 'Chèque', 'Virement'][index % 4],
    nature: 'Inscription',
    comment: 'Acompte recette',
  })

  await admin.from('student_assignments').insert({
    student_id: student.id,
    teacher_id: teacherId,
    is_referent: true,
  })

  if (index <= 8) {
    const lessonDate = new Date()
    lessonDate.setDate(lessonDate.getDate() - index)
    await admin.from('student_lesson_observations').insert({
      organization_id: orgId,
      student_id: student.id,
      teacher_id: teacherId,
      lesson_date: lessonDate.toISOString().slice(0, 10),
      lesson_time: `${8 + (index % 8)}:00`,
      duration: '1h',
      status: index % 3 === 0 ? 'Terminé' : 'En cours',
      observations: 'Leçon recette — maîtrise progressive des compétences REMC.',
      skills: ['C1.1', 'C2.3', 'C3.2'].slice(0, (index % 3) + 1),
      shared_with_student: index % 2 === 0,
      opened_by: 'Enseignant recette',
    })
  }

  if (index <= 5) {
    const { error: compErr } = await admin.from('student_competency_validations').insert({
      organization_id: orgId,
      student_id: student.id,
      validated_by: teacherId,
      competency_code: ['C1', 'C2', 'C3', 'C4', 'C1'][index - 1],
      validated_at: new Date().toISOString(),
    })
    if (compErr && !compErr.message.includes('duplicate')) {
      console.warn(`  ⚠ Compétence ${email}: ${compErr.message}`)
    }
  }

  return { studentId: student.id, userId, email, firstName, lastName }
}

async function seedAppointments(admin, orgId, teacherIds, studentIds, secretaryId) {
  const starts = new Date()
  starts.setDate(starts.getDate() + 2)
  starts.setHours(9, 0, 0, 0)

  for (let i = 0; i < Math.min(4, studentIds.length); i += 1) {
    const slot = new Date(starts)
    slot.setHours(starts.getHours() + i * 2)
    const { error } = await admin.from('appointments').insert({
      organization_id: orgId,
      student_id: studentIds[i],
      teacher_id: teacherIds[i % teacherIds.length],
      kind: 'Leçon',
      starts_at: slot.toISOString(),
      duration_minutes: 60,
      status: 'Planifié',
      notes: 'Créneau recette — leçon de conduite',
    })
    if (error) console.warn(`  ⚠ RDV org ${orgId}: ${error.message}`)
  }
}

async function seedMessaging(admin, orgId, managerId, teacherId, secretaryId) {
  const { data: conv, error } = await admin
    .from('conversations')
    .insert({
      organization_id: orgId,
      kind: 'internal',
      subject: 'Recette messagerie',
      created_by: managerId,
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !conv) return

  const participants = [managerId, teacherId, secretaryId]
  for (const profileId of participants) {
    await admin.from('conversation_participants').insert({
      conversation_id: conv.id,
      profile_id: profileId,
    })
  }

  const { data: msg } = await admin.from('messages').insert({
    conversation_id: conv.id,
    organization_id: orgId,
    sender_id: managerId,
    body: 'Bonjour, message de test recette — planning de la semaine prochaine.',
  }).select('id').single()

  if (msg) {
    await admin.from('notifications').insert({
      organization_id: orgId,
      profile_id: teacherId,
      kind: 'message',
      title: 'Nouveau message',
      body: 'Message recette reçu',
      link: `/teacher/messages?conversation=${conv.id}`,
    }).then(({ error: nErr }) => { if (nErr) { /* schema variable */ } })
  }
}

async function seedVehicles(admin, orgId, orgKey) {
  const plates = [`${orgKey.slice(-2).toUpperCase()}-101-AA`, `${orgKey.slice(-2).toUpperCase()}-202-BB`]
  for (const [i, vehicle] of [
    { brand: 'Renault', model: 'Clio V', energy: 'essence' },
    { brand: 'Peugeot', model: '208', energy: 'diesel' },
  ].entries()) {
    await admin.from('vehicles').insert({
      organization_id: orgId,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: plates[i],
      energy: vehicle.energy,
      details: { insuranceExpiry: '2027-06-30', technicalControl: '2026-12-15' },
    })
  }
}

async function seedOrganization(admin, config, accounts) {
  console.log(`\n--- ${config.name} (${config.planCode}) ---`)
  const org = await createOrganization(admin, config)
  const profileIds = { manager: null, secretaries: [], teachers: [] }
  const studentIds = []

  const managerEmail = recetteEmail(config.key, 'manager')
  profileIds.manager = await createAuthUser(admin, {
    email: managerEmail,
    orgId: org.id,
    role: 'manager',
    firstName: config.manager.firstName,
    lastName: config.manager.lastName,
    phone: '0102030405',
  })
  accounts.push({
    firstName: config.manager.firstName,
    lastName: config.manager.lastName,
    email: managerEmail,
    role: 'manager',
    roleLabel: roleLabel('manager'),
    organization: config.name,
    password: RECETTE_PASSWORD,
    organizationId: org.id,
    profileId: profileIds.manager,
    planCode: config.planCode,
  })

  for (let s = 1; s <= config.secretaries.length; s += 1) {
    const person = config.secretaries[s - 1]
    const email = recetteEmail(config.key, 'secretary', s)
    const id = await createAuthUser(admin, {
      email, orgId: org.id, role: 'secretary', firstName: person.firstName, lastName: person.lastName,
    })
    profileIds.secretaries.push(id)
    accounts.push({
      firstName: person.firstName, lastName: person.lastName, email,
      role: 'secretary', roleLabel: roleLabel('secretary'),
      organization: config.name, password: RECETTE_PASSWORD,
      organizationId: org.id, profileId: id, planCode: config.planCode,
    })
  }

  for (const teacher of config.teachers) {
    const email = recetteEmail(config.key, 'teacher', teacher.index)
    const id = await createAuthUser(admin, {
      email, orgId: org.id, role: 'teacher', firstName: teacher.firstName, lastName: teacher.lastName,
    })
    await enrichTeacher(admin, id, config.key, teacher.index)
    profileIds.teachers.push(id)
    accounts.push({
      firstName: teacher.firstName, lastName: teacher.lastName, email,
      role: 'teacher', roleLabel: roleLabel('teacher'),
      organization: config.name, password: RECETTE_PASSWORD,
      organizationId: org.id, profileId: id, planCode: config.planCode,
    })
  }

  const studentIndexes = Array.from({ length: config.studentsPerOrg }, (_, i) => i + 1)
  await runPool(studentIndexes, STUDENT_CONCURRENCY, async (index) => {
    const teacherId = profileIds.teachers[index % profileIds.teachers.length]
    const student = await createStudentRecord(admin, {
      orgId: org.id,
      teacherId,
      orgKey: config.key,
      index,
      city: config.city,
      postalCode: config.postalCode,
    })
    studentIds.push(student.studentId)
    accounts.push({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      role: 'student',
      roleLabel: roleLabel('student'),
      organization: config.name,
      password: RECETTE_PASSWORD,
      organizationId: org.id,
      studentId: student.studentId,
      studentIndex: index,
      teacherId,
      planCode: config.planCode,
    })
    if (index % 10 === 0) process.stdout.write(`  élèves ${index}/${config.studentsPerOrg}\r`)
  })

  await seedVehicles(admin, org.id, config.key)
  await seedAppointments(admin, org.id, profileIds.teachers, studentIds, profileIds.secretaries[0])
  await seedMessaging(admin, org.id, profileIds.manager, profileIds.teachers[0], profileIds.secretaries[0])

  const staffCount = 1 + config.secretaries.length + config.teachers.length
  console.log(`✓ ${config.name} : ${staffCount} staff, ${config.studentsPerOrg} élèves, plan ${config.planCode}`)
  return org.id
}

async function main() {
  const started = Date.now()
  const { url, serviceKey } = requireSupabaseAdmin()
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const configs = buildRecetteOrgsConfig({ orgCount: ORG_COUNT })
  console.log(`\n=== Seed recette — ${ORG_COUNT} auto-écoles ===`)
  console.log(`Cible : ${configs.length * (1 + 2 + 4)} staff + ${configs.length * 30} élèves`)
  console.log(`Domaine email : @${RECETTE_EMAIL_DOMAIN}`)
  console.log(`Mot de passe : ${RECETTE_PASSWORD}\n`)

  if (RESET) await resetRecetteData(admin)

  const accounts = []
  const orgIds = []
  let orgIndex = 0

  for (const config of configs) {
    orgIndex += 1
    const existing = await admin.from('organizations').select('id').eq('name', config.name).maybeSingle()
    if (existing.data?.id) {
      console.warn(`⚠ [${orgIndex}/${configs.length}] ${config.name} existe déjà — --reset pour recréer.`)
      continue
    }
    const orgId = await seedOrganization(admin, config, accounts)
    orgIds.push(orgId)
  }

  if (!accounts.length) {
    console.log('\nAucun compte créé (données déjà présentes ?).')
    process.exit(0)
  }

  const paths = writeRecetteCredentialsReport(accounts, {
    organizationIds: orgIds,
    counts: {
      organizations: orgIds.length,
      managers: accounts.filter((a) => a.role === 'manager').length,
      secretaries: accounts.filter((a) => a.role === 'secretary').length,
      teachers: accounts.filter((a) => a.role === 'teacher').length,
      students: accounts.filter((a) => a.role === 'student').length,
    },
  })

  const elapsed = Math.round((Date.now() - started) / 1000)
  console.log(`\n=== Terminé en ${elapsed}s ===`)
  console.log(`Comptes : ${accounts.length}`)
  console.log(`Fichiers :\n  - ${paths.mdPath}\n  - ${paths.jsonPath}`)
}

main().catch((error) => {
  console.error('\n❌ Échec seed recette :', error.message)
  process.exit(1)
})
