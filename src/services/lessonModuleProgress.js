import { supabase } from '../lib/supabase'
import {
  LESSON_MODULE_IDS_BY_COMPETENCY,
  LESSON_MODULE_STORAGE_KEYS,
  REMC_COMPETENCY_ORDER,
} from '../data/lessonCompetencyModules'
import { subscribePostgresChanges } from './realtime'

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

export async function fetchLatestPassedQcu(studentId) {
  const { progress, error } = await listLessonModuleProgressForStudent(studentId)
  if (error) return { latest: null, error }
  const latest = progress
    .filter((row) => row.qcuPassed)
    .sort((a, b) => String(b.qcuValidatedAt || '').localeCompare(String(a.qcuValidatedAt || '')))[0] || null
  return { latest, error: null }
}

function lessonProgressStorageKey(storageKey, ownerId) {
  if (!storageKey || !ownerId) return null
  return `${storageKey}:${ownerId}`
}

function readLocalModuleProgress(moduleId, ownerId) {
  const storageKey = LESSON_MODULE_STORAGE_KEYS[moduleId]
  const scopedKey = lessonProgressStorageKey(storageKey, ownerId)
  if (!scopedKey || typeof window === 'undefined') {
    return normalizeModuleProgress({ completed: false })
  }
  try {
    const saved = window.localStorage.getItem(scopedKey)
    return saved ? normalizeModuleProgress(JSON.parse(saved)) : normalizeModuleProgress({ completed: false })
  } catch {
    return normalizeModuleProgress({ completed: false })
  }
}

function mergeModuleProgress(localProgress, remoteProgress) {
  const local = normalizeModuleProgress(localProgress)
  const remote = normalizeModuleProgress(remoteProgress)
  const qcuPassed = local.qcuPassed || remote.qcuPassed
  return normalizeModuleProgress({
    courseReadComplete: local.courseReadComplete || remote.courseReadComplete,
    courseReadAt: remote.courseReadAt || local.courseReadAt,
    qcuPassed,
    score: qcuPassed ? (remote.score ?? local.score) : (local.score ?? remote.score),
    total: qcuPassed ? (remote.total ?? local.total) : (local.total ?? remote.total),
    percentage: qcuPassed ? (remote.percentage ?? local.percentage) : (local.percentage ?? remote.percentage),
    qcuValidatedAt: remote.qcuValidatedAt || local.qcuValidatedAt,
    completed: qcuPassed,
  })
}

export async function fetchLessonModuleProgressMap(studentId, profileId = null) {
  const ownerId = studentId || profileId
  const { progress, error } = studentId
    ? await listLessonModuleProgressForStudent(studentId)
    : { progress: [], error: null }

  const remoteByModuleId = Object.fromEntries(
    (progress || []).map((row) => [row.moduleId, normalizeModuleProgress(row)]),
  )

  const moduleIds = Object.keys(LESSON_MODULE_STORAGE_KEYS)
  const progressByModuleId = Object.fromEntries(
    moduleIds.map((moduleId) => [
      moduleId,
      ownerId
        ? mergeModuleProgress(readLocalModuleProgress(moduleId, ownerId), remoteByModuleId[moduleId])
        : normalizeModuleProgress(remoteByModuleId[moduleId]),
    ]),
  )

  return { progressByModuleId, error }
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

/** Progression par compétence à partir des QCU réussis dans les modules leçons. */
export function computeLessonProgressByCompetency(progressByModuleId = {}) {
  return REMC_COMPETENCY_ORDER.reduce((acc, code) => {
    const moduleIds = LESSON_MODULE_IDS_BY_COMPETENCY[code] || []
    if (!moduleIds.length) {
      acc[code] = 0
      return acc
    }
    const passedCount = moduleIds.filter((id) => progressByModuleId[id]?.qcuPassed).length
    acc[code] = Math.round((passedCount / moduleIds.length) * 100)
    return acc
  }, {})
}

/** Fusionne la progression REMC (enseignant) et la progression QCU (modules leçons). */
export function mergeRemcAndLessonProgress(remcProgress, lessonByCompetency = {}) {
  const byCompetency = { ...(remcProgress?.byCompetency || {}) }

  REMC_COMPETENCY_ORDER.forEach((code) => {
    const remcPct = byCompetency[code] ?? 0
    const lessonPct = lessonByCompetency[code] ?? 0
    byCompetency[code] = Math.max(remcPct, lessonPct)
  })

  const global = REMC_COMPETENCY_ORDER.length
    ? Math.round(
        REMC_COMPETENCY_ORDER.reduce((sum, code) => sum + (byCompetency[code] || 0), 0)
          / REMC_COMPETENCY_ORDER.length,
      )
    : 0

  return {
    ...(remcProgress || {}),
    byCompetency,
    global: Math.max(remcProgress?.global || 0, global),
  }
}

export function subscribeLessonModuleProgress(studentId, onChange) {
  if (!studentId) return () => {}
  return subscribePostgresChanges({
    topicBase: `lesson-module-progress:${studentId}`,
    listeners: [{
      config: {
        event: '*',
        schema: 'public',
        table: 'student_lesson_module_progress',
        filter: `student_id=eq.${studentId}`,
      },
      callback: onChange,
    }],
  })
}
