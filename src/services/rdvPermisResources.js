import {
  listRdvPermisExportableResources,
  normalizeTeachingResourceType,
  TEACHING_RESOURCE_TYPES,
  toRdvPermisTeachingResourceExport,
} from '../lib/teachingResources'
import { listTeachers } from './teachers'

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
