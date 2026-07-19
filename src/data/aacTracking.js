/** Mapping UI du suivi AAC (données issues de getAacBundle). */

export function getStudentAacTracking(student) {
  if (student?.aacTracking) return student.aacTracking
  if (student?.aacBundle?.profile) {
    return bundleToTracking(student.aacBundle)
  }
  return null
}

export function bundleToTracking(bundle) {
  if (!bundle?.profile) return null
  const { profile, rvp } = bundle
  return {
    startDate: profile.startedAt,
    minimumEndDate: profile.examEligibleAt,
    kilometersCurrent: profile.kmTotal,
    kilometersTarget: profile.progress?.target || 3000,
    tripCount: profile.tripCount,
    status: profile.status,
    statusLabel: profile.statusLabel,
    pedagogicalAppointments: (rvp || []).map((item) => ({
      id: item.id,
      label: item.label,
      date: item.heldOn,
      duration: '2 h',
      status: item.completed ? 'Validé' : 'À planifier',
      companionName: item.companionName,
      observations: item.observations,
      teacherId: item.teacherId,
      sequence: item.sequence,
      completed: item.completed,
    })),
  }
}

export const formationTypeOptions = [
  'Permis B traditionnel',
  'Boîte automatique',
  'AAC',
  'Conduite supervisée',
]
