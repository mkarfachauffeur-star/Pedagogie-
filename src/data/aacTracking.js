/** Suivi AAC minimal — données réelles uniquement (pas de localStorage). */
export function getStudentAacTracking(student) {
  if (!student?.aacTracking) return null
  return student.aacTracking
}

export const formationTypeOptions = [
  'Permis B traditionnel',
  'Boîte automatique',
  'AAC',
  'Conduite supervisée',
]
