/** Utilitaires partagés comptes utilisateurs / enseignants. */

import { roleLabelFor } from './genderedRoles'

/** Libellés masculins par défaut (sélecteurs de rôle, etc.). */
export const USER_ROLE_LABELS = {
  manager: 'Gérant',
  teacher: 'Enseignant',
  secretary: 'Secrétariat',
}

/** Libellé de rôle pour une personne, conjugué selon le genre. */
export function staffRoleLabel(role, gender) {
  return roleLabelFor(role, gender) || USER_ROLE_LABELS[role] || role || ''
}

export const STAFF_ROLES = ['manager', 'teacher', 'secretary']

export function formatPersonName(person = {}) {
  const firstName = String(person.firstName ?? person.first_name ?? '').trim()
  const lastName = String(person.lastName ?? person.last_name ?? '').trim()
  return [lastName, firstName].filter(Boolean).join(' ')
}

export function splitFullName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { lastName: parts[0], firstName: '' }
  return { lastName: parts[0], firstName: parts.slice(1).join(' ') }
}

export function joinFullName(firstName, lastName) {
  return formatPersonName({ firstName, lastName })
}

export function formatDateFr(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('fr-FR')
  } catch {
    return value
  }
}

export function formatDateTimeFr(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

/** Statut compte : Actif / Invitation en attente / Désactivé */
export function computeAccountStatus({
  isActive = true,
  invitedAt,
  emailConfirmedAt,
  lastSignInAt,
} = {}) {
  if (!isActive) return { label: 'Désactivé', tone: 'rose' }
  if (invitedAt && !emailConfirmedAt && !lastSignInAt) {
    return { label: 'Invitation en attente', tone: 'amber' }
  }
  return { label: 'Actif', tone: 'emerald' }
}

/** Statut métier enseignant */
export function computeTeacherStatus({ isActive = true, employmentStatus } = {}) {
  if (!isActive) return { label: 'Désactivé', tone: 'rose' }
  return { label: employmentStatus || 'Actif', tone: 'cyan' }
}

export const STATUS_BADGE = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-300',
}
