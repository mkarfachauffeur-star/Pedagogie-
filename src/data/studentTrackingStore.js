import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'pedagogia-drive-student-tracking'

export const formationTypeOptions = [
  'Permis B traditionnel',
  'Bo\u00eete automatique',
  'AAC',
  'Conduite supervis\u00e9e',
]

const statusScore = {
  'Non commenc\u00e9': 0,
  'D\u00e9but\u00e9': 0.34,
  'En cours': 0.67,
  'Valid\u00e9': 1,
}

const remcTemplate = [
  {
    code: 'C1',
    title: 'Ma\u00eetriser le v\u00e9hicule',
    items: [
      { id: 'c1-installation', label: 'Installation au poste de conduite', status: 'En cours' },
      { id: 'c1-volant', label: 'Tenir et tourner le volant', status: 'En cours' },
      {
        id: 'c1-demarrage',
        label: 'D\u00e9marrer et s\u2019arr\u00eater',
        status: 'Non commenc\u00e9',
      },
      { id: 'c1-commandes', label: 'Utiliser les commandes principales', status: 'Non commenc\u00e9' },
      { id: 'c1-arret', label: 'Arr\u00eat de pr\u00e9cision', status: 'Non commenc\u00e9' },
    ],
  },
  {
    code: 'C2',
    title: 'Appr\u00e9hender la route',
    items: [
      { id: 'c2-priorites', label: 'Priorit\u00e9s et intersections', status: 'Non commenc\u00e9' },
      { id: 'c2-observation', label: 'Observation et anticipation', status: 'Non commenc\u00e9' },
      { id: 'c2-allure', label: 'Adapter l\u2019allure', status: 'Non commenc\u00e9' },
      { id: 'c2-insertion', label: 'S\u2019ins\u00e9rer et changer de direction', status: 'Non commenc\u00e9' },
      { id: 'c2-position', label: 'Placement du v\u00e9hicule sur la chauss\u00e9e', status: 'Non commenc\u00e9' },
    ],
  },
  {
    code: 'C3',
    title: 'Partager la route avec les autres usagers',
    items: [
      { id: 'c3-communication', label: 'Communiquer avec les autres usagers', status: 'Non commenc\u00e9' },
      { id: 'c3-angle-mort', label: 'Contr\u00f4ler angles morts et zones de risque', status: 'Non commenc\u00e9' },
      { id: 'c3-depassement', label: 'D\u00e9passements et croisements', status: 'Non commenc\u00e9' },
      { id: 'c3-partage', label: 'Partager la route avec usagers vuln\u00e9rables', status: 'Non commenc\u00e9' },
      { id: 'c3-distance', label: 'Garder les distances de s\u00e9curit\u00e9', status: 'Non commenc\u00e9' },
    ],
  },
  {
    code: 'C4',
    title: 'Pratiquer une conduite autonome et \u00e9conomique',
    items: [
      { id: 'c4-autonomie', label: 'Pr\u00e9parer un trajet autonome', status: 'Non commenc\u00e9' },
      { id: 'c4-eco', label: 'Adopter une conduite \u00e9co-responsable', status: 'Non commenc\u00e9' },
      { id: 'c4-securite', label: 'Pr\u00e9venir les situations \u00e0 risque', status: 'Non commenc\u00e9' },
      { id: 'c4-stress', label: 'G\u00e9rer le stress et la fatigue', status: 'Non commenc\u00e9' },
      { id: 'c4-bilan', label: 'Faire un bilan de fin de trajet', status: 'Non commenc\u00e9' },
    ],
  },
]

const initialStudents = [
  {
    firstName: 'Thomas',
    lastName: 'Martin',
    formationType: 'Permis B \u00b7 Bo\u00eete manuelle',
    teacher: 'Mohamed Karfa',
    remc: remcTemplate,
    lessonHistory: [],
  },
  {
    firstName: 'Camille',
    lastName: 'Leroy',
    formationType: 'AAC',
    teacher: 'Marie Dupont',
    remc: remcTemplate,
    lessonHistory: [],
    aacTracking: {
      startDate: '2025-05-20',
      minimumEndDate: '2026-05-20',
      kilometersCurrent: 1250,
      kilometersTarget: 3000,
    },
  },
  {
    firstName: 'Nora',
    lastName: 'Faure',
    formationType: 'Permis B \u00b7 Bo\u00eete automatique',
    teacher: 'Mohamed Karfa',
    remc: remcTemplate,
    lessonHistory: [],
  },
  {
    firstName: 'Yanis',
    lastName: 'Roux',
    formationType: 'Conduite supervis\u00e9e',
    teacher: 'Mohamed Karfa',
    remc: remcTemplate,
    lessonHistory: [],
  },
  {
    firstName: 'In\u00e8s',
    lastName: 'Meyer',
    formationType: 'Permis B \u00b7 Bo\u00eete manuelle',
    teacher: 'Marie Dupont',
    remc: remcTemplate,
    lessonHistory: [],
  },
  {
    firstName: 'Lina',
    lastName: 'Bernard',
    formationType: 'Permis B \u00b7 Bo\u00eete automatique',
    teacher: 'Mohamed Karfa',
    remc: remcTemplate,
    lessonHistory: [],
  },
]

function cloneRemc() {
  return remcTemplate.map((competency) => ({
    ...competency,
    items: competency.items.map((item) => ({ ...item })),
  }))
}

function normalizeStudent(student, index = 0) {
  const base = student || {}
  const normalizedRemc =
    Array.isArray(base.remc) && base.remc.length
      ? base.remc.map((competency) => ({
          ...competency,
          items: (competency.items || []).map((item) => ({
            ...item,
            status: item.status === 'D\u00e9but\u00e9' ? 'Non commenc\u00e9' : item.status,
          })),
        }))
      : cloneRemc()
  return {
    ...base,
    id: base.id || `PD-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
    firstName: base.firstName || 'Nouvel',
    lastName: base.lastName || '\u00c9l\u00e8ve',
    formationType: base.formationType || 'Permis B traditionnel',
    teacher: base.teacher || 'Non assign\u00e9',
    remc: normalizedRemc,
    lessonHistory: Array.isArray(base.lessonHistory) ? base.lessonHistory : [],
    aacTracking: base.aacTracking || null,
  }
}

function getStoredStudents() {
  if (typeof window === 'undefined') return initialStudents
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialStudents
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return initialStudents
    const normalized = parsed.map((student, index) => normalizeStudent(student, index))
    if (normalized.length < initialStudents.length) {
      const existingKeys = new Set(normalized.map((student) => `${student.firstName}-${student.lastName}`))
      const missing = initialStudents.filter(
        (student) => !existingKeys.has(`${student.firstName}-${student.lastName}`),
      )
      return [...normalized, ...missing.map((student, index) => normalizeStudent(student, normalized.length + index))]
    }
    return normalized
  } catch {
    return initialStudents
  }
}

function computeCompetencyProgress(competency) {
  if (!competency?.items?.length) return 0
  const total = competency.items.reduce((sum, item) => sum + (statusScore[item.status] || 0), 0)
  return Math.round((total / competency.items.length) * 100)
}

export function computeStudentProgress(student) {
  if (!student?.remc?.length) return { global: 0, byCompetency: {} }
  const byCompetency = student.remc.reduce((acc, competency) => {
    acc[competency.code] = computeCompetencyProgress(competency)
    return acc
  }, {})
  const global = Math.round(
    Object.values(byCompetency).reduce((sum, value) => sum + value, 0) / student.remc.length,
  )
  return { global, byCompetency }
}

export function useStudentTrackingStore() {
  const [students, setStudents] = useState(() => getStoredStudents())

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
  }, [students])

  const studentsWithProgress = useMemo(
    () =>
      students.map((student) => ({
        ...student,
        progress: computeStudentProgress(student),
      })),
    [students],
  )

  const updateRemcStatus = (studentId, competencyCode, itemId, nextStatus) => {
    setStudents((current) =>
      current.map((student) => {
        if (student.id !== studentId) return student
        return {
          ...student,
          remc: student.remc.map((competency) => {
            if (competency.code !== competencyCode) return competency
            return {
              ...competency,
              items: competency.items.map((item) =>
                item.id === itemId ? { ...item, status: nextStatus } : item,
              ),
            }
          }),
        }
      }),
    )
  }

  const addLesson = (studentId, payload) => {
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId
          ? {
              ...student,
              lessonHistory: [
                {
                  id: `lesson-${Date.now()}`,
                  openedAt: new Date().toISOString(),
                  closedAt: null,
                  closedBy: '',
                  ...payload,
                },
                ...(student.lessonHistory || []),
              ],
            }
          : student,
      ),
    )
  }

  const updateLesson = (studentId, lessonId, patch) => {
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId
          ? {
              ...student,
              lessonHistory: (student.lessonHistory || []).map((lesson) =>
                lesson.id === lessonId ? { ...lesson, ...patch } : lesson,
              ),
            }
          : student,
      ),
    )
  }

  const addStudent = (payload) => {
    setStudents((current) => [
      {
        id:
          payload.id ||
          `PD-${new Date().getFullYear()}-${String(current.length + 1).padStart(3, '0')}`,
        firstName: payload.firstName || 'Nouvel',
        lastName: payload.lastName || '\u00c9l\u00e8ve',
        teacher: payload.teacher || 'Non assign\u00e9',
        formationType: payload.formationType || 'Permis B traditionnel',
        remc: cloneRemc(),
        lessonHistory: [],
      },
      ...current,
    ])
  }

  return { students: studentsWithProgress, updateRemcStatus, addLesson, updateLesson, addStudent }
}
