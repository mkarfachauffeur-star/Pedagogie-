import { useEffect, useState } from 'react'

const competencies = [
  {
    id: 'C1',
    number: '1',
    title: 'Maîtriser le véhicule',
    description: 'Maniement du véhicule dans un trafic faible ou nul',
    progress: 65,
    modulesStarted: 2,
    remaining: 4,
    summary:
      'Progressez étape par étape dans un trafic faible ou nul avec des vidéos, des QCM et des objectifs clairement encadrés.',
  },
  {
    id: 'C2',
    number: '2',
    title: 'Appréhender la route',
    description: 'Observer, anticiper et adapter son allure',
    progress: 38,
    modulesStarted: 1,
    remaining: 5,
    summary:
      'Travaillez l’observation, l’anticipation et l’adaptation de votre allure en environnement réel.',
  },
  {
    id: 'C3',
    number: '3',
    title: 'Partager la route',
    description: 'Interagir avec les autres usagers en sécurité',
    progress: 24,
    modulesStarted: 1,
    remaining: 5,
    summary:
      'Renforcez votre communication, vos contrôles et votre capacité à circuler avec les autres usagers.',
  },
  {
    id: 'C4',
    number: '4',
    title: 'Devenir autonome',
    description: 'Conduire de manière responsable et indépendante',
    progress: 12,
    modulesStarted: 0,
    remaining: 6,
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
      video: 'Vue',
      qcm: '8/10',
      done: true,
    },
    {
      id: 'SC1.2',
      title: 'S’installer au poste de conduite',
      description:
        'Régler siège, dossier, appuie-tête, rétroviseurs et ceinture pour conduire en sécurité.',
      accent: 'emerald',
      video: 'Vue',
      qcm: 'À faire',
      done: true,
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
      video: 'Vue',
      qcm: '7/10',
      done: true,
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
      video: 'Vue',
      qcm: 'À faire',
      done: true,
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

function createRandomizedQuestion(question, correctChoice, wrongChoices, explanation) {
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
  }
}

const drivingPositionModule = {
  id: 'SC1.2',
  storageKey: 'pedagogia:lesson:driving-position',
  title: 'S’installer au poste de conduite',
  intro:
    'Avant de démarrer, le conducteur doit correctement régler son poste de conduite afin d’assurer sa sécurité, son confort et une bonne maîtrise du véhicule.',
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
}

function StatusPill({ label, value, complete }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
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

function getSavedModuleProgress(storageKey) {
  if (typeof window === 'undefined') {
    return { completed: false, score: null, percentage: null }
  }

  try {
    const saved = window.localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : { completed: false, score: null, percentage: null }
  } catch {
    return { completed: false, score: null, percentage: null }
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
      className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${statusClass}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

export default function StudentLessonsPage() {
  const [activeCompetencyId, setActiveCompetencyId] = useState('C1')
  const [openedModuleId, setOpenedModuleId] = useState(null)
  const [moduleMode, setModuleMode] = useState('lesson')
  const [answersByModule, setAnswersByModule] = useState({})
  const [validatedByModule, setValidatedByModule] = useState({})
  const [moduleProgressById, setModuleProgressById] = useState(() =>
    Object.fromEntries(
      Object.values(lessonModules).map((module) => [
        module.id,
        getSavedModuleProgress(module.storageKey),
      ]),
    ),
  )
  const activeCompetency =
    competencies.find((competency) => competency.id === activeCompetencyId) || competencies[0]
  const activeSubcompetencies = subcompetenciesByCompetency[activeCompetency.id] || []
  const openedModule = activeSubcompetencies.find((item) => item.id === openedModuleId)
  const openedLesson = lessonModules[openedModuleId]
  const currentQuestions = openedLesson?.questions || []
  const currentAnswers = answersByModule[openedModuleId] || {}
  const currentValidated = Boolean(validatedByModule[openedModuleId])
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

  const openLesson = (moduleId) => {
    setOpenedModuleId(moduleId)
    setModuleMode('lesson')
  }

  const openQuiz = (moduleId) => {
    setOpenedModuleId(moduleId)
    setModuleMode('quiz')
  }

  const closeModule = () => {
    setOpenedModuleId(null)
  }

  const openNextModule = () => {
    if (!hasNextModule) return
    setOpenedModuleId(activeSubcompetencies[openedModuleIndex + 1].id)
    setModuleMode('lesson')
  }

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
    window.localStorage.setItem(openedLesson.storageKey, JSON.stringify(nextProgress))
  }

  const resetModule = () => {
    if (!openedModuleId) return
    setAnswersByModule((current) => ({ ...current, [openedModuleId]: {} }))
    setValidatedByModule((current) => ({ ...current, [openedModuleId]: false }))
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="grid gap-6 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:grid-cols-[1fr_320px] md:p-8">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
                Formation REMC
              </span>
              <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                Compétence {activeCompetency.number} : {activeCompetency.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50/85">
                {activeCompetency.summary}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-extrabold">{activeSubcompetencies.length}</p>
                <p className="text-sm text-cyan-50/75">Sous-compétences</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-extrabold">{activeCompetency.modulesStarted}</p>
                <p className="text-sm text-cyan-50/75">Modules commencés</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-extrabold">{activeCompetency.progress}%</p>
                <p className="text-sm text-cyan-50/75">Progression {activeCompetency.id}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 backdrop-blur">
              <p className="text-sm font-bold leading-6 text-cyan-50/90">
                Les leçons actuellement disponibles concernent les véhicules à boîte manuelle. Les modules pour boîte automatique seront ajoutés prochainement.
              </p>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-white/15 bg-white p-5 text-slate-900 shadow-2xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Progression
                </p>
                <p className="mt-1 text-5xl font-black text-cyan-600">
                  {activeCompetency.progress}%
                </p>
              </div>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-bold text-cyan-700">
                {activeCompetency.id}
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500 ease-out"
                style={{ width: `${activeCompetency.progress}%` }}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              {`Continuez les modules restants pour valider la compétence ${activeCompetency.id}.`}
            </p>
          </aside>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[var(--shadow-soft)] md:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-slate-900">Parcours de compétences</h2>
          <p className="text-sm text-slate-500">Les étapes principales restent visibles et structurées.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {competencies.map((competency) => {
            const isActive = competency.id === activeCompetency.id

            return (
            <button
              aria-pressed={isActive}
              className={`group relative min-h-44 w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/30 ${
                isActive
                  ? 'border-cyan-300/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 text-white shadow-2xl shadow-cyan-950/20'
                  : 'border-white/60 bg-white/70 shadow-[var(--shadow-soft)] backdrop-blur-xl hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-cyan-50/80 hover:shadow-xl'
              }`}
              key={competency.id}
              onClick={() => setActiveCompetencyId(competency.id)}
              type="button"
            >
              <span
                className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              />
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black ${
                  isActive ? 'bg-cyan-300 text-navy-950' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {competency.id}
              </span>
              <h3 className={`mt-4 font-extrabold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                {competency.title}
              </h3>
              <p className={`mt-2 text-sm leading-5 ${isActive ? 'text-cyan-50/80' : 'text-slate-500'}`}>
                {competency.description}
              </p>
              <div className={`mt-4 h-1.5 overflow-hidden rounded-full ${isActive ? 'bg-white/15' : 'bg-slate-100'}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500"
                  style={{ width: `${competency.progress}%` }}
                />
              </div>
            </button>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Sous-éléments {activeCompetency.id}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeCompetency.description}
            </p>
          </div>
          <span className="w-fit rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-bold text-cyan-700 shadow-sm">
            {activeCompetency.remaining} modules à terminer
          </span>
        </div>

        <div
          key={activeCompetency.id}
          className="grid gap-4 animate-slide-up lg:grid-cols-2"
        >
          {activeSubcompetencies.map((item) => {
            const styles = accentStyles[item.accent]
            const lessonModule = lessonModules[item.id]
            const qcmAvailable = Boolean(lessonModule?.questions?.length)
            const itemProgress = moduleProgressById[item.id] || { completed: false, score: null, percentage: null }
            const itemDone = item.done || itemProgress.completed
            const lessonValue = lessonModule
              ? (itemProgress.completed ? 'Validée' : 'Disponible')
              : item.video
            const qcmValue = lessonModule && qcmAvailable && itemProgress.percentage !== null
              ? `${itemProgress.score}/${lessonModule.questions.length}`
              : (lessonModule && qcmAvailable ? 'Disponible' : item.qcm)
            const lessonComplete = lessonModule ? itemProgress.completed : itemDone
            const qcmComplete = lessonModule && qcmAvailable ? itemProgress.percentage !== null : qcmValue !== 'À faire'

            return (
              <article
                className={`rounded-[1.5rem] border bg-white p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${styles.card}`}
                key={item.id}
              >
                <button className="flex w-full items-start gap-4 text-left" onClick={() => openLesson(item.id)} type="button">
                  <span className={`mt-1 h-3 w-3 rounded-full ${styles.icon}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${styles.badge}`}
                      >
                        {item.id}
                      </span>
                      {itemDone && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                          {lessonModule && itemProgress.completed ? 'Module validé' : 'En cours'}
                        </span>
                      )}
                      {lessonModule && !itemProgress.completed && (
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-100">
                          {qcmAvailable ? 'Leçon + QCM disponibles' : 'Leçon disponible'}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-extrabold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </button>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button className="text-left" onClick={() => openLesson(item.id)} type="button">
                    <StatusPill complete={lessonComplete} label="Leçon" value={lessonValue} />
                  </button>
                  <button
                    className="text-left disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={Boolean(lessonModule) && !qcmAvailable}
                    onClick={() => openQuiz(item.id)}
                    type="button"
                  >
                    <StatusPill complete={qcmComplete} label="QCM" value={qcmValue} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>


      {openedModule && (
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
                    onClick={() => setModuleMode('quiz')}
                    type="button"
                  >
                    QCM
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

                  <section className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Support vidéo</p>
                      <div className="mt-3 grid min-h-40 place-items-center rounded-2xl border border-dashed border-cyan-200 bg-white text-center">
                        <div>
                          <p className="text-4xl">▶</p>
                          <p className="mt-2 text-sm font-bold text-slate-600">Vidéo pédagogique à intégrer</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Images repères</p>
                      <div className="mt-3 grid min-h-40 place-items-center rounded-2xl border border-dashed border-cyan-200 bg-white text-center">
                        <div>
                          <p className="text-4xl">▣</p>
                          <p className="mt-2 text-sm font-bold text-slate-600">Schémas et photos du poste de conduite</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                    <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Résumé de leçon</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      {openedLesson ? 'Résumé pédagogique complet' : openedModule.title}
                    </h3>
                    {openedLesson && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Chaque étape prépare le conducteur à agir avec précision, à anticiper la trajectoire et à garder une maîtrise sûre du véhicule.
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
                      disabled={!currentQuestions.length}
                      onClick={() => setModuleMode('quiz')}
                      type="button"
                    >
                      {currentQuestions.length ? 'Ouvrir le QCM' : 'QCM bientôt disponible'}
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
                        <p className="text-sm font-semibold text-cyan-100">Leçon avant QCM</p>
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
                        <p className="text-sm font-black uppercase tracking-wide text-cyan-700">QCM professionnel</p>
                        <h3 className="mt-2 text-2xl font-extrabold text-slate-950">{openedLesson.title}</h3>
                      </div>
                      <span className="w-fit rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-black text-cyan-700">
                        {answeredCount}/{currentQuestions.length} réponses
                      </span>
                    </div>

                    <div className="mt-5 space-y-5">
                      {currentQuestions.map((question, questionIndex) => (
                        <article className="rounded-2xl border border-white bg-white p-4 shadow-sm" key={question.question}>
                          <h4 className="font-extrabold text-slate-950">
                            {questionIndex + 1}. {question.question}
                          </h4>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {question.choices.map((choice, choiceIndex) => {
                              const checked = currentAnswers[questionIndex] === choiceIndex
                              const status = currentValidated && choiceIndex === question.answer
                                ? 'correct'
                                : currentValidated && checked && choiceIndex !== question.answer
                                  ? 'wrong'
                                  : undefined

                              return (
                                <ChoiceButton
                                  checked={checked}
                                  disabled={currentValidated}
                                  key={choice}
                                  onClick={() =>
                                    setAnswersByModule((current) => ({ ...current, [openedModuleId]: { ...(current[openedModuleId] || {}), [questionIndex]: choiceIndex } }))
                                  }
                                  status={status}
                                >
                                  {choice}
                                </ChoiceButton>
                              )
                            })}
                          </div>
                          {currentValidated && (
                            <div className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-sm leading-6 text-slate-700">
                              <p className="font-black text-cyan-800">
                                Correction : {question.choices[question.answer]}
                              </p>
                              <p className="mt-1">{question.explanation}</p>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>

                  </div>
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-black uppercase tracking-wide text-cyan-700">QCM interactif</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">QCM en préparation</h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                      Cette interface est prête pour les questions du module « {openedModule.title} ». Le module d’installation contient déjà le QCM complet et validable.
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
                        Score : {score}/{currentQuestions.length} · Réussite : {percentage}%
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
                        Refaire le QCM
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
                      Répondez aux 10 questions pour valider le module. Validation à partir de 80%.
                    </p>
                    <button
                      className="rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                      disabled={!canValidate}
                      onClick={validateModule}
                      type="button"
                    >
                      Valider le QCM
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
