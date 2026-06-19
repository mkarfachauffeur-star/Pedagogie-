import {
  listRdvPermisExportableResources,
  normalizeTeachingResourceType,
  TEACHING_RESOURCE_TYPES,
  toRdvPermisTeachingResourceExport,
} from '../lib/teachingResources'
import { listRdvPermisExportableSimulatorSessions } from '../lib/simulatorSessions'
import { listTeachers } from './teachers'
import { listSimulatorSessions } from './simulatorSessions'

/**
 * Point d'entrée futur pour la synchronisation RdvPermis.
 * Chaque ressource (enseignant ou simulateur) est exportée indépendamment.
 */
export async function listRdvPermisTeachingResources({ resourceType } = {}) {
  const { teachers, error } = await listTeachers()
  if (error) return { resources: [], error }

  const normalizedType = resourceType ? normalizeTeachingResourceType(resourceType) : null
  const filtered = normalizedType
    ? (teachers || []).filter((row) => normalizeTeachingResourceType(row.resource_type) === normalizedType)
    : teachers || []

  return {
    resources: listRdvPermisExportableResources(filtered),
    error: null,
  }
}

export async function getRdvPermisTeachingResource(profileId) {
  const { teachers, error } = await listTeachers()
  if (error) return { resource: null, error }

  const record = (teachers || []).find((row) => row.profile_id === profileId)
  return {
    resource: toRdvPermisTeachingResourceExport(record),
    error: record ? null : new Error('Ressource introuvable.'),
  }
}

export { TEACHING_RESOURCE_TYPES, toRdvPermisTeachingResourceExport }

/** Séances simulateur exportables vers RdvPermis (future API). */
export async function listRdvPermisSimulatorSessions(filters = {}) {
  const { sessions, error } = await listSimulatorSessions(filters)
  if (error) return { sessions: [], error }
  return {
    sessions: listRdvPermisExportableSimulatorSessions(
      (sessions || []).map((session) => ({
        id: session.id,
        student_id: session.studentId,
        simulator_authorization_number: session.simulatorAuthorizationNumber,
        supervisor_id: session.supervisorId,
        supervisor_mode: session.supervisorMode,
        session_date: session.sessionDate,
        start_time: session.startTime,
        end_time: session.endTime,
        duration_minutes: session.durationMinutes,
        status: session.status,
        rdv_permis_external_id: session.rdvPermisExternalId,
        rdv_permis_sync_status: session.rdvPermisSyncStatus,
      })),
    ),
    error: null,
  }
}
