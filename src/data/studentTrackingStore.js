import { useEffect, useMemo, useState } from 'react'

// Clé versionnée : invalide automatiquement les anciennes données de
// démonstration encore stockées dans le navigateur (élèves fictifs, etc.).
const LEGACY_STORAGE_KEYS = ['pedagogia-drive-student-tracking']
const STORAGE_KEY = 'pedagogia-drive-student-tracking-v2'

if (typeof window !== 'undefined') {
  LEGACY_STORAGE_KEYS.forEach((key) => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  })
}

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

const legacyRemcItemIds = {
  'c1-installation': 'c1b',
  'c1-volant': 'c1c',
  'c1-demarrage': 'c1d',
  'c1-commandes': 'c1a',
  'c1-arret': 'c1e',
  'c2-priorites': 'c2d',
  'c2-observation': 'c2a',
  'c2-allure': 'c2c',
  'c2-insertion': 'c3e',
  'c2-position': 'c2b',
  'c3-communication': 'c3d',
  'c3-angle-mort': 'c3a',
  'c3-depassement': 'c3b',
  'c3-partage': 'c3d',
  'c3-distance': 'c3a',
  'c4-autonomie': 'c4a',
  'c4-eco': 'c4g',
  'c4-securite': 'c4c',
  'c4-stress': 'c4c',
  'c4-bilan': 'c4a',
}

const remcTemplate = [
  {
    code: 'C1',
    title: 'Ma\u00eetriser le maniement du v\u00e9hicule dans un trafic faible ou nul',
    items: [
      {
        id: 'c1a',
        code: 'C1a',
        label:
          'Conna\u00eetre les principaux organes et commandes du v\u00e9hicule, effectuer des v\u00e9rifications int\u00e9rieures et ext\u00e9rieures',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c1b',
        code: 'C1b',
        label: 'Entrer, s\u2019installer au poste de conduite et en sortir',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c1c',
        code: 'C1c',
        label: 'Tenir, tourner le volant et maintenir la trajectoire',
        status: 'Non commenc\u00e9',
      },
      { id: 'c1d', code: 'C1d', label: 'D\u00e9marrer et s\u2019arr\u00eater', status: 'Non commenc\u00e9' },
      {
        id: 'c1e',
        code: 'C1e',
        label: 'Doser l\u2019acc\u00e9l\u00e9ration et le freinage \u00e0 diverses allures',
        status: 'Non commenc\u00e9',
      },
      { id: 'c1f', code: 'C1f', label: 'Utiliser la bo\u00eete de vitesses', status: 'Non commenc\u00e9' },
      {
        id: 'c1g',
        code: 'C1g',
        label:
          'Diriger la voiture en avant en ligne droite et en courbe en adaptant allure et trajectoire',
        status: 'Non commenc\u00e9',
      },
      { id: 'c1h', code: 'C1h', label: 'Regarder autour de soi et avertir', status: 'Non commenc\u00e9' },
      {
        id: 'c1i',
        code: 'C1i',
        label: 'Effectuer une marche ar\u00e8re et un demi-tour en s\u00e9curit\u00e9',
        status: 'Non commenc\u00e9',
      },
    ],
  },
  {
    code: 'C2',
    title: 'Appr\u00e9hender la route et circuler dans des conditions normales',
    items: [
      {
        id: 'c2a',
        code: 'C2a',
        label: 'Rechercher la signalisation, les indices utiles et en tenir compte',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c2b',
        code: 'C2b',
        label: 'Positionner le v\u00e9hicule sur la chauss\u00e9e et choisir la voie de circulation',
        status: 'Non commenc\u00e9',
      },
      { id: 'c2c', code: 'C2c', label: 'Adapter l\u2019allure aux situations', status: 'Non commenc\u00e9' },
      {
        id: 'c2d',
        code: 'C2d',
        label: 'D\u00e9tecter, identifier et franchir les intersections suivant le r\u00e9gime de priorit\u00e9',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c2e',
        code: 'C2e',
        label: 'Tourner \u00e0 droite et \u00e0 gauche en agglom\u00e9ration',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c2f',
        code: 'C2f',
        label: 'Franchir les ronds-points et les carrefours \u00e0 sens giratoire',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c2g',
        code: 'C2g',
        label: 'S\u2019arr\u00eater et stationner en \u00e9pi, en bataille et en cr\u00e9neau',
        status: 'Non commenc\u00e9',
      },
    ],
  },
  {
    code: 'C3',
    title: 'Circuler dans des conditions difficiles et partager la route avec les autres usagers',
    items: [
      {
        id: 'c3a',
        code: 'C3a',
        label: '\u00c9valuer et maintenir les distances de s\u00e9curit\u00e9',
        status: 'Non commenc\u00e9',
      },
      { id: 'c3b', code: 'C3b', label: 'Croiser, d\u00e9passer, \u00eatre d\u00e9pass\u00e9', status: 'Non commenc\u00e9' },
      {
        id: 'c3c',
        code: 'C3c',
        label: 'Passer des virages et conduire en d\u00e9clivit\u00e9',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c3d',
        code: 'C3d',
        label:
          'Conna\u00eetre les caract\u00e9ristiques des autres usagers et savoir se comporter \u00e0 leur \u00e9gard avec respect et courtoisie',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c3e',
        code: 'C3e',
        label: 'S\u2019ins\u00e9rer, circuler et sortir d\u2019une voie rapide',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c3f',
        code: 'C3f',
        label: 'Conduire dans une file de v\u00e9hicules et dans une circulation dense',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c3g',
        code: 'C3g',
        label:
          'Conna\u00eetre les r\u00e8gles relatives \u00e0 la circulation inter-files des motocycles et savoir en tenir compte',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c3h',
        code: 'C3h',
        label: 'Conduire quand l\u2019adh\u00e9rence et la visibilit\u00e9 sont r\u00e9duites',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c3i',
        code: 'C3i',
        label: 'Conduire \u00e0 l\u2019abord et dans la travers\u00e9e d\u2019ouvrages routiers (tunnels, ponts)',
        status: 'Non commenc\u00e9',
      },
    ],
  },
  {
    code: 'C4',
    title: 'Pratiquer une conduite autonome, s\u00fbre et \u00e9conomique',
    items: [
      {
        id: 'c4a',
        code: 'C4a',
        label: 'Suivre un itin\u00e9raire de mani\u00e8re autonome',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c4b',
        code: 'C4b',
        label: 'Pr\u00e9parer et effectuer un voyage longue distance en autonomie',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c4c',
        code: 'C4c',
        label:
          'Conna\u00eetre les principaux facteurs de risque au volant et les recommandations \u00e0 appliquer',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c4d',
        code: 'C4d',
        label: 'Conna\u00eetre les comportements \u00e0 adopter en cas d\u2019accident : prot\u00e9ger, alerter, secourir',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c4e',
        code: 'C4e',
        label:
          'Faire l\u2019exp\u00e9rience des aides \u00e0 la conduite du v\u00e9hicule (r\u00e9gulateur, limiteur de vitesse, ABS, aides \u00e0 la navigation)',
        status: 'Non commenc\u00e9',
      },
      {
        id: 'c4f',
        code: 'C4f',
        label: 'Avoir des notions sur l\u2019entretien, le d\u00e9pannage et les situations d\u2019urgence',
        status: 'Non commenc\u00e9',
      },
      { id: 'c4g', code: 'C4g', label: 'Pratiquer l\u2019\u00e9coconduite', status: 'Non commenc\u00e9' },
    ],
  },
]

// Aucune donnée fictive : la liste des élèves est désormais alimentée
// uniquement par les données réelles (ajout manuel ou Supabase).
const initialStudents = []

function cloneRemc() {
  return remcTemplate.map((competency) => ({
    ...competency,
    items: competency.items.map((item) => ({ ...item })),
  }))
}

function normalizeRemcStatus(status) {
  return status === 'D\u00e9but\u00e9' ? 'Non commenc\u00e9' : status
}

function mergeRemcWithTemplate(storedRemc) {
  const storedStatuses = new Map()

  ;(storedRemc || []).forEach((competency) => {
    ;(competency.items || []).forEach((item) => {
      const normalizedId = legacyRemcItemIds[item.id] || item.id
      storedStatuses.set(normalizedId, normalizeRemcStatus(item.status))
    })
  })

  return remcTemplate.map((competency) => ({
    ...competency,
    items: competency.items.map((item) => ({
      ...item,
      status: storedStatuses.get(item.id) || item.status,
    })),
  }))
}

function isEmptyAacTracking(stored) {
  if (!stored || typeof stored !== 'object') return true
  const hasKm = Number(stored.kilometersCurrent) > 0
  const hasAppointments =
    Array.isArray(stored.pedagogicalAppointments) && stored.pedagogicalAppointments.length > 0
  const hasStartDate = Boolean(stored.startDate)
  return !hasKm && !hasAppointments && !hasStartDate
}

function resolveAacTracking(stored, seedStudent) {
  const seed = seedStudent?.aacTracking
  if (!seed && !stored) return null
  if (isEmptyAacTracking(stored)) return seed || null
  if (!seed) return stored
  return {
    ...seed,
    ...stored,
    startDate: stored.startDate || seed.startDate,
    minimumEndDate: stored.minimumEndDate || seed.minimumEndDate,
    kilometersCurrent: stored.kilometersCurrent ?? seed.kilometersCurrent,
    kilometersTarget: stored.kilometersTarget ?? seed.kilometersTarget,
    pedagogicalAppointments:
      Array.isArray(stored.pedagogicalAppointments) && stored.pedagogicalAppointments.length
        ? stored.pedagogicalAppointments
        : seed.pedagogicalAppointments,
  }
}

function findInitialSeed(student) {
  const byName = initialStudents.find(
    (seed) =>
      seed.firstName === student.firstName &&
      seed.lastName === student.lastName,
  )
  if (byName) return byName

  const formation = student.formationType || ''
  if (formation.includes('AAC')) {
    return initialStudents.find((seed) => seed.formationType?.includes('AAC'))
  }
  if (formation.toLowerCase().includes('supervis')) {
    return initialStudents.find((seed) => seed.formationType?.toLowerCase().includes('supervis'))
  }
  return undefined
}

function normalizeStudent(student, index = 0) {
  const base = student || {}
  const seed = findInitialSeed(base)
  const normalizedRemc =
    Array.isArray(base.remc) && base.remc.length ? mergeRemcWithTemplate(base.remc) : cloneRemc()
  return {
    ...base,
    id: base.id || `PD-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
    firstName: base.firstName || 'Nouvel',
    lastName: base.lastName || '\u00c9l\u00e8ve',
    formationType: base.formationType || 'Permis B traditionnel',
    teacher: base.teacher || 'Non assign\u00e9',
    remc: normalizedRemc,
    lessonHistory: Array.isArray(base.lessonHistory) ? base.lessonHistory : [],
    aacTracking: resolveAacTracking(base.aacTracking, seed),
  }
}

export const demoAacTracking = initialStudents.find((student) =>
  student.formationType?.includes('AAC'),
)?.aacTracking

export const demoSupervisedTracking = initialStudents.find((student) =>
  student.formationType?.toLowerCase().includes('supervis'),
)?.aacTracking

export function getStudentAacTracking(student) {
  if (!student) return null
  const seed = findInitialSeed(student)
  const resolved = resolveAacTracking(student.aacTracking, seed)
  if (resolved?.kilometersCurrent && resolved?.pedagogicalAppointments?.length) return resolved

  const formation = student.formationType || ''
  if (formation.includes('AAC') && demoAacTracking) return { ...demoAacTracking, ...resolved }
  if (formation.toLowerCase().includes('supervis') && demoSupervisedTracking) {
    return { ...demoSupervisedTracking, ...resolved }
  }
  return resolved
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
    const normalized = getStoredStudents()
    setStudents((current) => {
      const currentJson = JSON.stringify(current)
      const normalizedJson = JSON.stringify(normalized)
      return currentJson === normalizedJson ? current : normalized
    })
  }, [])

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
        codeStatus: payload.codeStatus || 'Non obtenu',
        remc: cloneRemc(),
        lessonHistory: [],
      },
      ...current,
    ])
  }

  const upsertStudent = (payload) => {
    setStudents((current) => {
      const existing = current.find((student) => student.id === payload.id)
      if (existing) {
        return current.map((student) =>
          student.id === payload.id
            ? normalizeStudent({ ...student, ...payload }, 0)
            : student,
        )
      }
      return [normalizeStudent(payload, current.length), ...current]
    })
  }

  return { students: studentsWithProgress, updateRemcStatus, addLesson, updateLesson, addStudent, upsertStudent }
}
