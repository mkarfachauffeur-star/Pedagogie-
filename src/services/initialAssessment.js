import {
  ASSESSMENT_STATUS_LABELS,
  computeAssessmentScores,
  recommendHoursFromScore,
} from '../data/initialAssessmentForm'
import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'

export function formatAssessmentStatus(status) {
  return ASSESSMENT_STATUS_LABELS[status] || status
}

export async function getInitialAssessmentForStudent(studentId) {
  if (!studentId) return { assessment: null, error: null }
  try {
    const { data, error } = await supabase
      .from('student_initial_assessments')
      .select(`
        *,
        teacher:completed_by(full_name)
      `)
      .eq('student_id', studentId)
      .maybeSingle()
    if (error) throw error
    return { assessment: data, error: null }
  } catch (error) {
    return { assessment: null, error }
  }
}

export async function saveInitialAssessmentStep({
  assessmentId,
  studentId,
  organizationId,
  answers,
  status = 'in_progress',
  completedBy = null,
  markCompleted = false,
}) {
  try {
    const scores = computeAssessmentScores(answers)
    const recommendation = recommendHoursFromScore(scores)
    const now = new Date().toISOString()

    const row = {
      answers,
      positive_score: scores.positiveScore,
      negative_score: scores.negativeScore,
      final_score: scores.finalScore,
      status: markCompleted ? 'completed' : status,
      updated_at: now,
      ...(markCompleted
        ? {
          result_level: recommendation.resultLevel,
          recommended_hours_min: recommendation.recommendedHoursMin,
          recommended_hours_max: recommendation.recommendedHoursMax,
          completed_at: now,
          completed_by: completedBy,
        }
        : {}),
    }

    if (assessmentId) {
      const { data, error } = await supabase
        .from('student_initial_assessments')
        .update(row)
        .eq('id', assessmentId)
        .select(`
          *,
          teacher:completed_by(full_name)
        `)
        .single()
      if (error) throw error
      return { assessment: data, error: null }
    }

    const { data, error } = await supabase
      .from('student_initial_assessments')
      .insert({
        organization_id: organizationId,
        student_id: studentId,
        ...row,
      })
      .select(`
        *,
        teacher:completed_by(full_name)
      `)
      .single()
    if (error) throw error
    return { assessment: data, error: null }
  } catch (error) {
    return { assessment: null, error: toUserError(error, 'save') }
  }
}

export async function listInitialAssessmentsForStudents(studentIds = []) {
  if (!studentIds.length) return { assessments: [], error: null }
  try {
    const { data, error } = await supabase
      .from('student_initial_assessments')
      .select(`
        *,
        teacher:completed_by(full_name)
      `)
      .in('student_id', studentIds)
    if (error) throw error
    return { assessments: data || [], error: null }
  } catch (error) {
    return { assessments: [], error }
  }
}

export async function getStudentHoursSummary(studentId) {
  if (!studentId) {
    return {
      contractHours: 0,
      completedHours: 0,
      remainingHours: 0,
      recommendedHours: null,
    }
  }

  try {
    const [studentRes, contractRes, appointmentsRes, assessmentRes] = await Promise.all([
      supabase.from('students').select('extra_hours, package_id').eq('id', studentId).maybeSingle(),
      supabase
        .from('contracts')
        .select('extra_hours, package:package_id(included_hours)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('appointments')
        .select('duration_minutes, status')
        .eq('student_id', studentId)
        .in('status', ['Réalisé', 'Realise', 'completed', 'done']),
      getInitialAssessmentForStudent(studentId),
    ])

    const student = studentRes.data
    const contract = contractRes.data
    const appointments = appointmentsRes.data
    const assessment = assessmentRes.assessment

    const packageHours = Number(contract?.package?.included_hours || 0)
    const extraHours = Number(contract?.extra_hours ?? student?.extra_hours ?? 0)
    const contractHours = packageHours + extraHours
    const completedMinutes = (appointments || []).reduce(
      (sum, row) => sum + Number(row.duration_minutes || 60),
      0,
    )
    const completedHours = Math.round((completedMinutes / 60) * 10) / 10
    const recommended = assessment?.status === 'completed'
      ? assessment.recommended_hours_max === assessment.recommended_hours_min
        ? assessment.recommended_hours_min
        : `${assessment.recommended_hours_min} à ${assessment.recommended_hours_max}`
      : null

    return {
      contractHours,
      completedHours,
      remainingHours: Math.max(contractHours - completedHours, 0),
      recommendedHours: recommended,
      assessment: assessment || null,
    }
  } catch {
    return {
      contractHours: 0,
      completedHours: 0,
      remainingHours: 0,
      recommendedHours: null,
      assessment: null,
    }
  }
}
