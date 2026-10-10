/** Règles pures de progression leçon/QCU (testables sans Supabase). */

export const QCU_PASS_PERCENTAGE = 80

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
