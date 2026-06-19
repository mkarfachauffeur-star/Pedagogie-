/** Types de ressources pédagogiques exportables vers RdvPermis. */
export type TeachingResourceType = 'teacher' | 'simulator'

/** Valeurs connues aujourd'hui ; extensible lors de nouveaux types RdvPermis. */
export const TEACHING_RESOURCE_TYPES = {
  TEACHER: 'teacher',
  SIMULATOR: 'simulator',
} as const satisfies Record<string, TeachingResourceType>

export interface TeachingResourceRecord {
  profileId: string
  organizationId?: string
  resourceType: TeachingResourceType
  authorizationNumber: string | null
  authorizationExpiresAt?: string | null
  fullName: string
  email?: string | null
  phone?: string | null
  authorizedCategories?: string[]
  isActive?: boolean
  createdAt?: string
}

/** Payload normalisé pour une future synchronisation API RdvPermis. */
export interface RdvPermisTeachingResourceExport {
  resourceType: TeachingResourceType
  authorizationNumber: string
  displayName: string
  profileId: string
  /** Réservé à la future intégration. */
  rdvPermisExternalId?: string | null
  rdvPermisSyncStatus?: 'pending' | 'synced' | 'error' | null
}

export interface TeachingResourceFormPayload {
  resourceType: TeachingResourceType
  authorizationNumber: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  birthDate?: string
  authorizationExpiresAt?: string
  categories?: string[]
  employmentStatus?: string
  linkProfileId?: string
}
