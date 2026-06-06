import { supabase } from '../lib/supabase'
import { DEMO_PROFILE_IDS, DEMO_STUDENT, isDemoStudentId } from '../data/demoPracticeExam'
import { REMC_COMPETENCY_ORDER } from '../data/remcCompetencies'

function storageKey(studentId) {
  return `pedagogia:remc-competency:${studentId}`
}

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

export function computeGlobalRemcProgress(unlockState) {
  const validated = REMC_COMPETENCY_ORDER.filter((code) => unlockState[code]?.validated).length
  return Math.round((validated / REMC_COMPETENCY_ORDER.length) * 100)
}

function readLocalValidations(studentId) {
  if (!studentId || typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(studentId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalValidations(studentId, validations) {
  if (!studentId || typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(studentId), JSON.stringify(validations))
}

export async function resolveStudentRecordId(profileId) {
  if (!profileId) return null
  if (profileId === DEMO_PROFILE_IDS.student) return DEMO_STUDENT.id
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle()
    if (error) throw error
    return data?.id || profileId
  } catch {
    return profileId
  }
}

export async function fetchCompetencyValidations(studentId) {
  if (!studentId) {
    return { validations: [], unlockState: buildUnlockState([]), error: null }
  }

  if (isDemoStudentId(studentId)) {
    const rows = readLocalValidations(studentId)
    return { validations: rows, unlockState: buildUnlockState(rows), error: null }
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
    if (validations.length) {
      writeLocalValidations(studentId, validations)
    }

    const rows = validations.length ? validations : readLocalValidations(studentId)
    const unlockState = buildUnlockState(rows)
    return { validations: rows, unlockState, error: null }
  } catch (error) {
    const rows = readLocalValidations(studentId)
    return {
      validations: rows,
      unlockState: buildUnlockState(rows),
      error,
    }
  }
}

export async function validateCompetency({ studentId, organizationId, competencyCode, teacherId }) {
  if (!studentId || !organizationId || !competencyCode || !teacherId) {
    return { unlockState: null, error: new Error('Paramètres manquants.') }
  }

  const validatedAt = new Date().toISOString()
  const row = {
    organization_id: organizationId,
    student_id: studentId,
    competency_code: competencyCode,
    validated_at: validatedAt,
    validated_by: teacherId,
  }

  if (isDemoStudentId(studentId)) {
    const local = readLocalValidations(studentId).filter((item) => item.competency_code !== competencyCode)
    local.push({ ...row, validated_by_profile: { full_name: 'Enseignant démo' } })
    writeLocalValidations(studentId, local)
    return { unlockState: buildUnlockState(local), error: null }
  }

  try {
    const { error } = await supabase
      .from('student_competency_validations')
      .upsert(row, { onConflict: 'student_id,competency_code' })
    if (error) throw error
  } catch (error) {
    const local = readLocalValidations(studentId).filter((item) => item.competency_code !== competencyCode)
    local.push({ ...row, validated_by_profile: null })
    writeLocalValidations(studentId, local)
    return { unlockState: buildUnlockState(local), error }
  }

  return fetchCompetencyValidations(studentId)
}

export async function revokeCompetencyValidation({ studentId, competencyCode }) {
  if (!studentId || !competencyCode) {
    return { unlockState: null, error: new Error('Paramètres manquants.') }
  }

  const startIndex = REMC_COMPETENCY_ORDER.indexOf(competencyCode)
  const codesToRevoke = startIndex >= 0 ? REMC_COMPETENCY_ORDER.slice(startIndex) : [competencyCode]

  if (isDemoStudentId(studentId)) {
    const local = readLocalValidations(studentId).filter(
      (item) => !codesToRevoke.includes(item.competency_code),
    )
    writeLocalValidations(studentId, local)
    return { unlockState: buildUnlockState(local), error: null }
  }

  try {
    const { error } = await supabase
      .from('student_competency_validations')
      .delete()
      .eq('student_id', studentId)
      .in('competency_code', codesToRevoke)
    if (error) throw error
  } catch (error) {
    const local = readLocalValidations(studentId).filter(
      (item) => !codesToRevoke.includes(item.competency_code),
    )
    writeLocalValidations(studentId, local)
    return { unlockState: buildUnlockState(local), error }
  }

  return fetchCompetencyValidations(studentId)
}

/** C1 est toujours accessible sans validation préalable. */
export function isCompetencyUnlockedCode(code, unlockState = DEFAULT_UNLOCK_STATE) {
  if (code === 'C1') return true
  return Boolean(unlockState?.[code]?.unlocked)
}

export function competencyStatusIcon(entry, code) {
  if (entry?.validated) return '✅'
  if (!isCompetencyUnlockedCode(code, entry ? { ...DEFAULT_UNLOCK_STATE, [code]: entry } : DEFAULT_UNLOCK_STATE)) {
    return '🔒'
  }
  return null
}
