export const ASSESSMENT_STATUS_LABELS = {
  pending: 'À réaliser',
  in_progress: 'En cours',
  completed: 'Réalisée',
}

export const ASSESSMENT_STATUS_STYLES = {
  pending: {
    container: 'border-amber-200 bg-amber-50',
    summary: 'text-amber-900',
  },
  in_progress: {
    container: 'border-blue-300 bg-blue-50',
    summary: 'text-blue-900',
  },
  completed: {
    container: 'border-emerald-200 bg-emerald-50',
    summary: 'text-emerald-900',
  },
}

export function getAssessmentStatusStyles(status) {
  return ASSESSMENT_STATUS_STYLES[status] || ASSESSMENT_STATUS_STYLES.pending
}

export const FSB_OPTIONS = [
  { value: 'F', label: 'F — Faible', points: 0 },
  { value: 'S', label: 'S — Satisfaisant', points: 1 },
  { value: 'B', label: 'B — Bon', points: 2 },
]

export const FSB_LEGEND = {
  F: 'Aucune connaissance / faible implication',
  S: 'Notions de base / implication normale',
  B: 'Maîtrise correcte / très bonne implication',
}

/** 7 modules pédagogiques + synthèse finale */
export const ASSESSMENT_MODULES = [
  {
    id: 'm1_experience',
    moduleNumber: 1,
    title: 'Expérience de conduite',
    objective: 'Mesurer l\'expérience déjà acquise.',
    description: 'Cette partie influence fortement le nombre d\'heures prévisionnelles.',
    available: true,
    fields: [
      {
        id: 'exp_driven_before',
        label: 'Avez-vous déjà conduit un véhicule ?',
        type: 'select',
        options: ['Jamais', 'Quelques fois', 'Régulièrement'],
        scoring: { Jamais: 0, 'Quelques fois': 2, Régulièrement: 5 },
      },
      {
        id: 'exp_context',
        label: 'Dans quel cadre ?',
        type: 'select',
        options: ['Route', 'Chemin privé', 'Parking', 'Auto-école', 'À l\'étranger'],
        scoring: {
          Route: 2,
          'Chemin privé': 1,
          Parking: 1,
          'Auto-école': 3,
          'À l\'étranger': 2,
        },
      },
      {
        id: 'exp_hours',
        label: 'Combien d\'heures environ ?',
        type: 'select',
        options: ['0 h', '1 à 5 h', '5 à 20 h', 'Plus de 20 h'],
        scoring: { '0 h': 0, '1 à 5 h': 2, '5 à 20 h': 4, 'Plus de 20 h': 6 },
      },
      {
        id: 'exp_previous_license',
        label: 'Avez-vous déjà obtenu un permis ?',
        type: 'select',
        options: ['Aucun', 'AM', 'A1/A2', 'B', 'Autre'],
        scoring: { Aucun: 0, AM: 1, 'A1/A2': 2, B: 5, Autre: 1 },
      },
    ],
  },
  {
    id: 'm2_vehicle',
    moduleNumber: 2,
    title: 'Connaissance du véhicule',
    objective: 'Savoir si l\'élève connaît les commandes de base.',
    description: 'Questions de connaissance + appréciation enseignant (F / S / B).',
    available: true,
    fields: [
      { id: 'veh_clutch', label: 'Savez-vous à quoi sert l\'embrayage ?', type: 'select', options: ['Oui', 'Non'], scoring: { Oui: 2, Non: 0 } },
      { id: 'veh_gearbox', label: 'Savez-vous utiliser une boîte de vitesses ?', type: 'select', options: ['Oui', 'Non'], scoring: { Oui: 2, Non: 0 } },
      { id: 'veh_pedals', label: 'Connaissez-vous les pédales ?', type: 'select', options: ['Oui', 'Partiellement', 'Non'], scoring: { Oui: 2, Partiellement: 1, Non: 0 } },
      { id: 'veh_seat_mirrors', label: 'Savez-vous régler votre siège et vos rétroviseurs ?', type: 'select', options: ['Oui', 'Non'], scoring: { Oui: 2, Non: 0 } },
    ],
    ratings: [
      { id: 'veh_rating_global', label: 'Appréciation globale — connaissance du véhicule' },
    ],
  },
  {
    id: 'm3_attitude',
    moduleNumber: 3,
    title: 'Attitude et motivation',
    objective: 'Évaluer le comportement futur de l\'élève.',
    description: 'Motivation, régularité et implication dans la formation.',
    available: true,
    fields: [
      { id: 'att_why_license', label: 'Pourquoi souhaitez-vous obtenir le permis ?', type: 'select', options: ['Travail', 'Études', 'Vie personnelle', 'Autre'], scoring: { Travail: 2, Études: 2, 'Vie personnelle': 2, Autre: 1 } },
      { id: 'att_motivation', label: 'Êtes-vous motivé à suivre une formation régulière ?', type: 'select', options: ['Faiblement', 'Moyennement', 'Très motivé'], scoring: { Faiblement: 0, Moyennement: 1, 'Très motivé': 3 } },
      { id: 'att_code_autonomy', label: 'Êtes-vous prêt à réviser le code en autonomie ?', type: 'select', options: ['Oui', 'Non'], scoring: { Oui: 2, Non: 0 } },
    ],
    ratings: [
      { id: 'att_rating_implication', label: 'Appréciation globale — implication' },
    ],
  },
  {
    id: 'm4_skills',
    moduleNumber: 4,
    title: 'Habiletés',
    objective: 'Évaluer les capacités motrices.',
    description: 'Évaluation réalisée par l\'enseignant lors de la première heure.',
    available: true,
    teacherOnly: true,
    ratings: [
      { id: 'skill_installation', label: 'Installation au poste de conduite' },
      { id: 'skill_steering', label: 'Utilisation du volant' },
      { id: 'skill_coordination', label: 'Coordination mains / pieds' },
      { id: 'skill_start', label: 'Démarrage du véhicule' },
    ],
  },
  {
    id: 'm5_comprehension',
    moduleNumber: 5,
    title: 'Compréhension et mémoire',
    objective: 'Mesurer la capacité d\'apprentissage.',
    description: 'Rétention des consignes et gestion de l\'information.',
    available: true,
    fields: [
      { id: 'und_retain', label: 'Retenez-vous facilement des consignes ?', type: 'select', options: ['Difficulté importante', 'Moyenne', 'Facilement'], scoring: { 'Difficulté importante': 0, Moyenne: 1, Facilement: 3 } },
      { id: 'und_multitask', label: 'Êtes-vous à l\'aise avec plusieurs informations simultanément ?', type: 'select', options: ['Non', 'Moyennement', 'Oui'], scoring: { Non: 0, Moyennement: 1, Oui: 3 } },
    ],
    ratings: [
      { id: 'und_rating_learning', label: 'Appréciation globale — compréhension' },
    ],
  },
  {
    id: 'm6_perception',
    moduleNumber: 6,
    title: 'Perception',
    objective: 'Analyser les capacités d\'observation.',
    description: 'Évaluation enseignant — regard, anticipation, trajectoire.',
    available: true,
    teacherOnly: true,
    ratings: [
      { id: 'per_gaze', label: 'Regard' },
      { id: 'per_observation', label: 'Observation' },
      { id: 'per_anticipation', label: 'Anticipation' },
      { id: 'per_orientation', label: 'Orientation' },
      { id: 'per_trajectory', label: 'Respect de trajectoire' },
    ],
  },
  {
    id: 'm7_emotion',
    moduleNumber: 7,
    title: 'Émotivité',
    objective: 'Détecter le stress et la gestion émotionnelle.',
    description: 'Auto-évaluation de l\'élève + observation enseignant.',
    available: true,
    fields: [
      { id: 'emo_stress_self', label: 'Êtes-vous stressé à l\'idée de conduire ?', type: 'select', options: ['Beaucoup', 'Un peu', 'Pas du tout'], scoring: { Beaucoup: 0, 'Un peu': 1, 'Pas du tout': 3 } },
    ],
    ratings: [
      { id: 'emo_stress_mgmt', label: 'Gestion du stress' },
      { id: 'emo_tension', label: 'Crispation' },
      { id: 'emo_concentration', label: 'Concentration' },
    ],
  },
  {
    id: 'results',
    moduleNumber: 8,
    title: 'Résultat final',
    objective: 'Synthèse pédagogique et recommandation horaire.',
    description: 'Profil élève, score total et volume de formation estimé.',
    available: true,
    readOnly: true,
  },
]

/** Alias rétrocompatibilité */
export const ASSESSMENT_STEPS = ASSESSMENT_MODULES

export const PROFILE_LABELS = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

/** @deprecated — utiliser PROFILE_LABELS */
export const RESULT_LEVEL_LABELS = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  faible: 'Débutant',
  moyen: 'Intermédiaire',
  bon: 'Intermédiaire',
  excellent: 'Avancé',
}

function fsbPoints(value) {
  const entry = FSB_OPTIONS.find((o) => o.value === value)
  return entry?.points ?? 0
}

function fieldPoints(field, answer) {
  if (!answer || !field?.scoring) return 0
  return field.scoring[answer] ?? 0
}

export function computeModuleScores(answers = {}) {
  const byModule = {}

  ASSESSMENT_MODULES.forEach((mod) => {
    if (mod.readOnly || !mod.available) return
    let score = 0
    let max = 0

    ;(mod.fields || []).forEach((field) => {
      const pts = fieldPoints(field, answers[field.id])
      score += pts
      max += Math.max(...Object.values(field.scoring || { 0: 0 }))
    })

    ;(mod.ratings || []).forEach((rating) => {
      score += fsbPoints(answers[rating.id])
      max += 2
    })

    byModule[mod.id] = { score, max, moduleNumber: mod.moduleNumber, title: mod.title }
  })

  return byModule
}

export function computeAssessmentScores(answers = {}) {
  const moduleScores = computeModuleScores(answers)
  const modules = Object.values(moduleScores)

  const positiveScore = modules.reduce((sum, m) => sum + m.score, 0)
  const maxPositive = modules.reduce((sum, m) => sum + m.max, 0) || 1
  const finalScore = Math.round((positiveScore / maxPositive) * 100)

  const experience = moduleScores.m1_experience?.score ?? 0
  const negativeScore = Math.max(0, 15 - experience)

  return {
    positiveScore,
    negativeScore,
    finalScore,
    maxPositive,
    moduleScores,
  }
}

export function recommendHoursFromScore({ finalScore, moduleScores = {} }) {
  const expScore = moduleScores.m1_experience?.score ?? 0

  let resultLevel = 'debutant'
  if (finalScore >= 68) resultLevel = 'avance'
  else if (finalScore >= 38) resultLevel = 'intermediaire'

  let recommendedHoursMin = 40
  let recommendedHoursMax = 40
  let label = '40 h et +'

  if (finalScore >= 75 && expScore >= 10) {
    recommendedHoursMin = 20
    recommendedHoursMax = 20
    label = '20 h'
  } else if (finalScore >= 62) {
    recommendedHoursMin = 25
    recommendedHoursMax = 25
    label = '25 h'
  } else if (finalScore >= 48) {
    recommendedHoursMin = 30
    recommendedHoursMax = 30
    label = '30 h'
  } else if (finalScore >= 32) {
    recommendedHoursMin = 35
    recommendedHoursMax = 35
    label = '35 h'
  }

  if (expScore <= 2) {
    recommendedHoursMin = Math.max(recommendedHoursMin, 35)
    recommendedHoursMax = 40
    label = recommendedHoursMin === recommendedHoursMax ? `${recommendedHoursMin} h` : `${recommendedHoursMin} à ${recommendedHoursMax} h`
    if (resultLevel === 'avance') resultLevel = 'intermediaire'
  }

  return {
    resultLevel,
    recommendedHoursMin,
    recommendedHoursMax,
    label,
    profileLabel: PROFILE_LABELS[resultLevel],
  }
}

export function getAssessmentModule(moduleId) {
  return ASSESSMENT_MODULES.find((m) => m.id === moduleId) ?? null
}

export function getFieldLabel(moduleId, fieldId) {
  const mod = getAssessmentModule(moduleId)
  const field = mod?.fields?.find((f) => f.id === fieldId)
  return field?.label ?? fieldId
}

export function getRatingLabel(moduleId, ratingId) {
  const mod = getAssessmentModule(moduleId)
  const rating = mod?.ratings?.find((r) => r.id === ratingId)
  return rating?.label ?? ratingId
}
