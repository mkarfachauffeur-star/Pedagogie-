/** @typedef {Record<string, string | number | boolean | undefined>} GtagEventParams */

const FALLBACK_MEASUREMENT_ID = ''

let initialized = false

function readEnv(name) {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[name]) {
    return String(import.meta.env[name]).trim()
  }
  if (typeof process !== 'undefined' && process.env?.[name]) {
    return String(process.env[name]).trim()
  }
  return ''
}

/** ID GA4 — NEXT_PUBLIC_GA_MEASUREMENT_ID (Next.js / Vercel) ou VITE_GA_MEASUREMENT_ID (Vite). */
export function getGaMeasurementId() {
  return (
    readEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID')
    || readEnv('VITE_GA_MEASUREMENT_ID')
    || FALLBACK_MEASUREMENT_ID
  )
}

export const GA_MEASUREMENT_ID = getGaMeasurementId()

export function getGaScriptSrc(measurementId = getGaMeasurementId()) {
  return measurementId
    ? `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    : ''
}

function isProduction() {
  if (typeof import.meta !== 'undefined' && typeof import.meta.env?.PROD === 'boolean') {
    return import.meta.env.PROD
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV === 'production'
  }
  return false
}

function hasGtag() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/** Charge gtag.js — à appeler une seule fois (SPA ou après next/script). */
export function initGoogleAnalytics(measurementId = getGaMeasurementId()) {
  if (!isProduction() || initialized || !measurementId || typeof document === 'undefined') {
    return false
  }

  initialized = true

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }

  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true,
  })

  if (!document.querySelector(`script[src="${getGaScriptSrc(measurementId)}"]`)) {
    const script = document.createElement('script')
    script.async = true
    script.src = getGaScriptSrc(measurementId)
    document.head.appendChild(script)
  }

  return true
}

export function trackPageView(pagePath, measurementId = getGaMeasurementId()) {
  if (!isProduction() || !measurementId || !hasGtag()) return

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export function trackGtagEvent(eventName, params = {}) {
  if (!isProduction() || !hasGtag()) return
  window.gtag('event', eventName, params)
}
