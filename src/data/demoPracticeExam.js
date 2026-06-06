import { getStoredRole } from '../utils/authSession'

export const DEMO_STUDENT = {
  id: 'demo-student-001',
  firstName: 'Lina',
  lastName: 'Martin',
  teacher: 'M. Dupont',
  formationType: 'Permis B 20h + Code',
  codeStatus: 'Obtenu',
}

export const DEMO_PROFILE_IDS = {
  student: 'demo-student-001',
  teacher: 'demo-teacher-001',
  organization: 'demo-organization-001',
}

export function isDemoAuth(profileId, organizationId) {
  return profileId === DEMO_PROFILE_IDS.student
    || profileId === DEMO_PROFILE_IDS.teacher
    || organizationId === DEMO_PROFILE_IDS.organization
}

export function isDemoStudentId(studentId) {
  return studentId === DEMO_STUDENT.id || studentId === DEMO_PROFILE_IDS.student
}

function hasPersistedSupabaseSession() {
  if (typeof window === 'undefined') return false
  return Object.keys(window.localStorage).some((key) => {
    if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) return false
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return false
      const parsed = JSON.parse(raw)
      return Boolean(parsed?.access_token)
    } catch {
      return false
    }
  })
}

export function clearPersistedSupabaseSession() {
  if (typeof window === 'undefined') return
  Object.keys(window.localStorage).forEach((key) => {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      window.localStorage.removeItem(key)
    }
  })
}

/** Accès démo local (rôle en localStorage, sans session Supabase persistée). */
export function isLocalDemoSession() {
  if (typeof window === 'undefined') return false
  return Boolean(getStoredRole()) && !hasPersistedSupabaseSession()
}

export function getDemoPracticeExams() {
  return [
    {
      id: 'demo-exam-002',
      student_id: DEMO_STUDENT.id,
      teacher_id: DEMO_PROFILE_IDS.teacher,
      exam_date: '2026-05-28',
      score_total: 26.5,
      result: 'favorable',
      comment: 'Bonne progression globale. Continuer à travailler la prise d\'information aux intersections.',
      has_eliminatory_error: false,
      eliminatory_errors: [],
      bonus_courtesy: true,
      bonus_eco: false,
      teacher: { full_name: 'M. Dupont' },
      pedagogical_report: {
        strengths: [
          'Adapter son allure aux circonstances',
          'Maintenir les espaces de sécurité',
          'Communiquer avec les autres usagers',
        ],
        weaknesses: [
          'Prendre l\'information',
          'Contrôler les rétroviseurs et angles morts',
          'Analyse des situations',
        ],
        recommendedLessons: [
          { moduleId: 'SC1.8', label: 'Regarder autour de soi et avertir', href: '/student/lessons' },
          { moduleId: 'SC2.1', label: 'Rechercher la signalisation et les indices utiles', href: '/student/lessons' },
        ],
        summaryLines: ['Objectif : atteindre au minimum 25/31 avant présentation à l\'examen.'],
      },
      item_scores: [
        { competence_id: 'vehicle_install', note: '3' },
        { competence_id: 'vehicle_checks', note: '2' },
        { competence_id: 'vehicle_controls', note: '3' },
        { competence_id: 'route_information', note: '1' },
        { competence_id: 'route_pace', note: '3' },
        { competence_id: 'route_rules', note: '2' },
        { competence_id: 'sharing_communicate', note: '3' },
        { competence_id: 'sharing_road', note: '2' },
        { competence_id: 'sharing_space', note: '3' },
        { competence_id: 'autonomy_analysis', note: '0.5' },
        { competence_id: 'autonomy_adaptation', note: '1' },
        { competence_id: 'autonomy_driving', note: '1' },
      ],
      created_at: '2026-05-28T10:00:00.000Z',
    },
    {
      id: 'demo-exam-001',
      student_id: DEMO_STUDENT.id,
      teacher_id: DEMO_PROFILE_IDS.teacher,
      exam_date: '2026-05-14',
      score_total: 21,
      result: 'insuffisant',
      comment: 'Manque d\'anticipation. Reprendre les intersections et le contrôle visuel.',
      has_eliminatory_error: false,
      eliminatory_errors: [],
      bonus_courtesy: false,
      bonus_eco: true,
      teacher: { full_name: 'M. Dupont' },
      pedagogical_report: {
        strengths: ['Savoir s\'installer et assurer la sécurité à bord', 'Appliquer la réglementation'],
        weaknesses: ['Prendre l\'information', 'Partager la chaussée', 'Conduite autonome'],
        recommendedLessons: [
          { moduleId: 'SC1.8', label: 'Regarder autour de soi et avertir', href: '/student/lessons' },
        ],
        summaryLines: ['Objectif : atteindre au minimum 25/31 avant présentation à l\'examen.'],
      },
      item_scores: [
        { competence_id: 'vehicle_install', note: '2' },
        { competence_id: 'vehicle_checks', note: '2' },
        { competence_id: 'vehicle_controls', note: '2' },
        { competence_id: 'route_information', note: '1' },
        { competence_id: 'route_pace', note: '2' },
        { competence_id: 'route_rules', note: '2' },
        { competence_id: 'sharing_communicate', note: '2' },
        { competence_id: 'sharing_road', note: '1' },
        { competence_id: 'sharing_space', note: '2' },
        { competence_id: 'autonomy_analysis', note: '0.5' },
        { competence_id: 'autonomy_adaptation', note: '0.5' },
        { competence_id: 'autonomy_driving', note: '0.5' },
      ],
      created_at: '2026-05-14T10:00:00.000Z',
    },
  ]
}
