import { supabase } from '../lib/supabase'

export const QCU_PASS_PERCENTAGE = 80

function mapProgressRow(row) {
  if (!row) return null
  return {
    moduleId: row.module_id,
    moduleTitle: row.module_title,
    courseReadComplete: Boolean(row.course_read_complete),
    courseReadAt: row.course_read_at,
    qcuPassed: Boolean(row.qcu_passed),
    score: row.qcu_score,
    total: row.qcu_total,
    percentage: row.qcu_percentage,
    qcuValidatedAt: row.qcu_validated_at,
    completed: Boolean(row.qcu_passed),
  }
}

export function normalizeModuleProgress(raw = {}) {
  const qcuPassed = Boolean(raw.qcuPassed ?? raw.qcu_passed ?? raw.completed)
  return {
    moduleId: raw.moduleId ?? raw.module_id ?? null,
    moduleTitle: raw.moduleTitle ?? raw.module_title ?? null,
    courseReadComplete: Boolean(raw.courseReadComplete ?? raw.course_read_complete),
    courseReadAt: raw.courseReadAt || raw.course_read_at || null,
    qcuPassed,
    score: raw.score ?? raw.qcu_score ?? null,
    total: raw.total ?? raw.qcu_total ?? null,
    percentage: raw.percentage ?? raw.qcu_percentage ?? null,
    qcuValidatedAt: raw.qcuValidatedAt || raw.qcu_validated_at || raw.validatedAt || null,
    completed: qcuPassed,
  }
}

export function isQcuPassed(score, total) {
  if (!total || total <= 0 || score == null) return false
  const percentage = Math.round((score / total) * 100)
  const minScore = Math.ceil(total * (QCU_PASS_PERCENTAGE / 100))
  return percentage >= QCU_PASS_PERCENTAGE && score >= minScore
}

export async function listLessonModuleProgressForStudent(studentId) {
  if (!studentId) return { progress: [], error: null }
  try {
    const { data, error } = await supabase
      .from('student_lesson_module_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('qcu_validated_at', { ascending: false, nullsFirst: false })
    if (error) throw error
    return { progress: (data || []).map(mapProgressRow), error: null }
  } catch (error) {
    return { progress: [], error }
  }
}

export async function fetchLessonModuleProgressMap(studentId) {
  const { progress, error } = await listLessonModuleProgressForStudent(studentId)
  if (error) return { progressByModuleId: {}, error }
  const progressByModuleId = Object.fromEntries(
    progress.map((row) => [row.moduleId, normalizeModuleProgress(row)]),
  )
  return { progressByModuleId, error: null }
}

export async function markCourseReadComplete({ moduleId, moduleTitle }) {
  try {
    const { data, error } = await supabase.rpc('save_student_lesson_module_progress', {
      p_module_id: moduleId,
      p_module_title: moduleTitle || null,
      p_mark_course_read: true,
      p_qcu_score: null,
      p_qcu_total: null,
    })
    if (error) throw error
    return { progress: normalizeModuleProgress(mapProgressRow(data)), error: null }
  } catch (error) {
    return { progress: null, error }
  }
}

export async function recordQcuResult({ moduleId, moduleTitle, score, total }) {
  try {
    const { data, error } = await supabase.rpc('save_student_lesson_module_progress', {
      p_module_id: moduleId,
      p_module_title: moduleTitle || null,
      p_mark_course_read: false,
      p_qcu_score: score,
      p_qcu_total: total,
    })
    if (error) throw error
    return { progress: normalizeModuleProgress(mapProgressRow(data)), error: null }
  } catch (error) {
    return { progress: null, error }
  }
}

export function formatQcuValidatedAt(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}
