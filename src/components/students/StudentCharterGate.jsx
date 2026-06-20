import { useCallback, useEffect, useState } from 'react'
import LoadingSpinner from '../ui/LoadingSpinner'
import StudentCharterAcceptanceScreen from './StudentCharterAcceptanceScreen'
import { fetchStudentCharterStatus } from '../../services/studentCharter'

export default function StudentCharterGate({ children }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { status: nextStatus } = await fetchStudentCharterStatus()
    setStatus(nextStatus)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return <LoadingSpinner label="Chargement de la charte d'engagement…" />
  }

  if (status?.needsAcceptance && status?.charter) {
    return (
      <StudentCharterAcceptanceScreen
        charter={status.charter}
        onAccepted={refresh}
      />
    )
  }

  return children
}
