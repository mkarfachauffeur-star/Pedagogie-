import assert from 'node:assert/strict'
import test from 'node:test'
import { createDistanceTracker, measureTrack } from './gpsDistance.js'

function point(lat, lng, accuracy, t) {
  return { lat, lng, accuracy, timestamp: t }
}

test('précision ~90 m : positions reçues mais aucun kilomètre compté, jamais inventé', () => {
  const points = [
    point(48.0, 2.0, 89, 0),
    point(48.005, 2.0, 90, 30_000),
    point(48.01, 2.0, 88, 60_000),
    point(48.015, 2.0, 91, 90_000),
  ]
  const { distanceKm } = measureTrack(points)
  assert.equal(distanceKm, 0, 'tous les points dépassent 80 m : aucun segment ne doit compter')
})

test('rejet précision : l’ancre ne bouge pas, le kilométrage reprend quand la précision revient', () => {
  const tracker = createDistanceTracker()
  const a = point(48.0, 2.0, 10, 0)
  const b = point(48.01, 2.0, 90, 60_000)
  const c = point(48.02, 2.0, 88, 120_000)
  const d = point(48.03, 2.0, 12, 180_000)

  assert.equal(tracker.add(a).accepted, true)
  assert.equal(tracker.add(b).accepted, false)
  assert.equal(tracker.add(b).reason, 'accuracy')
  assert.equal(tracker.add(c).accepted, false)
  const verdict = tracker.add(d)
  assert.equal(verdict.accepted, true)
  // ~3,33 km entre A et D : mesurés une seule fois depuis l’ancre A, sans double comptage.
  assert.ok(verdict.distanceKm > 3 && verdict.distanceKm < 3.6, `distance=${verdict.distanceKm}`)
})

test('limite exacte de 80 m : acceptée ; 80,1 m : rejetée', () => {
  const tracker = createDistanceTracker()
  tracker.add(point(48.0, 2.0, 10, 0))
  assert.equal(tracker.add(point(48.0005, 2.0, 80, 10_000)).reason === 'accuracy', false)
  const tracker2 = createDistanceTracker()
  tracker2.add(point(48.0, 2.0, 10, 0))
  assert.equal(tracker2.add(point(48.0005, 2.0, 80.1, 10_000)).reason, 'accuracy')
})

test('précision inconnue (null) : le point reste éligible au calcul', () => {
  const tracker = createDistanceTracker()
  tracker.add(point(48.0, 2.0, 10, 0))
  const verdict = tracker.add(point(48.0005, 2.0, null, 10_000))
  assert.notEqual(verdict.reason, 'accuracy')
})
