import { supabase } from '../lib/supabase'

export function parseLessonDurationHours(duration) {
  const normalized = String(duration || '').trim().toUpperCase().replace(/\s+/g, '')
  if (!normalized) return 2
  if (normalized === '45MIN') return 0.75
  if (normalized === '1H') return 1
  if (normalized === '2H') return 2
  const match = normalized.match(/^(\d+(?:\.\d+)?)H?$/)
  return match ? Number(match[1]) : 0
}

export function formatLessonDateFr(dateString) {
  if (!dateString) return ''
  const [year, month, day] = String(dateString).slice(0, 10).split('-')
  if (!year || !month || !day) return dateString
  return `${day}/${month}/${year}`
}

export function formatLessonOpeningLabel(date, time) {
  const dateFr = formatLessonDateFr(date)
  if (!dateFr) return '—'
  const hour = String(time || '').slice(0, 5)
  return hour ? `${dateFr} · ${hour}` : dateFr
}

export function formatLessonClosingLabel(date, time, duration) {
  if (!date) return '—'
  const [year, month, day] = String(date).slice(0, 10).split('-').map(Number)
  const [hours = 0, minutes = 0] = String(time || '00:00').split(':').map(Number)
  const start = new Date(year, (month || 1) - 1, day || 1, hours, minutes)
  if (Number.isNaN(start.getTime())) return '—'
  const end = new Date(start.getTime() + parseLessonDurationHours(duration) * 60 * 60 * 1000)
  const endDate = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}/${end.getFullYear()}`
  const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
  return `${endDate} · ${endTime}`
}

function buildLessonTimestamps(date, time, duration) {
  const now = new Date().toISOString()
  if (!date) return { openedAt: now, closedAt: now }
  const [year, month, day] = String(date).slice(0, 10).split('-').map(Number)
  const [hours = 0, minutes = 0] = String(time || '00:00').split(':').map(Number)
  const start = new Date(year, (month || 1) - 1, day || 1, hours, minutes)
  if (Number.isNaN(start.getTime())) return { openedAt: now, closedAt: now }
  const end = new Date(start.getTime() + parseLessonDurationHours(duration) * 60 * 60 * 1000)
  return { openedAt: start.toISOString(), closedAt: end.toISOString() }
}

export function sumCompletedLessonHours(lessons = []) {
  return lessons
    .filter((lesson) => !['Annulé', 'Annule'].includes(lesson.status))
    .reduce((sum, lesson) => sum + parseLessonDurationHours(lesson.duration), 0)
}

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
    const { openedAt, closedAt } = buildLessonTimestamps(date, time, duration)
    const { data, error } = await supabase
      .from('student_lesson_observations')
      .insert({
        organization_id: organizationId,
        student_id: studentId,
        teacher_id: teacherId,
        lesson_date: date || null,
        lesson_time: time || null,
        duration: duration || '2H',
        status: 'Terminé',
        observations: observations || '',
        skills,
        shared_with_student: sharedWithStudent,
        opened_by: openedBy || '',
        opened_at: openedAt,
        closed_by: openedBy || '',
        closed_at: closedAt,
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
