import { Capacitor } from '@capacitor/core'
import { GPS_LIMITS } from './gpsDistance'

/**
 * Géolocalisation Capacitor (iPhone) avec repli navigateur.
 * Autorisation « lorsque l’app est utilisée » uniquement.
 * Le plugin iOS officiel ne poursuit pas le GPS écran verrouillé :
 * il ne faut donc pas demander la localisation « toujours ».
 */

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
}

export const LOCATION_STATUS_MESSAGES = {
  prompt: 'Pedagogia Drive a besoin de la position du téléphone pour mesurer les kilomètres réellement parcourus pendant le trajet.',
  ready: 'Localisation autorisée. Appuyez sur Démarrer le trajet : la première position GPS valide lance le calcul.',
  granted: 'Localisation autorisée.',
  acquiring: 'Recherche d’une position GPS précise…',
  tracking: 'Trajet en cours. Les kilomètres viennent des positions GPS reçues par le téléphone.',
  paused: 'Signal GPS interrompu. Le suivi s’arrête si l’écran est verrouillé ou si l’application passe en arrière-plan, puis reprend au retour. Les kilomètres déjà calculés sont conservés.',
  denied: 'La localisation est refusée. Sur iPhone : Réglages > Pedagogia Drive > Localisation > Lorsque l’app est active.',
  restricted: 'La localisation est restreinte sur cet iPhone (contrôle parental ou profil d’entreprise).',
  servicesDisabled: 'Le service de localisation est désactivé. Sur iPhone : Réglages > Confidentialité et sécurité > Service de localisation.',
  unavailable: 'La position GPS n’est pas disponible sur cet appareil.',
  timeout: 'Le GPS n’a pas obtenu de position à temps. Placez-vous à l’extérieur, le ciel dégagé, puis réessayez.',
  weak: 'Signal GPS trop imprécis pour démarrer. Sortez du bâtiment et attendez une précision inférieure à 80 m.',
}

function toPosition(coords, timestamp) {
  return {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: coords.accuracy ?? null,
    timestamp: timestamp || Date.now(),
  }
}

function toLocationError(err, fallback) {
  const error = new Error(err?.message || fallback)
  if (err?.code != null) error.code = err.code
  return error
}

export function classifyLocationError(error) {
  const code = error?.code
  if (code === 1) return 'denied'
  if (code === 3) return 'timeout'
  const message = `${error?.message || ''} ${error?.code || ''}`
  if (/not enabled|services are not enabled|OS-PLUG-GLOC-0007/i.test(message)) return 'servicesDisabled'
  if (/restricted|OS-PLUG-GLOC-0008/i.test(message)) return 'restricted'
  if (/denied|OS-PLUG-GLOC-0003/i.test(message)) return 'denied'
  if (/timeout|timed out|OS-PLUG-GLOC-0010/i.test(message)) return 'timeout'
  if (/unavailable|OS-PLUG-GLOC-0002/i.test(message) || code === 2) return 'unavailable'
  return 'unavailable'
}

async function getCapacitorGeolocation() {
  try {
    const mod = await import('@capacitor/geolocation')
    return mod.Geolocation
  } catch {
    return null
  }
}

function statusFromPermission(result) {
  const loc = result?.location
  const coarse = result?.coarseLocation
  if (loc === 'granted' || coarse === 'granted') return 'granted'
  if (loc === 'denied' || coarse === 'denied') return 'denied'
  return 'prompt'
}

export async function inspectLocationAccess() {
  if (!Capacitor.isNativePlatform()) {
    if (!navigator?.geolocation) return { granted: false, status: 'unavailable' }
    try {
      const result = await navigator.permissions?.query?.({ name: 'geolocation' })
      if (result?.state === 'granted') return { granted: true, status: 'granted' }
      if (result?.state === 'denied') return { granted: false, status: 'denied' }
    } catch {
      // Safari n’expose pas toujours l’API Permissions : le dialogue arrive au premier relevé.
    }
    return { granted: false, status: 'prompt' }
  }

  const Geo = await getCapacitorGeolocation()
  if (!Geo?.checkPermissions) return { granted: false, status: 'unavailable' }
  try {
    const result = await Geo.checkPermissions()
    const status = statusFromPermission(result)
    return { granted: status === 'granted', status }
  } catch (error) {
    const status = classifyLocationError(error)
    return { granted: false, status }
  }
}

export async function requestLocationAccess() {
  if (!Capacitor.isNativePlatform()) {
    if (!navigator?.geolocation) return { granted: false, status: 'unavailable' }
    return { granted: true, status: 'prompt' }
  }

  const Geo = await getCapacitorGeolocation()
  if (!Geo?.requestPermissions) return { granted: false, status: 'unavailable' }
  try {
    const result = await Geo.requestPermissions({ permissions: ['location'] })
    const status = statusFromPermission(result)
    return { granted: status === 'granted', status }
  } catch (error) {
    const status = classifyLocationError(error)
    return { granted: false, status }
  }
}

/** Compatibilité : vrai uniquement si l’accès est accordé. */
export async function requestLocationPermission() {
  const access = await requestLocationAccess()
  return access.granted
}

export function canOpenLocationSettings() {
  return Capacitor.isNativePlatform()
}

export function openLocationSettings() {
  if (!canOpenLocationSettings()) return false
  window.location.href = 'app-settings:'
  return true
}

export async function getCurrentPosition(options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  if (Capacitor.isNativePlatform()) {
    const Geo = await getCapacitorGeolocation()
    if (Geo) {
      try {
        const pos = await Geo.getCurrentPosition(opts)
        return toPosition(pos.coords, pos.timestamp)
      } catch (error) {
        throw toLocationError(error, 'Impossible d’obtenir la position GPS.')
      }
    }
  }
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(toLocationError({ message: 'La géolocalisation n’est pas disponible sur cet appareil.' }, 'La géolocalisation n’est pas disponible sur cet appareil.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(toPosition(pos.coords, pos.timestamp)),
      (err) => reject(toLocationError(err, 'Impossible d’obtenir la position GPS.')),
      opts,
    )
  })
}

/**
 * Attend une position exploitable. `weak` signifie qu’un relevé est arrivé,
 * mais avec une précision insuffisante pour démarrer un trajet.
 */
export async function acquireAccuratePosition({ attempts = 3, maxAccuracyM = GPS_LIMITS.maxAccuracyM } = {}) {
  let last = null
  let lastError = null
  for (let i = 0; i < attempts; i += 1) {
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      })
      last = position
      if (position.accuracy == null || position.accuracy <= maxAccuracyM) {
        return { position, weak: false }
      }
    } catch (error) {
      lastError = error
      const status = classifyLocationError(error)
      if (status === 'denied' || status === 'servicesDisabled' || status === 'restricted') {
        error.locationStatus = status
        throw error
      }
    }
  }
  if (last) return { position: last, weak: true }
  const error = lastError || new Error('Impossible d’obtenir la position GPS.')
  error.locationStatus = error.locationStatus || classifyLocationError(error)
  throw error
}

/**
 * @returns {{ stop: () => void }}
 */
export function watchPosition(onUpdate, onError, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, timeout: 25000, ...options }
  let watchId = null
  let stopped = false
  let capacitorWatchId = null

  const start = async () => {
    if (Capacitor.isNativePlatform()) {
      const Geo = await getCapacitorGeolocation()
      if (Geo?.watchPosition) {
        capacitorWatchId = await Geo.watchPosition(opts, (pos, err) => {
          if (stopped) return
          if (err) {
            onError?.(toLocationError(err, 'Erreur GPS'))
            return
          }
          if (pos?.coords) onUpdate(toPosition(pos.coords, pos.timestamp))
        })
        return
      }
    }
    if (!navigator?.geolocation) {
      onError?.(new Error('La géolocalisation n’est pas disponible sur cet appareil.'))
      return
    }
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!stopped) onUpdate(toPosition(pos.coords, pos.timestamp))
      },
      (err) => {
        if (!stopped) onError?.(toLocationError(err, 'Erreur GPS'))
      },
      opts,
    )
  }

  // L’identifiant natif arrive après un aller-retour. stop() doit l’attendre,
  // sinon clearWatch ne part pas et le GPS continue sur iPhone.
  const ready = start()

  const stopWatch = async () => {
    stopped = true
    try {
      await ready
    } catch {
      // Le suivi n’a pas démarré : rien à couper.
    }
    if (watchId != null && navigator?.geolocation) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    if (capacitorWatchId != null) {
      const Geo = await getCapacitorGeolocation()
      await Geo?.clearWatch?.({ id: capacitorWatchId })
      capacitorWatchId = null
    }
  }

  return {
    stop: () => {
      void stopWatch()
    },
  }
}

export { accumulateDistance, formatKm, haversineKm, measureTrack } from './gpsDistance'

export function downsamplePath(points, maxPoints = 200) {
  if (!points?.length) return []
  if (points.length <= maxPoints) {
    return points.map((p) => [p.lat, p.lng])
  }
  const step = Math.ceil(points.length / maxPoints)
  const out = []
  for (let i = 0; i < points.length; i += step) {
    out.push([points[i].lat, points[i].lng])
  }
  const last = points[points.length - 1]
  const lastOut = out[out.length - 1]
  if (!lastOut || lastOut[0] !== last.lat || lastOut[1] !== last.lng) {
    out.push([last.lat, last.lng])
  }
  return out
}
