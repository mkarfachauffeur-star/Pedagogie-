import { supabase } from '../lib/supabase'
import { emptyScoreForm } from '../data/practiceExamGrid'
import {
  calculatePracticeExamScore,
  determinePracticeExamResult,
  generatePedagogicalReport,
} from './practiceExamScoring'
import { toUserError } from '../lib/userFacingError'

function normalizeExam(row, scores = []) {
  return {
    ...row,
    item_scores: scores,
  }
}

async function fetchScoresForExams(examIds) {
  if (!examIds.length) return {}
  const { data, error } = await supabase
    .from('practice_exam_item_scores')
    .select('id, exam_id, competence_id, note')
    .in('exam_id', examIds)
  if (error) throw error
  return (data || []).reduce((acc, row) => {
    if (!acc[row.exam_id]) acc[row.exam_id] = []
    acc[row.exam_id].push(row)
    return acc
  }, {})
}

export async function listPracticeExamsForStudent(studentId) {
  if (!studentId) return { exams: [], error: null }

  try {
    const { data, error } = await supabase
      .from('practice_exams')
      .select(`
        id,
        student_id,
        teacher_id,
        exam_date,
        score_total,
        result,
        comment,
        has_eliminatory_error,
        eliminatory_errors,
        bonus_courtesy,
        bonus_eco,
        pedagogical_report,
        created_at,
        teacher:teacher_id(full_name)
      `)
      .eq('student_id', studentId)
      .order('exam_date', { ascending: false })

    if (error) throw error

    const exams = data || []
    const scoreMap = await fetchScoresForExams(exams.map((exam) => exam.id))
    const normalized = exams.map((exam) => normalizeExam(exam, scoreMap[exam.id] || []))
    return { exams: normalized, error: null }
  } catch (error) {
    return { exams: [], error }
  }
}

export async function listPracticeExamsForOrganization() {
  try {
    const { data, error } = await supabase
      .from('practice_exams')
      .select(`
        id,
        student_id,
        teacher_id,
        exam_date,
        score_total,
        result,
        comment,
        has_eliminatory_error,
        eliminatory_errors,
        bonus_courtesy,
        bonus_eco,
        pedagogical_report,
        created_at,
        student:student_id(id, first_name, last_name),
        teacher:teacher_id(full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { exams: data || [], error: null }
  } catch (error) {
    return { exams: [], error }
  }
}

export async function createPracticeExam({
  organizationId,
  studentId,
  teacherId,
  examDate,
  scores,
  bonusCourtesy,
  bonusEco,
  eliminatoryErrors,
  comment,
}) {
  const hasEliminatoryError = eliminatoryErrors.length > 0
  const scoreTotal = calculatePracticeExamScore({ scores, bonusCourtesy, bonusEco })
  const result = determinePracticeExamResult({ scoreTotal, hasEliminatoryError })
  const pedagogicalReport = generatePedagogicalReport({
    scores,
    bonusCourtesy,
    bonusEco,
    hasEliminatoryError,
    eliminatoryErrors,
  })

  const payload = {
    organization_id: organizationId,
    student_id: studentId,
    teacher_id: teacherId,
    exam_date: examDate,
    score_total: scoreTotal,
    result,
    comment: comment || null,
    has_eliminatory_error: hasEliminatoryError,
    eliminatory_errors: eliminatoryErrors,
    bonus_courtesy: bonusCourtesy,
    bonus_eco: bonusEco,
    pedagogical_report: pedagogicalReport,
  }

  try {
    const { data: exam, error } = await supabase
      .from('practice_exams')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw error

    const scoreRows = Object.entries(scores).map(([competence_id, note]) => ({
      exam_id: exam.id,
      competence_id,
      note: note || 'E',
    }))

    const { error: scoresError } = await supabase.from('practice_exam_item_scores').insert(scoreRows)
    if (scoresError) throw scoresError

    const created = normalizeExam(exam, scoreRows.map((row, index) => ({ ...row, id: `local-${index}` })))
    return { exam: created, error: null }
  } catch (error) {
    return { exam: null, error: toUserError(error, 'practiceExam') }
  }
}

export async function deletePracticeExam(examId) {
  try {
    const { error } = await supabase.from('practice_exams').delete().eq('id', examId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'practiceExam') }
  }
}

export function buildInitialPracticeExamForm() {
  return {
    examDate: new Date().toISOString().slice(0, 10),
    scores: emptyScoreForm(),
    bonusCourtesy: false,
    bonusEco: false,
    eliminatoryErrors: [],
    comment: '',
  }
}

export function scoresArrayToMap(itemScores = []) {
  return Object.fromEntries(itemScores.map((row) => [row.competence_id, row.note]))
}
