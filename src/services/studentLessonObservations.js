import { supabase } from '../lib/supabase'

function mapRow(row) {
  if (!row) return null
  return {
    id: row.id,
    date: row.lesson_date || '',
    time: row.lesson_time || '',
    duration: row.duration || '2H',
    status: row.status || 'Débuté',
    observations: row.observations || '',
    skills: row.skills || [],
    sharedWithStudent: Boolean(row.shared_with_student),
    openedBy: row.opened_by || row.teacher?.full_name || 'Enseignant',
    closedBy: row.closed_by || '',
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    teacherName: row.teacher?.full_name || row.opened_by || null,
  }
}

export async function listLessonObservationsForStudent(studentId) {
  if (!studentId) return { lessons: [], error: null }
  try {
    const { data, error } = await supabase
      .from('student_lesson_observations')
      .select(`
        *,
        teacher:teacher_id(full_name)
      `)
      .eq('student_id', studentId)
      .order('opened_at', { ascending: false })
    if (error) throw error
    return { lessons: (data || []).map(mapRow), error: null }
  } catch (error) {
    return { lessons: [], error }
  }
}

export async function createLessonObservation({
  organizationId,
  studentId,
  teacherId,
  openedBy,
  date,
  time,
  duration,
  status,
  observations,
  skills = [],
  sharedWithStudent = false,
}) {
  try {
    const { data, error } = await supabase
      .from('student_lesson_observations')
      .insert({
        organization_id: organizationId,
        student_id: studentId,
        teacher_id: teacherId,
        lesson_date: date || null,
        lesson_time: time || null,
        duration: duration || '2H',
        status: status || 'Débuté',
        observations: observations || '',
        skills,
        shared_with_student: sharedWithStudent,
        opened_by: openedBy || '',
        opened_at: new Date().toISOString(),
      })
      .select(`
        *,
        teacher:teacher_id(full_name)
      `)
      .single()
    if (error) throw error
    return { lesson: mapRow(data), error: null }
  } catch (error) {
    return { lesson: null, error }
  }
}

export async function updateLessonObservation(lessonId, patch = {}) {
  if (!lessonId) return { lesson: null, error: new Error('Leçon introuvable.') }
  try {
    const row = {
      updated_at: new Date().toISOString(),
      ...(patch.status != null ? { status: patch.status } : {}),
      ...(patch.observations != null ? { observations: patch.observations } : {}),
      ...(patch.sharedWithStudent != null ? { shared_with_student: patch.sharedWithStudent } : {}),
      ...(patch.closedBy != null ? { closed_by: patch.closedBy } : {}),
      ...(patch.closedAt != null ? { closed_at: patch.closedAt } : {}),
    }
    const { data, error } = await supabase
      .from('student_lesson_observations')
      .update(row)
      .eq('id', lessonId)
      .select(`
        *,
        teacher:teacher_id(full_name)
      `)
      .single()
    if (error) throw error
    return { lesson: mapRow(data), error: null }
  } catch (error) {
    return { lesson: null, error }
  }
}
