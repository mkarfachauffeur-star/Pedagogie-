import assert from 'node:assert/strict'
import test from 'node:test'
import { accumulateDistance, formatKm, haversineKm, measureTrack } from './gpsDistance.js'

function east(origin, meters, dtMs, accuracy = 8) {
  const deg = meters / (111_320 * Math.cos((origin.lat * Math.PI) / 180))
  return {
    lat: origin.lat,
    lng: origin.lng + deg,
    timestamp: origin.timestamp + dtMs,
    accuracy,
  }
}

test('haversine : Paris → Lyon est d’environ 390 km', () => {
  const km = haversineKm(
    { lat: 48.8566, lng: 2.3522 },
    { lat: 45.764, lng: 4.8357 },
  )
  assert.ok(km > 380 && km < 410, `distance inattendue : ${km}`)
})

test('un trajet autoroute dont les segments dépassent 0,5 km est compté', () => {
  const start = { lat: 48.8566, lng: 2.3522, timestamp: 1_700_000_000_000, accuracy: 8 }
  const points = [start]
  let cursor = start
  for (let i = 0; i < 8; i += 1) {
    cursor = east(cursor, 700, 25_000)
    points.push(cursor)
  }
  const km = accumulateDistance(points)
  assert.ok(km > 5.4 && km < 5.8, `km inattendus : ${km}`)
})

test('les variations GPS à l’arrêt ne créent pas de kilomètres', () => {
  const start = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 6 }
  const points = [start]
  for (let i = 0; i < 20; i += 1) {
    const meters = i % 2 === 0 ? 4 : -4
    points.push(east(start, meters, (i + 1) * 1000, 6))
  }
  assert.equal(accumulateDistance(points), 0)
})

test('un saut aberrant est ignoré et le point suivant est mesuré depuis la dernière position valide', () => {
  const start = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 8 }
  const spike = east(start, 2_000, 1_000, 8)
  const real = east(start, 40, 10_000, 8)
  const track = measureTrack([start, spike, real])
  assert.ok(track.distanceKm > 0.03 && track.distanceKm < 0.06, `km : ${track.distanceKm}`)
  assert.equal(track.points.length, 2)
})

test('un saut trop rapide confirmé ne compte pas le trou, mais le trajet reprend ensuite', () => {
  const start = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 8 }
  const jump = east(start, 5_000, 20_000, 8)
  const next = east(jump, 40, 5_000, 8)
  const track = measureTrack([start, jump, next])
  assert.ok(track.distanceKm > 0.03 && track.distanceKm < 0.06, `km : ${track.distanceKm}`)
  assert.equal(track.points.length, 3)
})

test('une reprise après une coupure est comptée si la vitesse reste plausible', () => {
  const start = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 10 }
  const later = east(start, 12_000, 10 * 60 * 1000, 12)
  const km = accumulateDistance([start, later])
  assert.ok(km > 11.5 && km < 12.5, `km : ${km}`)
})

test('une position trop imprécise ne sert ni d’ancre ni de distance', () => {
  const start = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 200 }
  const next = east(start, 500, 30_000, 200)
  const good = { ...east(start, 30, 40_000, 8), accuracy: 8 }
  const track = measureTrack([start, next, good])
  assert.equal(track.points.length, 1)
  assert.equal(track.points[0].lat, good.lat)
  assert.equal(track.distanceKm, 0)
})

test('la première position valide ne fabrique pas de distance', () => {
  const km = accumulateDistance([
    { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 5 },
  ])
  assert.equal(km, 0)
})

test('les doublons ne sont pas additionnés', () => {
  const point = { lat: 43.7, lng: 7.26, timestamp: 1_700_000_000_000, accuracy: 5 }
  assert.equal(accumulateDistance([point, { ...point }, { ...point, timestamp: point.timestamp + 5000 }]), 0)
})

test('le format affiche le centième de kilomètre en français', () => {
  assert.equal(formatKm(0), '0,00')
  assert.equal(formatKm(12.345), '12,35')
})
