export const PRE_REGISTRATION_TRAININGS = [
  'Permis B',
  'AAC',
  'Conduite supervisée',
  'Moto A1',
  'Moto A2',
  'Permis AM',
]

export const PRE_REGISTRATION_STATUS_LABELS = {
  pending: 'En attente',
  approved: 'Acceptée',
  rejected: 'Refusée',
}

export function preRegistrationStatusClass(status) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800'
  if (status === 'rejected') return 'bg-rose-100 text-rose-800'
  return 'bg-amber-100 text-amber-800'
}
