import { GA_MEASUREMENT_ID, trackGtagEvent } from './gtag'

export { GA_MEASUREMENT_ID, getGaMeasurementId, getGaScriptSrc } from './gtag'

export function trackEvent(eventName, params = {}) {
  trackGtagEvent(eventName, params)
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
