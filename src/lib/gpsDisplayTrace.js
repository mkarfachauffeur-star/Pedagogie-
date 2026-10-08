/**
 * Points utilisés uniquement pour dessiner le trajet.
 * Le calcul des kilomètres reste dans gpsDistance.js et n’est pas appelé ici.
 */
import { haversineKm } from './gpsDistance.js'

const DISPLAY_LIMITS = {
  maxAccuracyM: 50,
  fallbackAccuracyM: 80,
  minGapM: 7,
  spikeReturnM: 70,
  spikeLegM: 90,
  tripGapM: 1200,
  tripGapMs: 15 * 60 * 1000,
  maxSpeedKmh: 180,
  simplifyM: 12,
  maxPoints: 240,
}

function timestampMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value == null || value === '') return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function meters(a, b) {
  return haversineKm(a, b) * 1000
}

function toLocal(origin, point) {
  const latRad = (origin.lat * Math.PI) / 180
  return {
    x: (point.lng - origin.lng) * 111_320 * Math.cos(latRad),
    y: (point.lat - origin.lat) * 110_540,
  }
}

function crossTrackM(start, end, point) {
  const a = toLocal(start, start)
  const b = toLocal(start, end)
  const p = toLocal(start, point)
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy)
  if (length < 0.5) return Math.hypot(p.x - a.x, p.y - a.y)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (length * length)))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function speedKmh(a, b) {
  if (a?.timestamp == null || b?.timestamp == null) return null
  const hours = (b.timestamp - a.timestamp) / 3_600_000
  if (!(hours > 0)) return Number.POSITIVE_INFINITY
  return (meters(a, b) / 1000) / hours
}

function normalize(points) {
  const out = []
  ;(points || []).forEach((point, index) => {
    const lat = Array.isArray(point) ? Number(point[0]) : Number(point?.lat)
    const lng = Array.isArray(point) ? Number(point[1]) : Number(point?.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return
    const accuracy = Number(point?.accuracy)
    const sequenceNo = Number(point?.sequenceNo)
    out.push({
      lat,
      lng,
      accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null,
      timestamp: timestampMs(point?.timestamp),
      sequenceNo: Number.isFinite(sequenceNo) ? sequenceNo : null,
      order: index,
    })
  })
  return out
}

function dropAccuracy(points, maxAccuracyM) {
  return points.filter((point) => point.accuracy == null || point.accuracy <= maxAccuracyM)
}

function sortTrack(points) {
  return [...points].sort((a, b) => {
    if (a.timestamp != null && b.timestamp != null && a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp
    }
    if (a.sequenceNo != null && b.sequenceNo != null && a.sequenceNo !== b.sequenceNo) {
      return a.sequenceNo - b.sequenceNo
    }
    return a.order - b.order
  })
}

function isSpike(start, point, end, limits) {
  const legIn = meters(start, point)
  const legOut = meters(point, end)
  const shortcut = meters(start, end)
  if (shortcut <= limits.spikeReturnM && Math.max(legIn, legOut) >= limits.spikeLegM) return true
  const offset = crossTrackM(start, end, point)
  return offset > 80 && legIn > 40 && legOut > 40 && shortcut < 0.45 * (legIn + legOut)
}

function removeSpikes(points, limits) {
  let current = points
  for (let pass = 0; pass < 6 && current.length >= 3; pass += 1) {
    const next = [current[0]]
    let removed = false
    for (let index = 1; index < current.length - 1; index += 1) {
      const point = current[index]
      if (isSpike(next[next.length - 1], point, current[index + 1], limits)) {
        removed = true
        continue
      }
      next.push(point)
    }
    next.push(current[current.length - 1])
    current = next
    if (!removed) break
  }
  return current
}

function dropImpossible(points, limits) {
  if (points.length < 3) return points
  const out = [points[0]]
  for (let index = 1; index < points.length - 1; index += 1) {
    const prev = out[out.length - 1]
    const point = points[index]
    const next = points[index + 1]
    const inbound = speedKmh(prev, point)
    const outbound = speedKmh(point, next)
    if (
      inbound != null
      && outbound != null
      && inbound > limits.maxSpeedKmh
      && outbound > limits.maxSpeedKmh
    ) {
      continue
    }
    out.push(point)
  }
  out.push(points[points.length - 1])
  return out
}

function endTime(segment) {
  for (let index = segment.length - 1; index >= 0; index -= 1) {
    if (segment[index].timestamp != null) return segment[index].timestamp
  }
  return null
}

function isForeignGap(prev, next, limits) {
  const gap = meters(prev, next)
  if (gap < limits.tripGapM) return false
  if (prev.timestamp == null || next.timestamp == null) return true
  const elapsed = next.timestamp - prev.timestamp
  if (elapsed >= limits.tripGapMs) return true
  const speed = speedKmh(prev, next)
  return speed != null && speed > limits.maxSpeedKmh
}

function keepCurrentTrip(points, limits) {
  if (points.length < 2) return points
  const segments = [[points[0]]]
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]
    const segment = segments[segments.length - 1]
    if (isForeignGap(segment[segment.length - 1], point, limits)) segments.push([point])
    else segment.push(point)
  }
  if (segments.length === 1) return segments[0]

  const substantial = segments.filter((segment) => segment.length >= 2)
  const pool = substantial.length ? substantial : segments
  let best = pool[pool.length - 1]
  let bestTime = endTime(best)
  pool.forEach((segment) => {
    const time = endTime(segment)
    if (time != null && (bestTime == null || time >= bestTime)) {
      best = segment
      bestTime = time
    }
  })
  return best
}

function dedupe(points, minGapM) {
  if (points.length < 2) return points
  const out = [points[0]]
  for (let index = 1; index < points.length - 1; index += 1) {
    if (meters(out[out.length - 1], points[index]) >= minGapM) out.push(points[index])
  }
  const last = points[points.length - 1]
  if (meters(out[out.length - 1], last) >= minGapM) out.push(last)
  else out[out.length - 1] = last
  return out
}

function simplify(points, epsilonM) {
  if (points.length < 3 || !(epsilonM > 0)) return points
  const keep = new Array(points.length).fill(false)
  keep[0] = true
  keep[points.length - 1] = true
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [start, end] = stack.pop()
    let maxDist = 0
    let index = -1
    for (let cursor = start + 1; cursor < end; cursor += 1) {
      const dist = crossTrackM(points[start], points[end], points[cursor])
      if (dist > maxDist) {
        maxDist = dist
        index = cursor
      }
    }
    if (index !== -1 && maxDist > epsilonM) {
      keep[index] = true
      stack.push([start, index], [index, end])
    }
  }
  return points.filter((_, index) => keep[index])
}

function toPairs(points) {
  return points.map((point) => [
    Math.round(point.lat * 1e6) / 1e6,
    Math.round(point.lng * 1e6) / 1e6,
  ])
}

/** Polyline d’affichage. Ne modifie pas la distance enregistrée. */
export function buildDisplayTrace(points, limits = {}) {
  const cfg = { ...DISPLAY_LIMITS, ...limits }
  const normalized = normalize(points)
  if (normalized.length < 2) return toPairs(normalized)

  let usable = dropAccuracy(normalized, cfg.maxAccuracyM)
  if (usable.length < 2) usable = dropAccuracy(normalized, cfg.fallbackAccuracyM)
  if (usable.length < 2) return toPairs(sortTrack(usable.length ? usable : normalized).slice(0, 1))

  usable = sortTrack(usable)
  usable = removeSpikes(usable, cfg)
  usable = dropImpossible(usable, cfg)
  usable = keepCurrentTrip(usable, cfg)
  usable = dedupe(usable, cfg.minGapM)
  usable = simplify(usable, cfg.simplifyM)
  if (usable.length > cfg.maxPoints) usable = simplify(usable, cfg.simplifyM * 2)
  return toPairs(usable)
}
