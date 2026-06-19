/** @typedef {import('../types/teachingResources').TeachingResourceType} TeachingResourceType */
/** @typedef {import('../types/teachingResources').RdvPermisTeachingResourceExport} RdvPermisTeachingResourceExport */

export const TEACHING_RESOURCE_TYPES = {
  TEACHER: 'teacher',
  SIMULATOR: 'simulator',
}

export const TEACHING_RESOURCE_TYPE_OPTIONS = [
  { value: TEACHING_RESOURCE_TYPES.TEACHER, label: 'Enseignant' },
  { value: TEACHING_RESOURCE_TYPES.SIMULATOR, label: 'Simulateur' },
]

/** @type {Record<TeachingResourceType, RegExp>} */
export const AUTHORIZATION_NUMBER_PATTERNS = {
  teacher: /^A\d{10}$/,
  simulator: /^S\d{10}$/,
}

/** @type {Record<TeachingResourceType, string>} */
export const AUTHORIZATION_NUMBER_HINTS = {
  teacher: 'AXXXXXXXXXX',
  simulator: 'SXXXXXXXXXX',
}

export function normalizeTeachingResourceType(value) {
  const normalized = String(value || TEACHING_RESOURCE_TYPES.TEACHER).trim().toLowerCase()
  if (normalized === TEACHING_RESOURCE_TYPES.SIMULATOR) return TEACHING_RESOURCE_TYPES.SIMULATOR
  return TEACHING_RESOURCE_TYPES.TEACHER
}

export function normalizeAuthorizationNumber(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '')
}

export function getResourceTypeLabel(resourceType) {
  return TEACHING_RESOURCE_TYPE_OPTIONS.find((option) => option.value === resourceType)?.label
    || resourceType
}

export function getAuthorizationFieldLabel(resourceType) {
  return resourceType === TEACHING_RESOURCE_TYPES.SIMULATOR
    ? "Numéro d'autorisation simulateur"
    : "Numéro d'autorisation d'enseigner"
}

/**
 * @param {TeachingResourceType} resourceType
 * @param {string} authorizationNumber
 * @returns {string|null}
 */
export function validateTeachingResourceAuthorization(resourceType, authorizationNumber) {
  const type = normalizeTeachingResourceType(resourceType)
  const normalized = normalizeAuthorizationNumber(authorizationNumber)

  if (!normalized) {
    return "Le numéro d'autorisation est obligatoire."
  }

  const pattern = AUTHORIZATION_NUMBER_PATTERNS[type]
  if (!pattern?.test(normalized)) {
    return `Format attendu : ${AUTHORIZATION_NUMBER_HINTS[type]}.`
  }

  return null
}

/**
 * @param {Record<string, unknown>} record
 * @returns {RdvPermisTeachingResourceExport|null}
 */
export function toRdvPermisTeachingResourceExport(record) {
  if (!record) return null

  const resourceType = normalizeTeachingResourceType(record.resource_type || record.resourceType)
  const authorizationNumber = normalizeAuthorizationNumber(
    record.authorization_number || record.authorizationNumber,
  )
  const profileId = record.profile_id || record.profileId

  if (!profileId || validateTeachingResourceAuthorization(resourceType, authorizationNumber)) {
    return null
  }

  return {
    resourceType,
    authorizationNumber,
    displayName: String(record.full_name || record.fullName || '').trim(),
    profileId: String(profileId),
    rdvPermisExternalId: record.rdv_permis_external_id || record.rdvPermisExternalId || null,
    rdvPermisSyncStatus: record.rdv_permis_sync_status || record.rdvPermisSyncStatus || null,
  }
}

/**
 * @param {Record<string, unknown>[]} records
 * @returns {RdvPermisTeachingResourceExport[]}
 */
export function listRdvPermisExportableResources(records = []) {
  return records
    .map(toRdvPermisTeachingResourceExport)
    .filter(Boolean)
}

export function isTeacherResource(resourceType) {
  return normalizeTeachingResourceType(resourceType) === TEACHING_RESOURCE_TYPES.TEACHER
}

export function isSimulatorResource(resourceType) {
  return normalizeTeachingResourceType(resourceType) === TEACHING_RESOURCE_TYPES.SIMULATOR
}
