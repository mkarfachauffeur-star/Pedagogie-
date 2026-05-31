import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roleDestinations } from '../utils/authSession'
import LoadingSpinner from './ui/LoadingSpinner'

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, role: currentRole, loading, isSuperAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner label="Vérification de votre accès…" />
  }

  if (!isAuthenticated || !currentRole) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (isSuperAdmin && role && role !== 'super_admin') {
    return <Navigate to="/platform/dashboard" replace />
  }

  if (role && currentRole !== role) {
    const destination = roleDestinations[currentRole] || '/login'
    return <Navigate to={destination} replace />
  }

  return children
}
