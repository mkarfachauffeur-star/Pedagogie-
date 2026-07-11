import { isGaDebugEnabled, trackGtagEvent } from '../gtag'

const STORAGE_PREFIX = 'pd_ga_once:'

export function onceKey(...parts) {
  return parts.filter(Boolean).join(':')
}

export function hasTrackedOnce(key) {
  if (!key || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key) === '1'
  } catch {
    return false
  }
}

export function markTrackedOnce(key) {
  if (!key || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, '1')
  } catch {
    // ignore quota / private mode
  }
}

/** Envoie un événement GA4 une seule fois par clé (localStorage). */
export function trackOnce(key, eventName, params = {}) {
  if (!key) return false

  const debug = isGaDebugEnabled()
  if (!debug && hasTrackedOnce(key)) {
    return false
  }

  if (debug && hasTrackedOnce(key) && typeof console !== 'undefined') {
    console.info(`[GA4] dedup bypass (debug) → ${eventName}`, { key })
  }

  trackGtagEvent(eventName, params)
  if (!debug) markTrackedOnce(key)
  return true
}

/** Événement « premier X » par organisation. */
export function trackOrgOnce(organizationId, eventName, params = {}) {
  if (!organizationId) return false
  return trackOnce(onceKey('org', organizationId, eventName), eventName, {
    organization_id: organizationId,
    ...params,
  })
}

/** Événement « premier X » par utilisateur. */
export function trackUserOnce(userId, eventName, params = {}) {
  if (!userId) return false
  return trackOnce(onceKey('user', userId, eventName), eventName, params)
}
