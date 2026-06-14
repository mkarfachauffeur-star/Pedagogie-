export const REMC_ITEM_STATUSES = ['Non commencé', 'En cours', 'Validé']

export const REMC_DEFAULT_STATUS = 'Non commencé'

const statusScore = {
  'Non commencé': 0,
  Débuté: 0.34,
  'En cours': 0.67,
  Validé: 1,
}

export const LEGACY_REMC_ITEM_IDS = {
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

/** Catalogue REMC officiel (C1–C4 + sous-compétences). Les statuts sont écrasés par Supabase. */
export const REMC_TEMPLATE = [
  {
    code: 'C1',
    title: 'Maîtriser le maniement du véhicule dans un trafic faible ou nul',
    items: [
      {
        id: 'c1a',
        code: 'C1a',
        label:
          'Connaître les principaux organes et commandes du véhicule, effectuer des vérifications intérieures et extérieures',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c1b',
        code: 'C1b',
        label: 'Entrer, s’installer au poste de conduite et en sortir',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c1c',
        code: 'C1c',
        label: 'Tenir, tourner le volant et maintenir la trajectoire',
        status: REMC_DEFAULT_STATUS,
      },
      { id: 'c1d', code: 'C1d', label: 'Démarrer et s’arrêter', status: REMC_DEFAULT_STATUS },
      {
        id: 'c1e',
        code: 'C1e',
        label: 'Doser l’accélération et le freinage à diverses allures',
        status: REMC_DEFAULT_STATUS,
      },
      { id: 'c1f', code: 'C1f', label: 'Utiliser la boîte de vitesses', status: REMC_DEFAULT_STATUS },
      {
        id: 'c1g',
        code: 'C1g',
        label:
          'Diriger la voiture en avant en ligne droite et en courbe en adaptant allure et trajectoire',
        status: REMC_DEFAULT_STATUS,
      },
      { id: 'c1h', code: 'C1h', label: 'Regarder autour de soi et avertir', status: REMC_DEFAULT_STATUS },
      {
        id: 'c1i',
        code: 'C1i',
        label: 'Effectuer une marche arrière et un demi-tour en sécurité',
        status: REMC_DEFAULT_STATUS,
      },
    ],
  },
  {
    code: 'C2',
    title: 'Appréhender la route et circuler dans des conditions normales',
    items: [
      {
        id: 'c2a',
        code: 'C2a',
        label: 'Rechercher la signalisation, les indices utiles et en tenir compte',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c2b',
        code: 'C2b',
        label: 'Positionner le véhicule sur la chaussée et choisir la voie de circulation',
        status: REMC_DEFAULT_STATUS,
      },
      { id: 'c2c', code: 'C2c', label: 'Adapter l’allure aux situations', status: REMC_DEFAULT_STATUS },
      {
        id: 'c2d',
        code: 'C2d',
        label: 'Détecter, identifier et franchir les intersections suivant le régime de priorité',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c2e',
        code: 'C2e',
        label: 'Tourner à droite et à gauche en agglomération',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c2f',
        code: 'C2f',
        label: 'Franchir les ronds-points et les carrefours à sens giratoire',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c2g',
        code: 'C2g',
        label: 'S’arrêter et stationner en épi, en bataille et en créneau',
        status: REMC_DEFAULT_STATUS,
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
        label: 'Évaluer et maintenir les distances de sécurité',
        status: REMC_DEFAULT_STATUS,
      },
      { id: 'c3b', code: 'C3b', label: 'Croiser, dépasser, être dépassé', status: REMC_DEFAULT_STATUS },
      {
        id: 'c3c',
        code: 'C3c',
        label: 'Passer des virages et conduire en déclivité',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c3d',
        code: 'C3d',
        label:
          'Connaître les caractéristiques des autres usagers et savoir se comporter à leur égard avec respect et courtoisie',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c3e',
        code: 'C3e',
        label: 'S’insérer, circuler et sortir d’une voie rapide',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c3f',
        code: 'C3f',
        label: 'Conduire dans une file de véhicules et dans une circulation dense',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c3g',
        code: 'C3g',
        label:
          'Connaître les règles relatives à la circulation inter-files des motocycles et savoir en tenir compte',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c3h',
        code: 'C3h',
        label: 'Conduire quand l’adhérence et la visibilité sont réduites',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c3i',
        code: 'C3i',
        label: 'Conduire à l’abord et dans la traversée d’ouvrages routiers (tunnels, ponts)',
        status: REMC_DEFAULT_STATUS,
      },
    ],
  },
  {
    code: 'C4',
    title: 'Pratiquer une conduite autonome, sûre et économique',
    items: [
      {
        id: 'c4a',
        code: 'C4a',
        label: 'Suivre un itinéraire de manière autonome',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c4b',
        code: 'C4b',
        label: 'Préparer et effectuer un voyage longue distance en autonomie',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c4c',
        code: 'C4c',
        label:
          'Connaître les principaux facteurs de risque au volant et les recommandations à appliquer',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c4d',
        code: 'C4d',
        label: 'Connaître les comportements à adopter en cas d’accident : protéger, alerter, secourir',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c4e',
        code: 'C4e',
        label:
          'Faire l’expérience des aides à la conduite du véhicule (régulateur, limiteur de vitesse, ABS, aides à la navigation)',
        status: REMC_DEFAULT_STATUS,
      },
      {
        id: 'c4f',
        code: 'C4f',
        label: 'Avoir des notions sur l’entretien, le dépannage et les situations d’urgence',
        status: REMC_DEFAULT_STATUS,
      },
      { id: 'c4g', code: 'C4g', label: 'Pratiquer l’écoconduite', status: REMC_DEFAULT_STATUS },
    ],
  },
]

export function cloneRemcTemplate() {
  return REMC_TEMPLATE.map((competency) => ({
    ...competency,
    items: competency.items.map((item) => ({ ...item })),
  }))
}

export function normalizeRemcStatus(status) {
  if (!status) return REMC_DEFAULT_STATUS
  if (status === 'Débuté') return REMC_DEFAULT_STATUS
  if (REMC_ITEM_STATUSES.includes(status)) return status
  return REMC_DEFAULT_STATUS
}

export function normalizeRemcItemId(itemId) {
  return LEGACY_REMC_ITEM_IDS[itemId] || itemId
}

export function mergeRemcWithTemplate(storedRemc) {
  const storedStatuses = new Map()

  ;(storedRemc || []).forEach((competency) => {
    ;(competency.items || []).forEach((item) => {
      const normalizedId = normalizeRemcItemId(item.id)
      storedStatuses.set(normalizedId, normalizeRemcStatus(item.status))
    })
  })

  return cloneRemcTemplate().map((competency) => ({
    ...competency,
    items: competency.items.map((item) => ({
      ...item,
      status: storedStatuses.get(item.id) || item.status,
    })),
  }))
}

export function mergeRemcWithProgressRows(progressRows = []) {
  const byItemId = Object.fromEntries(
    (progressRows || []).map((row) => [row.item_id, row]),
  )

  return cloneRemcTemplate().map((competency) => ({
    ...competency,
    items: competency.items.map((item) => {
      const row = byItemId[item.id]
      return {
        ...item,
        status: normalizeRemcStatus(row?.status || item.status),
        updatedAt: row?.updated_at || null,
        updatedBy: row?.updated_by || null,
      }
    }),
  }))
}

function computeCompetencyProgress(competency) {
  if (!competency?.items?.length) return 0
  const total = competency.items.reduce(
    (sum, item) => sum + (statusScore[normalizeRemcStatus(item.status)] || 0),
    0,
  )
  return Math.round((total / competency.items.length) * 100)
}

/** Progression globale et par compétence à partir du REMC fusionné. */
export function computeRemcProgress(remcCompetencies = []) {
  if (!remcCompetencies.length) {
    return { global: 0, byCompetency: {}, itemCounts: { total: 0, validated: 0, inProgress: 0 } }
  }

  const byCompetency = remcCompetencies.reduce((acc, competency) => {
    acc[competency.code] = computeCompetencyProgress(competency)
    return acc
  }, {})

  const global = Math.round(
    Object.values(byCompetency).reduce((sum, value) => sum + value, 0) / remcCompetencies.length,
  )

  const allItems = remcCompetencies.flatMap((competency) => competency.items || [])
  const itemCounts = {
    total: allItems.length,
    validated: allItems.filter((item) => normalizeRemcStatus(item.status) === 'Validé').length,
    inProgress: allItems.filter((item) => normalizeRemcStatus(item.status) === 'En cours').length,
  }

  return { global, byCompetency, itemCounts }
}

export function findRemcItemMeta(itemId) {
  for (const competency of REMC_TEMPLATE) {
    const item = competency.items.find((row) => row.id === itemId)
    if (item) {
      return { competencyCode: competency.code, item }
    }
  }
  return null
}

export const REMC_CATALOG_ITEM_COUNT = REMC_TEMPLATE.reduce(
  (sum, competency) => sum + competency.items.length,
  0,
)
