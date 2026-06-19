import { isAacFormation } from '../lib/studentTrack'

const PERMIS_B_ITEMS = [
  { href: '/student/dashboard', icon: '\u{1F4CA}', label: 'Tableau de bord' },
  { href: '/student/planning', icon: '\u{1F4C5}', label: 'Planning' },
  { href: '/student/initial-assessment', icon: '\u{1F4CB}', label: 'Évaluation de départ', track: 'permis_b' },
  { href: '/student/lessons', icon: '\u{1F4DA}', label: 'Compétences', track: 'permis_b' },
  { href: '/student/competency-reports', icon: '\u{1F4D3}', label: 'Historique des leçons', track: 'permis_b' },
  {
    href: '/student/pedagogical-appointments',
    icon: '\u{1F697}',
    label: 'Rendez-vous pédagogiques (AAC)',
    track: 'permis_b',
    aacOnly: true,
  },
  { href: '/student/documents', icon: '\u{1F4C1}', label: 'Documents' },
]

const MOTO_AM_ITEMS = [
  { href: '/student/dashboard', icon: '\u{1F4CA}', label: 'Tableau de bord' },
  { href: '/student/planning', icon: '\u{1F4C5}', label: 'Planning' },
  { href: '/student/next-lesson', icon: '\u{1F3CD}\uFE0F', label: 'Prochaine leçon', track: 'moto_am' },
  { href: '/student/documents', icon: '\u{1F4C1}', label: 'Documents' },
]

export function getStudentNavItems(track, student = null) {
  const items = track === 'moto_am' ? MOTO_AM_ITEMS : PERMIS_B_ITEMS
  return items.filter((item) => {
    if (item.aacOnly && !isAacFormation(student)) return false
    return true
  })
}

export const NAVIGATION = {
  manager: {
    user: { avatar: '\u{1F4BC}', name: 'Gérant', role: 'Gérant' },
    items: [
      { href: '/manager/dashboard', icon: '\u{1F4CA}', label: 'Tableau de bord' },
      { href: '/manager/teachers', icon: '\u{1F468}\u200D\u{1F3EB}', label: 'Enseignants' },
      { href: '/manager/simulator-sessions', icon: '\u{1F5A5}\uFE0F', label: 'Séances simulateur' },
      { href: '/manager/students', icon: '\u{1F465}', label: 'Élèves' },
      { href: '/manager/pre-registrations', icon: '\u{1F4DD}', label: 'Pré-inscriptions' },
      { href: '/manager/users', icon: '\u{1F510}', label: 'Utilisateurs' },
      { href: '/manager/planning', icon: '\u{1F4C5}', label: 'Planning global' },
      { href: '/manager/vehicles', icon: '\u{1F698}', label: 'Gestion des véhicules' },
      { href: '/manager/contracts', icon: '\u{1F4C4}', label: 'Contrats' },
      { href: '/manager/payments', icon: '\u{1F4B0}', label: 'Paiements' },
      { href: '/manager/packages', icon: '\u{1F4B8}', label: 'Formules & tarifs' },
      { href: '/manager/exports', icon: '\u{1F4E4}', label: 'Exports réglementaires' },
      { href: '/manager/messages', icon: '\u{1F4AC}', label: 'Messages' },
      { href: '/manager/statistics', icon: '\u{1F4C8}', label: 'Évolution du CA' },
      { href: '/manager/settings', icon: '\u2699\uFE0F', label: 'Paramètres' },
    ],
  },
  student: {
    user: null,
    items: PERMIS_B_ITEMS,
  },
  teacher: {
    user: { avatar: '\u{1F468}\u200D\u{1F3EB}', name: 'Enseignant', role: 'Enseignant' },
    items: [
      { href: '/teacher/dashboard', icon: '\u{1F4CA}', label: 'Tableau de bord' },
      { href: '/teacher/planning', icon: '\u{1F4C5}', label: 'Mon planning' },
      { href: '/teacher/students', icon: '\u{1F465}', label: 'Mes élèves' },
      { href: '/teacher/simulator-sessions', icon: '\u{1F5A5}\uFE0F', label: 'Séances simulateur' },
      { href: '/teacher/messages', icon: '\u{1F4AC}', label: 'Messagerie' },
      { href: '/teacher/finance', icon: '\u{1F4B8}', label: 'Finances' },
    ],
  },
  secretary: {
    user: { avatar: '\u{1F469}\u200D\u{1F4BC}', name: 'Secrétariat', role: 'Secrétariat' },
    items: [
      { href: '/secretary/dashboard', icon: '\u{1F4CA}', label: 'Tableau de bord' },
      { href: '/secretary/inscriptions', icon: '\u{1F4DD}', label: 'Inscriptions' },
      { href: '/secretary/pre-registrations', icon: '\u{1F4CB}', label: 'Pré-inscriptions' },
      { href: '/secretary/planning', icon: '\u{1F4C5}', label: 'Planning global' },
      { href: '/secretary/simulator-sessions', icon: '\u{1F5A5}\uFE0F', label: 'Séances simulateur' },
      { href: '/secretary/vehicles', icon: '\u{1F698}', label: 'Gestion des véhicules' },
      { href: '/secretary/paiements', icon: '\u{1F4B0}', label: 'Paiements' },
      { href: '/secretary/documents', icon: '\u{1F4C1}', label: 'Documents' },
      { href: '/secretary/exams', icon: '\u{1F3AF}', label: 'Examens' },
      { href: '/secretary/messages', icon: '\u{1F4AC}', label: 'Messages' },
    ],
  },
}
