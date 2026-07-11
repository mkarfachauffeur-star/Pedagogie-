/** Statuts et helpers — fin de parcours élève. */

export const STUDENT_STATUS = {
  ARCHIVED: 'Archivé',
  EXAM_AWAITING_RESULT: 'Examen pratique en attente de résultat',
  LICENSE_FAILED: 'Permis non obtenu',
}

export const LICENSE_RESULT = {
  AWAITING: 'awaiting_result',
  OBTAINED: 'obtained',
  FAILED: 'failed',
  PENDING: 'pending',
}

export const PRACTICAL_EXAM_TYPES = new Set(['Permis B', 'AAC', 'Boîte auto'])

export const ACTIVE_STUDENT_STATUSES = new Set([
  'En attente',
  'En cours',
  'Validé',
  'Pièces manquantes',
  'En formation',
  STUDENT_STATUS.EXAM_AWAITING_RESULT,
  STUDENT_STATUS.LICENSE_FAILED,
])

export function isPracticalExamType(type) {
  return PRACTICAL_EXAM_TYPES.has(type)
}

export function isArchivedStudent(student) {
  if (!student) return false
  return student.status === STUDENT_STATUS.ARCHIVED
    || student.license_result === LICENSE_RESULT.OBTAINED
    || Boolean(student.is_archived)
}

export function allowsActiveBookings(student) {
  if (!student) return false
  if (isArchivedStudent(student)) return false
  return ACTIVE_STUDENT_STATUSES.has(student.status) || !student.status
}

export function licenseResultLabel(result) {
  if (result === LICENSE_RESULT.OBTAINED) return 'Permis obtenu'
  if (result === LICENSE_RESULT.FAILED) return 'Permis non obtenu'
  if (result === LICENSE_RESULT.AWAITING) return 'En attente de résultat'
  if (result === LICENSE_RESULT.PENDING) return 'Résultat en attente'
  return '—'
}

export function statusBadgeClass(status, licenseResult) {
  if (licenseResult === LICENSE_RESULT.OBTAINED || status === STUDENT_STATUS.ARCHIVED) {
    return 'bg-emerald-50 text-emerald-700'
  }
  if (status === STUDENT_STATUS.EXAM_AWAITING_RESULT) {
    return 'bg-violet-50 text-violet-700'
  }
  if (status === STUDENT_STATUS.LICENSE_FAILED || licenseResult === LICENSE_RESULT.FAILED) {
    return 'bg-rose-50 text-rose-700'
  }
  return 'bg-slate-100 text-slate-600'
}
