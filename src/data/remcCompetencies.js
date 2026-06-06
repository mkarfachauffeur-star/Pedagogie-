export const REMC_COMPETENCY_ORDER = ['C1', 'C2', 'C3', 'C4']

export const REMC_COMPETENCIES = {
  C1: {
    number: '1',
    title: 'Maîtriser le maniement du véhicule dans un trafic faible ou nul',
    shortTitle: 'Maîtriser le véhicule',
  },
  C2: {
    number: '2',
    title: 'Appréhender la route et circuler dans des conditions normales',
    shortTitle: 'Appréhender la route',
  },
  C3: {
    number: '3',
    title: 'Circuler dans des conditions difficiles et partager la route avec les autres usagers',
    shortTitle: 'Circuler en conditions difficiles',
  },
  C4: {
    number: '4',
    title: 'Pratiquer une conduite autonome, sûre et économique',
    shortTitle: 'Conduite autonome',
  },
}

export const REMC_LOCKED_MESSAGE =
  'Cette compétence sera accessible lorsque la compétence précédente sera validée par votre enseignant.'

export function previousCompetency(code) {
  const index = REMC_COMPETENCY_ORDER.indexOf(code)
  if (index <= 0) return null
  return REMC_COMPETENCY_ORDER[index - 1]
}

export function nextCompetency(code) {
  const index = REMC_COMPETENCY_ORDER.indexOf(code)
  if (index < 0 || index >= REMC_COMPETENCY_ORDER.length - 1) return null
  return REMC_COMPETENCY_ORDER[index + 1]
}
