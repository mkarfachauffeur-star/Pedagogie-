#!/usr/bin/env node
/** Complète RDV + validations compétences pour les orgs recette déjà seedées. */
import { createClient } from '@supabase/supabase-js'
import { RECETTE_ORG_PREFIX, requireSupabaseAdmin } from './lib/recette-seed-utils.mjs'

async function main() {
  const { url, serviceKey } = requireSupabaseAdmin()
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: orgs } = await admin.from('organizations').select('id, name').like('name', `${RECETTE_ORG_PREFIX}%`)
  let apptAdded = 0
  let compAdded = 0

  for (const org of orgs || []) {
    const { data: teachers } = await admin.from('teachers').select('profile_id').eq('organization_id', org.id).limit(4)
    const { data: students } = await admin.from('students').select('id').eq('organization_id', org.id).order('created_at').limit(5)
    if (!teachers?.length || !students?.length) continue

    const { count: apptCount } = await admin.from('appointments').select('id', { count: 'exact', head: true }).eq('organization_id', org.id)
    if ((apptCount || 0) < 2) {
      const starts = new Date()
      starts.setDate(starts.getDate() + 3)
      starts.setHours(10, 0, 0, 0)
      for (let i = 0; i < Math.min(4, students.length); i += 1) {
        const slot = new Date(starts)
        slot.setHours(10 + i * 2, 0, 0, 0)
        const { error } = await admin.from('appointments').insert({
          organization_id: org.id,
          student_id: students[i].id,
          teacher_id: teachers[i % teachers.length].profile_id,
          kind: 'Leçon',
          starts_at: slot.toISOString(),
          duration_minutes: 60,
          status: 'Planifié',
          notes: 'Créneau recette — leçon de conduite',
        })
        if (!error) apptAdded += 1
      }
    }

    for (let i = 0; i < Math.min(3, students.length); i += 1) {
      const { error } = await admin.from('student_competency_validations').insert({
        organization_id: org.id,
        student_id: students[i].id,
        validated_by: teachers[0].profile_id,
        competency_code: ['C1', 'C2', 'C3'][i],
      })
      if (!error) compAdded += 1
    }

    const { data: pairs } = await admin
      .from('student_assignments')
      .select('student_id, teacher_id')
      .in('student_id', students.slice(0, 5).map((s) => s.id))

    for (const [i, row] of (pairs || []).slice(0, 3).entries()) {
      const { error } = await admin.from('student_competency_validations').upsert({
        organization_id: org.id,
        student_id: row.student_id,
        validated_by: row.teacher_id,
        competency_code: ['C1', 'C2', 'C3'][i % 3],
      }, { onConflict: 'student_id,competency_code' })
      if (!error) compAdded += 1
    }
  }

  console.log(`Patch recette : ${apptAdded} RDV · ${compAdded} validations compétences`)
}

main().catch((e) => { console.error(e); process.exit(1) })
