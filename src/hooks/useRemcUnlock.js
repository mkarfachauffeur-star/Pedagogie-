import { useCallback, useEffect, useMemo, useState } from 'react'
import { computeRemcProgress } from '../data/remcTemplate'
import { fetchRemcProgress, subscribeRemcProgress } from '../services/remcItems'
import {
  DEFAULT_UNLOCK_STATE,
  buildEffectiveUnlockState,
  computeGlobalRemcProgress,
  fetchCompetencyValidations,
  isCompetencyUnlockedCode,
  resolveStudentRecordId,
} from '../services/remcProgress'
import { useAuth } from '../context/AuthContext'

export function useRemcUnlock(profileId) {
  const { organizationId } = useAuth()
  const [studentId, setStudentId] = useState(null)
  const [unlockState, setUnlockState] = useState(DEFAULT_UNLOCK_STATE)
  const [remc, setRemc] = useState([])
  const [itemProgress, setItemProgress] = useState(() => computeRemcProgress([]))
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!profileId) {
      setStudentId(null)
      setUnlockState(DEFAULT_UNLOCK_STATE)
      setRemc([])
      setItemProgress(computeRemcProgress([]))
      setLoading(false)
      return
    }

    setLoading(true)
    const resolvedId = await resolveStudentRecordId(profileId)
    setStudentId(resolvedId)

    const [{ unlockState: nextState }, { remc: nextRemc, progress: nextItemProgress }] =
      await Promise.all([
        fetchCompetencyValidations(resolvedId),
        fetchRemcProgress(resolvedId, { organizationId }),
      ])

    setUnlockState(nextState || DEFAULT_UNLOCK_STATE)
    setRemc(nextRemc || [])
    setItemProgress(nextItemProgress || computeRemcProgress([]))
    setLoading(false)
  }, [profileId, organizationId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!studentId) return undefined
    return subscribeRemcProgress(studentId, refresh)
  }, [studentId, refresh])

  const effectiveUnlockState = useMemo(
    () => buildEffectiveUnlockState(unlockState, remc),
    [unlockState, remc],
  )

  const globalProgress = useMemo(() => {
    const competencyProgress = computeGlobalRemcProgress(effectiveUnlockState, remc)
    const subProgress = itemProgress?.global || 0
    return Math.max(competencyProgress, subProgress)
  }, [effectiveUnlockState, remc, itemProgress])

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
    remc,
    itemProgress,
    loading,
    globalProgress,
    refresh,
    isCompetencyUnlocked,
    isCompetencyValidated,
  }
}
