/** @typedef {import('../types/simulatorSessions').SimulatorSessionSupervisorMode} SimulatorSessionSupervisorMode */
/** @typedef {import('../types/simulatorSessions').SimulatorSessionStatus} SimulatorSessionStatus */
/** @typedef {import('../types/simulatorSessions').RdvPermisSimulatorSessionExport} RdvPermisSimulatorSessionExport */

export const SIMULATOR_SESSION_SUPERVISOR_MODES = {
  TEACHER: 'teacher',
  ADMIN_SUPERVISOR: 'admin_supervisor',
}

export const SIMULATOR_SESSION_SUPERVISOR_MODE_OPTIONS = [
  {
    value: SIMULATOR_SESSION_SUPERVISOR_MODES.ADMIN_SUPERVISOR,
    label: 'Mode B — Encadrant administratif (gérant ou secrétaire)',
    shortLabel: 'Encadrant administratif',
    description: 'Les séances simulateur sont gérées par le gérant ou la secrétaire pendant que les enseignants sont en conduite.',
  },
  {
    value: SIMULATOR_SESSION_SUPERVISOR_MODES.TEACHER,
    label: 'Mode A — Encadrant enseignant',
    shortLabel: 'Enseignant référent',
    description: 'Chaque séance simulateur est rattachée à un enseignant (moniteur).',
  },
]

export const SIMULATOR_SESSION_STATUSES = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const SIMULATOR_SESSION_STATUS_LABELS = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Clôturée',
  cancelled: 'Annulée',
}

export const SIMULATOR_SESSION_STATUS_BADGE = {
  planned: 'border-blue-300 bg-blue-50 text-blue-800',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-800',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  cancelled: 'border-slate-300 bg-slate-100 text-slate-600',
}

export function normalizeSupervisorMode(value) {
  const normalized = String(value || SIMULATOR_SESSION_SUPERVISOR_MODES.ADMIN_SUPERVISOR).trim()
  if (normalized === SIMULATOR_SESSION_SUPERVISOR_MODES.TEACHER) {
    return SIMULATOR_SESSION_SUPERVISOR_MODES.TEACHER
  }
  return SIMULATOR_SESSION_SUPERVISOR_MODES.ADMIN_SUPERVISOR
}

export function getSupervisorModeLabel(mode) {
  return SIMULATOR_SESSION_SUPERVISOR_MODE_OPTIONS.find((option) => option.value === mode)?.shortLabel
    || mode
}

export function getSessionStatusLabel(status) {
  return SIMULATOR_SESSION_STATUS_LABELS[status] || status
}

export function computeDurationMinutes(startTime, endTime) {
  const [sh, sm] = String(startTime || '').split(':').map(Number)
  const [eh, em] = String(endTime || '').split(':').map(Number)
  if ([sh, sm, eh, em].some((value) => Number.isNaN(value))) return 0
  const start = sh * 60 + sm
  const end = eh * 60 + em
  return Math.max(0, end - start)
}

export function formatDurationLabel(minutes) {
  if (!minutes) return '—'
  if (minutes % 60 === 0) return `${minutes / 60} h`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (!hours) return `${mins} min`
  return `${hours} h ${mins} min`
}

export function formatTimeFr(value) {
  if (!value) return '—'
  return String(value).slice(0, 5)
}

export function validateSimulatorSessionForm(payload, supervisorMode) {
  const errors = {}
  if (!payload.studentId) errors.studentId = 'Sélectionnez un élève.'
  if (!payload.simulatorId) errors.simulatorId = 'Sélectionnez un simulateur.'
  if (!payload.supervisorId) {
    errors.supervisorId = supervisorMode === SIMULATOR_SESSION_SUPERVISOR_MODES.TEACHER
      ? 'Sélectionnez un enseignant encadrant.'
      : 'Sélectionnez un encadrant (gérant ou secrétaire).'
  }
  if (!payload.sessionDate) errors.sessionDate = 'La date est obligatoire.'
  if (!payload.startTime) errors.startTime = "L'heure de début est obligatoire."
  if (!payload.endTime) errors.endTime = "L'heure de fin est obligatoire."
  else if (payload.startTime && computeDurationMinutes(payload.startTime, payload.endTime) <= 0) {
    errors.endTime = "L'heure de fin doit être postérieure à l'heure de début."
  }
  return errors
}

/**
 * @param {Record<string, unknown>} row
 * @returns {RdvPermisSimulatorSessionExport|null}
 */
export function toRdvPermisSimulatorSessionExport(row) {
  if (!row?.id || !row.simulator_authorization_number) return null
  return {
    sessionId: String(row.id),
    studentId: String(row.student_id || row.studentId),
    simulatorAuthorizationNumber: String(row.simulator_authorization_number || row.simulatorAuthorizationNumber),
    supervisorProfileId: String(row.supervisor_id || row.supervisorId),
    supervisorMode: normalizeSupervisorMode(row.supervisor_mode || row.supervisorMode),
    sessionDate: String(row.session_date || row.sessionDate),
    startTime: formatTimeFr(row.start_time || row.startTime),
    endTime: formatTimeFr(row.end_time || row.endTime),
    durationMinutes: Number(row.duration_minutes || row.durationMinutes || 0),
    status: row.status,
    rdvPermisExternalId: row.rdv_permis_external_id || row.rdvPermisExternalId || null,
    rdvPermisSyncStatus: row.rdv_permis_sync_status || row.rdvPermisSyncStatus || null,
  }
}

export function listRdvPermisExportableSimulatorSessions(rows = []) {
  return rows.map(toRdvPermisSimulatorSessionExport).filter(Boolean)
}
