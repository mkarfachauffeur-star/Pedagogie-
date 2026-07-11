import { supabase } from '../lib/supabase'
import {
  addMinutes,
  buildCsvContent,
  downloadCsv,
  formatDateFr,
  formatDurationMinutes,
  formatGeneratedAt,
  formatTimeFr,
  splitFullName,
  timestampForFilename,
} from '../utils/csvExport'

function referentTeacherName(student) {
  const assignments = student?.student_assignments || []
  const referent = assignments.find((row) => row.is_referent) || assignments[0]
  return referent?.teacher?.full_name || ''
}

function vehicleLabel(vehicle) {
  if (!vehicle) return ''
  return [vehicle.plate, vehicle.brand, vehicle.model].filter(Boolean).join(' · ')
}

function isRealizedLesson(status = '') {
  const value = status.toLowerCase()
  if (!value || value.includes('annul') || value.includes('planifi')) return false
  return true
}

function formationLabel(student) {
  if (!student) return ''
  return student.formation_type || student.package_name || ''
}

export async function fetchExportStudents({ dateFrom, dateTo, teacherId, studentId } = {}) {
  let query = supabase
    .from('students')
    .select(`
      id, file_number, first_name, last_name, email, phone, birth_date,
      birth_place, street_number, street, postal_code, city, neph,
      license_category, package_name, formation_type, driving_type,
      code_status, registration_date, status,
      student_assignments(is_referent, teacher_id, created_at)
    `)
    .order('last_name', { ascending: true })

  if (dateFrom) query = query.gte('registration_date', dateFrom)
  if (dateTo) query = query.lte('registration_date', dateTo)
  if (studentId) query = query.eq('id', studentId)

  const { data, error } = await query
  if (error) throw error

  let rows = data || []
  if (teacherId) {
    rows = rows.filter((student) =>
      (student.student_assignments || []).some((assignment) => assignment.teacher_id === teacherId),
    )
  }

  const teacherIds = [...new Set(
    rows.flatMap((student) => (student.student_assignments || []).map((assignment) => assignment.teacher_id)),
  )]
  const teacherProfilesById = new Map()
  if (teacherIds.length) {
    const { data: teacherProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', teacherIds)
    if (profilesError) throw profilesError
    for (const profile of teacherProfiles || []) {
      teacherProfilesById.set(profile.id, profile)
    }
  }

  return rows.map((student) => ({
    ...student,
    student_assignments: (student.student_assignments || []).map((assignment) => ({
      ...assignment,
      teacher: {
        id: assignment.teacher_id,
        full_name: teacherProfilesById.get(assignment.teacher_id)?.full_name ?? null,
      },
    })),
  }))
}

export async function fetchExportTeachers({ dateFrom, dateTo } = {}) {
  let query = supabase
    .from('teachers')
    .select('profile_id, created_at, profiles:profile_id(id, full_name, email, phone)')
    .order('created_at', { ascending: true })

  if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00`)
  if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchExportLessons({ dateFrom, dateTo, teacherId, studentId, realizedOnly = false } = {}) {
  let query = supabase
    .from('appointments')
    .select(`
      id, starts_at, duration_minutes, status, kind,
      student:student_id(id, first_name, last_name, formation_type, package_name),
      teacher:teacher_id(id, full_name),
      vehicle:vehicle_id(id, brand, model, plate)
    `)
    .order('starts_at', { ascending: true })

  if (dateFrom) query = query.gte('starts_at', `${dateFrom}T00:00:00`)
  if (dateTo) query = query.lte('starts_at', `${dateTo}T23:59:59`)
  if (teacherId) query = query.eq('teacher_id', teacherId)
  if (studentId) query = query.eq('student_id', studentId)

  const { data, error } = await query
  if (error) throw error
  let rows = data || []
  if (realizedOnly) rows = rows.filter((row) => isRealizedLesson(row.status))
  return rows
}

export async function fetchExportFilterOptions() {
  const [{ data: students }, { data: teachers }] = await Promise.all([
    supabase.from('students').select('id, first_name, last_name, file_number').order('last_name'),
    supabase.from('teachers').select('profile_id, profiles:profile_id(full_name)').order('created_at'),
  ])
  return {
    students: (students || []).map((s) => ({
      id: s.id,
      label: `${s.last_name || ''} ${s.first_name || ''}`.trim() || s.file_number || s.id,
    })),
    teachers: (teachers || []).map((t) => ({
      id: t.profile_id,
      label: t.profiles?.full_name?.trim() || 'Enseignant',
    })),
  }
}

function commonMeta(filters) {
  const meta = []
  if (filters.dateFrom || filters.dateTo) {
    meta.push(['Période', `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}`])
  }
  if (filters.teacherLabel) meta.push(['Enseignant', filters.teacherLabel])
  if (filters.studentLabel) meta.push(['Élève', filters.studentLabel])
  return meta
}

export async function exportStudentsCsv(filters = {}) {
  const generatedAt = formatGeneratedAt()
  const students = await fetchExportStudents(filters)
  const headers = [
    'Nom',
    'Prénom',
    'Email',
    'Téléphone',
    'Date de naissance',
    'Numéro de dossier',
    'Date d\'inscription',
    'Enseignant référent',
    'Statut',
  ]
  const rows = students.map((student) => ({
    Nom: student.last_name || '',
    Prénom: student.first_name || '',
    Email: student.email || '',
    Téléphone: student.phone || '',
    'Date de naissance': formatDateFr(student.birth_date),
    'Numéro de dossier': student.file_number || '',
    'Date d\'inscription': formatDateFr(student.registration_date),
    'Enseignant référent': referentTeacherName(student),
    Statut: student.status || '',
  }))
  const content = buildCsvContent({ generatedAt, meta: commonMeta(filters), headers, rows })
  downloadCsv(`export-eleves_${timestampForFilename()}.csv`, content)
}

export async function exportTeachersCsv(filters = {}) {
  const generatedAt = formatGeneratedAt()
  const teachers = await fetchExportTeachers(filters)
  const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Date d\'affectation']
  const rows = teachers.map((teacher) => {
    const { firstName, lastName } = splitFullName(teacher.profiles?.full_name || '')
    return {
      Nom: lastName,
      Prénom: firstName,
      Email: teacher.profiles?.email || '',
      Téléphone: teacher.profiles?.phone || '',
      'Date d\'affectation': formatDateFr(teacher.created_at),
    }
  })
  const content = buildCsvContent({ generatedAt, meta: commonMeta(filters), headers, rows })
  downloadCsv(`export-enseignants_${timestampForFilename()}.csv`, content)
}

export async function exportLessonsCsv(filters = {}) {
  const generatedAt = formatGeneratedAt()
  const lessons = await fetchExportLessons(filters)
  const headers = [
    'Élève',
    'Enseignant',
    'Date',
    'Heure début',
    'Heure fin',
    'Durée',
    'Type de formation',
    'Véhicule',
    'Statut',
  ]
  const rows = lessons.map((lesson) => {
    const studentName = lesson.student
      ? `${lesson.student.last_name || ''} ${lesson.student.first_name || ''}`.trim()
      : ''
    const endAt = addMinutes(lesson.starts_at, lesson.duration_minutes)
    return {
      Élève: studentName,
      Enseignant: lesson.teacher?.full_name || '',
      Date: formatDateFr(lesson.starts_at),
      'Heure début': formatTimeFr(lesson.starts_at),
      'Heure fin': formatTimeFr(endAt),
      Durée: formatDurationMinutes(lesson.duration_minutes),
      'Type de formation': formationLabel(lesson.student),
      Véhicule: vehicleLabel(lesson.vehicle),
      Statut: lesson.status || '',
    }
  })
  const content = buildCsvContent({ generatedAt, meta: commonMeta(filters), headers, rows })
  downloadCsv(`export-lecons_${timestampForFilename()}.csv`, content)
}

export async function exportPrefectureCsv(filters = {}) {
  const generatedAt = formatGeneratedAt()
  const [students, lessons] = await Promise.all([
    fetchExportStudents(filters),
    fetchExportLessons({ ...filters, realizedOnly: true }),
  ])

  const lines = [`Généré le;${generatedAt}`]
  commonMeta(filters).forEach(([label, value]) => lines.push(`${label};${value}`))
  lines.push('')

  const studentHeaders = [
    'Nom',
    'Prénom',
    'Email',
    'Téléphone',
    'Date de naissance',
    'Lieu de naissance',
    'Adresse numéro',
    'Adresse rue',
    'Code postal',
    'Ville',
    'NEPH',
    'Catégorie permis',
    'Formule',
    'Type de formation',
    'Type de conduite',
    'Statut code',
    'Numéro de dossier',
    'Date d\'inscription',
    'Statut dossier',
    'Enseignant référent',
  ]
  lines.push('SECTION;ÉLÈVES')
  lines.push(studentHeaders.join(';'))
  students.forEach((student) => {
    lines.push(
      [
        student.last_name,
        student.first_name,
        student.email,
        student.phone,
        formatDateFr(student.birth_date),
        student.birth_place,
        student.street_number,
        student.street,
        student.postal_code,
        student.city,
        student.neph,
        student.license_category,
        student.package_name,
        student.formation_type,
        student.driving_type,
        student.code_status,
        student.file_number,
        formatDateFr(student.registration_date),
        student.status,
        referentTeacherName(student),
      ]
        .map((cell) => {
          const text = cell == null ? '' : String(cell)
          return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
        })
        .join(';'),
    )
  })

  lines.push('')
  lines.push('SECTION;AFFECTATIONS ENSEIGNANTS')
  lines.push(['Élève', 'Enseignant', 'Référent', 'Date d\'affectation'].join(';'))
  students.forEach((student) => {
    const studentName = `${student.last_name || ''} ${student.first_name || ''}`.trim()
    ;(student.student_assignments || []).forEach((assignment) => {
      lines.push(
        [
          studentName,
          assignment.teacher?.full_name || '',
          assignment.is_referent ? 'Oui' : 'Non',
          formatDateFr(assignment.created_at),
        ]
          .map((cell) => {
            const text = cell == null ? '' : String(cell)
            return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
          })
          .join(';'),
      )
    })
  })

  lines.push('')
  lines.push('SECTION;LEÇONS RÉALISÉES')
  lines.push(
    [
      'Élève',
      'Enseignant',
      'Date',
      'Heure début',
      'Heure fin',
      'Durée',
      'Type de formation',
      'Type séance',
      'Véhicule',
      'Statut',
    ].join(';'),
  )
  lessons.forEach((lesson) => {
    const studentName = lesson.student
      ? `${lesson.student.last_name || ''} ${lesson.student.first_name || ''}`.trim()
      : ''
    const endAt = addMinutes(lesson.starts_at, lesson.duration_minutes)
    lines.push(
      [
        studentName,
        lesson.teacher?.full_name || '',
        formatDateFr(lesson.starts_at),
        formatTimeFr(lesson.starts_at),
        formatTimeFr(endAt),
        formatDurationMinutes(lesson.duration_minutes),
        formationLabel(lesson.student),
        lesson.kind || '',
        vehicleLabel(lesson.vehicle),
        lesson.status || '',
      ]
        .map((cell) => {
          const text = cell == null ? '' : String(cell)
          return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
        })
        .join(';'),
    )
  })

  downloadCsv(`export-prefecture_${timestampForFilename()}.csv`, `\uFEFF${lines.join('\r\n')}`)
}
