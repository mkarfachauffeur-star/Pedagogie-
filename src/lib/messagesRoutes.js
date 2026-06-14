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

export function getMessagesRoute(role) {
  return MESSAGES_ROUTE_BY_ROLE[role] || null
}

export function getPreRegistrationsRoute(role) {
  return PRE_REGISTRATIONS_ROUTE_BY_ROLE[role] || null
}
