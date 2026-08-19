import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Réinitialise le scroll à chaque changement de page ou de query,
 * et suit les ancres (#section) au lieu de les écraser.
 */
export default function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1))
      const scrollToHash = () => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      const raf = window.requestAnimationFrame(scrollToHash)
      const timer = window.setTimeout(scrollToHash, 80)
      return () => {
        window.cancelAnimationFrame(raf)
        window.clearTimeout(timer)
      }
    }

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
