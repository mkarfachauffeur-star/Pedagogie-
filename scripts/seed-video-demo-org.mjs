#!/usr/bin/env node
/**
 * Auto-école fictive pour montage vidéo / captures manuelles.
 *
 * Usage:
 *   node scripts/seed-video-demo-org.mjs
 *   node scripts/seed-video-demo-org.mjs --reset
 *   node scripts/seed-video-demo-org.mjs --enrich
 *
 * Prérequis: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import {
  DEMO_EMAIL_DOMAIN,
  demoEmail,
  generateFileNumber,
  requireSupabaseAdmin,
} from './lib/demo-seed-utils.mjs'

const RESET = process.argv.includes('--reset')
const ENRICH = process.argv.includes('--enrich')
const ORG_KEY = 'horizon'
const ORG_NAME = 'Auto-École Horizon Drive — Paris'
const SHARED_PASSWORD = 'Horizon2026!'
const PENDING_ASSESSMENT_STUDENT_INDEX = 6

const COMPLETED_ASSESSMENT_ANSWERS = {
  exp_driven_before: 'Quelques fois',
  exp_context: 'Auto-école',
  exp_hours: '1 à 5 h',
  exp_previous_license: 'Aucun',
  veh_clutch: 'Oui',
  veh_gearbox: 'Oui',
  veh_pedals: 'Oui',
  veh_seat_mirrors: 'Partiellement',
  veh_rating_global: 'S',
  att_why_license: 'Vie personnelle',
  att_motivation: 'Très motivé',
  att_code_autonomy: 'Oui',
  att_rating_implication: 'B',
  skill_installation: 'S',
  skill_steering: 'B',
  skill_coordination: 'S',
  skill_start: 'S',
  und_retain: 'Moyenne',
  und_multitask: 'Moyennement',
  und_rating_learning: 'S',
  per_gaze: 'S',
  per_observation: 'B',
  per_anticipation: 'S',
  per_orientation: 'S',
  per_trajectory: 'S',
  emo_stress_self: 'Un peu',
  emo_stress_mgmt: 'B',
  emo_tension: 'S',
  emo_concentration: 'B',
}

const STAFF = [
  { role: 'manager', key: 'gerant', firstName: 'Régis', lastName: 'Mercier' },
  { role: 'secretary', key: 'secretaire', firstName: 'Camille', lastName: 'Fontaine' },
  { role: 'teacher', key: 'enseignant1', firstName: 'Thomas', lastName: 'Garcia', teacherIndex: 1 },
  { role: 'teacher', key: 'enseignant2', firstName: 'Nicolas', lastName: 'Rodriguez', teacherIndex: 2 },
]

const STUDENTS = [
  { index: 1, firstName: 'Marie', lastName: 'Dupont', packageName: 'Forfait 20h · Permis B', codeStatus: 'En cours' },
  { index: 2, firstName: 'Lucas', lastName: 'Martin', packageName: 'Forfait 30h · Permis B', codeStatus: 'Obtenu' },
  { index: 3, firstName: 'Emma', lastName: 'Bernard', packageName: 'Forfait AAC · Permis B', codeStatus: 'Obtenu' },
  { index: 4, firstName: 'Hugo', lastName: 'Petit', packageName: 'Forfait 20h · Permis B', codeStatus: 'En cours' },
  { index: 5, firstName: 'Léa', lastName: 'Moreau', packageName: 'Forfait 20h · Permis B', codeStatus: 'En cours' },
  { index: 6, firstName: 'Nathan', lastName: 'Durand', packageName: 'Forfait 30h · Permis B', codeStatus: 'Non obtenu' },
]

function horizonEmail(key, studentIndex = null) {
  if (studentIndex != null) return demoEmail(ORG_KEY, 'student', studentIndex)
  if (key === 'gerant') return demoEmail(ORG_KEY, 'manager')
  if (key === 'secretaire') return demoEmail(ORG_KEY, 'secretary', 1)
  if (key.startsWith('enseignant')) return demoEmail(ORG_KEY, 'teacher', Number(key.replace('enseignant', '')))
  return `${ORG_KEY}.${key}@${DEMO_EMAIL_DOMAIN}`
}

async function listHorizonAuthUsers(admin) {
  const users = []
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    users.push(...(data.users || []))
    if ((data.users || []).length < 200) break
    page += 1
  }
  return users.filter((user) => user.email?.startsWith(`${ORG_KEY}.`) && user.email?.endsWith(`@${DEMO_EMAIL_DOMAIN}`))
}

async function resetHorizonOrg(admin) {
  for (const user of await listHorizonAuthUsers(admin)) {
    await admin.auth.admin.deleteUser(user.id)
  }
  const { data: orgs } = await admin.from('organizations').select('id').eq('name', ORG_NAME)
  for (const org of orgs || []) {
    await admin.from('organizations').delete().eq('id', org.id)
  }
}

async function createAuthUser(admin, { email, orgId, role, firstName, lastName, phone = null }) {
  const fullName = `${firstName} ${lastName}`.trim()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SHARED_PASSWORD,
    email_confirm: true,
    user_metadata: { organization_id: orgId, role, full_name: fullName },
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

async function seedRichData(admin, orgId, teacherIds, studentRows) {
  const { data: charter } = await admin
    .from('student_engagement_charter_versions')
    .select('id')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .maybeSingle()

  let charterId = charter?.id
  if (!charterId) {
    const { data: inserted } = await admin
      .from('student_engagement_charter_versions')
      .insert({
        organization_id: orgId,
        version_number: 1,
        title: 'Charte d\'engagement de l\'élève',
        content: '# Charte d\'engagement\n\nContenu fictif pour démonstration vidéo.',
        is_active: true,
      })
      .select('id')
      .single()
    charterId = inserted?.id
  }

  for (const student of studentRows) {
    if (charterId) {
      await admin.from('student_charter_acceptances').upsert({
        organization_id: orgId,
        student_id: student.id,
        charter_version_id: charterId,
        accepted_at: new Date().toISOString(),
      }, { onConflict: 'student_id,charter_version_id' })
    }
  }

  await admin.from('appointments').delete().eq('organization_id', orgId)

  const slots = [
    { day: -1, hour: 9, si: 0, ti: 0, status: 'Terminé', notes: 'Leçon Marie Dupont — priorités et intersections' },
    { day: -1, hour: 14, si: 1, ti: 0, status: 'Terminé', notes: 'Leçon Lucas Martin — voie rapide' },
    { day: 0, hour: 10, si: 0, ti: 0, status: 'Confirmé', notes: 'Leçon Marie — stationnement en bataille' },
    { day: 0, hour: 15, si: 2, ti: 1, status: 'Planifié', notes: 'Leçon Emma Bernard — ronds-points' },
    { day: 1, hour: 9, si: 3, ti: 1, status: 'Planifié', notes: 'Leçon Hugo Petit — démarrage en côte' },
    { day: 1, hour: 11, si: 4, ti: 0, status: 'Confirmé', notes: 'Leçon Léa Moreau — examen blanc' },
    { day: 2, hour: 14, si: 1, ti: 1, status: 'Planifié', notes: 'Leçon Lucas — autoroute' },
    { day: 3, hour: 10, si: 0, ti: 0, status: 'Planifié', notes: 'Leçon Marie — présentation examen' },
  ]

  for (const slot of slots) {
    const start = new Date()
    start.setHours(slot.hour, 0, 0, 0)
    start.setDate(start.getDate() + slot.day)
    await admin.from('appointments').insert({
      organization_id: orgId,
      student_id: studentRows[slot.si].id,
      teacher_id: teacherIds[slot.ti],
      kind: 'Leçon',
      starts_at: start.toISOString(),
      duration_minutes: 60,
      status: slot.status,
      notes: slot.notes,
    })
  }

  const comments = [
    'Excellente séance en agglomération. Priorités bien respectées, créneaux en net progrès.',
    'Travail sur voie rapide : insertions maîtrisées. Score QCM signalisation 88 %.',
    'Bon comportement aux ronds-points. À retravailler : le démarrage en côte.',
  ]

  for (let i = 0; i < studentRows.length; i += 1) {
    const student = studentRows[i]
    await admin.from('student_lesson_observations').delete().eq('student_id', student.id)
    const lessonDate = new Date()
    lessonDate.setDate(lessonDate.getDate() - (i + 1))
    await admin.from('student_lesson_observations').insert({
      organization_id: orgId,
      student_id: student.id,
      teacher_id: teacherIds[i % teacherIds.length],
      lesson_date: lessonDate.toISOString().slice(0, 10),
      lesson_time: `${10 + i}:00`,
      duration: '1h',
      status: 'Terminé',
      observations: comments[i % comments.length],
      skills: [['C1.1', 'C1.2'], ['C2.1', 'C2.3'], ['C1.3', 'C3.1']][i % 3],
      shared_with_student: true,
      opened_by: 'Thomas Garcia',
      closed_by: 'Thomas Garcia',
      closed_at: new Date().toISOString(),
    })

    for (const code of ['C1', 'C2'].slice(0, 1 + (i % 2))) {
      await admin.from('student_competency_validations').upsert({
        organization_id: orgId,
        student_id: student.id,
        validated_by: teacherIds[0],
        competency_code: code,
        validated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,competency_code' })
    }
  }

  await seedInitialAssessments(admin, orgId, teacherIds[0], studentRows)
}

const STUDENT_BUSINESS = [
  { index: 1, emailKey: 'eleve01', pkgKey: '20h', extraHours: 0, pastLessons: 6, payments: [
    { amount: 400, daysAgo: 44, method: 'Carte bancaire', nature: 'Inscription', comment: 'Acompte à l\'inscription' },
    { amount: 500, daysAgo: 20, method: 'Chèque', nature: 'Forfait', comment: '2e versement forfait 20h' },
    { amount: 290, daysAgo: 5, method: 'Virement', nature: 'Solde', comment: 'Solde dossier Marie Dupont' },
  ]},
  { index: 2, emailKey: 'eleve02', pkgKey: '20h', extraHours: 10, pastLessons: 10, payments: [
    { amount: 500, daysAgo: 58, method: 'Espèces', nature: 'Inscription', comment: 'Acompte Lucas Martin' },
    { amount: 800, daysAgo: 30, method: 'Carte bancaire', nature: 'Forfait', comment: 'Versement intermédiaire' },
    { amount: 400, daysAgo: 8, method: 'Chèque', nature: 'Forfait', comment: 'Paiement partiel avant examen' },
  ]},
  { index: 3, emailKey: 'eleve03', pkgKey: 'aac', extraHours: 0, pastLessons: 5, payments: [
    { amount: 600, daysAgo: 88, method: 'Virement', nature: 'Inscription', comment: 'Acompte AAC' },
    { amount: 700, daysAgo: 40, method: 'Carte bancaire', nature: 'Forfait', comment: 'Versement forfait AAC' },
  ]},
  { index: 4, emailKey: 'eleve04', pkgKey: '20h', extraHours: 0, pastLessons: 3, payments: [
    { amount: 350, daysAgo: 20, method: 'Carte bancaire', nature: 'Inscription', comment: 'Acompte Hugo Petit' },
    { amount: 300, daysAgo: 7, method: 'Espèces', nature: 'Forfait', comment: '1er versement forfait' },
  ]},
  { index: 5, emailKey: 'eleve05', pkgKey: '20h', extraHours: 0, pastLessons: 8, payments: [
    { amount: 400, daysAgo: 34, method: 'Chèque', nature: 'Inscription', comment: 'Acompte Léa Moreau' },
    { amount: 650, daysAgo: 12, method: 'Virement', nature: 'Forfait', comment: 'Versement forfait 20h' },
  ]},
  { index: 6, emailKey: 'eleve06', pkgKey: '20h', extraHours: 10, pastLessons: 1, payments: [
    { amount: 200, daysAgo: 9, method: 'Espèces', nature: 'Inscription', comment: 'Acompte Nathan Durand' },
  ]},
]

const PACKAGE_PRICES = {
  '20h': { price_ttc: 1290, admin_fee_ttc: 150, exam_presentation_ttc: 250, exam_presentation_included: true, extra_hour_price_ttc: 55 },
  aac: { price_ttc: 1590, admin_fee_ttc: 150, exam_presentation_ttc: 250, exam_presentation_included: true, extra_hour_price_ttc: 55 },
}

function daysAgoIso(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function daysFromNowIso(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const FLEET_VEHICLES = [
  {
    brand: 'Renault', model: 'Clio V', plate: 'AB-123-CD', energy: 'essence',
    details: {
      mileage: 45230, monthlyKm: 1180, availability: 'Disponible', cleanliness: 'propre',
      fuelLevel: 72, averageConsumption: 5.8, estimatedRange: 420, generalState: 'Bon',
      technicalControl: '2026-12-15', insuranceExpiry: '2027-06-30',
      fuelLogs: [{ id: 'fl-1', date: daysAgoIso(5), teacher: 'Thomas Garcia', mileage: 45100, liters: 42, price: 68.5, fuelType: 'SP95', station: 'Total Paris 11' }],
      maintenanceLogs: [{ id: 'ml-1', type: 'Lavage extérieur', date: daysAgoIso(3), reporter: 'Nicolas Rodriguez', observations: 'Véhicule prêt pour la semaine' }],
    },
  },
  {
    brand: 'Peugeot', model: '208', plate: 'EF-456-GH', energy: 'diesel',
    details: {
      mileage: 62100, monthlyKm: 1420, availability: 'Disponible', cleanliness: 'propre',
      fuelLevel: 55, averageConsumption: 4.9, estimatedRange: 510, generalState: 'Bon',
      technicalControl: '2027-03-20', insuranceExpiry: '2027-08-01',
      fuelLogs: [{ id: 'fl-2', date: daysAgoIso(2), teacher: 'Nicolas Rodriguez', mileage: 62020, liters: 38, price: 61.2, fuelType: 'Gazole', station: 'Intermarché' }],
    },
  },
  {
    brand: 'Citroën', model: 'C3', plate: 'IJ-789-KL', energy: 'hybride',
    details: {
      mileage: 18400, monthlyKm: 890, availability: 'En leçon', cleanliness: 'propre',
      fuelLevel: 88, batteryLevel: 76, chargingStatus: 'Chargé', averageConsumption: 4.2,
      estimatedRange: 380, generalState: 'Excellent', technicalControl: '2027-01-10', insuranceExpiry: '2027-04-15',
    },
  },
]

function resolvePackage(packages, key) {
  if (key === 'aac') {
    return packages.find((pkg) => /aac/i.test(pkg.name)) || packages[0]
  }
  return packages.find((pkg) => /20h.*manuelle/i.test(pkg.name)) || packages[0]
}

async function seedBusinessData(admin, orgId, teacherIds, studentRows, secretaryId = null) {
  const pricingRows = [
    { match: /20h Boîte Manuelle/i, ...PACKAGE_PRICES['20h'] },
    { match: /13h Boîte Automatique/i, price_ttc: 1190, admin_fee_ttc: 150, exam_presentation_ttc: 250, exam_presentation_included: true, extra_hour_price_ttc: 55 },
    { match: /AAC/i, ...PACKAGE_PRICES.aac },
    { match: /Supervisée|CS/i, price_ttc: 890, admin_fee_ttc: 150, exam_presentation_ttc: 250, exam_presentation_included: true, extra_hour_price_ttc: 55 },
    { match: /Moto/i, price_ttc: 990, admin_fee_ttc: 150, exam_presentation_ttc: 250, exam_presentation_included: true, extra_hour_price_ttc: 65 },
    { match: /Code seul/i, price_ttc: 290, admin_fee_ttc: 0, exam_presentation_ttc: 0, exam_presentation_included: false, extra_hour_price_ttc: 0 },
  ]

  const { data: packages } = await admin.from('pricing_packages').select('*').eq('organization_id', orgId)
  for (const row of pricingRows) {
    const pkg = packages.find((item) => row.match.test(item.name))
    if (!pkg) continue
    const { match: _match, ...updates } = row
    await admin.from('pricing_packages').update(updates).eq('id', pkg.id)
  }

  for (const [i, teacherId] of teacherIds.entries()) {
    await admin.from('teachers').update({
      authorization_number: `A075240000${i + 1}`,
      authorization_expires_at: i === 0 ? '2028-06-30' : '2028-09-15',
      authorized_categories: ['B'],
    }).eq('profile_id', teacherId)
  }

  await admin.from('vehicles').delete().eq('organization_id', orgId)
  const { data: vehicles, error: vehiclesError } = await admin.from('vehicles').insert(
    FLEET_VEHICLES.map((vehicle) => ({ organization_id: orgId, ...vehicle })),
  ).select('id')
  if (vehiclesError) throw vehiclesError

  await admin.from('payments').delete().eq('organization_id', orgId)
  await admin.from('exams').delete().eq('organization_id', orgId)
  await admin.from('documents').delete().eq('organization_id', orgId)
  await admin.from('appointments').delete().eq('organization_id', orgId).eq('notes', 'Leçon fictive démo — compétence REMC travaillée')

  const refreshedPackages = (await admin.from('pricing_packages').select('*').eq('organization_id', orgId)).data || []

  for (const cfg of STUDENT_BUSINESS) {
    const student = studentRows.find((row) => row.index === cfg.index)
    if (!student) continue

    const pkg = resolvePackage(refreshedPackages, cfg.pkgKey)
    const prices = PACKAGE_PRICES[cfg.pkgKey] || PACKAGE_PRICES['20h']
    const extraAmount = cfg.extraHours * prices.extra_hour_price_ttc
    const signedDaysAgo = [45, 60, 90, 21, 35, 10][cfg.index - 1]

    await admin.from('students').update({
      package_id: pkg.id,
      extra_hours: cfg.extraHours,
    }).eq('id', student.id)

    await admin.from('contracts').upsert({
      organization_id: orgId,
      student_id: student.id,
      package_id: pkg.id,
      package_price_ttc: prices.price_ttc,
      admin_fee_ttc: prices.admin_fee_ttc,
      exam_presentation_ttc: prices.exam_presentation_ttc,
      extra_hours: cfg.extraHours,
      extra_hours_amount_ttc: extraAmount || null,
      signed_at: daysAgoIso(signedDaysAgo),
      status: 'signed',
    }, { onConflict: 'student_id' })

    for (const payment of cfg.payments) {
      await admin.from('payments').insert({
        organization_id: orgId,
        student_id: student.id,
        amount: payment.amount,
        paid_at: daysAgoIso(payment.daysAgo),
        method: payment.method,
        nature: payment.nature,
        comment: payment.comment,
        created_by: secretaryId,
      })
    }

    const teacherId = teacherIds[[1, 2, 5].includes(cfg.index) ? 0 : 1]
    for (let i = 0; i < cfg.pastLessons; i += 1) {
      const start = new Date()
      start.setHours(9 + (i % 4), 0, 0, 0)
      start.setDate(start.getDate() - (cfg.pastLessons - i + 2))
      await admin.from('appointments').insert({
        organization_id: orgId,
        student_id: student.id,
        teacher_id: teacherId,
        vehicle_id: vehicles[i % vehicles.length].id,
        kind: 'Leçon',
        starts_at: start.toISOString(),
        duration_minutes: 60,
        status: 'Terminé',
        notes: 'Leçon fictive démo — compétence REMC travaillée',
      })
    }
  }

  const { data: appts } = await admin.from('appointments').select('id').eq('organization_id', orgId).is('vehicle_id', null).order('starts_at')
  for (const [i, appt] of (appts || []).entries()) {
    await admin.from('appointments').update({ vehicle_id: vehicles[i % vehicles.length].id }).eq('id', appt.id)
  }

  const byIndex = (idx) => studentRows.find((row) => row.index === idx)?.id
  await admin.from('exams').insert([
    { organization_id: orgId, student_id: byIndex(2), teacher_id: teacherIds[0], type: 'Permis B', exam_date: daysFromNowIso(14), exam_time: '10:30', center: 'Centre d\'examen Paris 12', status: 'Confirmé' },
    { organization_id: orgId, student_id: byIndex(3), teacher_id: teacherIds[1], type: 'Code', exam_date: daysAgoIso(30), exam_time: '14:00', center: 'Centre d\'examen Paris 11', status: 'Réussi' },
    { organization_id: orgId, student_id: byIndex(5), teacher_id: teacherIds[0], type: 'Examen blanc', exam_date: daysFromNowIso(3), exam_time: '09:00', center: 'Auto-École Horizon Drive', status: 'À confirmer' },
  ])

  const docs = [
    [1, 'Pièce d\'identité', 'CNI-MD-2024', 45, 'Validé'],
    [1, 'Photo signature', 'PHOTO-MD', 44, 'Validé'],
    [2, 'Pièce d\'identité', 'CNI-LM-2024', 60, 'Validé'],
    [2, 'Contrat signé', 'CTR-LM-2025', 58, 'Validé'],
    [3, 'ASSR/JDC', 'ASSR-EB', 90, 'Validé'],
    [3, 'Dossier ANTS', 'ANTS-EB', 85, 'À vérifier'],
    [4, 'Justificatif de domicile', 'JDD-HP', 20, 'Validé'],
    [5, 'Pièce d\'identité', 'CNI-LM2', 35, 'Validé'],
    [6, 'Photo signature', 'PHOTO-ND', 10, 'À compléter'],
  ]
  for (const [index, type, reference, daysAgo, status] of docs) {
    const studentId = byIndex(index)
    if (!studentId) continue
    await admin.from('documents').insert({
      organization_id: orgId,
      student_id: studentId,
      type,
      reference,
      received_date: daysAgoIso(daysAgo),
      status,
      folder: 'Dossier administratif',
      created_by: secretaryId,
    })
  }
}

async function seedInitialAssessments(admin, orgId, teacherId, studentRows) {
  const pendingStudent = studentRows.find((s) => s.index === PENDING_ASSESSMENT_STUDENT_INDEX)
  const completedAt = new Date()
  completedAt.setDate(completedAt.getDate() - 10)
  const respondedAt = new Date()
  respondedAt.setDate(respondedAt.getDate() - 9)

  for (const student of studentRows) {
    if (pendingStudent && student.id === pendingStudent.id) {
      await admin.from('student_initial_assessments').upsert({
        organization_id: orgId,
        student_id: student.id,
        status: 'pending',
        answers: {},
        positive_score: 0,
        negative_score: 0,
        final_score: 0,
        result_level: null,
        recommended_hours_min: null,
        recommended_hours_max: null,
        recommended_hours_response: 'pending',
        recommended_hours_responded_at: null,
        completed_at: null,
        completed_by: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' })
      continue
    }

    const comment =
      `Évaluation de départ réalisée. ${student.firstName} ${student.lastName} présente un profil intermédiaire : `
      + 'bonne motivation, bases du véhicule acquises. Volume horaire recommandé : 25 h.'

    await admin.from('student_initial_assessments').upsert({
      organization_id: orgId,
      student_id: student.id,
      status: 'completed',
      answers: { ...COMPLETED_ASSESSMENT_ANSWERS, teacher_comment: comment },
      positive_score: 48,
      negative_score: 8,
      final_score: 58,
      result_level: 'intermediaire',
      recommended_hours_min: 25,
      recommended_hours_max: 25,
      recommended_hours_response: 'accepted',
      recommended_hours_responded_at: respondedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      completed_by: teacherId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id' })
  }
}

async function loadHorizonContext(admin) {
  const { data: org, error: orgError } = await admin.from('organizations').select('id').eq('name', ORG_NAME).maybeSingle()
  if (orgError) throw orgError
  if (!org) throw new Error(`Auto-école « ${ORG_NAME} » introuvable. Lancez d'abord le seed complet.`)

  const { data: profiles } = await admin.from('profiles').select('id, email, role').eq('organization_id', org.id)
  const teacherIds = (profiles || [])
    .filter((profile) => profile.role === 'teacher')
    .sort((a, b) => a.email.localeCompare(b.email))
    .map((profile) => profile.id)
  const secretaryId = (profiles || []).find((profile) => profile.role === 'secretary')?.id || null

  const { data: students } = await admin
    .from('students')
    .select('id, first_name, last_name, email, profile_id')
    .eq('organization_id', org.id)
    .order('file_number')

  const studentRows = (students || []).map((student) => {
    const match = student.email.match(/eleve(\d+)/)
    return {
      id: student.id,
      profile_id: student.profile_id,
      index: Number(match?.[1] || 0),
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
    }
  }).filter((student) => student.index > 0)

  return { orgId: org.id, teacherIds, secretaryId, studentRows }
}

async function main() {
  const { url, serviceKey } = requireSupabaseAdmin()
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: existing } = await admin.from('organizations').select('id').eq('name', ORG_NAME).maybeSingle()

  if (ENRICH) {
    const context = await loadHorizonContext(admin)
    await seedBusinessData(admin, context.orgId, context.teacherIds, context.studentRows, context.secretaryId)
    console.log(`\n✓ Données métier enrichies pour « ${ORG_NAME} ».`)
    console.log('  Véhicules, contrats, paiements, heures passées, examens et documents mis à jour.')
    return
  }

  if (existing && !RESET) {
    console.log(`L'auto-école « ${ORG_NAME} » existe déjà. Utilisez --enrich ou --reset.`)
    process.exit(0)
  }

  if (RESET || existing) await resetHorizonOrg(admin)

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: ORG_NAME,
      email: horizonEmail('gerant'),
      phone: '0142567890',
      address: '18 rue de la Roquette',
      postal_code: '75011',
      city: 'Paris',
      siret: '12345678900012',
      prefecture_approval: '0751234567',
      status: 'trial',
    })
    .select('id, name')
    .single()

  if (orgError) throw orgError

  const { data: trialPlan } = await admin.from('plans').select('id, trial_days').eq('code', 'trial').single()
  const trialEnds = new Date()
  trialEnds.setDate(trialEnds.getDate() + (trialPlan?.trial_days || 30))
  await admin.from('subscriptions').insert({
    organization_id: org.id,
    plan_id: trialPlan.id,
    status: 'active',
    trial_ends_at: trialEnds.toISOString(),
    current_period_start: new Date().toISOString(),
    current_period_end: trialEnds.toISOString(),
  })
  await admin.rpc('seed_default_packages', { p_org_id: org.id })

  const credentials = []
  const teacherIds = []
  let secretaryId = null

  for (const member of STAFF) {
    const email = member.teacherIndex
      ? demoEmail(ORG_KEY, 'teacher', member.teacherIndex)
      : member.key === 'gerant'
        ? demoEmail(ORG_KEY, 'manager')
        : demoEmail(ORG_KEY, 'secretary', 1)

    const userId = await createAuthUser(admin, {
      email,
      orgId: org.id,
      role: member.role,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: '0600000001',
    })

    if (member.role === 'teacher') teacherIds.push(userId)
    if (member.role === 'secretary') secretaryId = userId

    credentials.push({
      role: member.role,
      roleLabel: member.role === 'manager' ? 'Gérant' : member.role === 'secretary' ? 'Secrétaire' : 'Enseignant',
      firstName: member.firstName,
      lastName: member.lastName,
      email,
      password: SHARED_PASSWORD,
      organization: ORG_NAME,
    })
  }

  const { data: allPackages } = await admin
    .from('pricing_packages')
    .select('id, name')
    .eq('organization_id', org.id)
    .eq('is_active', true)

  const studentRows = []

  for (const student of STUDENTS) {
    const email = demoEmail(ORG_KEY, 'student', student.index)
    const userId = await createAuthUser(admin, {
      email,
      orgId: org.id,
      role: 'student',
      firstName: student.firstName,
      lastName: student.lastName,
      phone: `061234567${student.index}`,
    })

    const businessCfg = STUDENT_BUSINESS.find((cfg) => cfg.index === student.index)
    const pkg = resolvePackage(allPackages || [], businessCfg?.pkgKey || '20h')

    const fileNumber = await generateFileNumber(admin, org.id, student.lastName, student.firstName, student.index)
    const { data: row, error } = await admin
      .from('students')
      .insert({
        organization_id: org.id,
        profile_id: userId,
        file_number: fileNumber,
        first_name: student.firstName,
        last_name: student.lastName,
        email,
        phone: `061234567${student.index}`,
        birth_date: '2004-06-15',
        birth_place: 'Paris',
        street_number: '12',
        street: 'Rue de la Roquette',
        postal_code: '75011',
        city: 'Paris',
        license_category: 'Permis B',
        package_id: pkg?.id || null,
        package_name: student.packageName,
        formation_type: student.packageName,
        code_status: student.codeStatus,
        status: 'En formation',
        extra_hours: businessCfg?.extraHours || 0,
        registration_date: new Date(Date.now() - student.index * 86400000 * 7).toISOString().slice(0, 10),
      })
      .select('id')
      .single()

    if (error) throw error

    await admin.from('student_assignments').insert({
      student_id: row.id,
      teacher_id: teacherIds[student.index % 2],
      is_referent: true,
    })

    studentRows.push({ id: row.id, profile_id: userId, ...student })

    credentials.push({
      role: 'student',
      roleLabel: 'Élève',
      firstName: student.firstName,
      lastName: student.lastName,
      email,
      password: SHARED_PASSWORD,
      organization: ORG_NAME,
    })
  }

  await seedRichData(admin, org.id, teacherIds, studentRows)
  await seedBusinessData(admin, org.id, teacherIds, studentRows, secretaryId)

  writeVideoCredentialsReport(credentials)

  console.log(`\n✓ ${ORG_NAME} créée avec ${credentials.length} comptes.`)
  console.log(`  Identifiants : scripts/output/video-demo-credentials.md`)
  console.log(`  Mot de passe : ${SHARED_PASSWORD}`)
}

function writeVideoCredentialsReport(accounts) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const outDir = join(root, 'scripts', 'output')
  mkdirSync(outDir, { recursive: true })

  const payload = {
    generatedAt: new Date().toISOString(),
    organization: ORG_NAME,
    sharedPassword: SHARED_PASSWORD,
    loginUrl: 'https://www.pedagogia-drive.fr/login',
    accounts,
  }

  writeFileSync(join(outDir, 'video-demo-credentials.json'), `${JSON.stringify(payload, null, 2)}\n`)

  const lines = [
    '# Comptes montage vidéo — Auto-École Horizon Drive',
    '',
    `Généré le ${new Date().toLocaleString('fr-FR')}`,
    '',
    `**Auto-école :** ${ORG_NAME}`,
    `**Mot de passe (tous les comptes) :** \`${SHARED_PASSWORD}\``,
    '',
    '**Connexion :** https://www.pedagogia-drive.fr/login',
    '',
    '| Rôle | Nom | E-mail |',
    '| --- | --- | --- |',
  ]

  for (const account of accounts) {
    lines.push(`| ${account.roleLabel} | ${account.firstName} ${account.lastName} | ${account.email} |`)
  }

  lines.push('', 'Planning, leçons, véhicules, paiements, contrats, examens et documents déjà renseignés.', '')
  writeFileSync(join(outDir, 'video-demo-credentials.md'), `${lines.join('\n')}\n`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
