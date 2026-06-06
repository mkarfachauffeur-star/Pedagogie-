import { Navigate, useLocation } from 'react-router-dom'
import LoadingSpinner from './ui/LoadingSpinner'
import { useStudentTrack } from '../hooks/useStudentTrack'
import { useAuth } from '../context/AuthContext'
import { isPermisBOnlyRoute } from '../lib/studentTrack'

export default function StudentTrackRoute({ children }) {
  const { profileId } = useAuth()
  const location = useLocation()
  const { track, loading } = useStudentTrack(profileId)

  if (loading) {
    return <LoadingSpinner label="Chargement de votre parcours…" />
  }

  if (track === 'moto_am' && isPermisBOnlyRoute(location.pathname)) {
    return <Navigate to="/student/dashboard" replace />
  }

  if (track === 'permis_b' && location.pathname === '/student/next-lesson') {
    return <Navigate to="/student/planning" replace />
  }

  if (!isPermisB && location.pathname === '/student/initial-assessment') {
    return <Navigate to="/student/dashboard" replace />
  }

  return children
}
