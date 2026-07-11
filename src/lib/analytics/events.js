import { trackGtagEvent } from '../gtag'
import { trackOnce, trackOrgOnce, trackUserOnce } from './once'

export function trackEvent(eventName, params = {}) {
  trackGtagEvent(eventName, params)
}

// ——— Marketing (conservés pour compatibilité) ———

export function trackDemoRequestClick(source = 'unknown') {
  trackEvent('demo_request_click', { source })
}

export function trackDemoFormSubmit() {
  trackEvent('demo_form_submit')
}

export function trackBookDemo(params = {}) {
  trackEvent('book_demo', params)
}

export function trackLogin(role) {
  trackEvent('login', { method: 'password', role: role || 'unknown' })
}

/** @deprecated Préférer trackSignUp — conservé pour compatibilité. */
export function trackOrganizationCreated(organizationId) {
  trackEvent('organization_created', { organization_id: organizationId || undefined })
}

// ——— Inscription & essai ———

export function trackSignUp({ organizationName, organizationId, planSelected }) {
  if (!organizationId) return
  trackOrgOnce(organizationId, 'sign_up', {
    organization_name: organizationName || undefined,
    organization_id: organizationId,
    plan_selected: planSelected || 'starter',
  })
}

export function trackBeginTrial({ organizationId, plan = 'starter', trialDays = 30 } = {}) {
  if (!organizationId) return
  trackOrgOnce(organizationId, 'begin_trial', {
    organization_id: organizationId,
    plan,
    trial_days: trialDays,
  })
}

// ——— Connexion ———

export function trackFirstLogin(userId, role) {
  if (!userId) return false
  return trackUserOnce(userId, 'first_login', { method: 'password', role: role || 'unknown' })
}

// ——— Abonnement ———

export function trackPurchase({
  organizationId,
  subscriptionPlan,
  amount,
  currency = 'EUR',
  billingCycle = 'monthly',
} = {}) {
  const numericAmount = amount != null ? Number(amount) : undefined
  trackEvent('purchase', {
    organization_id: organizationId || undefined,
    subscription_plan: subscriptionPlan || undefined,
    amount: numericAmount,
    value: numericAmount,
    currency,
    billing_cycle: billingCycle,
  })
}

export function trackSubscriptionRenewed({ organizationId, subscriptionPlan } = {}) {
  trackEvent('subscription_renewed', {
    organization_id: organizationId || undefined,
    subscription_plan: subscriptionPlan || undefined,
  })
}

export function trackSubscriptionCancelled({ organizationId, subscriptionPlan } = {}) {
  trackEvent('subscription_cancelled', {
    organization_id: organizationId || undefined,
    subscription_plan: subscriptionPlan || undefined,
  })
}

export function trackDeleteAccount({ organizationId, userId, scope = 'user' } = {}) {
  trackEvent('delete_account', {
    organization_id: organizationId || undefined,
    user_id: userId || undefined,
    scope,
  })
}

export function trackContactFormSubmit(params = {}) {
  trackEvent('contact_form_submit', params)
}

// ——— Rappels automatiques ———

export function trackAutomaticNotificationSent(params = {}) {
  trackOnce('automatic_notification_sent', 'automatic_notification_sent', params)
}

// ——— Exports ———

export function trackExportCsv(organizationId, exportType) {
  if (!organizationId) return false
  return trackOrgOnce(organizationId, 'export_csv', { export_type: exportType || undefined })
}

export function trackExportExcel(organizationId, exportType) {
  if (!organizationId) return false
  return trackOrgOnce(organizationId, 'export_excel', { export_type: exportType || undefined })
}

export function trackExportPdf(organizationId, exportType) {
  if (!organizationId) return false
  return trackOrgOnce(organizationId, 'export_pdf', { export_type: exportType || undefined })
}
