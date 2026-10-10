import { Capacitor } from '@capacitor/core'
import { GPS_LIMITS } from './gpsDistance.js'

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
  inaccurate: 'Signal GPS imprécis pour le moment. Le trajet reste ouvert : aucun kilomètre n’est ajouté tant que la précision ne redevient pas suffisante, et les kilomètres du trajet reprennent ensuite sans rien inventer.',
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
  if (err?.locationStatus) error.locationStatus = err.locationStatus
  return error
}

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error(message)
      error.code = 'OS-PLUG-GLOC-0010'
      error.locationStatus = 'timeout'
      reject(error)
    }, ms)
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
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

function gpsLog(step, detail) {
  if (detail === undefined) console.log(`[AAC-GPS] ${step}`)
  else console.log(`[AAC-GPS] ${step}`, detail)
}

function trace(message) {
  console.log(`[AAC-GPS][TRACE] ${message}`)
}

/** Délai temporaire de diagnostic. N’enlève pas le blocage : il le nomme. */
export function traceGpsAwait(promise, step, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      trace(`TIMEOUT ${step}`)
      const error = new Error(`TIMEOUT ${step}`)
      error.code = 'OS-PLUG-GLOC-0010'
      error.locationStatus = 'timeout'
      reject(error)
    }, ms)
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

export function flushNativeTripPoints() {
  return pullNativeTripPoints()
}

let cachedTripPlugin = null

/**
 * Le proxy Capacitor répond à toute propriété, y compris `then`, par une
 * fonction. `return plugin` dans une fonction async fait donc adopter ce
 * proxy comme promesse : son `then` n’appelle jamais resolve/reject, et
 * l’appelant reste pending après le log « plugin chargé ».
 * On renvoie un objet simple `{ plugin }`, qui n’est pas un thenable.
 */
async function getTripPlugin() {
  trace('GP 1 entrée getTripPlugin')
  if (Capacitor.getPlatform() !== 'ios' || tripPluginMissing) {
    trace('GP 8 sortie getTripPlugin')
    return null
  }
  if (!cachedTripPlugin) {
    let module
    try {
      module = await import('pedagogia-aac-trip-location')
    } catch (error) {
      gpsLog('plugin AacTripLocation indisponible', `${error?.code || ''} ${error?.message || error}`)
      trace('GP 8 sortie getTripPlugin')
      return null
    }
    trace('GP 2 import terminé')
    const found = module?.AacTripLocation
    if (!found || typeof found.requestPermissions !== 'function') {
      gpsLog('plugin AacTripLocation indisponible', 'export AacTripLocation manquant')
      trace('GP 8 sortie getTripPlugin')
      return null
    }
    trace('GP 3 module.AacTripLocation trouvé')
    cachedTripPlugin = found
    gpsLog('plugin AacTripLocation chargé')
  } else {
    trace('GP 2 import terminé')
    trace('GP 3 module.AacTripLocation trouvé')
  }
  // Le statut n’est pas nécessaire pour rendre le plugin. L’appel getStatus
  // reste dans requestPermissions / checkPermissions, pas ici.
  trace('GP 4 avant getStatus')
  trace('GP 5 getStatus terminé')
  trace('GP 6 avant return plugin')
  const result = { plugin: cachedTripPlugin }
  trace('GP 7 après construction résultat')
  trace('GP 8 sortie getTripPlugin')
  return result
}

function tripPluginFrom(loaded) {
  return loaded?.plugin || null
}

export function accessFromNative(result) {
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
  const tripPlugin = tripPluginFrom(await getTripPlugin())
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
  trace('3 avant getTripPlugin')
  const tripPlugin = tripPluginFrom(await traceGpsAwait(getTripPlugin(), 'getTripPlugin', 8000))
  trace('4 getTripPlugin terminé')
  if (tripPlugin) {
    try {
      trace('7 avant requestPermissions')
      gpsLog('requestPermissions appel')
      const pending = tripPlugin.requestPermissions()
      trace('8 requestPermissions appelé')
      const result = await traceGpsAwait(
        pending,
        'requestPermissions',
        90000,
      )
      trace('9 requestPermissions terminé')
      gpsLog('requestPermissions retour', result)
      return accessFromNative(result)
    } catch (error) {
      const status = error?.locationStatus || classifyLocationError(error)
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
  const tripPlugin = tripPluginFrom(await getTripPlugin())
  if (tripPlugin) {
    const timeoutMs = Number(opts.timeout) > 0 ? Number(opts.timeout) : 20000
    trace('10 avant getCurrentPosition')
    gpsLog('AacTripLocation.getCurrentPosition appel', { timeoutMs })
    try {
      const point = await traceGpsAwait(
        tripPlugin.getCurrentPosition({ timeout: timeoutMs }),
        'getCurrentPosition',
        timeoutMs + 3000,
      )
      trace('11 getCurrentPosition terminé')
      const normalized = normalizeNativePoint(point)
      gpsLog('getCurrentPosition succès', normalized)
      return normalized
    } catch (error) {
      gpsLog('getCurrentPosition erreur', `${error?.code || ''} ${error?.message || error}`)
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
  gpsLog('acquireAccuratePosition entrée')
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
        gpsLog('acquireAccuratePosition sortie', { weak: false, accuracy: position.accuracy })
        return { position, weak: false }
      }
    } catch (error) {
      lastError = error
      const status = error.locationStatus || classifyLocationError(error)
      error.locationStatus = status
      if (status === 'denied' || status === 'servicesDisabled' || status === 'restricted' || status === 'timeout') {
        throw error
      }
    }
  }
  if (last) {
    gpsLog('acquireAccuratePosition sortie', { weak: true, accuracy: last.accuracy })
    return { position: last, weak: true }
  }
  const error = lastError || new Error('Impossible d’obtenir la position GPS.')
  error.locationStatus = error.locationStatus || classifyLocationError(error)
  gpsLog('acquireAccuratePosition erreur', `${error.locationStatus} ${error.message}`)
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

  let loggedFirstFix = false
  const emit = (point) => {
    if (stopped || !point) return
    const normalized = normalizeNativePoint(point)
    if (!loggedFirstFix) {
      loggedFirstFix = true
      gpsLog('première position reçue', normalized)
    }
    gpsLog('point reçu JS', { sequenceNo: normalized.sequenceNo, accuracy: normalized.accuracy })
    onUpdate(normalized)
  }

  // Un drain en vol ne doit jamais se doubler : sans ce garde-fou, les appels
  // toutes les 4 s s'empilent si le natif tarde à répondre.
  let pullInFlight = false
  const pull = async () => {
    if (!plugin || stopped || pullInFlight) return
    pullInFlight = true
    try {
      const drained = await traceGpsAwait(plugin.drain(), 'drain', 8000)
      for (const point of drained?.points || []) emit(point)
    } catch {
      // Le drain suivant réessaiera : les points restent dans le tampon natif.
    } finally {
      pullInFlight = false
    }
  }

  const ready = (async () => {
    plugin = tripPluginFrom(await getTripPlugin())
    if (!plugin) {
      const fallback = watchPosition(onUpdate, onError, { ...options, background: false })
      removeListeners = async () => {
        fallback.stop()
      }
      onError?.(new Error('Cette version de l’application ne suit pas encore le GPS écran verrouillé. Installez la nouvelle version avec npm run ios:prepare.'))
      return
    }
    trace('12 avant start')
    gpsLog('AacTripLocation.start appel', { reset: Boolean(options.reset) })
    try {
      await traceGpsAwait(plugin.start({ reset: Boolean(options.reset) }), 'start', 8000)
    } catch (error) {
      onError?.(error)
      return
    }
    trace('13 start terminé')
    gpsLog('AacTripLocation.start retour')
    await pull()
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
    // ready peut avoir créé le drain périodique pendant l'attente : on le coupe ici.
    clearInterval(drainTimer)
    drainTimer = null
    if (endNative && plugin) {
      try {
        const drained = await plugin.drain()
        for (const point of drained?.points || []) onUpdate(normalizeNativePoint(point))
        await plugin.stop()
      } catch {
        // Un drain final en échec ne doit pas bloquer la clôture du trajet :
        // les points déjà remontés restent dans le tampon JS.
      }
    }
    stopped = true
    pullNativeTripPoints = async () => {}
    try {
      await removeListeners()
    } catch {
      // Le suivi n’a pas démarré.
    }
  }

  // stop()/detach() renvoient la promesse : l'appelant peut attendre le drain
  // final avant de mesurer la distance, sinon les derniers points sont perdus.
  return {
    stop: () => finish(true),
    detach: () => finish(false),
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
    stop: () => stopWatch(),
  }
}

export { accumulateDistance, formatKm, haversineKm, measureTrack } from './gpsDistance.js'

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
