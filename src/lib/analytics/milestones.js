import { supabase } from '../supabase'
import { trackOrgOnce } from './once'

async function countRows(table) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    return count || 0
  } catch {
    return null
  }
}

async function trackFirstEntity(organizationId, table, eventName, countParamName) {
  if (!organizationId) return
  const count = await countRows(table)
  if (count !== 1) return
  trackOrgOnce(organizationId, eventName, {
    [countParamName]: count,
  })
}

export async function trackFirstStudentMilestones(organizationId) {
  if (!organizationId) return
  await trackFirstEntity(organizationId, 'students', 'create_student', 'student_count')
  await trackFirstEntity(organizationId, 'students', 'create_student_file', 'student_count')
}

export async function trackFirstTeacherMilestone(organizationId) {
  await trackFirstEntity(organizationId, 'teachers', 'create_teacher', 'teacher_count')
}

export async function trackFirstVehicleMilestone(organizationId) {
  await trackFirstEntity(organizationId, 'vehicles', 'create_vehicle', 'vehicle_count')
}

export async function trackFirstLessonMilestone(organizationId) {
  await trackFirstEntity(organizationId, 'appointments', 'create_lesson', 'lesson_count')
}

export async function trackFirstExamMilestone(organizationId) {
  await trackFirstEntity(organizationId, 'exams', 'create_exam', 'exam_count')
}

export async function trackFirstMessageMilestone(organizationId) {
  await trackFirstEntity(organizationId, 'messages', 'send_message', 'message_count')
}

export async function trackFirstDocumentMilestone(organizationId) {
  await trackFirstEntity(organizationId, 'documents', 'upload_document', 'document_count')
}
