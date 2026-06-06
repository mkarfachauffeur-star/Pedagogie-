export const PRACTICE_EXAM_MAX_SCORE = 31
export const PRACTICE_EXAM_READY_THRESHOLD = 25
export const PRACTICE_EXAM_CONSOLIDATE_THRESHOLD = 20

export const PRACTICE_EXAM_HELP_ITEMS = [
  'Durée totale : 32 minutes.',
  'Parcours urbain, routier et/ou autoroutier.',
  'Conduite autonome environ 5 minutes.',
  'Une manoeuvre en marche arrière.',
  'Un freinage de précision.',
  'Vérifications intérieures / extérieures.',
  'Question sécurité routière.',
  'Question premiers secours.',
  'Respect du code de la route.',
  'Éco-conduite.',
  'Courtoisie envers les autres usagers.',
]

export const ELIMINATORY_ERRORS = [
  { id: 'left_lane', label: 'Circulation à gauche sur chaussée à double sens' },
  { id: 'solid_line', label: 'Franchissement d\'une ligne continue' },
  { id: 'emergency_lane', label: 'Circulation sur bande d\'arrêt d\'urgence' },
  { id: 'stop_signal', label: 'Non-respect d\'un signal prescrivant l\'arrêt' },
  { id: 'wrong_way', label: 'Circulation en sens interdit' },
  { id: 'other', label: 'Toute autre erreur éliminatoire décidée par l\'enseignant' },
]

export const STANDARD_NOTE_OPTIONS = ['E', '0', '1', '2', '3']
export const AUTONOMY_NOTE_OPTIONS = ['0', '0.5', '1']

export const PRACTICE_EXAM_SECTIONS = [
  {
    id: 'vehicle',
    title: 'Connaître et maîtriser son véhicule',
    scale: 'standard',
    items: [
      { id: 'vehicle_install', label: 'Savoir s\'installer et assurer la sécurité à bord' },
      { id: 'vehicle_checks', label: 'Effectuer les vérifications du véhicule' },
      { id: 'vehicle_controls', label: 'Connaître et utiliser les commandes' },
    ],
  },
  {
    id: 'route',
    title: 'Appréhender la route',
    scale: 'standard',
    items: [
      { id: 'route_information', label: 'Prendre l\'information' },
      { id: 'route_pace', label: 'Adapter son allure aux circonstances' },
      { id: 'route_rules', label: 'Appliquer la réglementation' },
    ],
  },
  {
    id: 'sharing',
    title: 'Partager la route',
    scale: 'standard',
    items: [
      { id: 'sharing_communicate', label: 'Communiquer avec les autres usagers' },
      { id: 'sharing_road', label: 'Partager la chaussée' },
      { id: 'sharing_space', label: 'Maintenir les espaces de sécurité' },
    ],
  },
  {
    id: 'autonomy',
    title: 'Autonomie et conscience du risque',
    scale: 'autonomy',
    items: [
      { id: 'autonomy_analysis', label: 'Analyse des situations' },
      { id: 'autonomy_adaptation', label: 'Adaptation aux situations' },
      { id: 'autonomy_driving', label: 'Conduite autonome' },
    ],
  },
]

export const ALL_COMPETENCE_ITEMS = PRACTICE_EXAM_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({ ...item, sectionId: section.id, scale: section.scale })),
)

/** Liens vers le livret numérique */
export const COMPETENCE_LESSON_LINKS = {
  vehicle_install: { moduleId: 'SC1.2', label: 'S\'installer au poste de conduite', href: '/student/lessons' },
  vehicle_checks: { moduleId: 'SC1.1', label: 'Connaître les principaux organes du véhicule', href: '/student/lessons' },
  vehicle_controls: { moduleId: 'SC1.6', label: 'Utiliser la boîte de vitesse', href: '/student/lessons' },
  route_information: { moduleId: 'SC1.8', label: 'Regarder autour de soi et avertir', href: '/student/lessons' },
  route_pace: { moduleId: 'SC1.5', label: 'Doser l\'accélération et le freinage', href: '/student/lessons' },
  route_rules: { moduleId: 'SC2.1', label: 'Rechercher la signalisation et les indices utiles', href: '/student/lessons' },
  sharing_communicate: { moduleId: 'SC1.8', label: 'Regarder autour de soi et avertir', href: '/student/lessons' },
  sharing_road: { moduleId: 'SC3.2', label: 'Croiser, dépasser et être dépassé', href: '/student/lessons' },
  sharing_space: { moduleId: 'SC3.1', label: 'Évaluer distances et vitesses', href: '/student/lessons' },
  autonomy_analysis: { moduleId: 'SC2.3', label: 'Adapter son allure aux situations', href: '/student/lessons' },
  autonomy_adaptation: { moduleId: 'SC3.6', label: 'Conduire dans une circulation dense', href: '/student/lessons' },
  autonomy_driving: { moduleId: 'SC4.1', label: 'Suivre un itinéraire de manière autonome', href: '/student/lessons' },
}

export function emptyScoreForm() {
  return Object.fromEntries(ALL_COMPETENCE_ITEMS.map((item) => [item.id, 'E']))
}

export function resultLabel(result) {
  if (result === 'favorable') return 'Favorable'
  if (result === 'echec') return 'Échec'
  return 'Insuffisant'
}

export function readinessLabel(level) {
  if (level === 'ready') return 'Prêt pour l\'examen'
  if (level === 'consolidate') return 'À consolider'
  return 'Niveau insuffisant'
}

export function readinessEmoji(level) {
  if (level === 'ready') return '🟢'
  if (level === 'consolidate') return '🟠'
  return '🔴'
}
