const ROLE_LABELS = {
  manager: 'Gérant',
  secretary: 'Secrétariat',
  teacher: 'Enseignant',
  student: 'Élève',
}

export function roleLabel(role) {
  if (!role) return 'Utilisateur'
  return ROLE_LABELS[role] || role
}

export function contactDisplayName(fullName, role) {
  const name = (fullName || '').trim()
  if (name) return name
  return roleLabel(role)
}
