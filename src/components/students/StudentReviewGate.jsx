import { useCallback, useEffect, useState } from 'react'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import StudentReviewScreen from './StudentReviewScreen'
import { fetchStudentReviewStatus } from '../../services/studentReviews'
import { getUserFacingError } from '../../lib/userFacingError'

export default function StudentReviewGate({ children }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { status: nextStatus, error: fetchError } = await fetchStudentReviewStatus()
    setStatus(nextStatus)
    setError(fetchError)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return <LoadingSpinner label="Vérification de votre avis…" />
  }

  if (error) {
    return (
      <EmptyState
        className="border-amber-200 bg-amber-50/80"
        icon="⭐"
        message={getUserFacingError(error, 'load') || 'Impossible de vérifier si un avis est requis.'}
        title="Avis utilisateur indisponible"
      />
    )
  }

  if (status?.needsReview) {
    return <StudentReviewScreen onCompleted={refresh} />
  }

  return children
}
