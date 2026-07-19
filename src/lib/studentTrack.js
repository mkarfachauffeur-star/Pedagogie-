export const STUDENT_TRACKS = {
  PERMIS_B: 'permis_b',
  MOTO_AM: 'moto_am',
}

const MOTO_AM_LICENSES = [
  /^permis am$/i,
  /^permis a1$/i,
  /^permis a2$/i,
  /^permis a$/i,
]

export function resolveStudentTrack(student) {
  const license = String(student?.license_category || 'Permis B').trim()
  if (MOTO_AM_LICENSES.some((pattern) => pattern.test(license))) {
    return STUDENT_TRACKS.MOTO_AM
  }
  return STUDENT_TRACKS.PERMIS_B
}

export function isPermisBStudent(student) {
  return resolveStudentTrack(student) === STUDENT_TRACKS.PERMIS_B
}

export function isMotoAmStudent(student) {
  return resolveStudentTrack(student) === STUDENT_TRACKS.MOTO_AM
}

export function isAacFormation(student) {
  const label = `${student?.package_name || ''} ${student?.formation_type || ''}`.toLowerCase()
  return label.includes('aac') || label.includes('accompagn')
}

export function isSupervisedFormation(student) {
  const label = `${student?.package_name || ''} ${student?.formation_type || ''}`.toLowerCase()
  return label.includes('supervis') || label.includes(' cs')
}

export function getTrackLabel(track) {
  return track === STUDENT_TRACKS.MOTO_AM ? 'Moto & AM (BSR)' : 'Permis B'
}

export const PERMIS_B_ONLY_ROUTES = [
  '/student/initial-assessment',
  '/student/lessons',
  '/student/competency-reports',
  '/student/pedagogical-appointments',
  '/student/accompanied-driving',
  '/student/practice-exams',
  '/student/exams',
  '/student/lexicon',
  '/student/accompanied-driving',
  '/student/progress',
]

export function isPermisBOnlyRoute(pathname) {
  return PERMIS_B_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}
