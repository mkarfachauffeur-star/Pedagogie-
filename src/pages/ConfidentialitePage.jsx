import { Navigate } from 'react-router-dom'

/** Redirection SEO — ancienne URL /confidentialite */
export default function ConfidentialitePage() {
  return <Navigate replace to="/politique-confidentialite" />
}
