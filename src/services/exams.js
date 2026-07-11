import { supabase } from '../lib/supabase'
import { assertOrgCanWrite } from '../lib/orgAccess'
import { studentLabel } from './finance'
import { toUserError } from '../lib/userFacingError'
import { subscribePostgresChanges } from './realtime'

const EXAM_SELECT = `
  id,
  organization_id,
  type,
  exam_date,
  exam_time,
  center,
  status,
  student_id,
  teacher_id,
  created_at,
  student:student_id(id, first_name, last_name),
  teacher:teacher_id(id, full_name)
`

export function mapExamRow(row) {
  if (!row) return null
  return {
    ...row,
    studentName: studentLabel(row.student),
    teacherName: row.teacher?.full_name?.trim() || '—',
  }
}

export async function listExams() {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select(EXAM_SELECT)
      .order('exam_date', { ascending: true })
      .order('exam_time', { ascending: true })
    if (error) throw error
    return { exams: (data || []).map(mapExamRow), error: null }
  } catch (error) {
    return { exams: [], error }
  }
}

export async function createExam({
  organizationId,
  studentId,
  teacherId,
  type,
  examDate,
  examTime,
  center,
  status,
}) {
  try {
    await assertOrgCanWrite()
    const { data, error } = await supabase
      .from('exams')
      .insert({
        organization_id: organizationId,
        student_id: studentId,
        teacher_id: teacherId || null,
        type,
        exam_date: examDate,
        exam_time: examTime,
        center: center?.trim() || null,
        status: status || 'À confirmer',
      })
      .select(EXAM_SELECT)
      .single()
    if (error) throw error
    const exam = mapExamRow(data)
    if (organizationId) {
      const { trackFirstExamMilestone } = await import('../lib/analytics')
      void trackFirstExamMilestone(organizationId)
    }
    return { exam, error: null }
  } catch (error) {
    return { exam: null, error: toUserError(error, 'save') }
  }
}

export async function updateExam(examId, fields) {
  if (!examId) return { exam: null, error: new Error('Examen introuvable') }
  try {
    const payload = {}
    if (fields.studentId !== undefined) payload.student_id = fields.studentId || null
    if (fields.teacherId !== undefined) payload.teacher_id = fields.teacherId || null
    if (fields.type !== undefined) payload.type = fields.type
    if (fields.examDate !== undefined) payload.exam_date = fields.examDate
    if (fields.examTime !== undefined) payload.exam_time = fields.examTime
    if (fields.center !== undefined) payload.center = fields.center?.trim() || null
    if (fields.status !== undefined) payload.status = fields.status

    const { data, error } = await supabase
      .from('exams')
      .update(payload)
      .eq('id', examId)
      .select(EXAM_SELECT)
      .single()
    if (error) throw error
    return { exam: mapExamRow(data), error: null }
  } catch (error) {
    return { exam: null, error: toUserError(error, 'save') }
  }
}

export async function deleteExam(examId) {
  if (!examId) return { error: new Error('Examen introuvable') }
  try {
    const { error } = await supabase.from('exams').delete().eq('id', examId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'delete') }
  }
}

export function subscribeToExams(onChange) {
  return subscribePostgresChanges({
    topicBase: 'exams',
    listeners: [{ config: { event: '*', schema: 'public', table: 'exams' }, callback: onChange }],
  })
}
