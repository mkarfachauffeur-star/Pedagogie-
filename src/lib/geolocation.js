import { Capacitor } from '@capacitor/core'
import { GPS_LIMITS } from './gpsDistance'

/**
 * Géolocalisation des trajets AAC.
 * Sur iPhone, un plugin CLLocationManager dédié suit la position tant que le
 * trajet est en cours, y compris écran verrouillé, puis s’arrête à la fin.
 * Le plugin Capacitor Geolocation reste le repli si cette version native
 * n’est pas encore dans l’application installée.
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
  tracking: 'Trajet en cours. Les kilomètres viennent des positions GPS reçues par le téléphone, y compris si l’iPhone est verrouillé.',
  background: 'Trajet en cours. Le GPS continue pendant que l’écran est verrouillé ou que l’application est en arrière-plan. Le suivi s’arrête quand vous terminez le trajet.',
  paused: 'Signal GPS momentanément perdu. Le trajet reste ouvert : les kilomètres reprendront dès qu’une position valide reviendra.',
  denied: 'La localisation est refusée. Sur iPhone : Réglages > Pedagogia Drive > Localisation > Toujours.',
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

let tripPluginMissing = false
let pullNativeTripPoints = async () => {}

export function flushNativeTripPoints() {
  return pullNativeTripPoints()
}

async function getTripPlugin() {
  if (Capacitor.getPlatform() !== 'ios' || tripPluginMissing) return null
  try {
    const module = await import('pedagogia-aac-trip-location')
    await module.AacTripLocation.getStatus()
    return module.AacTripLocation
  } catch (error) {
    if (/not implemented|UNIMPLEMENTED|plugin is not implemented/i.test(`${error?.message || ''} ${error?.code || ''}`)) {
      tripPluginMissing = true
      return null
    }
    return null
  }
}

function accessFromNative(result) {
  const scope = result?.scope || 'prompt'
  if (scope === 'disabled') return { granted: false, status: 'servicesDisabled', scope, background: false }
  if (scope === 'restricted') return { granted: false, status: 'restricted', scope, background: false }
  if (scope === 'denied' || result?.location === 'denied') {
    return { granted: false, status: 'denied', scope: 'denied', background: false }
  }
  if (result?.location === 'granted') {
    return { granted: true, status: 'granted', scope, background: Boolean(result.background) || scope === 'always' || scope === 'whenInUse' }
  }
  return { granted: false, status: 'prompt', scope, background: false }
}

function normalizeNativePoint(point) {
  return {
    lat: Number(point.lat),
    lng: Number(point.lng),
    accuracy: point.accuracy == null ? null : Number(point.accuracy),
    timestamp: Number(point.timestamp) || Date.now(),
    sequenceNo: point.sequenceNo == null ? undefined : Number(point.sequenceNo),
  }
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
  const tripPlugin = await getTripPlugin()
  if (tripPlugin) {
    try {
      return accessFromNative(await tripPlugin.checkPermissions())
    } catch (error) {
      return { granted: false, status: classifyLocationError(error), scope: 'none', background: false }
    }
  }

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
  const tripPlugin = await getTripPlugin()
  if (tripPlugin) {
    try {
      return accessFromNative(await tripPlugin.requestPermissions())
    } catch (error) {
      const status = classifyLocationError(error)
      return { granted: false, status, scope: 'none', background: false }
    }
  }

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
  const tripPlugin = await getTripPlugin()
  if (tripPlugin) {
    try {
      return normalizeNativePoint(await tripPlugin.getCurrentPosition())
    } catch (error) {
      throw toLocationError(error, 'Impossible d’obtenir la position GPS.')
    }
  }
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
function watchIosTrip(onUpdate, onError, options) {
  let drainTimer = null
  let stopped = false
  let finishing = false
  let plugin = null
  let removeListeners = async () => {}

  const emit = (point) => {
    if (stopped || !point) return
    onUpdate(normalizeNativePoint(point))
  }

  const pull = async () => {
    if (!plugin || stopped) return
    const drained = await plugin.drain()
    for (const point of drained?.points || []) emit(point)
  }

  const ready = (async () => {
    plugin = await getTripPlugin()
    if (!plugin) {
      const fallback = watchPosition(onUpdate, onError, { ...options, background: false })
      removeListeners = async () => {
        fallback.stop()
      }
      onError?.(new Error('Cette version de l’application ne suit pas encore le GPS écran verrouillé. Installez la nouvelle version avec npm run ios:prepare.'))
      return
    }
    await plugin.start({ reset: Boolean(options.reset) })
    const first = await plugin.drain()
    for (const point of first?.points || []) emit(point)
    const locationHandle = await plugin.addListener('location', (point) => emit(point))
    const errorHandle = await plugin.addListener('error', (payload) => {
      if (!stopped) onError?.(toLocationError(payload, 'Erreur GPS'))
    })
    removeListeners = async () => {
      await locationHandle?.remove?.()
      await errorHandle?.remove?.()
    }
    pullNativeTripPoints = pull
    drainTimer = setInterval(() => {
      void pull()
    }, 4000)
  })()

  const finish = async (endNative) => {
    if (finishing) return
    finishing = true
    clearInterval(drainTimer)
    drainTimer = null
    try {
      await ready
    } catch (error) {
      onError?.(error)
    }
    if (endNative && plugin) {
      const drained = await plugin.drain()
      for (const point of drained?.points || []) onUpdate(normalizeNativePoint(point))
      await plugin.stop()
    }
    stopped = true
    pullNativeTripPoints = async () => {}
    try {
      await removeListeners()
    } catch {
      // Le suivi n’a pas démarré.
    }
  }

  return {
    stop: () => {
      void finish(true)
    },
    detach: () => {
      void finish(false)
    },
  }
}

export function watchPosition(onUpdate, onError, options = {}) {
  if (options.background && Capacitor.getPlatform() === 'ios') {
    return watchIosTrip(onUpdate, onError, options)
  }
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
