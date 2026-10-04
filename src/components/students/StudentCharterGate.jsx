import { useCallback, useEffect, useState } from 'react'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import StudentCharterAcceptanceScreen from './StudentCharterAcceptanceScreen'
import { fetchStudentCharterStatus } from '../../services/studentCharter'
import { getUserFacingError } from '../../lib/userFacingError'

export default function StudentCharterGate({ children }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const applyResult = useCallback((nextStatus, fetchError) => {
    setStatus(nextStatus)
    setError(fetchError)
    setLoading(false)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { status: nextStatus, error: fetchError } = await fetchStudentCharterStatus()
    applyResult(nextStatus, fetchError)
  }, [applyResult])

  useEffect(() => {
    let cancelled = false
    fetchStudentCharterStatus().then(({ status: nextStatus, error: fetchError }) => {
      if (cancelled) return
      applyResult(nextStatus, fetchError)
    })
    return () => {
      cancelled = true
    }
  }, [applyResult])

  if (loading) {
    return <LoadingSpinner label="Chargement de la charte d'engagement…" />
  }

  if (error || !status) {
    return (
      <div className="px-4 py-8">
        <EmptyState
          className="border-amber-200 bg-amber-50/80"
          icon="📜"
          message={getUserFacingError(error, 'load') || 'Impossible de vérifier l\'acceptation de la charte d\'engagement.'}
          title="Charte d'engagement indisponible"
          action={(
            <button className="pd-btn-primary mt-2" onClick={refresh} type="button">
              Réessayer
            </button>
          )}
        />
      </div>
    )
  }

  if (status.needsAcceptance && status.charter) {
    return (
      <StudentCharterAcceptanceScreen
        charter={status.charter}
        onAccepted={refresh}
      />
    )
  }

  return children
}
