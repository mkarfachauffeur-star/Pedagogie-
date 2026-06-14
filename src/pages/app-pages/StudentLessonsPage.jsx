import { CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRemcUnlock } from '../../hooks/useRemcUnlock'
import { useClientPagination } from '../../hooks/useClientPagination'
import RemcLockedBanner from '../../components/remc/RemcLockedBanner'
import PaginationBar from '../../components/ui/PaginationBar'
import { REMC_COMPETENCY_ORDER } from '../../data/remcCompetencies'
import { competencyStatusIcon } from '../../services/remcProgress'
import DashboardWarningIcon, { dashboardWarningLights } from '../../components/DashboardWarningIcon'
import LessonImage from '../../components/ui/LessonImage'
import installationPosteConduiteImage from '../../assets/lessons/installation-poste-conduite.png'
import vehicleOrgansDiagramImage from '../../assets/lessons/elements-essentiels-vehicule.png'
import dashboardWarningLightsImage from '../../assets/lessons/voyants-tableau-de-bord.png'
import steeringWheelGuideImage from '../../assets/lessons/tenir-tourner-volant.png'
import startStopGuideImage from '../../assets/lessons/demarrer-arreter.png'
import brakingTypesGuideImage from '../../assets/lessons/types-freinage.png'
import doseAccelerationFreinageImage from '../../assets/lessons/doser-acceleration-freinage.png'
import gearboxGuideImage from '../../assets/lessons/utiliser-boite-vitesses.png'
import forwardReverseGuideImage from '../../assets/lessons/marche-avant-arriere.png'
import observationWarningGuideImage from '../../assets/lessons/regarder-autour-avertir.png'

const competencies = [
  {
    id: 'C1',
    number: '1',
    title: 'Maîtriser le véhicule',
    description: 'Maniement du véhicule dans un trafic faible ou nul',
    progress: 0,
    modulesStarted: 0,
    remaining: 8,
    summary:
      'Progressez étape par étape dans un trafic faible ou nul avec des vidéos, des QCU et des objectifs clairement encadrés.',
  },
  {
    id: 'C2',
    number: '2',
    title: 'Appréhender la route',
    description: 'Observer, anticiper et adapter son allure',
    progress: 0,
    modulesStarted: 0,
    remaining: 6,
    summary:
      'Travaillez l’observation, l’anticipation et l’adaptation de votre allure en environnement réel.',
  },
  {
    id: 'C3',
    number: '3',
    title: 'Partager la route',
    description: 'Interagir avec les autres usagers en sécurité',
    progress: 0,
    modulesStarted: 0,
    remaining: 7,
    summary:
      'Renforcez votre communication, vos contrôles et votre capacité à circuler avec les autres usagers.',
  },
  {
    id: 'C4',
    number: '4',
    title: 'Devenir autonome',
    description: 'Conduire de manière responsable et indépendante',
    progress: 0,
    modulesStarted: 0,
    remaining: 7,
    summary:
      'Préparez une conduite autonome, responsable, économique et adaptée aux situations complexes.',
  },
]

const subcompetenciesByCompetency = {
  C1: [
    {
      id: 'SC1.1',
      title: 'Connaître les principaux organes du véhicule',
      description:
        'Identifier les commandes, témoins, organes de sécurité et éléments indispensables avant de prendre la route.',
      accent: 'cyan',
      video: 'Leçon',
      qcm: 'À faire',
    },
    {
      id: 'SC1.2',
      title: 'S’installer au poste de conduite',
      description:
        'Régler siège, dossier, appuie-tête, rétroviseurs et ceinture pour conduire en sécurité.',
      accent: 'emerald',
      video: 'Leçon',
      qcm: 'À faire',
    },
    {
      id: 'SC1.3',
      title: 'Tenir et tourner le volant',
      description:
        'Leçon complète sur la tenue du volant : courbe, virage, tournant serré, tirer-glisser, chevauchement et gestes interdits.',
      accent: 'amber',
      video: 'Vue',
      qcm: 'À faire',
    },
    {
      id: 'SC1.4',
      title: 'Démarrer et s’arrêter',
      description:
        'Leçon complète pour préparer le départ, démarrer progressivement, s’arrêter en sécurité et immobiliser le véhicule.',
      accent: 'violet',
      video: 'Vue',
      qcm: 'À faire',
    },
    {
      id: 'SC1.5',
      title: 'Doser l’accélération et le freinage',
      description:
        'Leçon complète pour gérer la progressivité de l’accélération, adapter l’allure et freiner avec précision.',
      accent: 'rose',
      video: 'Disponible',
      qcm: 'À faire',
    },
    {
      id: 'SC1.6',
      title: 'Utiliser la boîte de vitesse',
      description:
        'Adapter le rapport de vitesse, gérer l’embrayage et éviter les à-coups.',
      accent: 'teal',
      video: 'Disponible',
      qcm: 'À faire',
    },
    {
      id: 'SC1.7',
      title: 'Diriger le véhicule en marche avant et en marche arrière',
      description:
        'Conserver une trajectoire précise en marche avant, marche arrière et manoeuvres simples.',
      accent: 'cyan',
      video: 'Disponible',
      qcm: 'À faire',
    },
    {
      id: 'SC1.8',
      title: 'Regarder autour de soi et avertir',
      description:
        'Observer avant d’agir, contrôler les angles morts et avertir les autres usagers au bon moment.',
      accent: 'emerald',
      video: 'Disponible',
      qcm: 'À faire',
    },
  ],
  C2: [
    {
      id: 'SC2.1',
      title: 'Rechercher la signalisation et les indices utiles',
      description:
        'Repérer panneaux, marquages, feux, comportements des usagers et indices annonçant un danger.',
      accent: 'cyan',
      video: 'Leçon',
      qcm: 'À faire',
    },
    {
      id: 'SC2.2',
      title: 'Positionner le véhicule sur la chaussée',
      description:
        'Choisir sa voie, respecter les marquages et maintenir un placement adapté à la situation.',
      accent: 'emerald',
      video: '13 min',
      qcm: 'À faire',
    },
    {
      id: 'SC2.3',
      title: 'Adapter son allure aux situations',
      description:
        'Ajuster sa vitesse selon visibilité, trafic, météo, signalisation et configuration des lieux.',
      accent: 'amber',
      video: '16 min',
      qcm: 'À faire',
    },
    {
      id: 'SC2.4',
      title: 'Détecter et franchir les intersections',
      description:
        'Identifier les régimes de priorité et franchir une intersection avec observation et décision sûre.',
      accent: 'violet',
      video: '10 min',
      qcm: 'À faire',
    },
    {
      id: 'SC2.5',
      title: 'Changer de direction',
      description:
        'Préparer, signaler et réaliser un changement de direction en conservant sécurité et placement.',
      accent: 'rose',
      video: '12 min',
      qcm: 'À faire',
    },
    {
      id: 'SC2.6',
      title: 'Stationner et repartir',
      description:
        'Choisir un emplacement, stationner sans gêner et repartir après contrôles complets.',
      accent: 'teal',
      video: '18 min',
      qcm: 'À faire',
    },
  ],
  C3: [
    {
      id: 'SC3.1',
      title: 'Évaluer distances et vitesses',
      description:
        'Apprécier les écarts, temps d’approche et marges de sécurité avec les autres usagers.',
      accent: 'cyan',
      video: 'Leçon',
      qcm: 'À faire',
    },
    {
      id: 'SC3.2',
      title: 'Croiser, dépasser et être dépassé',
      description:
        'Gérer croisements, dépassements et situations où un autre usager dépasse le véhicule.',
      accent: 'emerald',
      video: '12 min',
      qcm: 'À faire',
    },
    {
      id: 'SC3.3',
      title: 'Négocier les virages et déclivités',
      description:
        'Adapter l’allure et la trajectoire en virage, montée, descente et zone à visibilité réduite.',
      accent: 'amber',
      video: '14 min',
      qcm: 'À faire',
    },
    {
      id: 'SC3.4',
      title: 'Connaître les caractéristiques des autres usagers',
      description:
        'Anticiper piétons, cyclistes, deux-roues, poids lourds, transports collectifs et véhicules prioritaires.',
      accent: 'rose',
      video: '17 min',
      qcm: 'À faire',
    },
    {
      id: 'SC3.5',
      title: 'S’insérer, circuler et sortir d’une voie rapide',
      description:
        'S’insérer avec contrôle, maintenir distances et quitter une voie rapide avec anticipation.',
      accent: 'violet',
      video: '19 min',
      qcm: 'À faire',
    },
    {
      id: 'SC3.6',
      title: 'Conduire dans une circulation dense',
      description:
        'Gérer files, changements de voie, ronds-points chargés et interactions multiples.',
      accent: 'teal',
      video: '15 min',
      qcm: 'À faire',
    },
    {
      id: 'SC3.7',
      title: 'Conduire quand l’adhérence et la visibilité sont réduites',
      description:
        'Adapter conduite de nuit, pluie, brouillard, chaussée glissante et conditions dégradées.',
      accent: 'cyan',
      video: '16 min',
      qcm: 'À faire',
    },
  ],
  C4: [
    {
      id: 'SC4.1',
      title: 'Suivre un itinéraire de manière autonome',
      description:
        'Préparer, suivre et adapter un trajet avec signalisation, GPS ou consignes de navigation.',
      accent: 'cyan',
      video: '11 min',
      qcm: 'À faire',
    },
    {
      id: 'SC4.2',
      title: 'Préparer et effectuer un voyage longue distance',
      description:
        'Contrôler véhicule, fatigue, pauses, météo, chargement et choix d’itinéraire.',
      accent: 'emerald',
      video: '12 min',
      qcm: 'À faire',
    },
    {
      id: 'SC4.3',
      title: 'Connaître les principaux facteurs de risque',
      description:
        'Identifier alcool, stupéfiants, vitesse, fatigue, distraction, pression sociale et météo.',
      accent: 'violet',
      video: '15 min',
      qcm: 'À faire',
    },
    {
      id: 'SC4.4',
      title: 'Adopter une conduite économique et respectueuse',
      description:
        'Limiter consommation, bruit, usure mécanique et impact environnemental.',
      accent: 'teal',
      video: '18 min',
      qcm: 'À faire',
    },
    {
      id: 'SC4.5',
      title: 'Utiliser les aides à la conduite',
      description:
        'Comprendre ABS, ESP, régulateur, limiteur, aides au stationnement et leurs limites.',
      accent: 'amber',
      video: '13 min',
      qcm: 'À faire',
    },
    {
      id: 'SC4.6',
      title: 'Réagir en cas d’accident ou de panne',
      description:
        'Protéger, alerter, secourir, remplir un constat et sécuriser une zone d’incident.',
      accent: 'rose',
      video: '17 min',
      qcm: 'À faire',
    },
    {
      id: 'SC4.7',
      title: 'Entretenir le véhicule et détecter une anomalie',
      description:
        'Surveiller niveaux, pneumatiques, éclairage, témoins et signaux d’alerte du véhicule.',
      accent: 'cyan',
      video: '14 min',
      qcm: 'À faire',
    },
  ],
}

function createRandomizedQuestion(question, correctChoice, wrongChoices, explanation, iconType) {
  const choices = [correctChoice, ...wrongChoices].map((choice, index) => ({
    choice,
    correct: index === 0,
  }))

  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]]
  }

  return {
    question,
    choices: choices.map((item) => item.choice),
    answer: choices.findIndex((item) => item.correct),
    explanation,
    ...(iconType ? { iconType } : {}),
  }
}

function shuffleArray(items) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function buildQuizSession(questions = []) {
  return shuffleArray(questions).map((question) => {
    const choices = shuffleArray(
      question.choices.map((choice, index) => ({
        choice,
        correct: index === question.answer,
      })),
    )

    return {
      ...question,
      choices: choices.map((item) => item.choice),
      answer: choices.findIndex((item) => item.correct),
    }
  })
}

const VEHICLE_ORGANS_QUIZ_SIZE = 10

function getLessonQuestionPool(lesson) {
  if (!lesson) return []
  return lesson.questionPool ?? lesson.questions ?? []
}

function getExpectedQuizCount(lesson) {
  const pool = getLessonQuestionPool(lesson)
  if (!pool.length) return 0
  return lesson?.quizSize ? Math.min(lesson.quizSize, pool.length) : pool.length
}

function getQuizIntro(lesson, displayTotal) {
  if (!lesson || !displayTotal) {
    return 'QCU interactif avec correction immédiate et validation à 80 %.'
  }
  const randomNote = lesson.quizSize ? ' · tirage aléatoire' : ''
  return `${displayTotal} question${displayTotal > 1 ? 's' : ''} sur « ${lesson.title} ». Correction immédiate, score final et validation à 80 %${randomNote}.`
}

function createQuizSessionForLesson(lesson) {
  const pool = getLessonQuestionPool(lesson)
  if (!pool.length) return []

  const sample = lesson?.quizSize
    ? shuffleArray(pool).slice(0, Math.min(lesson.quizSize, pool.length))
    : pool

  return buildQuizSession(sample)
}

function resolveQuizSession(lesson, existingSession) {
  const expectedCount = getExpectedQuizCount(lesson)
  if (!expectedCount) return []
  if (existingSession?.length === expectedCount) return existingSession
  return createQuizSessionForLesson(lesson)
}

const vehicleOrgansModule = {
  id: 'SC1.1',
  storageKey: 'pedagogia:lesson:vehicle-organs',
  title: 'Connaître les principaux organes du véhicule',
  intro:
    'Identifier les commandes, témoins, organes de sécurité et éléments indispensables avant de prendre la route.',
  schemaSection: {
    kicker: 'Schéma pédagogique du véhicule',
    title: 'Les éléments essentiels du véhicule',
  },
  summaryIntro:
    'Chaque point du schéma vous aide à repérer les commandes, les organes de sécurité et les vérifications indispensables avant de prendre la route.',
  images: [
    {
      src: vehicleOrgansDiagramImage,
      alt: 'Schéma pédagogique : les éléments essentiels du véhicule',
      title: 'Les éléments essentiels du véhicule',
      caption:
        'Commandes, éléments extérieurs, témoins du tableau de bord, vérifications avant départ et visibilité : repères visuels avant de prendre la route.',
    },
  ],
  summary: [
    {
      title: 'Le volant',
      description:
        'Le volant permet de diriger le véhicule et de maintenir sa trajectoire. Un mauvais maintien peut diminuer la précision de conduite, augmenter le temps de réaction et provoquer une mauvaise maîtrise du véhicule.',
    },
    {
      title: 'L’embrayage',
      description:
        'L’embrayage permet l’arrêt du véhicule sans caler, le démarrage progressif, le changement de vitesse et la participation au frein moteur. Une mauvaise utilisation peut provoquer des à-coups, une usure prématurée ou un calage.',
    },
    {
      title: 'Le frein',
      description:
        'Le frein permet de ralentir, d’immobiliser le véhicule et d’adapter son allure aux situations. Le conducteur doit doser son freinage pour garder le contrôle du véhicule.',
    },
    {
      title: 'L’accélérateur',
      description:
        'L’accélérateur permet d’augmenter la vitesse en adaptant le régime moteur. Une accélération brutale peut augmenter la consommation, diminuer l’adhérence et rendre la conduite moins souple.',
    },
    {
      title: 'Les pneus',
      description:
        'Les pneus assurent l’adhérence, la stabilité, le freinage et la tenue de route. Il est conseillé de vérifier la pression une fois par mois, l’usure et l’état général avant un long trajet. Des pneus usés augmentent fortement les distances de freinage.',
    },
    {
      title: 'Les rétroviseurs',
      description:
        'Les rétroviseurs permettent de surveiller l’environnement arrière, d’anticiper les dangers et de sécuriser les changements de direction. Ils doivent être correctement réglés avant le départ.',
    },
    {
      title: 'Les feux du véhicule',
      description:
        'Les feux de croisement éclairent sans éblouir. Les feux de route améliorent la visibilité la nuit hors agglomération lorsqu’aucun usager n’est gêné. Les clignotants indiquent un changement de direction.',
    },
    {
      title: 'Les témoins du tableau de bord',
      description:
        'Le témoin de pression d’huile peut signaler un risque grave pour le moteur et imposer un arrêt rapide. Le témoin batterie signale un problème du système de charge. Le témoin moteur indique un dysfonctionnement du moteur ou du système antipollution.',
    },
    {
      title: 'Les essuie-glaces',
      description:
        'Les essuie-glaces permettent de conserver une bonne visibilité en cas de pluie ou de projection. Des balais usés réduisent fortement la visibilité.',
    },
    {
      title: 'Vérifications avant de prendre la route',
      description:
        'Avant un trajet, il est recommandé de vérifier l’état des pneus, les feux, les niveaux, les rétroviseurs et les documents du véhicule. Ces vérifications participent à la sécurité de tous les usagers.',
    },
  ],
  safetyAdvice: [
    'Vérifiez la pression des pneus environ une fois par mois.',
    'Contrôler l’aspect général du véhicule avant de démarrer.',
    'Surveillez les témoins du tableau de bord : un témoin d’huile peut exiger un arrêt rapide et sécurisé.',
    'Remplacez les balais d’essuie-glaces usés pour conserver une bonne visibilité par temps de pluie.',
  ],
  dashboardSection: {
    kicker: 'Tableau de bord',
    title: 'Voyants importants du tableau de bord',
    intro:
      'Les couleurs orientent la conduite : rouge = danger immédiat, orange = contrôle à prévoir, bleu/vert = information. Retenez la signification de chaque témoin avant l’examen pratique.',
    image: {
      src: dashboardWarningLightsImage,
      alt: 'Infographie : 10 voyants importants du tableau de bord',
      caption:
        'Dix témoins essentiels à reconnaître : pression d’huile, batterie, moteur, freinage, pneus, ceinture, feux, ABS et température.',
    },
    lights: dashboardWarningLights,
  },
}

const vehicleOrgansDashboardQuestions = [
  createRandomizedQuestion(
    'Quelle est la signification de ce témoin ?',
    'Signale un manque de pression d’huile moteur.',
    [
      'Indique qu’il est temps de réaliser la vidange périodique du moteur.',
      'Signale une température d’huile moteur trop élevée.',
      'Indique un niveau insuffisant de liquide lave-glace.',
    ],
    'Un manque de pression d’huile peut endommager gravement le moteur : arrêt sécurisé dès que possible.',
    'oil-pressure',
  ),
  createRandomizedQuestion(
    'Quelle est la signification de ce témoin ?',
    'Indique un problème du système de charge ou de la batterie.',
    [
      'Signale l’activation du mode économie d’énergie du véhicule.',
      'Indique que les bougies de préchauffage sont en fonctionnement.',
      'Signale une défaillance isolée du démarreur, sans lien avec la charge.',
    ],
    'Ce témoin concerne l’alternateur, la batterie ou le circuit de charge.',
    'battery',
  ),
  createRandomizedQuestion(
    'Quelle est la signification de ce témoin ?',
    'Signale un dysfonctionnement moteur ou du système antipollution.',
    [
      'Indique que le niveau de carburant est passé en réserve.',
      'Signale une surchauffe immédiate des pistons du moteur.',
      'Indique que le moteur fonctionne en mode « Sport ».',
    ],
    'Le voyant moteur peut concerner l’injection, l’allumage ou le système antipollution.',
    'engine',
  ),
  createRandomizedQuestion(
    'Quelle est la signification de ce témoin ?',
    'Indique que le frein de stationnement est activé ou qu’un problème de freinage est détecté.',
    [
      'Signale que les plaquettes de frein viennent d’être remplacées.',
      'Indique l’activation de l’aide au démarrage en côte.',
      'Signale une usure excessive des pneus arrière uniquement.',
    ],
    'Vérifiez le frein à main et l’état du circuit de freinage si le témoin reste allumé en roulant.',
    'parking-brake',
  ),
  createRandomizedQuestion(
    'Quelle est la signification de ce témoin ?',
    'Indique une pression insuffisante dans un ou plusieurs pneus.',
    [
      'Signale qu’il faut équiper le véhicule de pneus hiver.',
      'Indique un risque de verglas sur la chaussée.',
      'Signale que les roues ne sont pas correctement alignées.',
    ],
    'Une pression insuffisante réduit l’adhérence et allonge les distances de freinage.',
    'tire-pressure',
  ),
  createRandomizedQuestion(
    'Quelle est la signification de ce témoin ?',
    'Indique qu’une des ceintures de sécurité n’est pas bouclée',
    [
      'Signale un dysfonctionnement de l’airbag passager avant.',
      'Indique que le passager n’a pas mis sa ceinture de sécurité',
      'Indique que le dossier du siège n’est pas verrouillé en position conduite.',
    ],
    'La ceinture doit être bouclée avant tout départ.',
    'seatbelt',
  ),
  createRandomizedQuestion(
    'Quelle est la signification de ce témoin ?',
    'Indique que les feux de route sont allumés.',
    [
      'Indique l’activation des feux de brouillard arrière.',
      'Signale que seuls les feux de position sont en service.',
      'Indique que les feux de croisement sont en mode automatique.',
    ],
    'Les feux de route améliorent la visibilité loin, mais peuvent éblouir : à couper face aux usagers.',
    'high-beam',
  ),
  createRandomizedQuestion(
    'Quelle est la signification de ce témoin ?',
    'Indique l’activation des feux de croisement.',
    [
      'Indique l’activation des feux de jour uniquement.',
      'Signale que les feux de route sont en mode automatique permanent.',
      'Indique que les feux de stationnement sont seuls allumés.',
    ],
    'Les feux de croisement éclairent la route sans éblouir les autres usagers.',
    'low-beam',
  ),
  createRandomizedQuestion(
    'Quelle est la signification de ce témoin ?',
    'Signale un défaut du système antiblocage des roues.',
    [
      'Indique que le freinage d’urgence automatique vient de s’activer.',
      'Signale une usure avancée des disques de frein avant.',
      'Indique que le véhicule va nécessairement déraper au prochain freinage.',
    ],
    'Sans ABS, le freinage reste possible mais le blocage des roues n’est plus évité.',
    'abs',
  ),
  createRandomizedQuestion(
    'Quelle est la signification de ce témoin ?',
    'Indique une surchauffe du moteur.',
    [
      'Signale que le chauffage de l’habitacle est réglé au maximum.',
      'Indique que le liquide lave-glace a atteint une température élevée.',
      'Signale que le moteur a atteint sa température idéale de fonctionnement.',
    ],
    'Une surchauffe impose un arrêt sécurisé pour protéger le moteur.',
    'engine-temperature',
  ),
]

const vehicleOrgansQuestions = [
  {
    question: 'Quel élément permet principalement d’immobiliser le véhicule en sécurité ?',
    choices: [
      'Le système de freinage',
      'Le dispositif de transmission secondaire',
      'Le système de ventilation moteur',
    ],
    answer: 0,
    explanation: 'Le frein permet de ralentir et d’immobiliser le véhicule en sécurité.',
  },
  {
    question: 'Quel équipement permet au conducteur d’adapter précisément la trajectoire du véhicule ?',
    choices: [
      'Le volant',
      'Le limiteur de vitesse',
      'Avoir un bon regard',
    ],
    answer: 0,
    explanation: 'Le volant permet de diriger le véhicule et de maintenir sa trajectoire.',
  },
  {
    question: 'Quels sont les principaux rôles de l’embrayage ?',
    choices: [
      'Permettre l’arrêt, le démarrage, le changement de vitesse et participer au frein moteur',
      'Réguler automatiquement le régime moteur et corriger la trajectoire du véhicule',
      'Maintenir la pression hydraulique du système de freinage',
    ],
    answer: 0,
    explanation:
      'L’embrayage permet l’arrêt sans caler, le démarrage progressif, le changement de vitesse et participe au frein moteur.',
  },
  {
    question: 'À quelle fréquence est-il conseillé de vérifier la pression des pneus ?',
    choices: [
      'Tous les 10 000 km uniquement',
      'Une fois par mois',
      'Seulement avant un contrôle technique',
    ],
    answer: 1,
    explanation: 'Il est conseillé de vérifier la pression des pneus environ une fois par mois.',
  },
  {
    question: 'Quel équipement permet d’avertir les autres usagers d’un changement de direction ?',
    choices: [
      'Les feux de position',
      'Les clignotants',
      'Les feux diurnes automatiques',
      'L’avertisseur sonore',
    ],
    answer: 1,
    explanation:
      'Les clignotants permettent d’indiquer un changement de direction. L’avertisseur sonore est réservé au danger immédiat.',
  },
  {
    question: 'Pourquoi l’état des pneus est-il essentiel pour la sécurité ?',
    choices: [
      'Ils garantissent l’adhérence, la stabilité et l’efficacité du freinage',
      'Ils compensent automatiquement les défauts de suspension du véhicule',
      'Ils permettent uniquement d’économiser du carburant',
    ],
    answer: 0,
    explanation: 'Les pneus assurent l’adhérence, la stabilité, le freinage et la tenue de route.',
  },
  {
    question: 'Quel équipement permet au conducteur de contrôler l’environnement arrière du véhicule ?',
    choices: [
      'Les rétroviseurs',
      'Les angles morts',
      'Le correcteur électronique de trajectoire',
    ],
    answer: 0,
    explanation: 'Les rétroviseurs permettent de surveiller l’environnement arrière et d’anticiper les dangers.',
  },
  {
    question: 'Quel équipement est indispensable pour conserver une bonne visibilité sous la pluie ?',
    choices: [
      'Les essuie-glaces',
      'Les feux de route',
      'Le système antiblocage des roues',
    ],
    answer: 0,
    explanation: 'Les essuie-glaces permettent de conserver une bonne visibilité en cas de pluie.',
  },
]

const drivingPositionModule = {
  id: 'SC1.2',
  storageKey: 'pedagogia:lesson:driving-position',
  title: 'S’installer au poste de conduite',
  intro:
    'Avant de démarrer, le conducteur doit correctement régler son poste de conduite afin d’assurer sa sécurité, son confort et une bonne maîtrise du véhicule.',
  schemaSection: {
    kicker: 'Schémas et photos du poste de conduite',
    title: 'Installation correcte au poste de conduite',
  },
  summaryIntro:
    'Chaque étape prépare le conducteur à agir avec précision, à anticiper la trajectoire et à garder une maîtrise sûre du véhicule.',
  images: [
    {
      src: installationPosteConduiteImage,
      alt: 'Schéma pédagogique : installation correcte au poste de conduite',
      title: 'Installation correcte au poste de conduite',
      caption:
        'Repères visuels pour vérifier la position du siège, du dossier, des mains, des jambes, des pédales et des rétroviseurs.',
    },
  ],
  summary: [
    {
      title: 'Réglage du siège en hauteur',
      description:
        'Le regard du conducteur doit se situer au milieu du pare-brise, ni trop haut ni trop bas, afin d’avoir une bonne visibilité sur la route et les alentours.',
    },
    {
      title: 'Réglage de l’avancement du siège',
      description:
        'Pour une boîte manuelle, le conducteur doit enfoncer complètement la pédale d’embrayage avec le pied gauche. La jambe doit rester légèrement fléchie : ni trop tendue, ni trop pliée, afin de pouvoir utiliser les pédales facilement et sans fatigue.',
    },
    {
      title: 'Réglage du dossier',
      description:
        'Le dossier doit être légèrement incliné vers l’arrière. La tête ne doit pas porter entièrement sur les épaules afin de limiter la fatigue et rester concentré plus longtemps pendant la conduite.',
    },
    {
      title: 'Réglage du volant',
      description:
        'Les mains doivent être positionnées à 10h10 ou 9h15 sur le volant. Les bras doivent rester légèrement fléchis : ni trop proches ni trop éloignés du volant, afin de garder une bonne précision dans les mouvements.',
    },
    {
      title: 'Réglage du rétroviseur intérieur',
      description:
        'Le rétroviseur intérieur se règle avec les extrémités des doigts, sans poser la main sur la vitre. Le conducteur doit voir entièrement la lunette arrière ainsi que les appuie-têtes arrière.',
    },
    {
      title: 'Réglage des rétroviseurs extérieurs',
      description:
        'Mettre le contact si les rétroviseurs sont électriques. Le conducteur doit voir une petite partie de la poignée ou du côté du véhicule, puis le reste de l’image doit montrer la route. Les rétroviseurs ne doivent être ni trop hauts ni trop bas.',
    },
    {
      title: 'Ceinture de sécurité',
      description:
        'La ceinture doit passer sur la clavicule, ni trop vers le cou ni trop vers l’épaule. Si nécessaire, il faut régler la hauteur de la ceinture à l’aide de la commande prévue à cet effet.',
    },
  ],
  safetyAdvice: [
    'Effectuez tous les réglages à l’arrêt, avant de mettre le véhicule en mouvement.',
    'Gardez les bras et les jambes légèrement fléchis pour conserver précision, réactivité et confort.',
    'Vérifiez les rétroviseurs après avoir réglé le siège et le dossier, car votre position influence le champ de vision.',
    'La ceinture doit être ajustée après l’installation complète afin de rester efficace en cas de freinage brusque ou de choc.',
  ],
}

const drivingPositionQuestions = [
  {
    question: 'Quel est le bon ordre d’installation au poste de conduite ?',
    choices: [
      'Ceinture → siège → rétroviseurs → volant',
      'Volant → ceinture → siège → rétroviseurs',
      'Siège → dossier → volant → rétroviseurs → ceinture',
      'Rétroviseurs → siège → ceinture → volant',
    ],
    answer: 2,
    explanation:
      'Il faut d’abord régler le siège, puis le dossier, le volant, les rétroviseurs et terminer par la ceinture.',
  },
  {
    question: 'Lors du réglage de l’avancement du siège sur une boîte manuelle, quel contrôle permet de vérifier la bonne distance ?',
    choices: [
      'Tourner complètement le volant',
      'Appuyer à fond sur la pédale d’embrayage',
      'Regarder le capot moteur',
      'Tester le frein à main',
    ],
    answer: 1,
    explanation:
      'Le conducteur doit pouvoir enfoncer complètement l’embrayage tout en gardant la jambe légèrement fléchie.',
  },
  {
    question: 'Pourquoi le dossier ne doit-il pas être trop droit ?',
    choices: [
      'Cela augmente la consommation',
      'Cela réduit la visibilité arrière',
      'Cela fatigue plus rapidement le conducteur',
      'Cela bloque les rétroviseurs',
    ],
    answer: 2,
    explanation:
      'Un dossier trop droit augmente la fatigue musculaire et réduit le confort de conduite.',
  },
  {
    question: 'Quel défaut peut provoquer un volant réglé trop loin du conducteur ?',
    choices: [
      'Une mauvaise utilisation des pédales',
      'Des bras trop tendus et une perte de précision',
      'Une mauvaise visibilité du rétroviseur intérieur',
      'Un déclenchement de l’airbag',
    ],
    answer: 1,
    explanation:
      'Les bras doivent rester légèrement fléchis afin de conserver précision et réactivité.',
  },
  {
    question: 'Lors du réglage du rétroviseur intérieur, le conducteur doit voir :',
    choices: [
      'Une partie importante du pavillon',
      'Seulement les véhicules derrière',
      'L’ensemble de la lunette arrière',
      'Le siège passager arrière uniquement',
    ],
    answer: 2,
    explanation:
      'Le rétroviseur intérieur doit offrir une vision complète de la lunette arrière.',
  },
  {
    question: 'Pourquoi faut-il éviter de poser la main sur la vitre lors du réglage du rétroviseur intérieur ?',
    choices: [
      'Cela peut salir la vitre',
      'Cela dérègle automatiquement le siège',
      'Cela réduit la précision du réglage',
      'Cela empêche le contact du véhicule',
    ],
    answer: 2,
    explanation:
      'Le réglage doit être précis et réalisé avec les extrémités des doigts.',
  },
  {
    question: 'Quel réglage est correct pour un rétroviseur extérieur ?',
    choices: [
      'Voir uniquement le côté du véhicule',
      'Voir principalement le ciel',
      'Voir une petite partie du véhicule et la route',
      'Voir uniquement la poignée arrière',
    ],
    answer: 2,
    explanation:
      'Le rétroviseur doit permettre de surveiller la circulation tout en gardant un repère du véhicule.',
  },
  {
    question: 'Une ceinture mal positionnée au niveau du cou peut :',
    choices: [
      'Améliorer le maintien',
      'Gêner le conducteur et réduire la sécurité',
      'Faciliter les mouvements',
      'Éviter les blessures au bras',
    ],
    answer: 1,
    explanation:
      'Une ceinture mal réglée peut provoquer une gêne et diminuer son efficacité en cas de choc.',
  },
  {
    question: 'Quel risque existe si le siège est trop proche des pédales ?',
    choices: [
      'Les jambes seront trop tendues',
      'Le conducteur perdra l’accès au volant',
      'Les jambes seront trop fléchies et les mouvements moins fluides',
      'Le moteur risque de caler automatiquement',
    ],
    answer: 2,
    explanation:
      'Une position trop proche réduit l’aisance des mouvements et augmente la fatigue.',
  },
  {
    question: 'Pourquoi l’installation au poste de conduite est-elle importante avant de démarrer ?',
    choices: [
      'Pour améliorer uniquement le confort',
      'Pour respecter le design du véhicule',
      'Pour assurer visibilité, confort et sécurité',
      'Pour économiser du carburant',
    ],
    answer: 2,
    explanation:
      'Une bonne installation permet une meilleure maîtrise du véhicule et réduit les risques d’erreur.',
  },
]

const steeringWheelModule = {
  id: 'SC1.3',
  storageKey: 'pedagogia:lesson:steering-wheel',
  title: 'Tenir et tourner le volant',
  intro:
    'Les mains doivent être placées à 9h15 ou 10h10 avec les bras légèrement fléchis. Le regard doit porter loin afin de mieux suivre la trajectoire. Le conducteur doit garder les mains sur le volant autant que possible, y compris pour utiliser les commandes comme les clignotants, les essuie-glaces et les feux.',
  schemaSection: {
    kicker: 'Repère visuel',
    title: 'Tenir et tourner le volant',
  },
  images: [
    {
      src: steeringWheelGuideImage,
      alt: 'Infographie : position conseillée 9h15 et positions déconseillées sur le volant',
      title: 'Tenir et tourner le volant',
      caption:
        'Position conseillée à 9h15, mains détendues et regard loin devant. Positions déconseillées : mains croisées, une seule main, mains en 12h ou trop basses.',
      objectFit: 'contain',
    },
  ],
  summary: [
    {
      title: 'Position des mains et regard',
      description:
        'Les mains doivent rester à 9h15 ou 10h10, avec les bras légèrement fléchis. Le regard doit porter loin afin d’anticiper et de suivre naturellement la trajectoire.',
    },
    {
      title: 'Commandes à utiliser sans lâcher le volant',
      description:
        'Le conducteur doit garder les mains sur le volant autant que possible, y compris lorsqu’il utilise les clignotants, les essuie-glaces ou les feux.',
    },
    {
      title: 'Technique 1 : la courbe',
      description:
        'Technique : maintien des mains. Pour une légère courbe, le conducteur garde les deux mains à leur place sur le volant et effectue de petits mouvements souples. Dans une courbe, il peut voir la sortie ou le bout de la route.',
    },
    {
      title: 'Technique 2 : le virage',
      description:
        'Technique : tirer-glisser. Une main tire le volant pendant que l’autre glisse pour reprendre la position. Les mains ne se croisent pas. Le virage possède une visibilité plus restreinte que la courbe.',
    },
    {
      title: 'Usage du tirer-glisser',
      description:
        'Cette technique est principalement utilisée hors agglomération et en montagne, lorsque la visibilité est plus limitée et que la trajectoire doit rester progressive.',
    },
    {
      title: 'Technique 3 : le tournant serré à 90°',
      description:
        'Technique : chevauchement. Les mains peuvent se croiser sur un quart du volant afin d’obtenir une rotation plus importante.',
    },
    {
      title: 'Usage du chevauchement',
      description:
        'Cette technique est principalement utilisée en agglomération, en centre-ville, dans les rues étroites et pour certaines manœuvres.',
    },
  ],
  safetyAdvice: [
    'Ne pas pousser le volant.',
    'Ne pas mettre les mains sous le volant.',
    'Ne pas passer les mains à l’intérieur du volant.',
    'Ne pas tourner brusquement : les gestes doivent toujours rester souples et précis.',
  ],
}

const steeringWheelQuestions = [
  {
    question: 'Quelle est la bonne position des mains sur le volant ?',
    choices: ['6h00', '12h00', '9h15 ou 10h10', 'Une seule main sur le volant'],
    answer: 2,
    explanation: 'Les mains doivent être placées à 9h15 ou 10h10 pour garder une bonne maîtrise du volant.',
  },
  {
    question: 'Dans une courbe, le conducteur :',
    choices: ['Ne voit pas la sortie', 'Peut voir le bout de la route', 'Doit croiser les mains', 'Doit pousser le volant'],
    answer: 1,
    explanation: 'Dans une courbe, le conducteur peut voir la sortie ou le bout de la route.',
  },
  {
    question: 'Quelle technique est utilisée dans une courbe ?',
    choices: ['Chevauchement', 'Tirer-glisser', 'Maintien des mains', 'Rotation rapide'],
    answer: 2,
    explanation: 'Pour une légère courbe, la technique utilisée est le maintien des mains.',
  },
  {
    question: 'Le tirer-glisser est principalement utilisé :',
    choices: ['En centre-ville', 'Hors agglomération et en montagne', 'Pour stationner', 'À l’arrêt'],
    answer: 1,
    explanation: 'Le tirer-glisser est principalement utilisé hors agglomération et en montagne.',
  },
  {
    question: 'Avec la technique du tirer-glisser :',
    choices: ['Les mains se croisent', 'Une seule main tourne le volant', 'Les mains ne se croisent pas', 'Le volant est poussé'],
    answer: 2,
    explanation: 'Avec le tirer-glisser, une main tire pendant que l’autre glisse, sans croiser les mains.',
  },
  {
    question: 'Le chevauchement est principalement utilisé :',
    choices: ['Sur autoroute', 'Dans les rues étroites et en agglomération', 'Uniquement à grande vitesse', 'Dans les courbes légères'],
    answer: 1,
    explanation: 'Le chevauchement est surtout utilisé en agglomération, dans les rues étroites et pour certaines manoeuvres.',
  },
  {
    question: 'Avec la technique du chevauchement :',
    choices: ['Les mains peuvent se croiser', 'Le conducteur lâche le volant', 'Les bras restent tendus', 'Le volant ne tourne pas beaucoup'],
    answer: 0,
    explanation: 'Avec le chevauchement, les mains peuvent se croiser sur un quart du volant pour obtenir une rotation plus importante.',
  },
  {
    question: 'Quelle pratique est interdite ?',
    choices: ['Regarder loin', 'Garder les mains sur le volant', 'Pousser le volant', 'Adapter sa trajectoire'],
    answer: 2,
    explanation: 'Pousser le volant fait partie des pratiques interdites : les gestes doivent rester souples et précis.',
  },
  {
    question: 'Pourquoi faut-il regarder loin ?',
    choices: ['Pour voir uniquement les panneaux', 'Pour mieux suivre la trajectoire et anticiper', 'Pour éviter les rétroviseurs', 'Pour tourner plus vite'],
    answer: 1,
    explanation: 'Regarder loin permet de mieux suivre la trajectoire et d’anticiper les actions à venir.',
  },
  {
    question: 'Lors de l’utilisation des commandes (clignotants, essuie-glaces…), le conducteur doit :',
    choices: ['Lâcher complètement le volant', 'Garder les mains sur le volant autant que possible', 'Utiliser les deux mains sur le commodo', 'Regarder le tableau de bord longtemps'],
    answer: 1,
    explanation: 'Le conducteur doit garder les mains sur le volant autant que possible, même lorsqu’il utilise les commandes.',
  },
]

const startStopModule = {
  id: 'SC1.4',
  storageKey: 'pedagogia:lesson:start-stop',
  title: 'Démarrer et s’arrêter',
  intro:
    'Le conducteur doit adapter son démarrage selon la situation rencontrée et choisir un freinage adapté pour ralentir ou s’arrêter en sécurité.',
  schemaSection: {
    kicker: 'Schémas et photos',
  },
  images: [
    {
      src: startStopGuideImage,
      alt: 'Infographie : démarrer et s’arrêter — conseils pratiques et erreurs à éviter',
      title: 'Démarrer et s’arrêter',
      caption:
        'Conseils pratiques (démarrage en douceur, arrêt sécurisé, point de patinage) et gestes à éviter (embrayage brutal, commandes forcées, freinage brutal).',
      objectFit: 'contain',
    },
    {
      src: brakingTypesGuideImage,
      alt: 'Infographie : types de freinage progressif et dégressif',
      title: 'Types de freinage',
      caption:
        'Freinage progressif : pression qui augmente progressivement. Freinage dégressif : forte pression au début puis relâchement progressif.',
      objectFit: 'contain',
    },
  ],
  summary: [
    {
      title: 'Démarrage sans accélérateur',
      description:
        'Utilisé sur parking, en manœuvre et à très faible allure. Technique : embrayage + frein, puis lever progressivement l’embrayage jusqu’au point de patinage.',
    },
    {
      title: 'Démarrage avec accélération',
      description:
        'Utilisé sur route, aux feux, aux stops et dans la circulation. Technique : embrayage, point de patinage, légère accélération, puis relâcher progressivement l’embrayage.',
    },
    {
      title: 'Démarrage en côte',
      description:
        'Utilisé pour éviter le recul du véhicule. Technique : frein à main + embrayage ou frein + embrayage. Le conducteur trouve le point de patinage, accélère légèrement, puis relâche progressivement le frein et l’embrayage.',
    },
    {
      title: 'Freinage progressif',
      description:
        'Freiner doucement au début puis augmenter progressivement la pression. Cela permet un ralentissement confortable et évite les à-coups.',
    },
    {
      title: 'Freinage dégressif',
      description:
        'Freiner fort au début puis relâcher progressivement la pression. Cela permet un arrêt précis, plus de stabilité et plus de confort.',
    },
    {
      title: 'Freinage d’urgence',
      description:
        'Utilisé en cas de danger immédiat. Technique : frein à fond, embrayage à fond et garder le contrôle du volant.',
    },
  ],
  safetyAdvice: [
    'Adapter le type de démarrage à la situation : parking, circulation, feu, stop ou côte.',
    'Le point de patinage doit être trouvé progressivement pour éviter les à-coups ou le calage.',
    'En côte, sécuriser le véhicule pour éviter tout recul.',
    'En freinage d’urgence, freiner et débrayer à fond tout en gardant le contrôle du volant.',
  ],
}

const startStopQuestions = [
  {
    question: 'Le démarrage sans accélérateur est principalement utilisé :',
    choices: ['Sur parking et en manœuvre', 'Sur autoroute', 'En dépassement', 'À grande vitesse'],
    answer: 0,
    explanation: 'Le démarrage sans accélérateur est adapté aux parkings, aux manœuvres et aux très faibles allures.',
  },
  {
    question: 'Lors d’un démarrage avec accélération, le conducteur doit :',
    choices: ['Lever brutalement l’embrayage', 'Garder le frein appuyé', 'Trouver le point de patinage puis accélérer légèrement', 'Accélérer fortement immédiatement'],
    answer: 2,
    explanation: 'Le démarrage avec accélération se fait en trouvant le point de patinage, puis en accélérant légèrement.',
  },
  {
    question: 'Le démarrage en côte permet principalement :',
    choices: ['D’accélérer plus vite', 'D’éviter le recul du véhicule', 'De tourner plus facilement', 'D’utiliser moins les pédales'],
    answer: 1,
    explanation: 'Le démarrage en côte sert principalement à éviter le recul du véhicule.',
  },
  {
    question: 'Lors d’un démarrage en côte, le conducteur doit trouver :',
    choices: ['Le point mort', 'Le point de freinage', 'Le limiteur de vitesse', 'Le point de patinage'],
    answer: 3,
    explanation: 'Le point de patinage permet de maintenir le véhicule avant de relâcher progressivement le frein.',
  },
  {
    question: 'Le freinage progressif consiste à :',
    choices: ['Freiner doucement au début puis augmenter progressivement la pression', 'Freiner fort puis relâcher immédiatement', 'Utiliser uniquement le frein à main', 'Freiner brutalement jusqu’à l’arrêt'],
    answer: 0,
    explanation: 'Le freinage progressif augmente la pression progressivement pour ralentir confortablement et éviter les à-coups.',
  },
  {
    question: 'Le freinage dégressif consiste à :',
    choices: ['Freiner doucement jusqu’à l’arrêt complet', 'Utiliser uniquement l’embrayage', 'Freiner fort au début puis relâcher progressivement la pression', 'Freiner sans regarder devant'],
    answer: 2,
    explanation: 'Le freinage dégressif consiste à freiner fort au début, puis relâcher progressivement pour un arrêt précis et stable.',
  },
  {
    question: 'Le freinage d’urgence est utilisé :',
    choices: ['Pour économiser le carburant', 'Pour stationner', 'Dans les parkings', 'En cas de danger immédiat'],
    answer: 3,
    explanation: 'Le freinage d’urgence est réservé aux situations de danger immédiat.',
  },
  {
    question: 'Lors d’un freinage d’urgence, le conducteur doit :',
    choices: ['Couper le moteur', 'Utiliser uniquement le frein à main', 'Relâcher le volant', 'Appuyer à fond sur le frein et l’embrayage'],
    answer: 3,
    explanation: 'En freinage d’urgence, il faut freiner à fond, débrayer à fond et garder le contrôle du volant.',
  },
  {
    question: 'Le démarrage avec accélération est principalement utilisé :',
    choices: ['Véhicule moteur coupé', 'Sur route et dans la circulation', 'Uniquement en descente', 'À l’arrêt sans visibilité'],
    answer: 1,
    explanation: 'Le démarrage avec accélération est utilisé sur route, aux feux, aux stops et dans la circulation.',
  },
  {
    question: 'Lors d’un démarrage sans accélérateur, le véhicule avance grâce :',
    choices: ['Au frein à main', 'À la vitesse du moteur et au point de patinage', 'À une forte accélération', 'Au volant uniquement'],
    answer: 1,
    explanation: 'À très faible allure, le véhicule avance grâce au ralenti moteur et au point de patinage.',
  },
]

const accelerationBrakingModule = {
  id: 'SC1.5',
  storageKey: 'pedagogia:lesson:acceleration-braking',
  title: 'Doser l’accélération et le freinage',
  intro:
    'Le conducteur doit apprendre à doser correctement les pédales afin de conduire avec souplesse, précision et sécurité. Chaque pédale possède un rôle précis : embrayage, frein et accélérateur. Les pieds doivent être utilisés avec douceur afin d’éviter les à-coups, le calage et les freinages brusques.',
  schemaSection: {
    kicker: 'Schémas et photos',
  },
  images: [
    {
      src: doseAccelerationFreinageImage,
      alt: 'Infographie : doser l’accélération et le freinage — démarrages, freinages et conseils',
      title: 'Doser l’accélération et le freinage',
      caption:
        'Démarrages (sans accélérateur, avec accélération, en côte), freinages (progressif, dégressif, urgence) et conseils de sécurité.',
      objectFit: 'contain',
    },
  ],
  summary: [
    {
      title: 'Le rôle de l’embrayage',
      description:
        'L’embrayage permet de démarrer, de s’arrêter et de changer les vitesses. C’est lui qui permet au véhicule d’avancer grâce au point de patinage.',
    },
    {
      title: 'Utiliser l’embrayage correctement',
      description:
        'L’embrayage doit être enfoncé à fond puis relâché progressivement. Le conducteur ne doit pas rester appuyé longtemps : en général, il faut appuyer, effectuer l’action, puis relâcher en environ 3 secondes maximum.',
    },
    {
      title: 'Risques d’un mauvais usage de l’embrayage',
      description:
        'Garder le pied sur l’embrayage peut user le système, fatiguer le conducteur et provoquer une perte de contrôle du véhicule sur la vitesse.',
    },
    {
      title: 'Puissance des petites vitesses',
      description:
        'Plus la vitesse est petite, plus elle possède de puissance moteur. La 1ère vitesse est donc la plus dangereuse si les pédales sont mal dosées.',
    },
    {
      title: 'Le rôle du frein',
      description:
        'Le frein permet de ralentir, de contrôler l’allure et de s’arrêter. Le conducteur doit freiner progressivement afin d’éviter les à-coups et de garder le contrôle du véhicule.',
    },
    {
      title: 'Le rôle de l’accélérateur',
      description:
        'L’accélérateur permet d’augmenter la vitesse, d’accompagner le démarrage et d’adapter l’allure. La pression doit rester douce et progressive.',
    },
    {
      title: 'Risques d’une forte accélération',
      description:
        'Une forte accélération peut provoquer des à-coups, surprendre les autres usagers et augmenter la consommation.',
    },
    {
      title: 'Le dosage des pédales',
      description:
        'Le conducteur doit lever doucement l’embrayage, freiner progressivement et accélérer progressivement. Les mouvements doivent rester souples, précis et progressifs.',
    },
  ],
  safetyAdvice: [
    'Regarder loin devant.',
    'Éviter les gestes brusques.',
    'Utiliser les pédales avec souplesse.',
    'Anticiper les ralentissements.',
    'Garder le contrôle du véhicule.',
  ],
}

const accelerationBrakingQuestions = [
  {
    question: 'Quelle pédale permet principalement au véhicule d’avancer au démarrage ?',
    choices: ['Le frein', 'L’accélérateur', 'L’embrayage', 'Le frein à main'],
    answer: 2,
    explanation: 'L’embrayage permet au véhicule d’avancer grâce au point de patinage.',
  },
  {
    question: 'L’embrayage permet principalement :',
    choices: ['D’allumer les feux', 'De démarrer, s’arrêter et changer les vitesses', 'D’augmenter uniquement la vitesse', 'De tourner le volant'],
    answer: 1,
    explanation: 'L’embrayage sert à démarrer, s’arrêter et changer les vitesses.',
  },
  {
    question: 'Lors d’un changement de vitesse, l’embrayage doit être :',
    choices: ['Enfoncé à fond', 'Relâché brutalement', 'Utilisé à moitié uniquement', 'Gardé appuyé plusieurs secondes'],
    answer: 0,
    explanation: 'Lors d’un changement de vitesse, l’embrayage doit être enfoncé à fond.',
  },
  {
    question: 'Garder le pied sur l’embrayage peut :',
    choices: ['Réduire la consommation', 'Faciliter le freinage', 'Provoquer une perte de contrôle sur la vitesse', 'Améliorer l’adhérence'],
    answer: 2,
    explanation: 'Garder le pied sur l’embrayage peut provoquer une perte de contrôle du véhicule sur la vitesse.',
  },
  {
    question: 'Quelle vitesse possède le plus de puissance moteur ?',
    choices: ['La 5ème vitesse', 'La marche arrière uniquement', 'La vitesse la plus élevée', 'La 1ère vitesse'],
    answer: 3,
    explanation: 'Plus la vitesse est petite, plus elle possède de puissance moteur : la 1ère est donc la plus puissante.',
  },
  {
    question: 'Le frein permet principalement :',
    choices: ['D’accélérer', 'De ralentir ou s’arrêter', 'De changer les vitesses', 'De tourner plus facilement'],
    answer: 1,
    explanation: 'Le frein permet de ralentir, contrôler l’allure et s’arrêter.',
  },
  {
    question: 'Pour éviter les à-coups, le conducteur doit :',
    choices: ['Utiliser les pédales brutalement', 'Doser les pédales progressivement', 'Garder le pied sur l’embrayage', 'Accélérer fortement'],
    answer: 1,
    explanation: 'Le dosage progressif des pédales évite les à-coups et améliore la maîtrise.',
  },
  {
    question: 'Une forte accélération peut :',
    choices: ['Réduire la consommation', 'Faciliter le point de patinage', 'Provoquer des à-coups', 'Stabiliser automatiquement le véhicule'],
    answer: 2,
    explanation: 'Une forte accélération peut provoquer des à-coups, surprendre les autres usagers et augmenter la consommation.',
  },
  {
    question: 'Le conducteur doit relâcher l’embrayage :',
    choices: ['Le plus vite possible', 'Brutalement', 'Progressivement', 'En gardant le frein à main serré'],
    answer: 2,
    explanation: 'L’embrayage doit être relâché progressivement pour éviter le calage et les à-coups.',
  },
  {
    question: 'Pour conduire avec souplesse, les mouvements doivent être :',
    choices: ['Rapides et brusques', 'Souples et progressifs', 'Forts et rapides', 'Courts et secs'],
    answer: 1,
    explanation: 'Des mouvements souples et progressifs permettent une conduite plus précise et sécurisée.',
  },
]

const gearboxModule = {
  id: 'SC1.6',
  storageKey: 'pedagogia:lesson:gearbox',
  title: 'Utiliser la boîte de vitesse',
  intro:
    'La boîte de vitesse permet d’adapter la vitesse du véhicule au régime moteur et à la situation de circulation. Elle se comprend avec l’embrayage et, plus indirectement, avec le volant moteur qui participe à la transmission du mouvement du moteur.',
  schemaSection: {
    kicker: 'Schémas et photos',
  },
  images: [
    {
      src: gearboxGuideImage,
      alt: 'Infographie : utiliser la boîte de vitesses — rapports, passage des vitesses et conseils',
      title: 'Utiliser la boîte de vitesses',
      caption:
        'Rôle de la boîte, schéma des rapports, passage des vitesses (débrayer, changer, embrayer), conseils pratiques et erreurs à éviter.',
      objectFit: 'contain',
    },
  ],
  summary: [
    {
      title: 'Rôle de la boîte de vitesse',
      description:
        'La boîte de vitesse sert à choisir un rapport adapté pour que le véhicule avance avec souplesse, sans forcer le moteur et sans perdre de maîtrise.',
    },
    {
      title: 'Lien avec l’embrayage',
      description:
        'L’embrayage permet de séparer momentanément le moteur de la boîte de vitesse pour changer de rapport. Il doit être utilisé à fond puis relâché progressivement.',
    },
    {
      title: 'Lien indirect avec le volant moteur',
      description:
        'Le volant moteur aide à transmettre le mouvement du moteur vers l’embrayage. Pour l’élève, l’idée importante est de comprendre que moteur, embrayage et boîte de vitesse travaillent ensemble.',
    },
    {
      title: 'Monter les rapports',
      description:
        'Monter les rapports permet d’accompagner l’augmentation de l’allure, de stabiliser le moteur et d’éviter le sur-régime.',
    },
    {
      title: 'Descendre les vitesses',
      description:
        'Descendre les rapports, ou rétrograder, permet de retrouver de la puissance, de mieux contrôler l’allure et d’utiliser le frein moteur.',
    },
    {
      title: 'Adapter vitesse et régime moteur',
      description:
        'Le bon rapport dépend de l’allure, du bruit moteur, du relief et de la circulation. Le conducteur doit chercher une conduite souple, sans moteur qui force ni moteur qui hurle.',
    },
    {
      title: 'Éviter le sous-régime',
      description:
        'Le sous-régime apparaît quand le rapport est trop élevé pour l’allure : le moteur manque de puissance et le véhicule devient moins réactif.',
    },
    {
      title: 'Éviter le sur-régime',
      description:
        'Le sur-régime apparaît quand le rapport est trop bas pour l’allure : le moteur fait trop de bruit et il faut généralement monter un rapport.',
    },
  ],
  safetyAdvice: [
    'Adapter le rapport à l’allure et à la situation.',
    'Utiliser l’embrayage avec souplesse.',
    'Éviter de rester le pied sur l’embrayage.',
    'Anticiper les ralentissements pour rétrograder si nécessaire.',
    'Écouter le moteur pour éviter sous-régime et sur-régime.',
  ],
}

const gearboxQuestions = [
  createRandomizedQuestion(
    'Quel est le rôle principal de la boîte de vitesse ?',
    'Adapter la puissance du moteur à la vitesse et à la situation de circulation',
    ['Augmenter automatiquement l’adhérence du véhicule', 'Remplacer le système de freinage', 'Stabiliser automatiquement la direction'],
    'La boîte de vitesse sert à adapter la puissance du moteur selon la vitesse du véhicule et la situation de circulation.',
  ),
  createRandomizedQuestion(
    'Pourquoi la 1ère vitesse possède-t-elle davantage de puissance moteur ?',
    'Parce qu’elle possède le rapport le plus court et transmet plus de force aux roues',
    ['Parce qu’elle permet d’atteindre la vitesse maximale du véhicule', 'Parce qu’elle réduit totalement la consommation', 'Parce qu’elle utilise automatiquement le frein moteur'],
    'La 1ère vitesse possède un rapport très court : elle donne plus de force aux roues pour démarrer ou avancer à faible allure.',
  ),
  createRandomizedQuestion(
    'Dans quelle situation la 1ère vitesse est-elle principalement utilisée ?',
    'Pour démarrer et circuler à faible allure',
    ['Pour stabiliser l’allure sur voie rapide', 'Pour rouler à vitesse élevée', 'Pour réduire le bruit du moteur'],
    'La 1ère vitesse est surtout utilisée au démarrage et à faible allure, car elle fournit beaucoup de puissance.',
  ),
  createRandomizedQuestion(
    'Quel est le bon ordre pour monter une vitesse ?',
    'Embrayer → changer le rapport → relâcher progressivement l’embrayage → accélérer',
    ['Relâcher l’embrayage → changer la vitesse → accélérer', 'Accélérer fortement → changer la vitesse sans embrayer', 'Freiner → accélérer → changer le rapport'],
    'Pour monter une vitesse, il faut embrayer à fond, changer le rapport, relâcher progressivement l’embrayage puis accélérer progressivement.',
  ),
  createRandomizedQuestion(
    'Pourquoi faut-il relâcher progressivement l’embrayage après un changement de vitesse ?',
    'Pour éviter les à-coups et garder le contrôle du véhicule',
    ['Pour augmenter immédiatement la vitesse du moteur', 'Pour utiliser automatiquement le frein moteur', 'Pour réduire la rotation du volant moteur'],
    'Un relâchement progressif évite les à-coups, limite le risque de calage et aide à garder le contrôle du véhicule.',
  ),
  createRandomizedQuestion(
    'Un moteur qui “hurle” indique généralement :',
    'Un sur-régime moteur',
    ['Un régime moteur adapté à la situation', 'Un sous-régime moteur', 'Une perte d’adhérence des pneus'],
    'Un moteur qui hurle indique souvent un sur-régime : le rapport engagé est trop petit par rapport à l’allure.',
  ),
  createRandomizedQuestion(
    'Le rétrogradage permet principalement :',
    'D’utiliser le frein moteur et récupérer de la puissance',
    ['D’augmenter rapidement la vitesse du véhicule', 'De supprimer l’effet de l’embrayage', 'De réduire automatiquement la consommation'],
    'Le rétrogradage permet d’utiliser le frein moteur, de ralentir le véhicule et de récupérer de la puissance.',
  ),
  createRandomizedQuestion(
    'Le sous-régime correspond généralement à :',
    'Un moteur qui manque de puissance par rapport à la vitesse engagée',
    ['Un moteur qui tourne trop vite', 'Une vitesse moteur adaptée', 'Un freinage trop puissant'],
    'Le sous-régime apparaît lorsque le moteur manque de puissance par rapport au rapport engagé et à l’allure du véhicule.',
  ),
  createRandomizedQuestion(
    'Pourquoi le conducteur ne doit-il pas garder le pied sur l’embrayage ?',
    'Cela peut provoquer une usure prématurée et perturber le contrôle de la vitesse',
    ['Cela bloque automatiquement le passage des vitesses', 'Cela empêche le moteur de fonctionner', 'Cela augmente uniquement le bruit moteur'],
    'Garder le pied sur l’embrayage peut user prématurément le mécanisme et perturber le contrôle de la vitesse.',
  ),
  createRandomizedQuestion(
    'Pourquoi le conducteur doit-il éviter de regarder le levier de vitesse ?',
    'Pour garder son attention sur la route et l’environnement',
    ['Pour accélérer plus rapidement', 'Pour éviter le sous-régime moteur', 'Pour réduire la consommation de carburant'],
    'Le conducteur doit garder son attention sur la route, les usagers et l’environnement pour rester en sécurité.',
  ),
]

const forwardReverseModule = {
  id: 'SC1.7',
  storageKey: 'pedagogia:lesson:forward-reverse',
  title: 'Diriger le véhicule en marche avant et en marche arrière',
  intro:
    'Le conducteur doit être capable de diriger le véhicule avec précision tout en gardant le contrôle de la trajectoire. La direction dépend du regard, de la vitesse et des mouvements du volant. Le véhicule suit généralement le regard du conducteur.',
  schemaSection: {
    kicker: 'Schémas et photos',
    title: 'Marche avant et marche arrière',
  },
  images: [
    {
      src: forwardReverseGuideImage,
      alt: 'Infographie : diriger le véhicule en marche avant et en marche arrière — trajectoire, regard, rétroviseurs et points clés',
      title: 'Marche avant et marche arrière',
      objectFit: 'contain',
    },
  ],
  summary: [
    {
      title: 'La marche avant',
      description:
        'En marche avant, les roues directrices se situent à l’avant du véhicule. Le conducteur doit regarder loin devant, maintenir une trajectoire stable et effectuer des mouvements souples sur le volant.',
    },
    {
      title: 'Le rôle du regard en marche avant',
      description:
        'Le regard permet d’anticiper, de corriger la trajectoire et d’éviter les écarts. La marche avant est généralement plus facile à maîtriser car les roues directrices se trouvent du côté où le conducteur regarde.',
    },
    {
      title: 'Adapter les mouvements du volant',
      description:
        'Plus la vitesse augmente, moins il faut tourner le volant et plus les mouvements doivent être précis. Les gestes doivent rester souples pour conserver une trajectoire stable.',
    },
    {
      title: 'La marche arrière',
      description:
        'En marche arrière, les roues arrière ne sont pas directrices. Le véhicule réagit donc plus rapidement et la trajectoire est plus difficile à contrôler.',
    },
    {
      title: 'Contrôler en marche arrière',
      description:
        'Le conducteur doit rouler lentement, contrôler autour du véhicule et regarder principalement vers l’arrière. Un petit mouvement du volant peut provoquer un changement important de trajectoire.',
    },
    {
      title: 'Gestes précis en marche arrière',
      description:
        'Le conducteur doit utiliser une faible allure, effectuer des gestes lents et précis, puis contrôler régulièrement les rétroviseurs.',
    },
    {
      title: 'Le regard et la trajectoire',
      description:
        'Le regard est essentiel pour guider le véhicule, maintenir la trajectoire et anticiper les obstacles. Regarder trop près du véhicule augmente les erreurs de trajectoire.',
    },
    {
      title: 'Contrôles indispensables',
      description:
        'Le conducteur doit regarder loin, contrôler les rétroviseurs et vérifier les angles morts si nécessaire afin de garder une trajectoire sûre.',
    },
  ],
  safetyAdvice: [
    'Garder une allure adaptée.',
    'Tourner le volant progressivement.',
    'Anticiper les obstacles.',
    'Contrôler l’environnement autour du véhicule.',
    'Garder le contrôle de la trajectoire.',
  ],
}

const forwardReverseQuestions = [
  createRandomizedQuestion(
    'Pourquoi la marche arrière demande-t-elle généralement plus de précision que la marche avant ?',
    'Parce que les roues directrices restent à l’avant du véhicule',
    ['Parce que les roues arrière deviennent directrices', 'Parce que le volant tourne moins en marche arrière', 'Parce que le frein moteur ne fonctionne plus'],
    'En marche arrière, les roues directrices restent à l’avant : le véhicule réagit différemment et la trajectoire devient plus délicate à contrôler.',
  ),
  createRandomizedQuestion(
    'En marche avant, les roues directrices permettent principalement :',
    'De guider immédiatement la trajectoire du véhicule',
    ['De stabiliser le moteur', 'D’augmenter automatiquement l’adhérence', 'De réduire les distances de freinage'],
    'En marche avant, les roues directrices situées à l’avant orientent directement la trajectoire du véhicule.',
  ),
  createRandomizedQuestion(
    'Pourquoi un petit mouvement du volant peut-il avoir un effet important en marche arrière ?',
    'Parce que le véhicule pivote autour des roues arrière',
    ['Parce que le moteur transmet plus de puissance', 'Parce que les roues arrière deviennent motrices', 'Parce que le rayon de braquage augmente automatiquement'],
    'En marche arrière, le véhicule réagit plus vite aux corrections et pivote autour de son arrière, ce qui amplifie les petits mouvements.',
  ),
  createRandomizedQuestion(
    'Lorsque la vitesse augmente, les mouvements du volant doivent devenir :',
    'Plus précis et plus limités',
    ['Plus rapides et plus amples', 'Plus brusques pour garder la trajectoire', 'Identiques quelle que soit l’allure'],
    'Plus l’allure augmente, plus les mouvements du volant doivent être limités, précis et progressifs.',
  ),
  createRandomizedQuestion(
    'Quel regard permet généralement de mieux stabiliser une trajectoire ?',
    'Un regard porté loin dans la direction souhaitée',
    ['Un regard proche du capot', 'Un regard alterné entre le volant et le levier de vitesse', 'Un regard fixé sur les rétroviseurs intérieurs uniquement'],
    'Un regard porté loin aide à anticiper et à stabiliser la trajectoire.',
  ),
  createRandomizedQuestion(
    'En marche arrière, le conducteur doit principalement :',
    'Contrôler l’environnement et rouler à faible allure',
    ['Se fier uniquement aux radars de recul', 'Accélérer légèrement pour stabiliser la direction', 'Garder le volant immobile le plus longtemps possible'],
    'En marche arrière, la priorité est de contrôler autour du véhicule et de rouler lentement pour pouvoir corriger.',
  ),
  createRandomizedQuestion(
    'Pourquoi regarder trop près du véhicule peut-il provoquer des erreurs de trajectoire ?',
    'Parce que le conducteur anticipe moins les déplacements du véhicule',
    ['Parce que les roues deviennent moins réactives', 'Parce que le volant devient plus sensible', 'Parce que le frein moteur agit moins efficacement'],
    'Regarder trop près limite l’anticipation et rend les corrections de trajectoire plus tardives.',
  ),
  createRandomizedQuestion(
    'En marche arrière, une allure faible permet principalement :',
    'De corriger plus facilement la trajectoire',
    ['D’éviter d’utiliser l’embrayage', 'D’augmenter la puissance moteur', 'De réduire automatiquement le rayon de braquage'],
    'Une allure faible laisse le temps de contrôler, d’observer et de corriger la trajectoire avec précision.',
  ),
  createRandomizedQuestion(
    'Le véhicule suit généralement :',
    'Le regard du conducteur',
    ['Les mouvements du levier de vitesse', 'La position des pédales uniquement', 'Le rétroviseur intérieur'],
    'Le véhicule suit généralement le regard du conducteur : regarder loin aide à guider la trajectoire.',
  ),
  createRandomizedQuestion(
    'Pour conserver une bonne maîtrise de la trajectoire, le conducteur doit :',
    'Effectuer des gestes souples et anticiper les corrections',
    ['Tourner le volant rapidement dès qu’un écart apparaît', 'Corriger la trajectoire uniquement avec les pédales', 'Regarder principalement le tableau de bord'],
    'La maîtrise de la trajectoire repose sur l’anticipation, le regard et des gestes souples sur le volant.',
  ),
]

const observationWarningModule = {
  id: 'SC1.8',
  storageKey: 'pedagogia:lesson:observation-warning',
  title: 'Regarder autour de soi et avertir',
  intro:
    'Le conducteur doit observer son environnement afin d’anticiper les dangers, d’adapter sa conduite et d’informer les autres usagers de ses intentions. Observer permet d’anticiper, avertir permet d’être compris.',
  schemaSection: {
    kicker: 'Schémas et photos',
    title: 'Regarder autour de soi et avertir',
  },
  images: [
    {
      src: observationWarningGuideImage,
      alt: 'Infographie : regarder autour de soi et avertir — observer, contrôler les rétroviseurs et angles morts, avertir en cas d’urgence, sécuriser chaque déplacement',
      title: 'Regarder autour de soi et avertir',
      objectFit: 'contain',
    },
  ],
  summary: [
    {
      title: 'Regarder autour',
      description:
        'Le conducteur doit contrôler régulièrement loin devant, les rétroviseurs, les côtés du véhicule et les angles morts. Le regard doit rester mobile, régulier et rapide.',
    },
    {
      title: 'Ne pas regarder uniquement devant',
      description:
        'Un conducteur qui regarde uniquement devant lui manque des informations importantes autour du véhicule. Il doit organiser ses contrôles pour comprendre toute la situation.',
    },
    {
      title: 'Les rétroviseurs',
      description:
        'Les rétroviseurs permettent de contrôler l’arrière, les côtés et l’environnement du véhicule. Ils doivent être utilisés avant de ralentir, tourner, changer de direction ou freiner fortement.',
    },
    {
      title: 'Les limites des rétroviseurs',
      description:
        'Les rétroviseurs ne montrent pas toute la zone autour du véhicule. Certaines zones restent invisibles et nécessitent un contrôle direct.',
    },
    {
      title: 'Les angles morts',
      description:
        'Les angles morts sont des zones invisibles dans les rétroviseurs. Un véhicule, un vélo ou un piéton peut s’y trouver sans être visible.',
    },
    {
      title: 'Contrôler les angles morts',
      description:
        'Le contrôle des angles morts est indispensable avant un changement de direction, un dépassement, une manœuvre ou l’ouverture d’une portière.',
    },
    {
      title: 'Avertir les autres usagers',
      description:
        'Le conducteur doit signaler ses intentions afin d’éviter les surprises. Les principaux moyens d’avertir sont les clignotants, les feux stop et l’avertisseur sonore uniquement en cas de danger.',
    },
    {
      title: 'Observer, avertir, agir',
      description:
        'Le clignotant n’est pas une priorité : c’est une information. Le conducteur doit d’abord observer, puis avertir, puis agir.',
    },
  ],
  safetyAdvice: [
    'Regarder loin et régulièrement.',
    'Contrôler les rétroviseurs fréquemment.',
    'Vérifier les angles morts.',
    'Mettre le clignotant suffisamment tôt.',
    'Anticiper les réactions des autres usagers.',
  ],
}

const observationWarningQuestions = [
  createRandomizedQuestion(
    'Pourquoi le conducteur doit-il contrôler régulièrement ses rétroviseurs ?',
    'Pour surveiller l’environnement autour du véhicule et anticiper les situations',
    ['Pour vérifier uniquement la vitesse des véhicules derrière', 'Pour éviter l’utilisation du volant', 'Pour maintenir automatiquement la trajectoire'],
    'Les rétroviseurs permettent de surveiller l’environnement autour du véhicule et d’anticiper les situations.',
  ),
  createRandomizedQuestion(
    'Les angles morts correspondent :',
    'Aux zones invisibles dans les rétroviseurs',
    ['Aux zones visibles uniquement dans le rétroviseur intérieur', 'Aux espaces situés derrière le tableau de bord', 'Aux parties cachées par les montants du pare-brise uniquement'],
    'Les angles morts sont les zones qui ne sont pas visibles dans les rétroviseurs.',
  ),
  createRandomizedQuestion(
    'Pourquoi le contrôle des angles morts reste-t-il indispensable ?',
    'Parce que certains usagers peuvent rester invisibles dans les rétroviseurs',
    ['Parce que les rétroviseurs empêchent de voir devant', 'Parce que les angles morts concernent uniquement les motos', 'Parce que le clignotant remplace les rétroviseurs'],
    'Un véhicule, un vélo ou un piéton peut se trouver dans un angle mort sans être visible dans les rétroviseurs.',
  ),
  createRandomizedQuestion(
    'Quel est le bon ordre avant de changer de direction ?',
    'Observer → avertir → agir',
    ['Avertir → agir → observer', 'Agir → observer → avertir', 'Observer → agir → avertir'],
    'Avant de changer de direction, il faut observer, avertir les autres usagers, puis agir.',
  ),
  createRandomizedQuestion(
    'Pourquoi le clignotant doit-il être mis suffisamment tôt ?',
    'Pour prévenir les autres usagers de l’intention du conducteur',
    ['Pour obtenir automatiquement la priorité', 'Pour éviter de contrôler les rétroviseurs', 'Pour réduire la distance de sécurité'],
    'Le clignotant informe les autres usagers de l’intention du conducteur et doit être mis assez tôt pour être compris.',
  ),
  createRandomizedQuestion(
    'Pourquoi dit-on que “le clignotant n’est pas une priorité” ?',
    'Parce qu’il informe sans donner le droit de passage',
    ['Parce qu’il fonctionne uniquement hors agglomération', 'Parce qu’il remplace le contrôle des angles morts', 'Parce qu’il doit être utilisé seulement à l’arrêt'],
    'Le clignotant donne une information, mais il ne donne jamais automatiquement la priorité.',
  ),
  createRandomizedQuestion(
    'Avant un freinage important, le conducteur doit principalement :',
    'Contrôler ses rétroviseurs',
    ['Regarder le levier de vitesse', 'Mettre immédiatement le clignotant', 'Accélérer légèrement avant de freiner'],
    'Avant un freinage important, le conducteur doit contrôler ses rétroviseurs pour vérifier ce qui se passe derrière lui.',
  ),
  createRandomizedQuestion(
    'Un conducteur qui regarde uniquement devant lui risque :',
    'De manquer des informations importantes autour du véhicule',
    ['D’améliorer son anticipation', 'De réduire les angles morts', 'De mieux stabiliser sa trajectoire'],
    'Regarder uniquement devant soi fait perdre des informations importantes sur les côtés et à l’arrière du véhicule.',
  ),
  createRandomizedQuestion(
    'L’avertisseur sonore doit être utilisé principalement :',
    'En cas de danger immédiat',
    ['Pour signaler une priorité', 'Pour prévenir d’un stationnement', 'Pour demander le passage aux intersections'],
    'L’avertisseur sonore doit rester exceptionnel et servir principalement à prévenir un danger immédiat.',
  ),
  createRandomizedQuestion(
    'Pourquoi le regard doit-il être mobile et régulier ?',
    'Pour surveiller l’ensemble de l’environnement et anticiper les dangers',
    ['Pour éviter d’utiliser les rétroviseurs', 'Pour maintenir une vitesse constante uniquement', 'Pour réduire les mouvements du volant'],
    'Un regard mobile et régulier permet de surveiller l’ensemble de l’environnement et d’anticiper les dangers.',
  ),
]

const lessonModules = {
  [vehicleOrgansModule.id]: {
    ...vehicleOrgansModule,
    questionPool: [...vehicleOrgansDashboardQuestions, ...vehicleOrgansQuestions],
    quizSize: VEHICLE_ORGANS_QUIZ_SIZE,
  },
  [drivingPositionModule.id]: {
    ...drivingPositionModule,
    questions: drivingPositionQuestions,
  },
  [steeringWheelModule.id]: {
    ...steeringWheelModule,
    questions: steeringWheelQuestions,
  },
  [startStopModule.id]: {
    ...startStopModule,
    questions: startStopQuestions,
  },
  [accelerationBrakingModule.id]: {
    ...accelerationBrakingModule,
    questions: accelerationBrakingQuestions,
  },
  [gearboxModule.id]: {
    ...gearboxModule,
    questions: gearboxQuestions,
  },
  [forwardReverseModule.id]: {
    ...forwardReverseModule,
    questions: forwardReverseQuestions,
  },
  [observationWarningModule.id]: {
    ...observationWarningModule,
    questions: observationWarningQuestions,
  },
}

const subcompetencyAccents = ['cyan', 'emerald', 'amber', 'violet', 'rose', 'teal', 'indigo', 'orange', 'sky', 'fuchsia']

const accentStyles = {
  cyan: {
    card: 'border-cyan-100 bg-cyan-50/60',
    badge: 'bg-cyan-100 text-cyan-700 ring-cyan-200',
    icon: 'bg-cyan-500',
  },
  emerald: {
    card: 'border-emerald-100 bg-emerald-50/60',
    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    icon: 'bg-emerald-500',
  },
  amber: {
    card: 'border-amber-100 bg-amber-50/60',
    badge: 'bg-amber-100 text-amber-700 ring-amber-200',
    icon: 'bg-amber-500',
  },
  violet: {
    card: 'border-violet-100 bg-violet-50/60',
    badge: 'bg-violet-100 text-violet-700 ring-violet-200',
    icon: 'bg-violet-500',
  },
  rose: {
    card: 'border-rose-100 bg-rose-50/60',
    badge: 'bg-rose-100 text-rose-700 ring-rose-200',
    icon: 'bg-rose-500',
  },
  teal: {
    card: 'border-teal-100 bg-teal-50/60',
    badge: 'bg-teal-100 text-teal-700 ring-teal-200',
    icon: 'bg-teal-500',
  },
  indigo: {
    card: 'border-indigo-100 bg-indigo-50/60',
    badge: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
    icon: 'bg-indigo-500',
  },
  orange: {
    card: 'border-orange-100 bg-orange-50/60',
    badge: 'bg-orange-100 text-orange-700 ring-orange-200',
    icon: 'bg-orange-500',
  },
  sky: {
    card: 'border-sky-100 bg-sky-50/60',
    badge: 'bg-sky-100 text-sky-700 ring-sky-200',
    icon: 'bg-sky-500',
  },
  fuchsia: {
    card: 'border-fuchsia-100 bg-fuchsia-50/60',
    badge: 'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200',
    icon: 'bg-fuchsia-500',
  },
}

function StatusPill({ label, value, complete }) {
  return (
    <div className="card-inner flex items-center gap-3">
      <span
        className={`grid h-8 w-8 place-items-center rounded-xl text-sm font-bold ${
          complete ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {complete ? '✓' : '▶'}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function buildEmptyModuleProgress() {
  return Object.fromEntries(
    Object.values(lessonModules).map((module) => [
      module.id,
      { completed: false, score: null, percentage: null },
    ]),
  )
}

function lessonProgressStorageKey(storageKey, ownerId) {
  if (!ownerId) return null
  return `${storageKey}:${ownerId}`
}

function getSavedModuleProgress(storageKey, ownerId) {
  const empty = { completed: false, score: null, percentage: null }
  if (!ownerId || typeof window === 'undefined') return empty

  const scopedKey = lessonProgressStorageKey(storageKey, ownerId)
  if (!scopedKey) return empty

  try {
    const saved = window.localStorage.getItem(scopedKey)
    return saved ? JSON.parse(saved) : empty
  } catch {
    return empty
  }
}

function ChoiceButton({ checked, children, disabled, onClick, status }) {
  const statusClass =
    status === 'correct'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100'
      : status === 'wrong'
        ? 'border-rose-300 bg-rose-50 text-rose-900 ring-2 ring-rose-100'
        : checked
          ? 'border-cyan-300 bg-cyan-50 text-cyan-950 ring-2 ring-cyan-100'
          : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/50'

  return (
    <button
      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition duration-200 active:scale-[0.97] ${statusClass} ${
        !disabled && !status ? 'hover:shadow-md' : ''
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {status === 'correct' && <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-600" />}
      {status === 'wrong' && <XCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-rose-600" />}
      <span>{children}</span>
    </button>
  )
}

const severityBadge = {
  danger: 'bg-rose-100 text-rose-800 ring-rose-200',
  warning: 'bg-amber-100 text-amber-800 ring-amber-200',
  info: 'bg-sky-100 text-sky-800 ring-sky-200',
}

export default function StudentLessonsPage() {
  const { profileId } = useAuth()
  const {
    studentId,
    unlockState,
    globalProgress,
    isCompetencyUnlocked,
  } = useRemcUnlock(profileId)
  const progressOwnerId = studentId || profileId
  const [activeCompetencyId, setActiveCompetencyId] = useState('C1')
  const [openedModuleId, setOpenedModuleId] = useState(null)
  const [moduleMode, setModuleMode] = useState('lesson')
  const [openedGalleryImage, setOpenedGalleryImage] = useState(null)
  const [quizSessionsByModule, setQuizSessionsByModule] = useState({})
  const [quizIndexByModule, setQuizIndexByModule] = useState({})
  const [answersByModule, setAnswersByModule] = useState({})
  const [validatedByModule, setValidatedByModule] = useState({})
  const [moduleProgressById, setModuleProgressById] = useState(buildEmptyModuleProgress)
  const [expandedModuleIds, setExpandedModuleIds] = useState({})
  const activeCompetency =
    competencies.find((competency) => competency.id === activeCompetencyId) || competencies[0]
  const activeSubcompetencies = subcompetenciesByCompetency[activeCompetency.id] || []
  const competencyHasContent = activeSubcompetencies.some((item) => Boolean(lessonModules[item.id]))
  const openedModule = activeSubcompetencies.find((item) => item.id === openedModuleId)
  const openedLesson = lessonModules[openedModuleId]
  const lessonQuestionPool = getLessonQuestionPool(openedLesson)
  const expectedQuizCount = getExpectedQuizCount(openedLesson)
  const currentQuestions = quizSessionsByModule[openedModuleId] || []
  const quizDisplayTotal = currentQuestions.length || expectedQuizCount
  const currentAnswers = answersByModule[openedModuleId] || {}
  const currentValidated = Boolean(validatedByModule[openedModuleId])
  const currentQuizIndex = quizIndexByModule[openedModuleId] || 0
  const currentQuizQuestion = currentQuestions[currentQuizIndex]
  const currentQuizAnswer = currentAnswers[currentQuizIndex]
  const currentQuizAnswered = currentQuizAnswer !== undefined
  const currentProgress = moduleProgressById[openedModuleId] || {
    completed: false,
    score: null,
    percentage: null,
  }
  const score = currentQuestions.reduce(
    (total, question, index) => total + (currentAnswers[index] === question.answer ? 1 : 0),
    0,
  )
  const percentage = currentQuestions.length ? Math.round((score / currentQuestions.length) * 100) : 0
  const answeredCount = Object.keys(currentAnswers).length
  const canValidate = currentQuestions.length > 0 && answeredCount === currentQuestions.length
  const openedModuleIndex = activeSubcompetencies.findIndex((item) => item.id === openedModuleId)
  const hasNextModule = openedModuleIndex >= 0 && openedModuleIndex < activeSubcompetencies.length - 1
  const activeCompetencyUnlocked = isCompetencyUnlocked(activeCompetencyId)

  const {
    page: modulePage,
    setPage: setModulePage,
    totalPages: moduleTotalPages,
    totalItems: moduleTotalItems,
    pageItems: modulePageItems,
    pageSize: modulePageSize,
  } = useClientPagination(activeSubcompetencies, { pageSize: 4 })

  const selectCompetency = (competencyId) => {
    if (!isCompetencyUnlocked(competencyId)) return
    setActiveCompetencyId(competencyId)
    setModulePage(1)
    setExpandedModuleIds({})
  }

  const toggleModuleExpanded = (moduleId) => {
    setExpandedModuleIds((current) => ({
      ...current,
      [moduleId]: !current[moduleId],
    }))
  }

  useEffect(() => {
    setModulePage(1)
    setExpandedModuleIds({})
  }, [activeCompetencyId, setModulePage])

  useEffect(() => {
    if (!progressOwnerId) {
      setModuleProgressById(buildEmptyModuleProgress())
      return
    }

    setModuleProgressById(
      Object.fromEntries(
        Object.values(lessonModules).map((module) => [
          module.id,
          getSavedModuleProgress(module.storageKey, progressOwnerId),
        ]),
      ),
    )
  }, [progressOwnerId])

  useEffect(() => {
    if (!unlockState) return
    if (!isCompetencyUnlocked(activeCompetencyId)) {
      const firstUnlocked = REMC_COMPETENCY_ORDER.find((code) => unlockState[code]?.unlocked) || 'C1'
      setActiveCompetencyId(firstUnlocked)
      setOpenedModuleId(null)
    }
  }, [unlockState, activeCompetencyId, isCompetencyUnlocked])

  const openLesson = (moduleId) => {
    if (!isCompetencyUnlocked(activeCompetencyId)) return
    setOpenedModuleId(moduleId)
    setModuleMode('lesson')
  }

  const openQuiz = (moduleId) => {
    if (!isCompetencyUnlocked(activeCompetencyId)) return
    setOpenedModuleId(moduleId)
    setModuleMode('quiz')
    const lesson = lessonModules[moduleId]
    if (!getLessonQuestionPool(lesson).length) return

    setQuizSessionsByModule((current) => {
      const previous = current[moduleId]
      const session = resolveQuizSession(lesson, previous)
      const sessionRenewed = session !== previous

      if (sessionRenewed) {
        setQuizIndexByModule((indexes) => ({ ...indexes, [moduleId]: 0 }))
        setAnswersByModule((answers) => ({ ...answers, [moduleId]: {} }))
        setValidatedByModule((validated) => ({ ...validated, [moduleId]: false }))
      }

      return { ...current, [moduleId]: session }
    })

    setQuizIndexByModule((current) => ({
      ...current,
      [moduleId]: current[moduleId] ?? 0,
    }))
  }

  const closeModule = () => {
    setOpenedModuleId(null)
    setOpenedGalleryImage(null)
  }

  const openNextModule = () => {
    if (!hasNextModule) return
    setOpenedModuleId(activeSubcompetencies[openedModuleIndex + 1].id)
    setModuleMode('lesson')
  }

  useEffect(() => {
    if (!openedModuleId) return
    const lesson = lessonModules[openedModuleId]
    const expected = getExpectedQuizCount(lesson)
    if (!expected) return

    setQuizSessionsByModule((current) => {
      const previous = current[openedModuleId]
      if (previous?.length === expected) return current

      setQuizIndexByModule((indexes) => ({ ...indexes, [openedModuleId]: 0 }))
      setAnswersByModule((answers) => ({ ...answers, [openedModuleId]: {} }))
      setValidatedByModule((validated) => ({ ...validated, [openedModuleId]: false }))

      return { ...current, [openedModuleId]: createQuizSessionForLesson(lesson) }
    })
  }, [openedModuleId])

  useEffect(() => {
    if (!openedModule) return undefined

    const scrollY = window.scrollY
    const previousOverflow = document.body.style.overflow
    const previousPosition = document.body.style.position
    const previousTop = document.body.style.top
    const previousWidth = document.body.style.width

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.classList.add('learning-modal-open')

    return () => {
      document.body.classList.remove('learning-modal-open')
      document.body.style.overflow = previousOverflow
      document.body.style.position = previousPosition
      document.body.style.top = previousTop
      document.body.style.width = previousWidth
      window.scrollTo(0, scrollY)
    }
  }, [openedModule])

  const validateModule = () => {
    if (!canValidate || !openedLesson) return

    const completed = percentage >= 80
    const nextProgress = {
      completed,
      score,
      percentage,
      validatedAt: new Date().toISOString(),
    }

    setValidatedByModule((current) => ({ ...current, [openedLesson.id]: true }))
    setModuleProgressById((current) => ({ ...current, [openedLesson.id]: nextProgress }))
    const scopedKey = lessonProgressStorageKey(openedLesson.storageKey, progressOwnerId)
    if (scopedKey) {
      window.localStorage.setItem(scopedKey, JSON.stringify(nextProgress))
    }
  }

  const resetModule = () => {
    if (!openedModuleId) return
    setAnswersByModule((current) => ({ ...current, [openedModuleId]: {} }))
    setValidatedByModule((current) => ({ ...current, [openedModuleId]: false }))
    setQuizIndexByModule((current) => ({ ...current, [openedModuleId]: 0 }))
    if (getLessonQuestionPool(openedLesson).length) {
      setQuizSessionsByModule((current) => ({
        ...current,
        [openedModuleId]: createQuizSessionForLesson(openedLesson),
      }))
    }
  }

  const selectQuizChoice = (choiceIndex) => {
    if (!openedModuleId || currentQuizAnswered || currentValidated) return
    setAnswersByModule((current) => ({
      ...current,
      [openedModuleId]: {
        ...(current[openedModuleId] || {}),
        [currentQuizIndex]: choiceIndex,
      },
    }))
  }

  const goToNextQuizQuestion = () => {
    if (!openedModuleId || !currentQuizAnswered) return
    if (currentQuizIndex + 1 >= currentQuestions.length) {
      validateModule()
      return
    }
    setQuizIndexByModule((current) => ({
      ...current,
      [openedModuleId]: currentQuizIndex + 1,
    }))
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-5 text-white md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                Formation REMC
              </span>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Compétence {activeCompetency.number} : {activeCompetency.title}
              </h1>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center backdrop-blur">
              <p className="text-3xl font-black">{unlockState ? globalProgress : activeCompetency.progress}%</p>
              <p className="text-xs text-cyan-50/75">Progression globale</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card-panel">
          <div className="flex flex-wrap gap-2">
            {competencies.map((competency) => {
              const isActive = competency.id === activeCompetency.id
              const unlocked = isCompetencyUnlocked(competency.id)
              const entry = unlockState?.[competency.id]
              const statusIcon = competencyStatusIcon(entry, competency.id)
              return (
                <button
                  className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                    !unlocked
                      ? 'cursor-not-allowed border border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                      : isActive
                        ? 'bg-navy-950 text-white shadow-md'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-200'
                  }`}
                  disabled={!unlocked}
                  key={competency.id}
                  onClick={() => selectCompetency(competency.id)}
                  type="button"
                >
                  {competency.id}{statusIcon ? ` ${statusIcon}` : ''}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Modules {activeCompetency.id}</h2>
              <p className="mt-1 text-sm text-slate-500">{activeCompetency.description}</p>
            </div>
            <span className="w-fit rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-bold text-cyan-700">
              {competencyHasContent ? `${moduleTotalItems} module(s)` : 'En développement'}
            </span>
          </div>

          {!activeCompetencyUnlocked ? (
            <div className="mt-4">
              <RemcLockedBanner competencyCode={activeCompetencyId} />
            </div>
          ) : !competencyHasContent ? (
            <div
              key={activeCompetency.id}
              className="mt-4 animate-slide-up overflow-hidden rounded-[1.75rem] border border-cyan-100 bg-white shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 px-6 py-10 text-center text-white">
                <h3 className="text-2xl font-black">Bientôt disponible</h3>
                <p className="max-w-lg text-sm leading-6 text-cyan-50/85">
                  Cours, schémas, vidéos et QCU en cours de préparation pour cette compétence.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-3">
                {modulePageItems.map((item) => {
                  const index = activeSubcompetencies.findIndex((row) => row.id === item.id)
                  const accentKey = subcompetencyAccents[index % subcompetencyAccents.length]
                  const styles = accentStyles[accentKey]
                  const lessonModule = lessonModules[item.id]
                  const lessonPool = getLessonQuestionPool(lessonModule)
                  const qcmAvailable = lessonPool.length > 0
                  const qcmTotal = getExpectedQuizCount(lessonModule) || lessonPool.length
                  const itemProgress = moduleProgressById[item.id] || { completed: false, score: null, percentage: null }
                  const itemDone = itemProgress.completed
                  const isExpanded = Boolean(expandedModuleIds[item.id])
                  const lessonValue = lessonModule
                    ? (itemProgress.completed ? 'Validée' : 'Disponible')
                    : item.video
                  const qcmValue = lessonModule && qcmAvailable && itemProgress.percentage !== null
                    ? `${itemProgress.score}/${qcmTotal}`
                    : (lessonModule && qcmAvailable ? 'Disponible' : item.qcm)
                  const lessonComplete = lessonModule ? itemProgress.completed : false
                  const qcmComplete = lessonModule && qcmAvailable ? itemProgress.completed : false

                  return (
                    <article
                      className={`rounded-2xl border p-4 ${styles.card}`}
                      key={item.id}
                    >
                      <button
                        className="flex w-full items-start gap-3 text-left"
                        onClick={() => toggleModuleExpanded(item.id)}
                        type="button"
                      >
                        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${styles.icon}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ring-1 ${styles.badge}`}>
                              {item.id}
                            </span>
                            {itemDone && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                Validé
                              </span>
                            )}
                            <span className="ml-auto text-xs font-bold text-slate-400">
                              {isExpanded ? 'Masquer ▲' : 'Détails ▼'}
                            </span>
                          </div>
                          <h3 className="mt-2 font-extrabold text-slate-900">{item.title}</h3>
                          {isExpanded && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                          )}
                        </div>
                      </button>

                      <div className={`grid gap-2 sm:grid-cols-2 ${isExpanded ? 'mt-4' : 'mt-3'}`}>
                        <button className="text-left" onClick={() => openLesson(item.id)} type="button">
                          <StatusPill complete={lessonComplete} label="Leçon" value={lessonValue} />
                        </button>
                        <button
                          className="text-left disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={Boolean(lessonModule) && !qcmAvailable}
                          onClick={() => openQuiz(item.id)}
                          type="button"
                        >
                          <StatusPill complete={qcmComplete} label="QCU" value={qcmValue} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
              <PaginationBar
                className="mt-4"
                onPageChange={setModulePage}
                page={modulePage}
                pageSize={modulePageSize}
                totalItems={moduleTotalItems}
                totalPages={moduleTotalPages}
              />
            </>
          )}
        </section>


      {openedModule && activeCompetencyUnlocked && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-navy-950/65 p-3 backdrop-blur-md sm:p-5 lg:p-8">
          <div className="flex h-[90vh] max-h-[90vh] min-h-0 w-full max-w-[1200px] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-2xl backdrop-blur-2xl">
            <div className="shrink-0 border-b border-white/60 bg-white/90 p-4 backdrop-blur-xl sm:p-5">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-700">
                    Module {openedModule.id} · {activeCompetency.title}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                    {openedModule.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {openedModule.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`rounded-2xl px-4 py-2 text-sm font-extrabold transition ${moduleMode === 'lesson' ? 'bg-navy-950 text-white' : 'border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}
                    onClick={() => setModuleMode('lesson')}
                    type="button"
                  >
                    Leçon
                  </button>
                  <button
                    className={`rounded-2xl px-4 py-2 text-sm font-extrabold transition ${moduleMode === 'quiz' ? 'bg-navy-950 text-white' : 'border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'}`}
                    onClick={() => openQuiz(openedModule.id)}
                    type="button"
                  >
                    QCU
                  </button>
                  <button
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                    onClick={closeModule}
                    type="button"
                  >
                    Retour
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]" style={{ WebkitOverflowScrolling: 'touch' }}>
            {moduleMode === 'lesson' ? (
              <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-6">
                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-5 text-white shadow-xl">
                    <p className="text-sm font-semibold text-cyan-100">Contenu de leçon</p>
                    <h3 className="mt-2 text-2xl font-black">
                      {openedLesson?.title || openedModule.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-cyan-50/85">
                      {openedLesson?.intro || 'Ce module ouvre une fiche pédagogique complète avec objectifs, supports visuels et validation progressive.'}
                    </p>
                  </section>

                  {openedLesson?.images?.length > 0 && (
                    <section className="overflow-hidden rounded-[1.75rem] border border-cyan-100 bg-white shadow-xl">
                      <div className="border-b border-slate-100 bg-cyan-50/70 p-5">
                        <p className="text-sm font-black uppercase tracking-wide text-cyan-700">
                          {openedLesson.schemaSection?.kicker || 'Schémas pédagogiques'}
                        </p>
                        {openedLesson.schemaSection?.title && (
                          <h3 className="mt-2 text-2xl font-black text-slate-950">
                            {openedLesson.schemaSection.title}
                          </h3>
                        )}
                      </div>
                      <div className="grid gap-4 p-4">
                        {openedLesson.images.map((image) => (
                          <figure
                            className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50"
                            key={image.src}
                          >
                            <button
                              aria-label={`Agrandir : ${image.title || image.alt}`}
                              className={`group block w-full cursor-zoom-in overflow-hidden bg-white text-left ${image.objectFit === 'contain' ? 'min-h-[280px] sm:min-h-[360px]' : 'aspect-[16/9]'}`}
                              onClick={() => setOpenedGalleryImage(image)}
                              type="button"
                            >
                              <LessonImage
                                alt={image.alt}
                                className={`h-full w-full transition duration-300 group-hover:scale-[1.02] ${image.objectFit === 'contain' ? 'object-contain p-3 sm:p-4' : 'object-cover'}`}
                                objectFit={image.objectFit === 'contain' ? 'contain' : 'cover'}
                                src={image.src}
                              />
                            </button>
                            {image.caption && (
                              <figcaption className="border-t border-slate-100 p-4">
                                <p className="text-sm font-semibold leading-6 text-slate-500">{image.caption}</p>
                              </figcaption>
                            )}
                          </figure>
                        ))}
                      </div>
                    </section>
                  )}

                  {openedLesson?.dashboardSection && (
                    <section className="rounded-[1.75rem] border border-amber-100 bg-white shadow-xl">
                      <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-cyan-50/80 p-5">
                        <p className="text-sm font-black uppercase tracking-wide text-cyan-700">
                          {openedLesson.dashboardSection.kicker}
                        </p>
                        <h3 className="mt-2 text-2xl font-black text-slate-950">
                          {openedLesson.dashboardSection.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {openedLesson.dashboardSection.intro}
                        </p>
                      </div>
                      <button
                        className="group block w-full text-left"
                        onClick={() =>
                          setOpenedGalleryImage({
                            src: openedLesson.dashboardSection.image.src,
                            alt: openedLesson.dashboardSection.image.alt,
                            title: openedLesson.dashboardSection.title,
                            caption: openedLesson.dashboardSection.image.caption,
                          })
                        }
                        type="button"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-slate-50 sm:aspect-[16/10]">
                          <LessonImage
                            alt={openedLesson.dashboardSection.image.alt}
                            className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.01]"
                            objectFit="contain"
                            src={openedLesson.dashboardSection.image.src}
                          />
                        </div>
                        <p className="border-t border-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">
                          {openedLesson.dashboardSection.image.caption}
                        </p>
                      </button>
                      <div className="grid gap-3 p-4 sm:grid-cols-2">
                        {openedLesson.dashboardSection.lights.map((light) => (
                          <article
                            className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-cyan-200 hover:bg-white"
                            key={light.id}
                          >
                            <DashboardWarningIcon alt={light.title} type={light.id} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-black text-slate-400">{light.number}.</span>
                                <h4 className="font-extrabold text-slate-950">{light.title}</h4>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ring-1 ${severityBadge[light.severity]}`}
                                >
                                  {light.severity === 'danger'
                                    ? 'Danger'
                                    : light.severity === 'warning'
                                      ? 'Contrôle'
                                      : 'Info'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{light.description}</p>
                              <p className="mt-2 text-xs font-bold leading-5 text-cyan-800">{light.action}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 bg-cyan-50/50 p-4">
                        <button
                          className="w-full rounded-2xl bg-navy-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700 active:scale-[0.98]"
                          onClick={() => openQuiz(openedModule.id)}
                          type="button"
                        >
                          Lancer le QCU voyants du tableau de bord
                        </button>
                      </div>
                    </section>
                  )}

                  <section className="grid gap-3">
                    <div className="overflow-hidden rounded-[1.5rem] border border-cyan-100 bg-white p-5 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Support vidéo</p>
                      <div className="mt-3 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-cyan-200 bg-gradient-to-br from-cyan-50/80 via-white to-white px-5 py-9 text-center">
                        <span className="grid h-16 w-16 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30">
                          <svg aria-hidden="true" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10 9l5 3-5 3V9z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-lg font-black text-slate-900">Bientôt disponible</p>
                          <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                            Les vidéos pédagogiques de cette sous-compétence seront ajoutées prochainement.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Résumé de leçon</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      {openedLesson ? 'Résumé pédagogique complet' : openedModule.title}
                    </h3>
                    {openedLesson?.summaryIntro && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {openedLesson.summaryIntro}
                      </p>
                    )}
                    <div className="mt-4 grid gap-3">
                      {(openedLesson?.summary || [{ title: openedModule.title, description: openedModule.description }]).map((item, index) => (
                        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item.title}>
                          <div className="flex gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-100 text-sm font-black text-cyan-700">
                              {index + 1}
                            </span>
                            <div>
                              <h4 className="font-extrabold text-slate-950">{item.title}</h4>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  {openedLesson && (
                    <section className="rounded-[1.75rem] border border-cyan-100 bg-cyan-50/70 p-5">
                      <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Conseils de sécurité</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {openedLesson.safetyAdvice.map((advice) => (
                          <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm" key={advice}>
                            <p className="text-sm font-bold leading-6 text-slate-700">{advice}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <aside className="h-fit rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Progression</p>
                  <div className="mt-4 rounded-2xl bg-white p-4">
                    <p className="text-3xl font-black text-slate-950">
                      {openedLesson && currentProgress.completed ? '100%' : '35%'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {openedLesson && currentProgress.completed ? 'Module validé' : 'Leçon ouverte'}
                    </p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300"
                        style={{ width: openedLesson && currentProgress.completed ? '100%' : '35%' }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <button
                      className="rounded-2xl bg-navy-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={!lessonQuestionPool.length}
                      onClick={() => openQuiz(openedModule.id)}
                      type="button"
                    >
                      {lessonQuestionPool.length ? 'Ouvrir le QCU' : 'QCU bientôt disponible'}
                    </button>
                    <button className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-extrabold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={!hasNextModule} onClick={openNextModule} type="button">
                      Module suivant
                    </button>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="p-4 sm:p-5 lg:p-6">
                {openedLesson ? (
                  <div className="space-y-5">
                    <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[var(--shadow-soft)]">
                      <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-5 text-white">
                        <p className="text-sm font-semibold text-cyan-100">Leçon avant QCU</p>
                        <h3 className="mt-2 text-2xl font-black">{openedLesson.title}</h3>
                        <p className="mt-3 max-w-4xl text-sm leading-6 text-cyan-50/85">
                          {openedLesson.intro}
                        </p>
                      </div>
                      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Résumé de leçon</p>
                          <div className="mt-4 grid gap-3">
                            {openedLesson.summary.map((item, index) => (
                              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item.title}>
                                <div className="flex gap-3">
                                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-100 text-sm font-black text-cyan-700">
                                    {index + 1}
                                  </span>
                                  <div>
                                    <h4 className="font-extrabold text-slate-950">{item.title}</h4>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                        <aside className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 p-4">
                          <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Conseils de sécurité</p>
                          <div className="mt-3 space-y-3">
                            {openedLesson.safetyAdvice.map((advice) => (
                              <p className="rounded-2xl border border-white bg-white/80 p-3 text-sm font-bold leading-6 text-slate-700" key={advice}>
                                {advice}
                              </p>
                            ))}
                          </div>
                        </aside>
                      </div>
                    </section>

                    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 md:p-5">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                          <p className="text-sm font-black uppercase tracking-wide text-cyan-700">QCU interactif</p>
                          <h3 className="mt-2 text-2xl font-extrabold text-slate-950">{openedLesson.title}</h3>
                          <p className="mt-2 text-sm font-semibold text-slate-500">
                            {getQuizIntro(openedLesson, quizDisplayTotal)}
                          </p>
                        </div>
                        <span className="w-fit rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-black text-cyan-700">
                          {Math.min(currentQuizIndex + 1, quizDisplayTotal)}/{quizDisplayTotal}
                          {openedLesson?.quizSize ? ' · aléatoire' : ''}
                        </span>
                      </div>

                      {!currentValidated && currentQuestions.length > 0 && (
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                            style={{
                              width: `${Math.round(((currentQuizIndex + (currentQuizAnswered ? 1 : 0)) / currentQuestions.length) * 100)}%`,
                            }}
                          />
                        </div>
                      )}

                      {currentValidated ? (
                        <article className="mt-5 rounded-[1.5rem] border border-white bg-white p-5 text-center shadow-sm">
                          <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Résultat final</p>
                          <p className="mt-3 text-5xl font-black text-slate-950">{percentage}%</p>
                          <div className="mx-auto mt-4 h-3 max-w-xs overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${percentage >= 80 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="mt-2 text-sm font-bold text-slate-500">
                            Score : {score}/{quizDisplayTotal} · Seuil de validation : 80 %
                          </p>
                          <p className={`mt-4 text-2xl font-black ${percentage >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {percentage >= 80 ? 'Module validé' : 'Module à retravailler'}
                          </p>
                        </article>
                      ) : currentQuizQuestion ? (
                        <article className="mt-5 rounded-[1.5rem] border border-white bg-white p-5 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 ring-1 ring-cyan-100">
                              {currentQuizQuestion.iconType ? 'Témoin tableau de bord' : 'Question organes'}{' '}
                              {currentQuizIndex + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {answeredCount}/{quizDisplayTotal} réponses
                            </span>
                          </div>
                          {currentQuizQuestion.iconType && (
                            <div className="mt-5 flex flex-col items-center rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white p-6 shadow-inner">
                              <DashboardWarningIcon
                                pulse={!currentQuizAnswered}
                                type={currentQuizQuestion.iconType}
                              />
                              <p className="mt-3 text-center text-sm font-bold text-slate-500">
                                Identifiez la signification de ce témoin
                              </p>
                            </div>
                          )}
                          <h4 className="mt-4 text-xl font-extrabold leading-8 text-slate-950">
                            {currentQuizQuestion.question}
                          </h4>
                          <div
                            className={`mt-5 grid gap-2 ${
                              currentQuizQuestion.choices.length > 3 ? 'sm:grid-cols-2' : 'sm:grid-cols-2'
                            }`}
                          >
                            {currentQuizQuestion.choices.map((choice, choiceIndex) => {
                              const checked = currentQuizAnswer === choiceIndex
                              const status = currentQuizAnswered && choiceIndex === currentQuizQuestion.answer
                                ? 'correct'
                                : currentQuizAnswered && checked && choiceIndex !== currentQuizQuestion.answer
                                  ? 'wrong'
                                  : undefined

                              return (
                                <ChoiceButton
                                  checked={checked}
                                  disabled={currentQuizAnswered}
                                  key={choice}
                                  onClick={() => selectQuizChoice(choiceIndex)}
                                  status={status}
                                >
                                  {choice}
                                </ChoiceButton>
                              )
                            })}
                          </div>
                          {currentQuizAnswered && (
                            <div
                              className={`mt-4 rounded-2xl border p-4 text-sm leading-6 ${
                                currentQuizAnswer === currentQuizQuestion.answer
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                                  : 'border-rose-200 bg-rose-50 text-rose-950'
                              }`}
                            >
                              <p className="font-black">
                                {currentQuizAnswer === currentQuizQuestion.answer
                                  ? 'Bonne réponse'
                                  : 'Réponse incorrecte'}
                              </p>
                              <p className="mt-2 font-black text-slate-800">
                                Correction : {currentQuizQuestion.choices[currentQuizQuestion.answer]}
                              </p>
                              <p className="mt-1 text-slate-700">{currentQuizQuestion.explanation}</p>
                              <button
                                className="mt-4 rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700"
                                onClick={goToNextQuizQuestion}
                                type="button"
                              >
                                {currentQuizIndex + 1 >= currentQuestions.length ? 'Voir le résultat' : 'Question suivante'}
                              </button>
                            </div>
                          )}
                        </article>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-black uppercase tracking-wide text-cyan-700">QCU interactif</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">QCU en préparation</h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                      Cette interface est prête pour les questions du module « {openedModule.title} ». Le module d’installation contient déjà le QCU complet et validable.
                    </p>
                    <button className="mt-5 rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700" onClick={() => setModuleMode('lesson')} type="button">
                      Retour à la leçon
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
            {moduleMode === 'quiz' && openedLesson && (
              <div className="shrink-0 border-t border-white/60 bg-white/95 p-4 shadow-[0_-18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5">
                {currentValidated ? (
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Score : {score}/{quizDisplayTotal} · Réussite : {percentage}%
                      </p>
                      <p className={`mt-1 text-2xl font-black ${percentage >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {percentage >= 80 ? 'Module validé' : 'Module à retravailler'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-extrabold text-cyan-700 transition hover:bg-cyan-100"
                        onClick={resetModule}
                        type="button"
                      >
                        Refaire le QCU
                      </button>
                      <button
                        className="rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        disabled={!hasNextModule}
                        onClick={openNextModule}
                        type="button"
                      >
                        Module suivant
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                    <p className="text-sm font-bold text-slate-500">
                      Répondez question par question. La question suivante apparaît uniquement après correction.
                    </p>
                    <span className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-extrabold text-cyan-700">
                      Validation automatique en fin de QCU
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          {openedGalleryImage && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-navy-950/80 p-4 backdrop-blur-md">
              <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-cyan-700">
                      Galerie photo
                    </p>
                    <h3 className="text-lg font-black text-slate-950">{openedGalleryImage.title}</h3>
                  </div>
                  <button
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                    onClick={() => setOpenedGalleryImage(null)}
                    type="button"
                  >
                    Fermer
                  </button>
                </div>
                <div className="min-h-0 overflow-auto bg-slate-950 p-3">
                  <LessonImage
                    alt={openedGalleryImage.alt}
                    className="mx-auto max-h-[72vh] w-auto max-w-full rounded-2xl object-contain"
                    objectFit="contain"
                    src={openedGalleryImage.src}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
