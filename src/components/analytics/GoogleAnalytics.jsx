import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initGoogleAnalytics, trackPageView } from '../../lib/analytics'

export default function GoogleAnalytics() {
  const location = useLocation()

  useEffect(() => {
    initGoogleAnalytics()
  }, [])

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}${location.hash}`
    trackPageView(pagePath)
  }, [location.pathname, location.search, location.hash])

  return null
}
