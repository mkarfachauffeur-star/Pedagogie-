import { supabase } from '../lib/supabase'
import { REMC_COMPETENCY_ORDER } from '../data/remcCompetencies'

function emptyEntry() {
  return { validated: false, validatedAt: null, validatedBy: null, teacherName: null }
}

export function buildUnlockState(validations = []) {
  const byCode = Object.fromEntries(
    REMC_COMPETENCY_ORDER.map((code) => [code, { ...emptyEntry(), unlocked: code === 'C1' }]),
  )

  validations.forEach((row) => {
    const code = row.competency_code
    if (!byCode[code]) return
    byCode[code].validated = true
    byCode[code].validatedAt = row.validated_at
    byCode[code].validatedBy = row.validated_by
    byCode[code].teacherName = row.validated_by_profile?.full_name || null
  })

  REMC_COMPETENCY_ORDER.forEach((code, index) => {
    if (index === 0) {
      byCode[code].unlocked = true
      return
    }
    const previous = REMC_COMPETENCY_ORDER[index - 1]
    byCode[code].unlocked = Boolean(byCode[previous].validated)
  })

  return byCode
}

/** État par défaut : C1 débloquée, C2–C4 verrouillées */
export const DEFAULT_UNLOCK_STATE = buildUnlockState([])

export function areAllSubCompetenciesValidated(competency) {
  if (!competency?.items?.length) return false
  return competency.items.every((item) => item.status === 'Validé')
}

/** Une compétence n'est réellement validée que si toutes ses sous-compétences le sont. */
export function isCompetencyEffectivelyValidated(entry, competency) {
  if (!entry?.validated) return false
  if (!competency?.items?.length) return Boolean(entry.validated)
  return areAllSubCompetenciesValidated(competency)
}

export function buildEffectiveUnlockState(unlockState, remcCompetencies = []) {
  if (!unlockState) return unlockState

  const byCode = Object.fromEntries(remcCompetencies.map((row) => [row.code, row]))
  const effective = {}

  REMC_COMPETENCY_ORDER.forEach((code) => {
    const entry = unlockState[code] || { ...emptyEntry(), unlocked: code === 'C1' }
    const competency = byCode[code]
    const validated = isCompetencyEffectivelyValidated(entry, competency)

    effective[code] = {
      ...entry,
      validated,
      validatedAt: validated ? entry.validatedAt : null,
      validatedBy: validated ? entry.validatedBy : null,
      teacherName: validated ? entry.teacherName : null,
    }
  })

  REMC_COMPETENCY_ORDER.forEach((code, index) => {
    if (index === 0) {
      effective[code].unlocked = true
      return
    }
    const previous = REMC_COMPETENCY_ORDER[index - 1]
    effective[code].unlocked = Boolean(effective[previous].validated)
  })

  return effective
}

export function computeGlobalRemcProgress(unlockState, remcCompetencies = []) {
  const state = remcCompetencies.length
    ? buildEffectiveUnlockState(unlockState, remcCompetencies)
    : unlockState
  const validated = REMC_COMPETENCY_ORDER.filter((code) => state?.[code]?.validated).length
  return Math.round((validated / REMC_COMPETENCY_ORDER.length) * 100)
}

/** Valide ou révoque C1–C4 selon l'état réel des sous-compétences locales. */
export async function syncAutoCompetencyValidations({
  studentId,
  organizationId,
  teacherId,
  remcCompetencies = [],
  unlockState,
}) {
  if (!studentId || !organizationId || !teacherId) {
    return { unlockState, error: null }
  }

  let latestState = unlockState
  let changed = false

  for (const competency of remcCompetencies) {
    const code = competency.code
    if (!REMC_COMPETENCY_ORDER.includes(code)) continue
    if (!latestState?.[code]?.validated) continue
    if (areAllSubCompetenciesValidated(competency)) continue

    const { unlockState: nextState } = await revokeCompetencyValidation({ studentId, competencyCode: code })
    if (nextState) {
      latestState = nextState
      changed = true
    }
    break
  }

  for (const competency of remcCompetencies) {
    const code = competency.code
    if (!REMC_COMPETENCY_ORDER.includes(code)) continue
    if (latestState?.[code]?.validated) continue
    if (!areAllSubCompetenciesValidated(competency)) continue
    if (!latestState?.[code]?.unlocked && code !== 'C1') continue

    const { unlockState: nextState } = await validateCompetency({
      studentId,
      organizationId,
      competencyCode: code,
      teacherId,
    })
    if (nextState) {
      latestState = nextState
      changed = true
    }
  }

  if (changed) {
    return fetchCompetencyValidations(studentId)
  }

  return { unlockState: latestState, error: null }
}

export async function resolveStudentRecordId(profileId) {
  if (!profileId) return null
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle()
    if (error) throw error
    return data?.id ?? null
  } catch (error) {
    console.warn('[remcProgress] resolveStudentRecordId', {
      profileId,
      message: error?.message,
      code: error?.code,
    })
    return null
  }
}

export async function fetchCompetencyValidations(studentId) {
  if (!studentId) {
    return { validations: [], unlockState: buildUnlockState([]), error: null }
  }

  try {
    const { data, error } = await supabase
      .from('student_competency_validations')
      .select(`
        competency_code,
        validated_at,
        validated_by,
        validated_by_profile:validated_by(full_name)
      `)
      .eq('student_id', studentId)
      .order('competency_code', { ascending: true })

    if (error) throw error

    const validations = data || []
    const unlockState = buildUnlockState(validations)
    return { validations, unlockState, error: null }
  } catch (error) {
    return {
      validations: [],
      unlockState: buildUnlockState([]),
      error,
    }
  }
}

export async function validateCompetency({ studentId, organizationId, competencyCode, teacherId }) {
  if (!studentId || !organizationId || !competencyCode || !teacherId) {
    return { unlockState: null, error: new Error('Paramètres manquants.') }
  }

  const row = {
    organization_id: organizationId,
    student_id: studentId,
    competency_code: competencyCode,
    validated_at: new Date().toISOString(),
    validated_by: teacherId,
  }

  try {
    const { error } = await supabase
      .from('student_competency_validations')
      .upsert(row, { onConflict: 'student_id,competency_code' })
    if (error) throw error
  } catch (error) {
    return { unlockState: null, error }
  }

  return fetchCompetencyValidations(studentId)
}

export async function revokeCompetencyValidation({ studentId, competencyCode }) {
  if (!studentId || !competencyCode) {
    return { unlockState: null, error: new Error('Paramètres manquants.') }
  }

  const startIndex = REMC_COMPETENCY_ORDER.indexOf(competencyCode)
  const codesToRevoke = startIndex >= 0 ? REMC_COMPETENCY_ORDER.slice(startIndex) : [competencyCode]

  try {
    const { error } = await supabase
      .from('student_competency_validations')
      .delete()
      .eq('student_id', studentId)
      .in('competency_code', codesToRevoke)
    if (error) throw error
  } catch (error) {
    return { unlockState: null, error }
  }

  return fetchCompetencyValidations(studentId)
}

/** C1 est toujours accessible sans validation préalable. */
export function isCompetencyUnlockedCode(code, unlockState = DEFAULT_UNLOCK_STATE) {
  if (code === 'C1') return true
  return Boolean(unlockState?.[code]?.unlocked)
}

export function competencyStatusIcon(entry, code, competency = null) {
  const validated = competency
    ? isCompetencyEffectivelyValidated(entry, competency)
    : Boolean(entry?.validated)
  if (validated) return '✅'
  if (!isCompetencyUnlockedCode(code, entry ? { ...DEFAULT_UNLOCK_STATE, [code]: entry } : DEFAULT_UNLOCK_STATE)) {
    return '🔒'
  }
  return null
}
