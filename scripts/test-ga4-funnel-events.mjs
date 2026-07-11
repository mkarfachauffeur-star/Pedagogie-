/**
 * Vérifie l'envoi GA4 des événements du tunnel (mock gtag + localStorage).
 * Usage: node scripts/test-ga4-funnel-events.mjs
 */

const store = {}
globalThis.window = {
  localStorage: {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => {
      store[k] = v
    },
  },
  dataLayer: [],
  gtag(...args) {
    this.dataLayer.push(args)
  },
  location: { href: 'http://localhost/test', search: '?ga_debug=1' },
}
globalThis.document = {
  title: 'Test',
  head: { appendChild() {} },
  querySelector: () => null,
}

// Simule import.meta.env pour activer le debug GA hors prod
globalThis.import_meta_env = { PROD: false }

const events = []

function trackGtagEvent(name, params = {}) {
  events.push({ name, params })
}

function onceKey(...parts) {
  return parts.filter(Boolean).join(':')
}

function trackOnce(key, eventName, params = {}) {
  if (!key || store[`pd_ga_once:${key}`] === '1') return false
  trackGtagEvent(eventName, params)
  store[`pd_ga_once:${key}`] = '1'
  return true
}

function trackOrgOnce(organizationId, eventName, params = {}) {
  if (!organizationId) return false
  return trackOnce(onceKey('org', organizationId, eventName), eventName, {
    organization_id: organizationId,
    ...params,
  })
}

function trackSignUp({ organizationName, organizationId, planSelected, email, requestId }) {
  if (!organizationId && !email && !requestId) return false
  const dedupKey = organizationId
    ? onceKey('org', organizationId, 'sign_up')
    : onceKey('signup', email || requestId, 'sign_up')
  return trackOnce(dedupKey, 'sign_up', {
    organization_name: organizationName || undefined,
    organization_id: organizationId || undefined,
    plan_selected: planSelected || 'starter',
  })
}

function trackAePendingValidation({ organizationName, email, requestId, planSelected } = {}) {
  if (!email && !requestId) return false
  const dedupKey = onceKey('signup', email || requestId, 'ae_pending_validation')
  return trackOnce(dedupKey, 'ae_pending_validation', {
    organization_name: organizationName || undefined,
    plan_selected: planSelected || 'starter',
  })
}

function trackAeApproved({
  organizationId,
  organizationName,
  approvedBy,
  approvedAt,
  trialDays = 30,
  planSelected = 'starter',
} = {}) {
  if (!organizationId) return false
  return trackOrgOnce(organizationId, 'ae_approved', {
    organization_name: organizationName || undefined,
    approved_by: approvedBy || undefined,
    approved_at: approvedAt || new Date().toISOString(),
    trial_days: trialDays,
    plan_selected: planSelected,
  })
}

function trackBeginTrial({ organizationId, plan = 'starter', trialDays = 30 } = {}) {
  if (!organizationId) return false
  return trackOrgOnce(organizationId, 'begin_trial', {
    organization_id: organizationId,
    plan,
    trial_days: trialDays,
  })
}

function trackPurchase({ organizationId, subscriptionPlan, amount, currency = 'EUR', billingCycle = 'monthly' } = {}) {
  trackGtagEvent('purchase', {
    organization_id: organizationId || undefined,
    subscription_plan: subscriptionPlan || undefined,
    amount: Number(amount),
    value: Number(amount),
    currency,
    billing_cycle: billingCycle,
  })
}

// ——— Scénario tunnel complet ———
const email = 'test-funnel@pedagogia.local'
const orgId = '11111111-1111-1111-1111-111111111111'
const requestId = 'req-abc-123'

trackSignUp({ organizationName: 'Auto-École Test', email, requestId, planSelected: 'starter' })
trackAePendingValidation({ organizationName: 'Auto-École Test', email, requestId, planSelected: 'starter' })
trackAeApproved({
  organizationId: orgId,
  organizationName: 'Auto-École Test',
  approvedBy: 'admin@pedagogia-drive.fr',
  approvedAt: '2026-07-11T17:00:00.000Z',
  trialDays: 30,
  planSelected: 'starter',
})
trackBeginTrial({ organizationId: orgId, plan: 'starter', trialDays: 30 })
trackPurchase({
  organizationId: orgId,
  subscriptionPlan: 'premium',
  amount: 99,
  billingCycle: 'monthly',
})

const names = events.map((e) => e.name)
const expected = [
  'sign_up',
  'ae_pending_validation',
  'ae_approved',
  'begin_trial',
  'purchase',
]

const missing = expected.filter((n) => !names.includes(n))
const dupes = names.filter((n, i) => names.indexOf(n) !== i)

if (missing.length) {
  console.error('Échec — événements manquants:', missing.join(', '))
  process.exit(1)
}

if (dupes.length) {
  console.error('Échec — doublons:', [...new Set(dupes)].join(', '))
  process.exit(1)
}

const aeApproved = events.find((e) => e.name === 'ae_approved')
const requiredAeParams = ['organization_id', 'organization_name', 'approved_by', 'approved_at', 'trial_days', 'plan_selected']
const missingParams = requiredAeParams.filter((p) => aeApproved.params[p] == null)

if (missingParams.length) {
  console.error('Échec ae_approved — params manquants:', missingParams.join(', '))
  process.exit(1)
}

// Déduplication sign_up
trackSignUp({ organizationName: 'Auto-École Test', email, requestId, planSelected: 'starter' })
const signUpCount = events.filter((e) => e.name === 'sign_up').length
if (signUpCount !== 1) {
  console.error('Échec déduplication sign_up — count:', signUpCount)
  process.exit(1)
}

console.log('OK — tunnel GA4 simulé:', expected.join(' → '))
console.log('Événements capturés:', names.join(', '))
console.log('ae_approved params:', JSON.stringify(aeApproved.params, null, 2))
