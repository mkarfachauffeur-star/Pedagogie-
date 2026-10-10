import assert from 'node:assert/strict'
import test from 'node:test'
import { addMonths, buildRvpMilestones, journeyProgress, milestoneState, orderedRvpMilestones } from './aacJourney.js'

const TODAY = new Date(2026, 9, 10) // 10 octobre 2026

test('0 km : rien de commencé, tout reste à faire', () => {
  const p = journeyProgress(0)
  assert.equal(p.km, 0)
  assert.equal(p.target, 3000)
  assert.equal(p.percent, 0)
  assert.equal(p.percentDisplay, 0)
  assert.equal(p.remaining, 3000)
  assert.equal(p.finished, false)

  const { mandatory } = buildRvpMilestones({ rvp: [], km: p.km, today: TODAY })
  assert.equal(mandatory[0].state, 'a_effectuer')
  assert.equal(mandatory[1].state, 'a_effectuer')
  assert.equal(mandatory[1].due, false, 'RVP 2 ne doit pas être déclenché à 0 km')
})

test('progression intermédiaire : formule km / 3000 × 100', () => {
  const p = journeyProgress(1234.5)
  assert.equal(p.percent, 41)
  assert.equal(p.percentDisplay, 41)
  assert.equal(p.remaining, 1765.5)
  assert.equal(p.finished, false)
})

test('2 999 km : pas de « 100 % » trompeur tant que l’objectif n’est pas atteint', () => {
  const p = journeyProgress(2999)
  assert.equal(p.percent, 100, 'la formule arrondit à 100')
  assert.equal(p.percentDisplay, 99, 'l’affichage reste honnête à 99 %')
  assert.equal(p.remaining, 1)
  assert.equal(p.finished, false)

  const { mandatory } = buildRvpMilestones({ rvp: [], km: p.km, today: TODAY })
  assert.equal(mandatory[1].due, false, '2 999 km ne déclenche pas RVP 2')
})

test('3 000 km : objectif atteint, RVP 2 devient à effectuer', () => {
  const p = journeyProgress(3000)
  assert.equal(p.percent, 100)
  assert.equal(p.percentDisplay, 100)
  assert.equal(p.remaining, 0)
  assert.equal(p.finished, true)

  const { mandatory } = buildRvpMilestones({ rvp: [], km: p.km, today: TODAY })
  assert.equal(mandatory[1].state, 'a_effectuer', 'franchir 3 000 km ne vaut pas réalisation')
  assert.equal(mandatory[1].due, true)
})

test('3 400 km : plafonné à 100 %, reste à 0', () => {
  const p = journeyProgress(3400)
  assert.equal(p.percent, 100)
  assert.equal(p.percentDisplay, 100)
  assert.equal(p.remaining, 0)
  assert.equal(p.finished, true)
})

test('RVP 2 réalisé uniquement par l’enregistrement du rendez-vous', () => {
  const { mandatory } = buildRvpMilestones({
    rvp: [{ sequence: 2, completed: true, heldOn: '2026-09-20' }],
    km: 3200,
    today: TODAY,
  })
  assert.equal(mandatory[1].state, 'realise')
  assert.equal(mandatory[1].due, false)
})

test('RVP 1 : échéance calculée depuis la FFI, jamais depuis une distance', () => {
  const { mandatory } = buildRvpMilestones({
    rvp: [],
    km: 3000,
    ffiAt: '2026-03-01',
    today: TODAY,
  })
  assert.equal(formatIso(mandatory[0].windowStart), '2026-07-01')
  assert.equal(formatIso(mandatory[0].deadline), '2026-09-01')
  assert.equal(mandatory[0].state, 'en_retard', 'FFI + 6 mois dépassé sans réalisation')
})

test('RVP 1 : dans la fenêtre des 4-6 mois → à effectuer, pas en retard', () => {
  const { mandatory } = buildRvpMilestones({
    rvp: [],
    km: 0,
    ffiAt: '2026-06-01',
    today: TODAY,
  })
  assert.equal(mandatory[0].state, 'a_effectuer')
})

test('RVP 1 : sans date FFI fiable, jamais « en retard »', () => {
  const { mandatory } = buildRvpMilestones({ rvp: [], km: 0, ffiAt: null, today: TODAY })
  assert.equal(mandatory[0].state, 'a_effectuer')
  assert.equal(mandatory[0].deadline, null)
})

test('RVP 1 réalisé prime sur l’échéance dépassée', () => {
  const { mandatory } = buildRvpMilestones({
    rvp: [{ sequence: 1, completed: true, heldOn: '2026-08-15' }],
    km: 0,
    ffiAt: '2026-03-01',
    today: TODAY,
  })
  assert.equal(mandatory[0].state, 'realise')
})

test('rendez-vous supplémentaires : facultatifs, états sur date fiable', () => {
  const { extras } = buildRvpMilestones({
    rvp: [
      { sequence: 3, completed: true, heldOn: '2026-07-01', label: 'RVP 3' },
      { sequence: 4, completed: false, heldOn: '2026-09-01', label: 'RVP 4' },
      { sequence: 5, completed: false, heldOn: '2026-12-01', label: 'RVP 5' },
      { sequence: 6, completed: false, heldOn: '', label: 'RVP 6' },
    ],
    km: 100,
    today: TODAY,
  })
  assert.deepEqual(
    extras.map((item) => [item.row.sequence, item.state, item.optional]),
    [
      [3, 'realise', true],
      [4, 'en_retard', true],
      [5, 'a_effectuer', true],
      [6, 'a_effectuer', true],
    ],
  )
})

test('ordre officiel : RVP 1 obligatoire, RVP 2 obligatoire (3 000 km), puis facultatifs', () => {
  const milestones = buildRvpMilestones({
    rvp: [
      { sequence: 5, completed: false, heldOn: '', label: 'RVP 5' },
      { sequence: 3, completed: true, heldOn: '2026-07-01', label: 'RVP 3' },
      { sequence: 2, completed: false },
      { sequence: 1, completed: false },
    ],
    km: 100,
    today: TODAY,
  })
  const ordered = orderedRvpMilestones(milestones)
  assert.deepEqual(ordered.map((item) => item.sequence), [1, 2, 3, 5])
  assert.deepEqual(ordered.map((item) => item.optional), [false, false, true, true])
  assert.equal(ordered[0].requirement, 'Obligatoire — entre 4 et 6 mois après l’attestation de fin de formation initiale')
  assert.equal(ordered[1].requirement, 'Obligatoire — lorsque 3 000 km ont été parcourus')
})

test('milestoneState : réalisé prime, puis retard, sinon à effectuer', () => {
  assert.equal(milestoneState({ completed: true, overdue: true }), 'realise')
  assert.equal(milestoneState({ completed: false, overdue: true }), 'en_retard')
  assert.equal(milestoneState({ completed: false, overdue: false }), 'a_effectuer')
})

test('addMonths : ajoute des mois calendaires', () => {
  assert.equal(formatIso(addMonths('2026-01-31', 1)), '2026-03-03', 'débordement documenté JS')
  assert.equal(formatIso(addMonths('2026-03-01', 4)), '2026-07-01')
  assert.equal(addMonths(null, 4), null)
})

function formatIso(date) {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
