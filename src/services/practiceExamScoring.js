import {
  ALL_COMPETENCE_ITEMS,
  COMPETENCE_LESSON_LINKS,
  PRACTICE_EXAM_CONSOLIDATE_THRESHOLD,
  PRACTICE_EXAM_MAX_SCORE,
  PRACTICE_EXAM_READY_THRESHOLD,
  PRACTICE_EXAM_SECTIONS,
} from '../data/practiceExamGrid'

function parseNote(note) {
  if (note === 'E' || note === '' || note == null) return null
  const value = Number(note)
  return Number.isFinite(value) ? value : null
}

export function calculatePracticeExamScore({ scores, bonusCourtesy, bonusEco }) {
  let total = 0
  ALL_COMPETENCE_ITEMS.forEach((item) => {
    const value = parseNote(scores[item.id])
    if (value !== null) total += value
  })
  if (bonusCourtesy) total += 1
  if (bonusEco) total += 1
  return Math.min(Math.round(total * 10) / 10, PRACTICE_EXAM_MAX_SCORE)
}

export function determinePracticeExamResult({ scoreTotal, hasEliminatoryError }) {
  if (hasEliminatoryError) return 'echec'
  if (scoreTotal >= PRACTICE_EXAM_READY_THRESHOLD) return 'favorable'
  return 'insuffisant'
}

export function determineReadinessLevel({ scoreTotal, hasEliminatoryError }) {
  if (hasEliminatoryError || scoreTotal < PRACTICE_EXAM_CONSOLIDATE_THRESHOLD) return 'insufficient'
  if (scoreTotal < PRACTICE_EXAM_READY_THRESHOLD) return 'consolidate'
  return 'ready'
}

export function estimateSuccessProbability(exams = [], remcValidatedCount = 0) {
  if (!exams.length) return null
  const sorted = [...exams].sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date))
  if (sorted[0]?.has_eliminatory_error) return 35

  const recent = sorted.slice(0, 3)
  const avg = recent.reduce((sum, exam) => sum + Number(exam.score_total || 0), 0) / recent.length
  const trend = recent.length >= 2
    ? Number(recent[0].score_total) - Number(recent[recent.length - 1].score_total)
    : 0

  let probability = (avg / PRACTICE_EXAM_MAX_SCORE) * 88 + remcValidatedCount * 2 + trend * 1.5
  return Math.round(Math.min(95, Math.max(20, probability)))
}

export function suggestNextExamDate(exams = []) {
  if (!exams.length) return null
  const last = [...exams].sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date))[0]
  const next = new Date(last.exam_date)
  next.setDate(next.getDate() + 14)
  return next.toISOString().slice(0, 10)
}

export function generatePedagogicalReport({ scores, bonusCourtesy, bonusEco, hasEliminatoryError, eliminatoryErrors = [] }) {
  const evaluated = ALL_COMPETENCE_ITEMS.map((item) => {
    const raw = scores[item.id]
    const value = parseNote(raw)
    return { ...item, raw, value: value ?? -1 }
  }).filter((item) => item.raw !== 'E')

  const strengths = evaluated
    .filter((item) => {
      if (item.scale === 'autonomy') return item.value >= 1
      return item.value >= 2
    })
    .slice(0, 4)
    .map((item) => item.label)

  const weaknesses = [...evaluated]
    .sort((a, b) => a.value - b.value)
    .slice(0, 3)
    .map((item) => item.label)

  const recommendedLessons = [...new Set(
    weaknesses
      .map((label) => evaluated.find((item) => item.label === label))
      .filter(Boolean)
      .map((item) => COMPETENCE_LESSON_LINKS[item.id])
      .filter(Boolean),
  )]

  const objectiveScore = PRACTICE_EXAM_READY_THRESHOLD
  const summaryLines = []

  if (hasEliminatoryError) {
    summaryLines.push('Erreur éliminatoire constatée : reprise ciblée indispensable avant présentation à l\'examen.')
  } else if (calculatePracticeExamScore({ scores, bonusCourtesy, bonusEco }) >= objectiveScore) {
    summaryLines.push('Niveau satisfaisant : l\'élève peut envisager une présentation à l\'examen après consolidation.')
  } else {
    summaryLines.push(`Objectif : atteindre au minimum ${objectiveScore}/${PRACTICE_EXAM_MAX_SCORE} avant présentation à l'examen.`)
  }

  return {
    strengths: strengths.length
      ? strengths
      : ['Participation à l\'épreuve', 'Volonté de progresser'],
    weaknesses: weaknesses.length
      ? weaknesses
      : ['Poursuivre l\'entraînement régulier'],
    recommendedLessons,
    eliminatorySummary: hasEliminatoryError ? eliminatoryErrors : [],
    summaryLines,
    sectionAverages: PRACTICE_EXAM_SECTIONS.map((section) => {
      const items = evaluated.filter((item) => item.sectionId === section.id)
      if (!items.length) return { sectionId: section.id, title: section.title, average: null }
      const avg = items.reduce((sum, item) => sum + Math.max(item.value, 0), 0) / items.length
      return { sectionId: section.id, title: section.title, average: Math.round(avg * 10) / 10 }
    }),
  }
}

export function computeTeacherPracticeExamStats(exams = [], students = []) {
  const byStudent = new Map()
  exams.forEach((exam) => {
    const current = byStudent.get(exam.student_id) || []
    current.push(exam)
    byStudent.set(exam.student_id, current)
  })

  let readyCount = 0
  let riskCount = 0
  byStudent.forEach((studentExams) => {
    const latest = [...studentExams].sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date))[0]
    const level = determineReadinessLevel({
      scoreTotal: Number(latest.score_total),
      hasEliminatoryError: latest.has_eliminatory_error,
    })
    if (level === 'ready') readyCount += 1
    if (level === 'insufficient' || latest.has_eliminatory_error) riskCount += 1
  })

  const average =
    exams.length > 0
      ? Math.round((exams.reduce((sum, exam) => sum + Number(exam.score_total || 0), 0) / exams.length) * 10) / 10
      : 0

  const recent = [...exams]
    .sort((a, b) => new Date(b.created_at || b.exam_date) - new Date(a.created_at || a.exam_date))
    .slice(0, 5)

  return {
    readyCount,
    riskCount,
    average,
    recent,
    totalExams: exams.length,
    trackedStudents: byStudent.size,
    totalStudents: students.length,
  }
}

export function computeStudentPracticeExamStats(exams = []) {
  if (!exams.length) {
    return {
      count: 0,
      lastScore: null,
      bestScore: null,
      progressionRate: 0,
      nextSuggestedDate: null,
    }
  }

  const sorted = [...exams].sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
  const scores = sorted.map((exam) => Number(exam.score_total || 0))
  const first = scores[0]
  const last = scores[scores.length - 1]
  const progressionRate = scores.length >= 2 ? Math.round(((last - first) / PRACTICE_EXAM_MAX_SCORE) * 100) : 0

  return {
    count: exams.length,
    lastScore: last,
    bestScore: Math.max(...scores),
    progressionRate,
    nextSuggestedDate: suggestNextExamDate(exams),
    history: sorted.map((exam) => ({
      id: exam.id,
      date: exam.exam_date,
      score: Number(exam.score_total || 0),
      result: exam.result,
    })),
  }
}
