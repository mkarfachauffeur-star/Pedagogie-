import assert from 'node:assert/strict'
import test from 'node:test'
import { isQcuPassed, normalizeModuleProgress, QCU_PASS_PERCENTAGE } from './lessonProgressRules.js'

test('seuil QCU : 8/10 valide, 7/10 ne valide pas', () => {
  assert.equal(QCU_PASS_PERCENTAGE, 80)
  assert.equal(isQcuPassed(8, 10), true)
  assert.equal(isQcuPassed(7, 10), false)
  assert.equal(isQcuPassed(10, 10), true)
})

test('seuil QCU : arrondis cohérents sur petits questionnaires', () => {
  assert.equal(isQcuPassed(4, 5), true, '4/5 = 80 %')
  assert.equal(isQcuPassed(3, 5), false, '3/5 = 60 %')
  assert.equal(isQcuPassed(2, 3), false, '2/3 ≈ 67 %')
  assert.equal(isQcuPassed(0, 10), false)
  assert.equal(isQcuPassed(8, 0), false, 'pas de questions, pas de validation')
  assert.equal(isQcuPassed(null, 10), false)
})

test('normalizeModuleProgress : lecture complète requise avant QCU', () => {
  const empty = normalizeModuleProgress({ completed: false })
  assert.equal(empty.courseReadComplete, false, 'le QCU reste verrouillé tant que la leçon n’est pas lue')
  assert.equal(empty.qcuPassed, false)

  const read = normalizeModuleProgress({ courseReadComplete: true, course_read_complete: undefined })
  assert.equal(read.courseReadComplete, true)

  const passed = normalizeModuleProgress({ qcu_passed: true, qcu_score: 9, qcu_total: 10, qcu_percentage: 90 })
  assert.equal(passed.qcuPassed, true)
  assert.equal(passed.completed, true)
  assert.equal(passed.score, 9)
  assert.equal(passed.total, 10)
  assert.equal(passed.percentage, 90)
})

test('normalizeModuleProgress : accepte les deux formes (camelCase et snake_case)', () => {
  const camel = normalizeModuleProgress({ courseReadComplete: true, qcuPassed: true })
  const snake = normalizeModuleProgress({ course_read_complete: true, qcu_passed: true })
  assert.deepEqual(
    { read: camel.courseReadComplete, passed: camel.qcuPassed },
    { read: snake.courseReadComplete, passed: snake.qcuPassed },
  )
})
