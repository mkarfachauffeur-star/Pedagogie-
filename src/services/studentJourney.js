import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'
import { LICENSE_RESULT, STUDENT_STATUS } from '../lib/studentJourney'

export async function recordLicenseResult(studentId, result) {
  try {
    const { data, error } = await supabase.rpc('record_license_result', {
      p_student_id: studentId,
      p_result: result,
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: toUserError(error, 'save') }
  }
}

export async function reactivateStudentAccess(studentId) {
  try {
    const { data, error } = await supabase.rpc('reactivate_student_access', {
      p_student_id: studentId,
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: toUserError(error, 'save') }
  }
}

export async function listStudentsForLicenseResult() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        file_number,
        status,
        license_result,
        license_obtained_at,
        is_archived,
        code_status,
        profile_id,
        profile:profile_id(id, is_active, access_expires_at)
      `)
      .eq('is_archived', false)
      .in('license_result', [LICENSE_RESULT.AWAITING, LICENSE_RESULT.PENDING])
      .order('last_name', { ascending: true })
    if (error) throw error

    const awaiting = (data || []).filter(
      (row) => row.license_result === LICENSE_RESULT.AWAITING
        || row.license_result === LICENSE_RESULT.PENDING
        || row.status === STUDENT_STATUS.EXAM_AWAITING_RESULT,
    )

    return { students: awaiting, error: null }
  } catch (error) {
    return { students: [], error }
  }
}

export async function listArchivedStudents() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        file_number,
        status,
        license_result,
        license_obtained_at,
        archived_at,
        is_archived,
        profile_id,
        profile:profile_id(id, is_active, access_expires_at)
      `)
      .or('is_archived.eq.true,license_result.eq.obtained,status.eq.Archivé')
      .order('license_obtained_at', { ascending: false, nullsFirst: false })
    if (error) throw error
    return { students: data || [], error: null }
  } catch (error) {
    return { students: [], error }
  }
}

export async function runStudentAccessExpiryChecks() {
  try {
    const { data, error } = await supabase.rpc('run_student_access_expiry_checks')
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
