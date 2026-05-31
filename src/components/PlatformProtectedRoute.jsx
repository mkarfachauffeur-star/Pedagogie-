import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './ui/LoadingSpinner'

export default function PlatformProtectedRoute({ children }) {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner label="Vérification accès plateforme…" />
  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
