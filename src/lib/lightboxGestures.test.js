import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyGesture,
  canPan,
  clamp,
  distanceBetween,
  LIGHTBOX_MAX_SCALE,
  LIGHTBOX_MIN_SCALE,
  midpoint,
  toggleDoubleTap,
} from './lightboxGestures.js'

test('clamp borne les valeurs', () => {
  assert.equal(clamp(5, 1, 4), 4)
  assert.equal(clamp(0.5, 1, 4), 1)
  assert.equal(clamp(2.5, 1, 4), 2.5)
})

test('distance et milieu entre deux doigts', () => {
  const a = { clientX: 0, clientY: 0 }
  const b = { clientX: 30, clientY: 40 }
  assert.equal(distanceBetween(a, b), 50)
  assert.deepEqual(midpoint(a, b), { clientX: 15, clientY: 20 })
})

test('pincement : le zoom est borné entre 1 et 4', () => {
  const zoomed = applyGesture({ scale: 3, tx: 0, ty: 0 }, { scaleFactor: 2 })
  assert.equal(zoomed.scale, LIGHTBOX_MAX_SCALE)
  const shrunk = applyGesture({ scale: 1.2, tx: 10, ty: 10 }, { scaleFactor: 0.5 })
  assert.equal(shrunk.scale, LIGHTBOX_MIN_SCALE)
})

test('retour à l’échelle 1 : l’image est recentrée (pas de décalage résiduel)', () => {
  const reset = applyGesture({ scale: 1.02, tx: 80, ty: -40 }, { scaleFactor: 0.5 })
  assert.deepEqual(reset, { scale: LIGHTBOX_MIN_SCALE, tx: 0, ty: 0 })
})

test('le déplacement ne s’applique que lorsque l’image est agrandie', () => {
  const moved = applyGesture({ scale: 2, tx: 0, ty: 0 }, { dx: 12, dy: -6 })
  assert.deepEqual(moved, { scale: 2, tx: 12, ty: -6 })
  assert.equal(canPan(moved.scale), true)
  assert.equal(canPan(1), false)
})

test('double-toucher : zoome puis réinitialise', () => {
  const zoomIn = toggleDoubleTap({ scale: 1, tx: 0, ty: 0 })
  assert.ok(zoomIn.scale > 1)
  const zoomOut = toggleDoubleTap(zoomIn)
  assert.deepEqual(zoomOut, { scale: LIGHTBOX_MIN_SCALE, tx: 0, ty: 0 })
})

test('un pincement ne peut pas descendre sous 1 ni dépasser 4', () => {
  assert.equal(applyGesture({ scale: 4, tx: 0, ty: 0 }, { scaleFactor: 3 }).scale, LIGHTBOX_MAX_SCALE)
  assert.equal(applyGesture({ scale: 1, tx: 0, ty: 0 }, { scaleFactor: 0.2 }).scale, LIGHTBOX_MIN_SCALE)
})
