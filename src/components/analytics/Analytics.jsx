import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getGaMeasurementId,
  initGoogleAnalytics,
  trackPageView,
} from '../../lib/gtag'

/**
 * Google Analytics 4 — React Router / Vite (Pedagogia Drive).
 *
 * Next.js App Router : placer dans `app/layout.jsx` avec `next/script` et
 * `NEXT_PUBLIC_GA_MEASUREMENT_ID` (voir commentaire dans `src/lib/gtag.js`).
 */
export default function Analytics({ measurementId } = {}) {
  const location = useLocation()
  const gaId = measurementId || getGaMeasurementId()

  useEffect(() => {
    if (!gaId) return
    initGoogleAnalytics(gaId)
  }, [gaId])

  useEffect(() => {
    if (!gaId) return
    const pagePath = `${location.pathname}${location.search}${location.hash}`
    trackPageView(pagePath, gaId)
  }, [gaId, location.pathname, location.search, location.hash])

  return null
}
