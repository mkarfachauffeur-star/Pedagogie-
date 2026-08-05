import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Réinitialise le scroll à chaque navigation, y compris
 * quand seule la query-string change (?student=...).
 */
export default function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    const scrollNow = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0
      document.body.scrollTop = 0
      document.documentElement.scrollTop = 0
    }

    scrollNow()
    const raf = window.requestAnimationFrame(scrollNow)
    return () => window.cancelAnimationFrame(raf)
  }, [location.pathname, location.search, location.hash])

  return null
}
