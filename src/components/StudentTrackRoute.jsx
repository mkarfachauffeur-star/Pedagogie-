import { Navigate, useLocation } from 'react-router-dom'
import LoadingSpinner from './ui/LoadingSpinner'
import { useStudentTrack } from '../hooks/useStudentTrack'
import { useAuth } from '../context/AuthContext'
import { isPermisBOnlyRoute, isPermisBStudent, STUDENT_TRACKS } from '../lib/studentTrack'

export default function StudentTrackRoute({ children }) {
  const { profileId } = useAuth()
  const location = useLocation()
  const { track, loading, student } = useStudentTrack(profileId)
  const isPermisB = isPermisBStudent(student)

  if (loading) {
    return <LoadingSpinner label="Chargement de votre parcours…" />
  }

  if (import.meta.env.DEV) {
    console.debug('[StudentTrackRoute]', {
      profileId,
      pathname: location.pathname,
      track,
      isPermisB,
      studentId: student?.id ?? null,
    })
  }

  if (track === STUDENT_TRACKS.MOTO_AM && isPermisBOnlyRoute(location.pathname)) {
    return <Navigate to="/student/dashboard" replace />
  }

  if (track === STUDENT_TRACKS.PERMIS_B && location.pathname === '/student/next-lesson') {
    return <Navigate to="/student/planning" replace />
  }

  if (!isPermisB && location.pathname === '/student/initial-assessment') {
    return <Navigate to="/student/dashboard" replace />
  }

  return children
}
