import { useCallback, useEffect, useMemo, useState } from 'react'
import { computeRemcProgress } from '../data/remcTemplate'
import {
  fetchRemcHistory,
  fetchRemcProgress,
  subscribeRemcProgress,
  updateRemcItemStatus,
} from '../services/remcItems'
import { syncAutoCompetencyValidations } from '../services/remcProgress'

export function useStudentRemcProgress(studentId, { organizationId, teacherId } = {}) {
  const [remc, setRemc] = useState([])
  const [progress, setProgress] = useState(() => computeRemcProgress([]))
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!studentId) {
      setRemc([])
      setProgress(computeRemcProgress([]))
      setHistory([])
      setLoading(false)
      return
    }

    setLoading(true)
    const [{ remc: nextRemc, progress: nextProgress, error: fetchError }, { history: nextHistory }] =
      await Promise.all([
        fetchRemcProgress(studentId, { organizationId, updatedBy: teacherId }),
        fetchRemcHistory(studentId, { limit: 50 }),
      ])

    setRemc(nextRemc)
    setProgress(nextProgress)
    setHistory(nextHistory)
    setError(fetchError)
    setLoading(false)
  }, [studentId, organizationId, teacherId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!studentId) return undefined
    return subscribeRemcProgress(studentId, refresh)
  }, [studentId, refresh])

  const updateStatus = useCallback(
    async (competencyCode, itemId, status) => {
      if (!studentId || !organizationId) return { error: new Error('Contexte manquant.') }

      const { remc: nextRemc, error: updateError } = await updateRemcItemStatus({
        studentId,
        organizationId,
        competencyCode,
        itemId,
        status,
        updatedBy: teacherId,
      })

      if (updateError) return { error: updateError }

      let syncedRemc = nextRemc
      if (teacherId && nextRemc?.length) {
        const { unlockState } = await syncAutoCompetencyValidations({
          studentId,
          organizationId,
          teacherId,
          remcCompetencies: nextRemc,
        })
        if (unlockState) {
          // refresh après sync C1–C4
          await refresh()
          return { remc: nextRemc, unlockState, error: null }
        }
      }

      if (syncedRemc) {
        setRemc(syncedRemc)
        setProgress(computeRemcProgress(syncedRemc))
      }
      await refresh()
      return { remc: syncedRemc, error: null }
    },
    [studentId, organizationId, teacherId, refresh],
  )

  const remcByCode = useMemo(
    () => Object.fromEntries((remc || []).map((row) => [row.code, row])),
    [remc],
  )

  return {
    remc,
    remcByCode,
    progress,
    history,
    loading,
    error,
    refresh,
    updateStatus,
  }
}
