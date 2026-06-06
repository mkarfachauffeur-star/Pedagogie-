import { useCallback, useEffect, useMemo, useState } from 'react'
import { subscribePostgresChanges } from '../services/realtime'
import {
  DEFAULT_UNLOCK_STATE,
  computeGlobalRemcProgress,
  fetchCompetencyValidations,
  isCompetencyUnlockedCode,
  resolveStudentRecordId,
} from '../services/remcProgress'

export function useRemcUnlock(profileId) {
  const [studentId, setStudentId] = useState(null)
  const [unlockState, setUnlockState] = useState(DEFAULT_UNLOCK_STATE)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!profileId) {
      setStudentId(null)
      setUnlockState(DEFAULT_UNLOCK_STATE)
      setLoading(false)
      return
    }
    setLoading(true)
    const resolvedId = await resolveStudentRecordId(profileId)
    setStudentId(resolvedId)
    const { unlockState: nextState } = await fetchCompetencyValidations(resolvedId)
    setUnlockState(nextState || DEFAULT_UNLOCK_STATE)
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!studentId) return undefined
    return subscribePostgresChanges({
      topicBase: `remc-unlock:${studentId}`,
      listeners: [
        {
          config: {
            event: '*',
            schema: 'public',
            table: 'student_competency_validations',
            filter: `student_id=eq.${studentId}`,
          },
          callback: refresh,
        },
      ],
    })
  }, [studentId, refresh])

  const effectiveUnlockState = unlockState || DEFAULT_UNLOCK_STATE

  const globalProgress = useMemo(
    () => computeGlobalRemcProgress(effectiveUnlockState),
    [effectiveUnlockState],
  )

  const isCompetencyUnlocked = useCallback(
    (code) => isCompetencyUnlockedCode(code, effectiveUnlockState),
    [effectiveUnlockState],
  )

  const isCompetencyValidated = useCallback(
    (code) => Boolean(effectiveUnlockState[code]?.validated),
    [effectiveUnlockState],
  )

  return {
    studentId,
    unlockState: effectiveUnlockState,
    loading,
    globalProgress,
    refresh,
    isCompetencyUnlocked,
    isCompetencyValidated,
  }
}
