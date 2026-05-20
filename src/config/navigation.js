export const NAVIGATION = {
  manager: {
    user: { avatar: '\u{1F4BC}', name: 'Gérant', role: 'Gérant' },
    items: [
      { href: '/manager/dashboard', icon: '\u{1F4CA}', label: 'Tableau de bord' },
      { href: '/manager/students', icon: '\u{1F465}', label: 'Élèves' },
      { href: '/manager/teachers', icon: '\u{1F468}\u200D\u{1F3EB}', label: 'Enseignants' },
      { href: '/manager/users', icon: '\u{1F510}', label: 'Utilisateurs' },
      { href: '/manager/planning', icon: '\u{1F4C5}', label: 'Planning global' },
      { href: '/manager/vehicles', icon: '\u{1F698}', label: 'Gestion des véhicules' },
      { href: '/manager/contracts', icon: '\u{1F4C4}', label: 'Contrats' },
      { href: '/manager/payments', icon: '\u{1F4B0}', label: 'Paiements' },
      { href: '/manager/messages', icon: '\u{1F4AC}', label: 'Messages' },
      { href: '/manager/statistics', icon: '\u{1F4C8}', label: 'Statistiques' },
      { href: '/manager/settings', icon: '\u2699\uFE0F', label: 'Paramètres' },
    ],
  },
  student: {
    user: null,
    items: [
      { href: '/student/dashboard', icon: '\u{1F4CA}', label: 'Tableau de bord' },
      { href: '/student/lessons', icon: '\u{1F4DA}', label: 'Mes leçons' },
      { href: '/student/lexicon', icon: '\u{1F4D8}', label: 'Lexique auto-école' },
      { href: '/student/exams', icon: '\u{1F3AF}', label: 'Examens' },
      { href: '/student/accompanied-driving', icon: '\u{1F697}', label: 'Conduite accompagnée' },
      { href: '/student/messages', icon: '\u{1F4AC}', label: 'Messagerie' },
    ],
  },
  teacher: {
    user: { avatar: '\u{1F468}\u200D\u{1F3EB}', name: 'Jean Moniteur', role: 'Enseignant' },
    items: [
      { href: '/teacher/dashboard', icon: '\u{1F4CA}', label: 'Tableau de bord' },
      { href: '/teacher/planning', icon: '\u{1F4C5}', label: 'Mon planning' },
      { href: '/teacher/students', icon: '\u{1F465}', label: 'Mes élèves' },
      { href: '/teacher/resources', icon: '\u{1F4D6}', label: 'REMC & Conseils enseignants' },
      { href: '/teacher/messages', icon: '\u{1F4AC}', label: 'Messagerie' },
    ],
  },
  secretary: {
    user: { avatar: '\u{1F469}\u200D\u{1F4BC}', name: 'Isabelle Lemoine', role: 'Secrétariat' },
    items: [
      { href: '/secretary/dashboard', icon: '\u{1F4CA}', label: 'Tableau de bord' },
      { href: '/secretary/inscriptions', icon: '\u{1F4DD}', label: 'Inscriptions' },
      { href: '/secretary/planning', icon: '\u{1F4C5}', label: 'Planning global' },
      { href: '/secretary/vehicles', icon: '\u{1F698}', label: 'Gestion des véhicules' },
      { href: '/secretary/paiements', icon: '\u{1F4B0}', label: 'Paiements' },
      { href: '/secretary/documents', icon: '\u{1F4C1}', label: 'Documents' },
      { href: '/secretary/exams', icon: '\u{1F3AF}', label: 'Examens' },
      { href: '/secretary/messages', icon: '\u{1F4AC}', label: 'Messages' },
    ],
  },
}
