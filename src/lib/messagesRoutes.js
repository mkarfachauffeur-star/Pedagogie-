export const MESSAGES_ROUTE_BY_ROLE = {
  manager: '/manager/messages',
  teacher: '/teacher/messages',
  secretary: '/secretary/messages',
  student: '/student/messages',
}

export const PRE_REGISTRATIONS_ROUTE_BY_ROLE = {
  manager: '/manager/pre-registrations',
  secretary: '/secretary/pre-registrations',
}

const EXPIRY_REMINDER_ROUTE_BY_ROLE = {
  manager: {
    teacher_authorization: '/manager/teachers',
    simulator_authorization: '/manager/teachers',
    vehicle_technical_control: '/manager/vehicles',
    fleet_monthly_maintenance: '/manager/vehicles',
  },
  secretary: {
    teacher_authorization: '/secretary/dashboard',
    simulator_authorization: '/secretary/dashboard',
    vehicle_technical_control: '/secretary/vehicles',
  },
}

export function getMessagesRoute(role) {
  return MESSAGES_ROUTE_BY_ROLE[role] || null
}

export function getPreRegistrationsRoute(role) {
  return PRE_REGISTRATIONS_ROUTE_BY_ROLE[role] || null
}

export function getExpiryReminderRoute(role, expiryKind) {
  return EXPIRY_REMINDER_ROUTE_BY_ROLE[role]?.[expiryKind] || null
}

const STUDENT_DOSSIER_ROUTE_BY_ROLE = {
  manager: '/manager/students',
  secretary: '/secretary/inscriptions',
}

export function getStudentDossierRoute(role, studentId) {
  const base = STUDENT_DOSSIER_ROUTE_BY_ROLE[role]
  if (!base || !studentId) return null
  return `${base}?student=${encodeURIComponent(studentId)}`
}

export function getAutomatedReminderRoute(role, reminderKind, studentId) {
  if (reminderKind === 'code_missing' || reminderKind === 'license_obtained') {
    return getStudentDossierRoute(role, studentId)
  }
  return null
}
