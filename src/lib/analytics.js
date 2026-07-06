export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-2F56CZDDBQ'

let initialized = false

function hasGtag() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

export function initGoogleAnalytics() {
  if (!import.meta.env.PROD || initialized || !GA_MEASUREMENT_ID) return

  initialized = true

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }

  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
}

export function trackPageView(pagePath) {
  if (!import.meta.env.PROD || !hasGtag()) return

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export function trackEvent(eventName, params = {}) {
  if (!import.meta.env.PROD || !hasGtag()) return
  window.gtag('event', eventName, params)
}

export function trackDemoRequestClick(source = 'unknown') {
  trackEvent('demo_request_click', { source })
}

export function trackDemoFormSubmit() {
  trackEvent('demo_form_submit')
}

export function trackLogin(role) {
  trackEvent('login', { method: 'password', role: role || 'unknown' })
}

export function trackOrganizationCreated(organizationId) {
  trackEvent('organization_created', { organization_id: organizationId || undefined })
}
