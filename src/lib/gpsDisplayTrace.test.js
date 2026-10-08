import assert from 'node:assert/strict'
import test from 'node:test'
import { measureTrack } from './gpsDistance.js'
import { buildDisplayTrace } from './gpsDisplayTrace.js'

function east(origin, meters, dtMs = 1000, accuracy = 8) {
  const deg = meters / (111_320 * Math.cos((origin.lat * Math.PI) / 180))
  return {
    lat: origin.lat,
    lng: origin.lng + deg,
    timestamp: origin.timestamp + dtMs,
    accuracy,
  }
}

function along(start, count, stepM, stepMs) {
  const points = [start]
  let cursor = start
  for (let index = 0; index < count; index += 1) {
    cursor = east(cursor, stepM, stepMs)
    points.push(cursor)
  }
  return points
}

test('un trajet rectiligne garde le départ, l’arrivée et le sens de la route', () => {
  const start = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 8 }
  const points = along(start, 12, 40, 4000)
  const trace = buildDisplayTrace(points)
  assert.ok(trace.length >= 2)
  assert.equal(trace[0][0], Math.round(start.lat * 1e6) / 1e6)
  assert.equal(trace.at(-1)[1], Math.round(points.at(-1).lng * 1e6) / 1e6)
  for (let index = 1; index < trace.length; index += 1) {
    assert.ok(trace[index][1] >= trace[index - 1][1])
  }
})

test('un pic entre deux positions proches disparaît du tracé', () => {
  const start = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 6 }
  const road = along(start, 6, 30, 3000)
  const spike = east(road[3], 400, 1000, 6)
  spike.timestamp = road[3].timestamp + 500
  const points = [...road.slice(0, 4), spike, ...road.slice(4)]
  const trace = buildDisplayTrace(points)
  const spikeLng = Math.round(spike.lng * 1e6) / 1e6
  assert.ok(trace.every((pair) => pair[1] !== spikeLng))
  assert.ok(trace.at(-1)[1] > trace[0][1])
})

test('une position trop imprécise n’entre pas dans le tracé', () => {
  const start = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 8 }
  const bad = { ...east(start, 25, 3000, 120), accuracy: 120 }
  const next = east(start, 50, 6000, 8)
  const trace = buildDisplayTrace([start, bad, next])
  const badLng = Math.round(bad.lng * 1e6) / 1e6
  assert.ok(trace.every((pair) => pair[1] !== badLng))
})

test('un trajet précédent éloigné n’est pas relié au trajet en cours', () => {
  const oldStart = { lat: 43.6, lng: 7.1, timestamp: 1_700_000_000_000, accuracy: 8, sequenceNo: 0 }
  const previous = along(oldStart, 5, 40, 4000).map((point, index) => ({ ...point, sequenceNo: index }))
  const currentStart = {
    lat: 43.71,
    lng: 7.28,
    timestamp: previous.at(-1).timestamp + 2 * 60 * 60 * 1000,
    accuracy: 8,
    sequenceNo: 0,
  }
  const current = along(currentStart, 6, 35, 4000).map((point, index) => ({
    ...point,
    sequenceNo: index,
  }))
  const trace = buildDisplayTrace([...previous, ...current])
  assert.ok(trace[0][0] > 43.7)
  assert.ok(trace.every((pair) => pair[1] > 7.2))
})

test('des points reçus dans le désordre sont dessinés dans l’ordre du temps', () => {
  const start = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 8, sequenceNo: 2 }
  const middle = { ...east(start, 80, 8000), sequenceNo: 0 }
  const end = { ...east(middle, 80, 8000), sequenceNo: 1 }
  const trace = buildDisplayTrace([end, start, middle])
  assert.ok(trace.length >= 2)
  assert.equal(trace[0][0], Math.round(start.lat * 1e6) / 1e6)
  assert.equal(trace[0][1], Math.round(start.lng * 1e6) / 1e6)
  assert.equal(trace.at(-1)[1], Math.round(end.lng * 1e6) / 1e6)
  assert.ok(trace[0][1] < trace.at(-1)[1])
})

test('le filtrage du tracé ne change pas les kilomètres mesurés', () => {
  const start = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 8 }
  const road = along(start, 8, 50, 5000)
  const spike = east(road[4], 250, 400, 8)
  const points = [...road.slice(0, 5), spike, ...road.slice(5)]
  const before = measureTrack(points)
  buildDisplayTrace(points)
  const after = measureTrack(points)
  assert.equal(after.distanceKm, before.distanceKm)
  assert.equal(after.points.length, before.points.length)
})
