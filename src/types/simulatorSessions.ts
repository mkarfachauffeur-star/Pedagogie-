/** Mode d'encadrement des séances simulateur (paramètre établissement). */
export type SimulatorSessionSupervisorMode = 'teacher' | 'admin_supervisor'

export const SIMULATOR_SESSION_SUPERVISOR_MODES = {
  TEACHER: 'teacher',
  ADMIN_SUPERVISOR: 'admin_supervisor',
} as const satisfies Record<string, SimulatorSessionSupervisorMode>

export type SimulatorSessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export const SIMULATOR_SESSION_STATUSES = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, SimulatorSessionStatus>

/** Ressource simulateur (ligne teachers.resource_type = simulator). */
export interface SimulatorResource {
  id: string
  label: string
  authorizationNumber: string | null
}

export interface SimulatorSessionRecord {
  id: string
  organizationId: string
  studentId: string
  studentFirstName?: string
  studentLastName?: string
  studentFileNumber?: string | null
  simulatorId: string
  simulatorName?: string
  simulatorAuthorizationNumber?: string | null
  supervisorId: string
  supervisorName?: string
  supervisorMode: SimulatorSessionSupervisorMode
  sessionDate: string
  startTime: string
  endTime: string
  durationMinutes: number
  status: SimulatorSessionStatus
  notes?: string | null
  rdvPermisExternalId?: string | null
  rdvPermisSyncStatus?: 'pending' | 'synced' | 'error' | null
  createdAt?: string
  updatedAt?: string
  closedAt?: string | null
}

/** Payload normalisé pour une future synchronisation RdvPermis. */
export interface RdvPermisSimulatorSessionExport {
  sessionId: string
  studentId: string
  simulatorAuthorizationNumber: string
  supervisorProfileId: string
  supervisorMode: SimulatorSessionSupervisorMode
  sessionDate: string
  startTime: string
  endTime: string
  durationMinutes: number
  status: SimulatorSessionStatus
  rdvPermisExternalId?: string | null
  rdvPermisSyncStatus?: 'pending' | 'synced' | 'error' | null
}

export interface SimulatorSessionFormPayload {
  id?: string
  studentId: string
  simulatorId: string
  supervisorId: string
  sessionDate: string
  startTime: string
  endTime: string
  notes?: string
  status?: SimulatorSessionStatus
}
