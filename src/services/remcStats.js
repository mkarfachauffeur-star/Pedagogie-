import { supabase } from '../lib/supabase'
import { REMC_TEMPLATE, computeRemcProgress } from '../data/remcTemplate'
import { fetchRemcItemProgressRows, fetchRemcHistory } from './remcItems'
import { fetchCompetencyValidations } from './remcProgress'

export async function fetchStudentRemcStats(studentId) {
  if (!studentId) {
    return { stats: null, error: new Error('Élève manquant.') }
  }

  try {
    const { data, error } = await supabase.rpc('get_remc_student_stats', {
      p_student_id: studentId,
    })
    if (error) throw error
    return { stats: data, error: null }
  } catch (error) {
    console.warn('[remcStats] fetchStudentRemcStats rpc fallback', error)

    const [{ rows }, { validations }, { history }] = await Promise.all([
      fetchRemcItemProgressRows(studentId),
      fetchCompetencyValidations(studentId),
      fetchRemcHistory(studentId, { limit: 1 }),
    ])

    const remc = REMC_TEMPLATE.map((competency) => ({
      ...competency,
      items: competency.items.map((item) => {
        const row = rows.find((r) => r.item_id === item.id)
        return { ...item, status: row?.status || item.status }
      }),
    }))

    const progress = computeRemcProgress(remc)
    const itemsByCompetency = REMC_TEMPLATE.reduce((acc, competency) => {
      const items = remc.find((row) => row.code === competency.code)?.items || []
      acc[competency.code] = {
        validated: items.filter((item) => item.status === 'Validé').length,
        total: items.length,
        percent: progress.byCompetency[competency.code] || 0,
      }
      return acc
    }, {})

    return {
      stats: {
        student_id: studentId,
        competencies_validated: validations.length,
        global_percent: progress.global,
        items_by_competency: itemsByCompetency,
        history_events: history.length,
        item_counts: progress.itemCounts,
      },
      error: null,
    }
  }
}

export async function fetchOrganizationRemcStats(organizationId) {
  if (!organizationId) {
    return { stats: null, error: new Error('Organisation manquante.') }
  }

  try {
    const { data, error } = await supabase.rpc('get_remc_organization_stats', {
      p_organization_id: organizationId,
    })
    if (error) throw error
    return { stats: data, error: null }
  } catch (error) {
    console.warn('[remcStats] fetchOrganizationRemcStats', error)
    return { stats: null, error }
  }
}

export async function fetchTeacherRemcStats(teacherId, organizationId) {
  if (!teacherId || !organizationId) {
    return { stats: null, error: new Error('Paramètres manquants.') }
  }

  try {
    const { data: assignments, error: assignError } = await supabase
      .from('student_assignments')
      .select('student_id')
      .eq('teacher_id', teacherId)
      .eq('is_referent', true)

    if (assignError) throw assignError

    const studentIds = [...new Set((assignments || []).map((row) => row.student_id))]
    if (!studentIds.length) {
      return {
        stats: {
          teacher_id: teacherId,
          student_count: 0,
          average_global_percent: 0,
          students: [],
        },
        error: null,
      }
    }

    const studentStats = await Promise.all(
      studentIds.map(async (studentId) => {
        const { stats } = await fetchStudentRemcStats(studentId)
        return stats
      }),
    )

    const validStats = studentStats.filter(Boolean)
    const averageGlobal = validStats.length
      ? Math.round(
          validStats.reduce((sum, row) => sum + (row.global_percent || 0), 0) / validStats.length,
        )
      : 0

    return {
      stats: {
        teacher_id: teacherId,
        student_count: studentIds.length,
        average_global_percent: averageGlobal,
        students: validStats,
      },
      error: null,
    }
  } catch (error) {
    console.warn('[remcStats] fetchTeacherRemcStats', error)
    return { stats: null, error }
  }
}

export function formatRemcHistoryLabel(entry) {
  if (!entry) return ''
  if (entry.record_type === 'competency') {
    const action = entry.new_status === 'validated' ? 'validée' : 'révoquée'
    return `Compétence ${entry.competency_code} ${action}`
  }
  const itemCode = entry.item_id?.toUpperCase() || entry.item_id
  return `${itemCode} : ${entry.previous_status || '—'} → ${entry.new_status}`
}
