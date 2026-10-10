import assert from 'node:assert/strict'
import test from 'node:test'
import { accessFromNative, classifyLocationError, traceGpsAwait } from './geolocation.js'

test('traceGpsAwait : laisse passer une promesse résolue', async () => {
  const value = await traceGpsAwait(Promise.resolve({ ok: true }), 'test', 50)
  assert.deepEqual(value, { ok: true })
})

test('traceGpsAwait : propage un rejet natif sans le transformer', async () => {
  const native = new Error('refusé')
  native.code = 'OS-PLUG-GLOC-0003'
  await assert.rejects(traceGpsAwait(Promise.reject(native), 'test', 50), (err) => {
    assert.equal(err.message, 'refusé')
    assert.equal(err.code, 'OS-PLUG-GLOC-0003')
    return true
  })
})

test('traceGpsAwait : une promesse pendante se termine toujours en timeout', async () => {
  const started = Date.now()
  await assert.rejects(
    traceGpsAwait(new Promise(() => {}), 'acquisition', 60),
    (err) => {
      assert.equal(err.locationStatus, 'timeout')
      assert.equal(err.code, 'OS-PLUG-GLOC-0010')
      return true
    },
  )
  assert.ok(Date.now() - started < 1000, 'le timeout doit être borné, jamais indéfini')
})

test('accessFromNative : Toujours → suivi arrière-plan disponible', () => {
  assert.deepEqual(accessFromNative({ location: 'granted', scope: 'always', background: true }), {
    granted: true,
    status: 'granted',
    scope: 'always',
    background: true,
  })
})

test('accessFromNative : Pendant l’utilisation → accordé', () => {
  const access = accessFromNative({ location: 'granted', scope: 'whenInUse', background: false })
  assert.equal(access.granted, true)
  assert.equal(access.status, 'granted')
  assert.equal(access.scope, 'whenInUse')
  assert.equal(access.background, true, 'whenInUse reste compatible avec le suivi (avertissement affiché)')
})

test('accessFromNative : refus → non accordé, statut denied', () => {
  const access = accessFromNative({ location: 'denied', scope: 'denied' })
  assert.equal(access.granted, false)
  assert.equal(access.status, 'denied')
})

test('accessFromNative : services désactivés et restreint', () => {
  assert.equal(accessFromNative({ scope: 'disabled' }).status, 'servicesDisabled')
  assert.equal(accessFromNative({ scope: 'restricted' }).status, 'restricted')
})

test('accessFromNative : indéterminé → prompt', () => {
  const access = accessFromNative({ location: 'prompt', scope: 'prompt' })
  assert.equal(access.granted, false)
  assert.equal(access.status, 'prompt')
})

test('classifyLocationError : codes et messages natifs vers les statuts UI', () => {
  assert.equal(classifyLocationError({ code: 1 }), 'denied')
  assert.equal(classifyLocationError({ code: 3 }), 'timeout')
  assert.equal(classifyLocationError({ code: 2 }), 'unavailable')
  assert.equal(classifyLocationError({ code: 'OS-PLUG-GLOC-0007', message: 'not enabled' }), 'servicesDisabled')
  assert.equal(classifyLocationError({ code: 'OS-PLUG-GLOC-0008', message: 'restricted' }), 'restricted')
  assert.equal(classifyLocationError({ code: 'OS-PLUG-GLOC-0010', message: 'timeout' }), 'timeout')
  assert.equal(classifyLocationError({ code: 'OS-PLUG-GLOC-0003', message: 'denied' }), 'denied')
})
