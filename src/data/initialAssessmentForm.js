export const ASSESSMENT_STATUS_LABELS = {
  pending: 'À réaliser',
  in_progress: 'En cours',
  completed: 'Réalisée',
}

export const ASSESSMENT_STEPS = [
  {
    id: 'general',
    title: 'Renseignements généraux',
    description: 'Informations administratives et médicales utiles à l\'évaluation.',
    scoring: false,
    fields: [
      { id: 'visionCorrection', label: 'Port de lunettes ou lentilles', type: 'select', options: ['Non', 'Oui', 'Non renseigné'] },
      { id: 'medicalRestriction', label: 'Restriction médicale connue', type: 'select', options: ['Non', 'Oui', 'Non renseigné'] },
      { id: 'codeValidated', label: 'Code de la route validé', type: 'select', options: ['Oui', 'Non', 'En cours'] },
      { id: 'previousDriving', label: 'Expérience antérieure au volant', type: 'select', options: ['Aucune', 'Occasionnelle', 'Régulière'] },
      { id: 'generalNotes', label: 'Observations générales', type: 'textarea' },
    ],
  },
  {
    id: 'experience',
    title: 'Expérience de la conduite',
    description: 'Appréciation des automatismes déjà acquis.',
    items: [
      { id: 'exp_start_engine', label: 'Démarrage / arrêt moteur maîtrisé', type: 'positive', points: 2 },
      { id: 'exp_clutch', label: 'Utilisation de l\'embrayage fluide', type: 'positive', points: 2 },
      { id: 'exp_steering', label: 'Tenue correcte du volant', type: 'positive', points: 2 },
      { id: 'exp_nervous', label: 'Nervosité excessive au démarrage', type: 'negative', points: 2 },
      { id: 'exp_stalls', label: 'Calages répétés', type: 'negative', points: 2 },
    ],
  },
  {
    id: 'vehicle',
    title: 'Connaissance du véhicule',
    description: 'Compréhension des commandes et des vérifications.',
    items: [
      { id: 'veh_commands', label: 'Identification des commandes principales', type: 'positive', points: 2 },
      { id: 'veh_mirrors', label: 'Réglage des rétroviseurs', type: 'positive', points: 2 },
      { id: 'veh_checks', label: 'Vérifications intérieures / extérieures', type: 'positive', points: 2 },
      { id: 'veh_confusion', label: 'Confusion entre commandes', type: 'negative', points: 2 },
    ],
  },
  {
    id: 'attitude',
    title: 'Attitude face à l\'apprentissage et à la sécurité',
    description: 'Motivation, écoute et respect des consignes.',
    items: [
      { id: 'att_listen', label: 'Écoute active et respect des consignes', type: 'positive', points: 3 },
      { id: 'att_safety', label: 'Sensibilisation à la sécurité routière', type: 'positive', points: 2 },
      { id: 'att_calm', label: 'Attitude calme et coopérative', type: 'positive', points: 2 },
      { id: 'att_risk', label: 'Prise de risque ou imprudence', type: 'negative', points: 3 },
      { id: 'att_resistance', label: 'Résistance aux corrections', type: 'negative', points: 2 },
    ],
  },
  {
    id: 'skills',
    title: 'Habiletés',
    description: 'Coordination, précision et maîtrise gestuelle.',
    items: [
      { id: 'skill_coordination', label: 'Coordination pieds / mains', type: 'positive', points: 3 },
      { id: 'skill_precision', label: 'Précision des gestes', type: 'positive', points: 2 },
      { id: 'skill_balance', label: 'Équilibre et positionnement', type: 'positive', points: 2 },
      { id: 'skill_harsh', label: 'Gestes brusques ou désorganisés', type: 'negative', points: 2 },
    ],
  },
  {
    id: 'understanding',
    title: 'Compréhension et mémoire',
    description: 'Capacité à mémoriser et appliquer les consignes.',
    items: [
      { id: 'und_instructions', label: 'Compréhension des consignes', type: 'positive', points: 3 },
      { id: 'und_memory', label: 'Mémorisation des enchaînements', type: 'positive', points: 2 },
      { id: 'und_apply', label: 'Application en situation', type: 'positive', points: 2 },
      { id: 'und_repeat', label: 'Besoin de répétitions excessives', type: 'negative', points: 2 },
    ],
  },
  {
    id: 'perception',
    title: 'Perception',
    description: 'Observation de l\'environnement et anticipation.',
    items: [
      { id: 'per_scan', label: 'Balayage visuel régulier', type: 'positive', points: 3 },
      { id: 'per_mirrors', label: 'Utilisation des rétroviseurs', type: 'positive', points: 2 },
      { id: 'per_space', label: 'Appréciation des distances', type: 'positive', points: 2 },
      { id: 'per_blind', label: 'Angles morts insuffisants', type: 'negative', points: 3 },
    ],
  },
  {
    id: 'emotion',
    title: 'Émotivité',
    description: 'Gestion du stress et de la pression.',
    items: [
      { id: 'emo_control', label: 'Contrôle émotionnel satisfaisant', type: 'positive', points: 3 },
      { id: 'emo_confidence', label: 'Confiance progressive', type: 'positive', points: 2 },
      { id: 'emo_stress', label: 'Stress bloquant', type: 'negative', points: 3 },
      { id: 'emo_panic', label: 'Réactions paniquées', type: 'negative', points: 2 },
    ],
  },
  {
    id: 'results',
    title: 'Résultats',
    description: 'Synthèse automatique et recommandation horaire.',
    readOnly: true,
  },
]

export function getScoredSteps() {
  return ASSESSMENT_STEPS.filter((step) => step.items?.length)
}

export function getMaxPositiveScore() {
  return getScoredSteps().flatMap((step) => step.items).reduce((sum, item) => {
    if (item.type === 'positive') return sum + item.points
    return sum
  }, 0)
}

export function computeAssessmentScores(answers = {}) {
  let positiveScore = 0
  let negativeScore = 0

  getScoredSteps().forEach((step) => {
    step.items.forEach((item) => {
      if (!answers[item.id]) return
      if (item.type === 'positive') positiveScore += item.points
      if (item.type === 'negative') negativeScore += item.points
    })
  })

  return {
    positiveScore,
    negativeScore,
    finalScore: positiveScore - negativeScore,
  }
}

export function recommendHoursFromScore({ finalScore, positiveScore }) {
  const maxPositive = getMaxPositiveScore()
  const ratio = maxPositive > 0 ? finalScore / maxPositive : 0

  if (ratio >= 0.72) {
    return { resultLevel: 'excellent', recommendedHoursMin: 20, recommendedHoursMax: 20, label: '20 heures' }
  }
  if (ratio >= 0.52) {
    return { resultLevel: 'bon', recommendedHoursMin: 25, recommendedHoursMax: 25, label: '25 heures' }
  }
  if (ratio >= 0.32) {
    return { resultLevel: 'moyen', recommendedHoursMin: 30, recommendedHoursMax: 30, label: '30 heures' }
  }
  return { resultLevel: 'faible', recommendedHoursMin: 35, recommendedHoursMax: 40, label: '35 à 40 heures' }
}

export const RESULT_LEVEL_LABELS = {
  faible: 'Résultat faible',
  moyen: 'Résultat moyen',
  bon: 'Résultat bon',
  excellent: 'Résultat excellent',
}
