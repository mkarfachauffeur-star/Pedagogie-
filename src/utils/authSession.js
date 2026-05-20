export const AUTH_ROLE_KEY = 'pedagogia-drive-auth-role'

export const roleDestinations = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  secretary: '/secretary/dashboard',
  manager: '/manager/dashboard',
}

export const roleLabels = {
  student: 'Élève',
  teacher: 'Enseignant',
  secretary: 'Secrétariat',
  manager: 'Gérant',
}

export function getStoredRole() {
  if (typeof window === 'undefined') return null
  const role = window.localStorage.getItem(AUTH_ROLE_KEY)
  return roleDestinations[role] ? role : null
}

export function setStoredRole(role) {
  if (typeof window === 'undefined') return
  if (!roleDestinations[role]) return
  window.localStorage.setItem(AUTH_ROLE_KEY, role)
}

export function clearStoredRole() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_ROLE_KEY)
}
