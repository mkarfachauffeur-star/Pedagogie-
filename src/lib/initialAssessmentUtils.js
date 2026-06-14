/** Normalise une valeur pour affichage JSX (évite React error #31). */
export function toDisplayText(value, fallback = '—') {
  if (value == null || value === '') return fallback
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return fallback
}

/** Parse et nettoie answers (jsonb Supabase → objet plat string/boolean). */
export function normalizeAssessmentAnswers(raw) {
  let answers = raw
  if (typeof answers === 'string') {
    try {
      answers = JSON.parse(answers)
    } catch {
      answers = {}
    }
  }
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(answers).map(([key, value]) => {
      if (typeof value === 'boolean') return [key, value]
      if (value == null) return [key, '']
      if (typeof value === 'object') return [key, JSON.stringify(value)]
      return [key, String(value)]
    }),
  )
}

/** Prépare une évaluation Supabase pour l'affichage React. */
export function normalizeInitialAssessment(row) {
  if (!row) return null
  const { teacher, ...rest } = row
  return {
    ...rest,
    status: toDisplayText(row.status, 'pending'),
    answers: normalizeAssessmentAnswers(row.answers),
    teacherName: toDisplayText(teacher?.full_name, null),
  }
}

export function formatRecommendedHours(assessment) {
  const min = assessment?.recommended_hours_min
  const max = assessment?.recommended_hours_max
  if (min == null || min === '') return '—'
  if (max == null || max === '' || max === min) return `${min} h`
  return `${min} à ${max} h`
}

export function getHoursProposalStatus(assessment) {
  const response = assessment?.recommended_hours_response
  if (response === 'accepted') {
    return { label: 'Acceptée par l\'élève', tone: 'accepted' }
  }
  if (response === 'declined') {
    return { label: 'Refusée par l\'élève', tone: 'declined' }
  }
  return { label: 'En attente de l\'élève', tone: 'pending' }
}

/** Heures cible retenues après acceptation de la proposition (max si fourchette). */
export function resolveAcceptedRecommendedHours(assessment) {
  if (!assessment || assessment.status !== 'completed') return null
  if (assessment.recommended_hours_response !== 'accepted') return null
  const min = Number(assessment.recommended_hours_min)
  const max = Number(assessment.recommended_hours_max ?? assessment.recommended_hours_min)
  if (Number.isNaN(min)) return null
  const target = Number.isNaN(max) ? min : Math.max(min, max)
  return target
}
