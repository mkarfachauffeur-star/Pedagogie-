import { useCallback, useEffect, useState } from 'react'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import StudentReviewScreen from './StudentReviewScreen'
import { fetchStudentReviewStatus } from '../../services/studentReviews'
import { getUserFacingError } from '../../lib/userFacingError'

const REVIEW_LATER_KEY = 'pd-review-later'

function hasPostponedReview() {
  try {
    return window.sessionStorage.getItem(REVIEW_LATER_KEY) === '1'
  } catch {
    return false
  }
}

function postponeReview() {
  try {
    window.sessionStorage.setItem(REVIEW_LATER_KEY, '1')
  } catch {
    // ignore
  }
}

export default function StudentReviewGate({ children }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [postponed, setPostponed] = useState(hasPostponedReview)

  const applyResult = useCallback((nextStatus, fetchError) => {
    setStatus(nextStatus)
    setError(fetchError)
    setLoading(false)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { status: nextStatus, error: fetchError } = await fetchStudentReviewStatus()
    applyResult(nextStatus, fetchError)
  }, [applyResult])

  useEffect(() => {
    let cancelled = false
    fetchStudentReviewStatus().then(({ status: nextStatus, error: fetchError }) => {
      if (cancelled) return
      applyResult(nextStatus, fetchError)
    })
    return () => {
      cancelled = true
    }
  }, [applyResult])

  if (loading) {
    return <LoadingSpinner label="Vérification de votre avis…" />
  }

  if (error && !postponed) {
    return (
      <div className="px-4 py-8">
        <EmptyState
          className="border-amber-200 bg-amber-50/80"
          icon="⭐"
          message={getUserFacingError(error, 'load') || 'Impossible de vérifier si un avis est requis.'}
          title="Avis temporairement indisponible"
          action={(
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <button className="pd-btn-secondary" onClick={refresh} type="button">
                Réessayer
              </button>
              <button
                className="pd-btn-primary"
                onClick={() => {
                  postponeReview()
                  setPostponed(true)
                }}
                type="button"
              >
                Continuer
              </button>
            </div>
          )}
        />
      </div>
    )
  }

  if (status?.needsReview && !postponed) {
    return (
      <StudentReviewScreen
        onCompleted={refresh}
        onLater={() => {
          postponeReview()
          setPostponed(true)
        }}
      />
    )
  }

  return children
}
