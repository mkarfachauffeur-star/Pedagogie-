import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'
import { subscribePostgresChanges } from './realtime'
import { normalizeSupervisorMode } from '../lib/simulatorSessions'
import { fetchOrganization } from './organization'
import { listStudents } from './students'

function mapStudentOption(student) {
  const label = `${student.last_name || ''} ${student.first_name || ''}`.trim()
    || student.file_number
    || 'Élève'
  return {
    id: student.id,
    label,
    file_number: student.file_number || null,
  }
}

async function loadSimulatorSessionFormOptionsFallback() {
  const [
    orgRes,
    studentsRes,
    simulatorsRes,
    teacherSupervisorsRes,
    adminSupervisorsRes,
  ] = await Promise.all([
    fetchOrganization(),
    listStudents(),
    supabase
      .from('teachers')
      .select('profile_id, authorization_number, is_active, profiles:profile_id(full_name, is_active)')
      .eq('resource_type', 'simulator')
      .eq('is_active', true),
    supabase
      .from('teachers')
      .select('profile_id, is_active, profiles:profile_id(full_name, is_active)')
      .eq('resource_type', 'teacher')
      .eq('is_active', true),
    supabase
      .from('profiles')
      .select('id, full_name, role, is_active')
      .in('role', ['manager', 'secretary'])
      .eq('is_active', true),
  ])

  const supervisorMode = normalizeSupervisorMode(
    orgRes.organization?.simulator_session_supervisor_mode,
  )

  const students = (studentsRes.students || []).map(mapStudentOption)

  const simulators = (simulatorsRes.data || [])
    .filter((row) => row.is_active !== false && row.profiles?.is_active !== false)
    .map((row) => ({
      id: row.profile_id,
      label: row.profiles?.full_name?.trim() || 'Simulateur',
      authorization_number: row.authorization_number || null,
    }))

  const supervisors = supervisorMode === 'teacher'
    ? (teacherSupervisorsRes.data || [])
      .filter((row) => row.is_active !== false && row.profiles?.is_active !== false)
      .map((row) => ({
        id: row.profile_id,
        label: row.profiles?.full_name?.trim() || 'Enseignant',
      }))
    : (adminSupervisorsRes.data || [])
      .map((row) => ({
        id: row.id,
        label: row.full_name?.trim() || 'Encadrant',
        role: row.role,
      }))

  return {
    supervisorMode,
    simulators,
    students,
    supervisors,
    error: null,
  }
}

function mapSessionRow(row) {
  if (!row) return null
  return {
    id: row.id,
    organizationId: row.organization_id,
    studentId: row.student_id,
    studentFirstName: row.student_first_name,
    studentLastName: row.student_last_name,
    studentFileNumber: row.student_file_number,
    simulatorId: row.simulator_id,
    simulatorName: row.simulator_name,
    simulatorAuthorizationNumber: row.simulator_authorization_number,
    supervisorId: row.supervisor_id,
    supervisorName: row.supervisor_name,
    supervisorMode: row.supervisor_mode,
    sessionDate: row.session_date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    status: row.status,
    notes: row.notes,
    rdvPermisExternalId: row.rdv_permis_external_id,
    rdvPermisSyncStatus: row.rdv_permis_sync_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  }
}

export async function listSimulatorSessions({ dateFrom, dateTo, studentId, simulatorId } = {}) {
  try {
    const { data, error } = await supabase.rpc('list_organization_simulator_sessions', {
      p_date_from: dateFrom || null,
      p_date_to: dateTo || null,
      p_student_id: studentId || null,
      p_simulator_id: simulatorId || null,
    })
    if (error) throw error
    return { sessions: (data || []).map(mapSessionRow), error: null }
  } catch (error) {
    return { sessions: [], error }
  }
}

export async function loadSimulatorSessionFormOptions() {
  try {
    const { data, error } = await supabase.rpc('list_simulator_session_form_options')
    if (error) throw error
    return {
      supervisorMode: normalizeSupervisorMode(data?.supervisor_mode),
      simulators: data?.simulators || [],
      students: data?.students || [],
      supervisors: data?.supervisors || [],
      error: null,
    }
  } catch (error) {
    try {
      return await loadSimulatorSessionFormOptionsFallback()
    } catch (fallbackError) {
      return {
        supervisorMode: normalizeSupervisorMode('admin_supervisor'),
        simulators: [],
        students: [],
        supervisors: [],
        error: fallbackError,
      }
    }
  }
}

function sessionInsertPayload(organizationId, profileId, payload, supervisorMode) {
  return {
    organization_id: organizationId,
    student_id: payload.studentId,
    simulator_id: payload.simulatorId,
    supervisor_id: payload.supervisorId,
    supervisor_mode: supervisorMode,
    session_date: payload.sessionDate,
    start_time: payload.startTime,
    end_time: payload.endTime,
    notes: payload.notes?.trim() || null,
    status: payload.status || 'planned',
    created_by: profileId,
  }
}

function sessionUpdatePayload(payload) {
  return {
    student_id: payload.studentId,
    simulator_id: payload.simulatorId,
    supervisor_id: payload.supervisorId,
    session_date: payload.sessionDate,
    start_time: payload.startTime,
    end_time: payload.endTime,
    notes: payload.notes?.trim() || null,
    status: payload.status,
  }
}

export async function createSimulatorSession({
  organizationId,
  profileId,
  payload,
  supervisorMode,
}) {
  try {
    const { data: sessionId, error: rpcError } = await supabase.rpc('create_simulator_session', {
      p_student_id: payload.studentId,
      p_simulator_id: payload.simulatorId,
      p_supervisor_id: payload.supervisorId,
      p_session_date: payload.sessionDate,
      p_start_time: payload.startTime,
      p_end_time: payload.endTime,
      p_notes: payload.notes?.trim() || null,
    })

    if (!rpcError && sessionId) {
      return { sessionId, error: null }
    }

    if (rpcError) {
      const rpcMissing = rpcError.code === 'PGRST202'
        || /create_simulator_session/i.test(rpcError.message || '')
        || /could not find the function/i.test(rpcError.message || '')

      if (!rpcMissing) throw rpcError
    }

    const { data, error } = await supabase
      .from('simulator_sessions')
      .insert(sessionInsertPayload(organizationId, profileId, payload, supervisorMode))
      .select('id')
      .single()
    if (error) throw error
    return { sessionId: data?.id || null, error: null }
  } catch (error) {
    return { sessionId: null, error: toUserError(error, 'save') }
  }
}

export async function updateSimulatorSession(sessionId, payload) {
  try {
    const { error } = await supabase
      .from('simulator_sessions')
      .update(sessionUpdatePayload(payload))
      .eq('id', sessionId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'save') }
  }
}

export async function closeSimulatorSession(sessionId) {
  try {
    const { error } = await supabase
      .from('simulator_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'save') }
  }
}

export async function cancelSimulatorSession(sessionId) {
  try {
    const { error } = await supabase
      .from('simulator_sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'save') }
  }
}

export async function deleteSimulatorSession(sessionId) {
  try {
    const { error } = await supabase
      .from('simulator_sessions')
      .delete()
      .eq('id', sessionId)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'permission') }
  }
}

export function subscribeSimulatorSessions(onChange) {
  return subscribePostgresChanges({
    topicBase: 'simulator-sessions',
    listeners: [
      { config: { event: '*', schema: 'public', table: 'simulator_sessions' }, callback: onChange },
    ],
  })
}

export async function listSimulatorResources() {
  const { simulators, error } = await loadSimulatorSessionFormOptions()
  if (error) return { resources: [], error }
  return {
    resources: (simulators || []).map((row) => ({
      id: row.id,
      label: row.label,
      authorizationNumber: row.authorization_number || null,
    })),
    error: null,
  }
}
