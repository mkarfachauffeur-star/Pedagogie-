/**
 * Distance réelle entre positions GPS.
 * Chaque kilomètre ajouté vient d’un segment haversine accepté.
 * Aucun incrément artificiel.
 */

const EARTH_RADIUS_KM = 6371

export const GPS_LIMITS = {
  /** Au-delà, le point est trop proche d’une position cellule / Wi-Fi. */
  maxAccuracyM: 80,
  /** Déplacement minimal retenu quand le GPS est précis (10 m = 0,01 km). */
  minMoveM: 10,
  /** Ignore les variations plus petites que ce facteur × la précision annoncée. */
  accuracyNoiseFactor: 0.8,
  /** Au-dessus, le segment est un saut (pas un déplacement de véhicule). */
  maxSpeedKmh: 180,
}

export function haversineKm(a, b) {
  if (!isCoord(a) || !isCoord(b)) return 0
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(Math.max(0, h)), Math.sqrt(Math.max(0, 1 - h)))
}

export function roundKm(km, decimals = 3) {
  const factor = 10 ** decimals
  const value = Number(km) || 0
  return Math.round(value * factor) / factor
}

export function formatKm(km) {
  return roundKm(km, 2).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function isCoord(point) {
  return Number.isFinite(point?.lat) && Number.isFinite(point?.lng)
}

function timestampMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function finiteAccuracy(value) {
  const accuracy = Number(value)
  return Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null
}

function noiseFloorM(limits, previous, next) {
  const accuracies = [previous?.accuracy, next?.accuracy].filter((value) => value != null)
  const widest = accuracies.length ? Math.max(...accuracies) : 0
  return Math.max(limits.minMoveM, widest * limits.accuracyNoiseFactor)
}

function classifySegment(limits, from, sample) {
  const meters = haversineKm(from, sample) * 1000
  if (meters < 1) return { kind: 'duplicate', meters }
  if (meters < noiseFloorM(limits, from, sample)) return { kind: 'stationary', meters }
  const hours = (sample.timestamp - from.timestamp) / 3_600_000
  const speedKmh = hours > 0 ? (meters / 1000) / hours : Number.POSITIVE_INFINITY
  if (!(hours > 0) || !Number.isFinite(speedKmh) || speedKmh > limits.maxSpeedKmh) {
    return { kind: 'speed', meters }
  }
  return { kind: 'move', meters }
}

/**
 * Suivi incrémental.
 * Un saut isolé (vitesse impossible) ne déplace pas l’ancre : le point suivant
 * est encore mesuré depuis la dernière position crédible.
 * Deux positions cohérentes après un saut confirment un vrai déplacement :
 * l’ancre rejoint ce nouveau lieu sans ajouter les kilomètres du saut.
 */
export function createDistanceTracker(limits = {}) {
  const cfg = { ...GPS_LIMITS, ...limits }
  let anchor = null
  let pending = null
  let distanceKm = 0
  const accepted = []

  function remember(sample, meters) {
    distanceKm += meters / 1000
    anchor = sample
    pending = null
    accepted.push(sample)
  }

  function add(point) {
    if (!isCoord(point)) {
      return { accepted: false, reason: 'invalid', distanceKm }
    }

    const accuracy = finiteAccuracy(point.accuracy)
    if (accuracy != null && accuracy > cfg.maxAccuracyM) {
      return { accepted: false, reason: 'accuracy', distanceKm }
    }

    const timestamp = timestampMs(point.timestamp) ?? Date.now()
    const sample = {
      lat: point.lat,
      lng: point.lng,
      accuracy,
      timestamp,
      sequenceNo: point.sequenceNo,
    }

    if (!anchor) {
      anchor = sample
      pending = null
      accepted.push(sample)
      return { accepted: true, reason: 'seed', distanceKm }
    }

    const verdict = classifySegment(cfg, anchor, sample)
    if (verdict.kind === 'move') {
      remember(sample, verdict.meters)
      return { accepted: true, reason: 'move', distanceKm }
    }
    if (verdict.kind === 'duplicate' || verdict.kind === 'stationary') {
      pending = null
      return { accepted: false, reason: verdict.kind, distanceKm }
    }

    if (pending) {
      const follow = classifySegment(cfg, pending, sample)
      if (follow.kind === 'move') {
        anchor = pending
        accepted.push(pending)
        remember(sample, follow.meters)
        return { accepted: true, reason: 'move', distanceKm }
      }
      if (follow.kind === 'duplicate' || follow.kind === 'stationary') {
        anchor = pending
        pending = null
        accepted.push(anchor)
        return { accepted: true, reason: 'seed', distanceKm }
      }
    }

    pending = sample
    return { accepted: false, reason: 'speed', distanceKm }
  }

  return {
    add,
    get distanceKm() {
      return distanceKm
    },
    get points() {
      return accepted
    },
  }
}

/** Somme des segments GPS valides. Les points rejetés ne déplacent pas l’ancre. */
export function measureTrack(points, limits) {
  const tracker = createDistanceTracker(limits)
  for (const point of points || []) tracker.add(point)
  return {
    distanceKm: roundKm(tracker.distanceKm),
    points: tracker.points,
  }
}

export function accumulateDistance(points, limits) {
  return measureTrack(points, limits).distanceKm
}
