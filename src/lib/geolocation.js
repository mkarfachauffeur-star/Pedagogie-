import { Capacitor } from '@capacitor/core'

/**
 * Géolocalisation unifiée (Capacitor natif + fallback navigateur).
 * Suivi au premier plan uniquement (V1).
 */

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 2000,
}

function toPosition(coords, timestamp) {
  return {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: coords.accuracy ?? null,
    timestamp: timestamp || Date.now(),
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

export async function requestLocationPermission() {
  if (Capacitor.isNativePlatform()) {
    const Geo = await getCapacitorGeolocation()
    if (Geo?.requestPermissions) {
      const result = await Geo.requestPermissions()
      return result?.location === 'granted' || result?.coarseLocation === 'granted'
    }
  }
  return true
}

export async function getCurrentPosition(options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  if (Capacitor.isNativePlatform()) {
    const Geo = await getCapacitorGeolocation()
    if (Geo) {
      const pos = await Geo.getCurrentPosition(opts)
      return toPosition(pos.coords, pos.timestamp)
    }
  }
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(toPosition(pos.coords, pos.timestamp)),
      (err) => reject(new Error(err?.message || 'Impossible d’obtenir la position GPS.')),
      opts,
    )
  })
}

/**
 * @returns {{ stop: () => void }}
 */
export function watchPosition(onUpdate, onError, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
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
            onError?.(new Error(err.message || 'Erreur GPS'))
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
        if (!stopped) onError?.(new Error(err?.message || 'Erreur GPS'))
      },
      opts,
    )
  }

  void start()

  return {
    stop: () => {
      stopped = true
      if (watchId != null && navigator?.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
      if (capacitorWatchId != null) {
        void getCapacitorGeolocation().then((Geo) => {
          Geo?.clearWatch?.({ id: capacitorWatchId })
        })
      }
    },
  }
}

/** Distance haversine en kilomètres. */
export function haversineKm(a, b) {
  if (!a || !b) return 0
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Filtre les sauts GPS aberrants (> maxJumpKm entre deux points). */
export function accumulateDistance(points, maxJumpKm = 0.5) {
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    const d = haversineKm(points[i - 1], points[i])
    if (d > 0 && d <= maxJumpKm) total += d
  }
  return Math.round(total * 1000) / 1000
}

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
