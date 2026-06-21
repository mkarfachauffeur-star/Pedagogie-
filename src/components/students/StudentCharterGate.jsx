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

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { status: nextStatus, error: fetchError } = await fetchStudentCharterStatus()
    setStatus(nextStatus)
    setError(fetchError)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return <LoadingSpinner label="Chargement de la charte d'engagement…" />
  }

  if (error || !status) {
    return (
      <EmptyState
        className="border-amber-200 bg-amber-50/80"
        icon="📜"
        message={getUserFacingError(error, 'load') || 'Impossible de vérifier l\'acceptation de la charte d\'engagement.'}
        title="Charte d'engagement indisponible"
      />
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
