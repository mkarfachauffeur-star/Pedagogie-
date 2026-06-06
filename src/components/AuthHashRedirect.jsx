import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { hasAuthHash, logAuthHash } from '../lib/authHashParams'

/**
 * Si Supabase redirige vers la racine (Site URL) avec un fragment auth,
 * renvoie vers /accept-invite en conservant le hash pour traitement.
 */
export default function AuthHashRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.pathname === '/accept-invite') return
    if (!hasAuthHash()) return

    logAuthHash('AuthHashRedirect')
    navigate(`/accept-invite${window.location.hash}`, { replace: true })
  }, [location.pathname, navigate])

  return null
}
