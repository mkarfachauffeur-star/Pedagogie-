import { Capacitor } from '@capacitor/core'

const ANDROID_PACKAGE = 'fr.pedagogiadrive.app'

export function getAppPlatform() {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return 'iOS'
  if (platform === 'android') return 'Android'
  return 'Web'
}

export function getAppVersion() {
  return import.meta.env.VITE_APP_VERSION || '0.0.0'
}

export function getStoreUrl() {
  const platform = Capacitor.getPlatform()
  if (platform === 'android') {
    return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`
  }
  if (platform === 'ios') {
    return import.meta.env.VITE_IOS_APP_STORE_URL || ''
  }
  return ''
}

export function openAppStore() {
  const url = getStoreUrl()
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
