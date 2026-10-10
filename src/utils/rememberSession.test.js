import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyRememberMePreference,
  consumeEphemeralSessionFlag,
  EPHEMERAL_SESSION_KEY,
  readRememberedEmail,
  SAVED_EMAIL_KEY,
} from './rememberSession.js'

function fakeStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    _map: map,
  }
}

test('case cochée : e-mail mémorisé, session conservée (pas de drapeau éphémère)', () => {
  const storage = fakeStorage()
  storage.setItem(EPHEMERAL_SESSION_KEY, '1')
  applyRememberMePreference(true, 'eleve@example.fr', storage)
  assert.equal(storage.getItem(SAVED_EMAIL_KEY), 'eleve@example.fr')
  assert.equal(storage.getItem(EPHEMERAL_SESSION_KEY), null)
  assert.equal(consumeEphemeralSessionFlag(storage), false)
})

test('case décochée : e-mail effacé, session marquée éphémère pour le prochain démarrage', () => {
  const storage = fakeStorage()
  storage.setItem(SAVED_EMAIL_KEY, 'ancien@example.fr')
  applyRememberMePreference(false, 'eleve@example.fr', storage)
  assert.equal(storage.getItem(SAVED_EMAIL_KEY), null, 'aucun e-mail conservé sans consentement')
  assert.equal(storage.getItem(EPHEMERAL_SESSION_KEY), '1')
})

test('démarrage suivant sans « Se souvenir de moi » : révocation demandée une seule fois', () => {
  const storage = fakeStorage()
  applyRememberMePreference(false, 'eleve@example.fr', storage)
  assert.equal(consumeEphemeralSessionFlag(storage), true)
  assert.equal(consumeEphemeralSessionFlag(storage), false, 'le drapeau est consommé : pas de boucle')
})

test('reconnexion avec la case cochée : la session redevient persistante', () => {
  const storage = fakeStorage()
  applyRememberMePreference(false, 'eleve@example.fr', storage)
  applyRememberMePreference(true, 'eleve@example.fr', storage)
  assert.equal(consumeEphemeralSessionFlag(storage), false)
  assert.equal(readRememberedEmail(storage), 'eleve@example.fr')
})

test('lecture e-mail : vide si jamais mémorisé ou si décoché', () => {
  const storage = fakeStorage()
  assert.equal(readRememberedEmail(storage), '')
  applyRememberMePreference(false, 'eleve@example.fr', storage)
  assert.equal(readRememberedEmail(storage), '')
})

test('stockage indisponible : aucune exception, comportement dégradé propre', () => {
  assert.doesNotThrow(() => applyRememberMePreference(true, 'a@b.fr', null))
  assert.doesNotThrow(() => applyRememberMePreference(false, 'a@b.fr', null))
  assert.equal(consumeEphemeralSessionFlag(null), false)
  assert.equal(readRememberedEmail(null), '')
})
