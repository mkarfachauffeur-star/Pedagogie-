import { useState } from 'react'

const labels = {
  studentOnly: 'Élève uniquement',
  title: 'Lexique auto-école',
  subtitle: 'Définitions essentielles, panneaux de signalisation et quiz QCU aléatoire pour ancrer le vocabulaire.',
}

const terms = [
  { word: 'Décélérer', definition: 'Réduire progressivement son allure.', explanation: 'On décélère en relâchant l’accélérateur, en freinant doucement ou en rétrogradant selon la situation.' },
  { word: 'Accélérer', definition: 'Augmenter la vitesse du véhicule.', explanation: 'L’accélération doit être progressive pour éviter les à-coups et garder le contrôle.' },
  { word: 'Embrayer', definition: 'Relier le moteur aux roues avec l’embrayage.', explanation: 'Quand on relâche progressivement la pédale d’embrayage, la puissance du moteur revient vers les roues.' },
  { word: 'Débrayer', definition: 'Séparer le moteur des roues avec l’embrayage.', explanation: 'On débraye en appuyant à fond sur la pédale d’embrayage pour changer de vitesse ou s’arrêter.' },
  { word: 'Point de patinage', definition: 'Moment où le véhicule commence à vouloir avancer.', explanation: 'C’est le point d’équilibre entre l’embrayage et le moteur, très utile pour démarrer en douceur.' },
  { word: 'Frein moteur', definition: 'Ralentissement naturel du véhicule quand on relâche l’embrayage.', explanation: 'Le frein moteur aide à ralentir sans freiner fortement, surtout en descente ou avant un virage.' },
  { word: 'Rétrograder', definition: 'Passer à un rapport inférieur.', explanation: 'On rétrograde pour récupérer de la puissance, ralentir ou adapter l’allure.' },
  { word: 'Angle mort', definition: 'Zone invisible dans les rétroviseurs.', explanation: 'Il faut tourner la tête pour vérifier qu’aucun usager ne se trouve dans cette zone.' },
  { word: 'Trajectoire', definition: 'Chemin suivi par le véhicule.', explanation: 'La trajectoire dépend du regard, de l’allure et de la précision des gestes au volant.' },
  { word: 'Priorité', definition: 'Droit de passer avant un autre usager.', explanation: 'Avoir la priorité ne dispense jamais d’observer et de ralentir si nécessaire.' },
  { word: 'Intersection', definition: 'Lieu où plusieurs routes se croisent.', explanation: 'Il faut y rechercher la signalisation, contrôler les usagers et adapter son allure.' },
  { word: 'Agglomération', definition: 'Zone urbaine signalée par un panneau d’entrée de ville.', explanation: 'La vitesse et l’observation doivent être adaptées à la présence de piétons, cyclistes et intersections.' },
  { word: 'Hors agglomération', definition: 'Zone située en dehors d’une ville ou d’un village.', explanation: 'Les vitesses sont souvent plus élevées, mais l’anticipation reste indispensable.' },
  { word: 'Voie de décélération', definition: 'Voie permettant de ralentir pour sortir d’un axe rapide.', explanation: 'On s’y engage pour réduire progressivement l’allure sans gêner la circulation principale.' },
  { word: 'Voie d’insertion', definition: 'Voie permettant d’entrer dans une circulation rapide.', explanation: 'Elle sert à prendre de la vitesse, contrôler et s’insérer sans surprendre les autres usagers.' },
]

const signs = [
  {
    name: 'STOP',
    type: 'stop',
    category: 'Intersection',
    accent: 'rose',
    explanation: 'Arrêt obligatoire à l’intersection avant de repartir si la voie est libre.',
    question: 'Que faut-il faire à un panneau STOP ?',
    answer: 'Marquer un arrêt complet, observer puis repartir seulement si la voie est libre.',
  },
  {
    name: 'Cédez le passage',
    type: 'yield',
    category: 'Intersection',
    accent: 'rose',
    explanation: 'Ralentir et laisser passer les véhicules circulant sur la route prioritaire.',
    question: 'Faut-il s’arrêter à un cédez le passage ?',
    answer: 'Non, sauf si un usager arrive. On ralentit et on cède le passage si nécessaire.',
  },
  {
    name: 'Sens interdit',
    type: 'noEntry',
    category: 'Interdiction',
    accent: 'rose',
    explanation: 'Interdiction d’entrer dans cette voie dans le sens indiqué.',
    question: 'Que signifie un disque rouge avec une barre blanche ?',
    answer: 'Sens interdit : on ne peut pas circuler dans cette direction.',
  },
  {
    name: 'Rond-point',
    type: 'roundabout',
    category: 'Obligation',
    accent: 'sky',
    explanation: 'Annonce un carrefour à sens giratoire avec priorité aux véhicules déjà engagés.',
    question: 'Qui est prioritaire dans un rond-point ?',
    answer: 'Les véhicules déjà engagés dans l’anneau sont prioritaires.',
  },
  {
    name: 'Limitation de vitesse',
    type: 'speed50',
    category: 'Interdiction',
    accent: 'rose',
    explanation: 'Vitesse maximale autorisée jusqu’au prochain panneau de fin ou de changement.',
    question: 'Que veut dire un disque blanc bordé de rouge avec un chiffre ?',
    answer: 'Vitesse maximale autorisée en km/h sur cette portion de route.',
  },
  {
    name: 'Passage piéton',
    type: 'pedestrian',
    category: 'Indication',
    accent: 'sky',
    explanation: 'Endroit où les piétons engagés ou manifestant l’intention de traverser sont prioritaires.',
    question: 'Que faire à l’approche d’un passage piéton ?',
    answer: 'Ralentir, observer et s’arrêter si un piéton traverse ou s’apprête à traverser.',
  },
  {
    name: 'Feu tricolore',
    type: 'trafficLight',
    category: 'Signalisation',
    accent: 'emerald',
    explanation: 'Régule la circulation : rouge arrêt, orange préparation à l’arrêt, vert passage.',
    question: 'Que signifie le feu orange ?',
    answer: 'Préparer l’arrêt avant la ligne, sauf si le freinage devient dangereux.',
  },
  {
    name: 'Priorité à droite',
    type: 'priority',
    category: 'Danger',
    accent: 'amber',
    explanation: 'À une intersection sans signalisation particulière, le véhicule venant de droite est prioritaire.',
    question: 'Qui passe en premier à une intersection sans signalisation ?',
    answer: 'Le véhicule arrivant par la droite est prioritaire.',
  },
  {
    name: 'Sens unique',
    type: 'oneWay',
    category: 'Indication',
    accent: 'sky',
    explanation: 'Indique que la circulation est autorisée uniquement dans le sens de la flèche.',
    question: 'Que faut-il faire face à ce panneau ?',
    answer: 'Suivre la direction indiquée par la flèche : la voie est à sens unique.',
  },
  {
    name: 'Stationnement interdit',
    type: 'noParking',
    category: 'Interdiction',
    accent: 'rose',
    explanation: 'Interdiction de stationner sur le côté de chaussée signalé.',
    question: 'Peut-on s’arrêter quelques secondes sous ce panneau ?',
    answer: 'Oui, l’arrêt est autorisé, mais le stationnement est interdit.',
  },
  {
    name: 'Ralentisseur',
    type: 'bump',
    category: 'Danger',
    accent: 'amber',
    explanation: 'Annonce un ralentisseur : réduire fortement son allure avant de le franchir lentement et dans l’axe.',
    question: 'Comment franchir un ralentisseur ?',
    answer: 'Très lentement et dans l’axe, pour éviter de heurter le bas du véhicule.',
  },
]

const quiz = [
  { question: 'Que signifie débrayer ?', answer: 'Appuyer sur l’embrayage pour séparer le moteur des roues', choices: ['Appuyer sur l’embrayage pour séparer le moteur des roues', 'Accélérer fortement pour passer une vitesse', 'Couper le contact du moteur', 'Tourner le volant à fond'] },
  { question: 'Qu’est-ce qu’un angle mort ?', answer: 'Une zone invisible dans les rétroviseurs', choices: ['Une zone invisible dans les rétroviseurs', 'Une voie d’insertion sur autoroute', 'Une zone réservée aux piétons', 'Un emplacement de stationnement'] },
  { question: 'À quoi sert une voie d’insertion ?', answer: 'Entrer progressivement dans une circulation rapide', choices: ['Entrer progressivement dans une circulation rapide', 'Stationner sur le côté de la chaussée', 'Faire demi-tour en toute sécurité', 'Doubler les véhicules lents'] },
  { question: 'Que veut dire rétrograder ?', answer: 'Passer à un rapport inférieur', choices: ['Passer à un rapport inférieur', 'Passer à un rapport supérieur', 'Couper le contact du moteur', 'Mettre la boîte au point mort'] },
  { question: 'Le clignotant sert principalement à :', answer: 'Informer les autres usagers de l’intention de tourner', choices: ['Informer les autres usagers de l’intention de tourner', 'Obtenir automatiquement la priorité', 'Signaler une situation d’urgence', 'Demander aux piétons de s’écarter'] },
  { question: 'Que veut dire décélérer ?', answer: 'Relâcher l’accélérateur', choices: ['Relâcher l’accélérateur', 'Accélérer franchement', 'Couper le moteur', 'Maintenir une allure constante'] },
  { question: 'Qu’est-ce que le frein moteur ?', answer: 'Le ralentissement naturel du véhicule quand on relâche l’embrayage', choices: ['Le ralentissement naturel du véhicule quand on relâche l’embrayage', 'Le frein de stationnement à main', 'Le système ABS du véhicule', 'Une pédale spécifique au moteur'] },
  { question: 'Qu’est-ce que le point de patinage ?', answer: 'Le moment où le véhicule commence à vouloir avancer', choices: ['Le moment où le véhicule commence à vouloir avancer', 'Le moment où l’on cale le moteur', 'Le point d’arrêt du frein à main', 'Le point culminant d’un virage'] },
  { question: 'Que désigne une intersection ?', answer: 'Un lieu où plusieurs routes se croisent', choices: ['Un lieu où plusieurs routes se croisent', 'Une portion d’autoroute', 'Une zone réservée aux bus', 'Un passage piéton signalé'] },
  { question: 'Quel est ce panneau ?', visualType: 'stop', answer: 'STOP', choices: ['STOP', 'Cédez le passage', 'Sens interdit', 'Limitation de vitesse'] },
  { question: 'Quel est ce panneau ?', visualType: 'yield', answer: 'Cédez le passage', choices: ['Cédez le passage', 'STOP', 'Ralentisseur', 'Priorité à droite'] },
  { question: 'Quel est ce panneau ?', visualType: 'noEntry', answer: 'Sens interdit', choices: ['Sens interdit', 'Stationnement interdit', 'Sens unique', 'STOP'] },
  { question: 'Quel est ce panneau ?', visualType: 'roundabout', answer: 'Rond-point', choices: ['Rond-point', 'Sens unique', 'Priorité à droite', 'Cédez le passage'] },
  { question: 'Quel est ce panneau ?', visualType: 'speed50', answer: 'Limitation de vitesse', choices: ['Limitation de vitesse', 'Sens interdit', 'Stationnement interdit', 'Passage piéton'] },
  { question: 'Quel est ce panneau ?', visualType: 'pedestrian', answer: 'Passage piéton', choices: ['Passage piéton', 'Sens unique', 'Feu tricolore', 'Rond-point'] },
  { question: 'Quel est ce panneau ?', visualType: 'trafficLight', answer: 'Feu tricolore', choices: ['Feu tricolore', 'Rond-point', 'Passage piéton', 'Priorité à droite'] },
  { question: 'Quel est ce panneau ?', visualType: 'priority', answer: 'Priorité à droite', choices: ['Priorité à droite', 'Ralentisseur', 'Cédez le passage', 'STOP'] },
  { question: 'Quel est ce panneau ?', visualType: 'oneWay', answer: 'Sens unique', choices: ['Sens unique', 'Sens interdit', 'Passage piéton', 'Rond-point'] },
  { question: 'Quel est ce panneau ?', visualType: 'noParking', answer: 'Stationnement interdit', choices: ['Stationnement interdit', 'Sens interdit', 'Sens unique', 'Limitation de vitesse'] },
  { question: 'Quel est ce panneau ?', visualType: 'bump', answer: 'Ralentisseur', choices: ['Ralentisseur', 'Priorité à droite', 'Limitation de vitesse', 'Cédez le passage'] },
]

const QUIZ_SAMPLE_SIZE = 10

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildSession() {
  return shuffleArray(quiz)
    .slice(0, Math.min(QUIZ_SAMPLE_SIZE, quiz.length))
    .map((item) => ({ ...item, choices: shuffleArray(item.choices) }))
}

const accentBadge = {
  rose: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100',
  sky: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
}

function SignVisual({ type, size = 'md' }) {
  const dim = size === 'sm' ? 'h-20 w-20' : size === 'lg' ? 'h-36 w-36' : 'h-28 w-28'
  const className = `${dim} drop-shadow-[0_8px_18px_rgba(15,23,42,0.18)]`

  switch (type) {
    case 'stop':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau STOP">
          <polygon points="40,6 80,6 114,40 114,80 80,114 40,114 6,80 6,40" fill="#d4101a" />
          <polygon points="40,6 80,6 114,40 114,80 80,114 40,114 6,80 6,40" fill="none" stroke="#ffffff" strokeWidth="5" />
          <polygon points="41,11 79,11 109,41 109,79 79,109 41,109 11,79 11,41" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.55" />
          <text x="60" y="72" textAnchor="middle" fill="#ffffff" fontSize="28" fontWeight="900" fontFamily="'Helvetica Neue', Arial, sans-serif" letterSpacing="1.5">STOP</text>
        </svg>
      )
    case 'yield':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau Cédez le passage">
          <polygon points="60,112 6,16 114,16" fill="#d4101a" />
          <polygon points="60,100 19,26 101,26" fill="#ffffff" />
        </svg>
      )
    case 'noEntry':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau sens interdit">
          <circle cx="60" cy="60" r="52" fill="#d4101a" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.5" />
          <rect x="22" y="52" width="76" height="16" rx="3" fill="#ffffff" />
        </svg>
      )
    case 'roundabout':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau rond-point obligatoire">
          <circle cx="60" cy="60" r="52" fill="#0a52a3" />
          <path d="M60 32a28 28 0 0 1 24.25 14" fill="none" stroke="#ffffff" strokeWidth="7.5" strokeLinecap="round" />
          <polygon points="78,38 92,49 76,52" fill="#ffffff" />
          <path d="M84 64a28 28 0 0 1-40.5 22" fill="none" stroke="#ffffff" strokeWidth="7.5" strokeLinecap="round" />
          <polygon points="47,93 33,84 49,80" fill="#ffffff" />
          <path d="M36 76A28 28 0 0 1 38 41" fill="none" stroke="#ffffff" strokeWidth="7.5" strokeLinecap="round" />
          <polygon points="30,36 47,33 41,49" fill="#ffffff" />
        </svg>
      )
    case 'speed50':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau limitation 50 km/h">
          <circle cx="60" cy="60" r="56" fill="#ffffff" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="#d4101a" strokeWidth="13" />
          <text x="60" y="78" textAnchor="middle" fill="#0f172a" fontSize="48" fontWeight="900" fontFamily="'Helvetica Neue', Arial, sans-serif">50</text>
        </svg>
      )
    case 'pedestrian':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau passage piéton">
          <rect x="8" y="8" width="104" height="104" rx="10" fill="#0a52a3" />
          <polygon points="60,22 100,98 20,98" fill="#ffffff" />
          <circle cx="62" cy="44" r="5.5" fill="#0f172a" />
          <path d="M58 50.5l-7 16 4 3 5-11" fill="#0f172a" />
          <path d="M62 50.5l9 13-2 5-9-9" fill="#0f172a" />
          <path d="M56 67l-7 14 4 2 6-11" fill="#0f172a" />
          <path d="M64 64l8 14-3 3-8-11" fill="#0f172a" />
          <line x1="32" y1="92" x2="88" y2="92" stroke="#0a52a3" strokeWidth="3" />
          <line x1="37" y1="86" x2="83" y2="86" stroke="#0a52a3" strokeWidth="3" />
          <line x1="42" y1="80" x2="78" y2="80" stroke="#0a52a3" strokeWidth="3" />
          <line x1="47" y1="74" x2="73" y2="74" stroke="#0a52a3" strokeWidth="3" />
        </svg>
      )
    case 'trafficLight':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Feu tricolore">
          <rect x="12" y="10" width="96" height="14" rx="4" fill="#374151" />
          <rect x="34" y="22" width="52" height="86" rx="14" fill="#1f2937" />
          <circle cx="60" cy="40" r="11" fill="#ef4444" />
          <circle cx="60" cy="40" r="11" fill="url(#redGlow)" opacity="0.5" />
          <circle cx="60" cy="65" r="11" fill="#f59e0b" />
          <circle cx="60" cy="65" r="11" fill="url(#orangeGlow)" opacity="0.5" />
          <circle cx="60" cy="90" r="11" fill="#10b981" />
          <circle cx="60" cy="90" r="11" fill="url(#greenGlow)" opacity="0.5" />
          <defs>
            <radialGradient id="redGlow" cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#fff" stopOpacity="0.7" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0" /></radialGradient>
            <radialGradient id="orangeGlow" cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#fff" stopOpacity="0.7" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0" /></radialGradient>
            <radialGradient id="greenGlow" cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#fff" stopOpacity="0.7" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></radialGradient>
          </defs>
        </svg>
      )
    case 'priority':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau priorité à droite">
          <polygon points="60,10 114,104 6,104" fill="#ffffff" />
          <polygon points="60,10 114,104 6,104" fill="none" stroke="#d4101a" strokeWidth="9" strokeLinejoin="round" />
          <line x1="42" y1="58" x2="78" y2="94" stroke="#0f172a" strokeWidth="13" strokeLinecap="square" />
          <line x1="78" y1="58" x2="42" y2="94" stroke="#0f172a" strokeWidth="13" strokeLinecap="square" />
        </svg>
      )
    case 'oneWay':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau sens unique">
          <rect x="8" y="8" width="104" height="104" rx="8" fill="#ffffff" />
          <rect x="12" y="12" width="96" height="96" rx="5" fill="#0a52a3" />
          <polygon points="60,22 92,58 76,58 76,100 44,100 44,58 28,58" fill="#ffffff" />
        </svg>
      )
    case 'noParking':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau stationnement interdit">
          <circle cx="60" cy="60" r="52" fill="#0a52a3" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="#d4101a" strokeWidth="9" />
          <line x1="26" y1="94" x2="94" y2="26" stroke="#d4101a" strokeWidth="9" strokeLinecap="round" />
        </svg>
      )
    case 'bump':
      return (
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau ralentisseur">
          <polygon points="60,10 114,104 6,104" fill="#ffffff" />
          <polygon points="60,10 114,104 6,104" fill="none" stroke="#d4101a" strokeWidth="9" strokeLinejoin="round" />
          <path d="M22 90 C 36 70, 50 70, 60 90 C 70 70, 84 70, 98 90" fill="none" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="18" y1="92" x2="102" y2="92" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export default function StudentLexiconPage() {
  const [activeTerm, setActiveTerm] = useState(terms[0])
  const [flipped, setFlipped] = useState({})

  const [session, setSession] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const startQuiz = () => {
    setSession(buildSession())
    setCurrentIndex(0)
    setSelectedChoice(null)
    setScore(0)
    setFinished(false)
  }

  const handleSelect = (choice) => {
    if (selectedChoice || !session) return
    setSelectedChoice(choice)
    if (choice === session[currentIndex].answer) {
      setScore((value) => value + 1)
    }
  }

  const handleNext = () => {
    if (!session) return
    if (currentIndex + 1 >= session.length) {
      setFinished(true)
    } else {
      setCurrentIndex((value) => value + 1)
      setSelectedChoice(null)
    }
  }

  const currentQuestion = session && !finished ? session[currentIndex] : null
  const progress = session ? Math.round(((currentIndex + (selectedChoice ? 1 : 0)) / session.length) * 100) : 0
  const percentage = session ? Math.round((score / session.length) * 100) : 0

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">{labels.studentOnly}</span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{labels.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50/85">{labels.subtitle}</p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Définitions du lexique</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Cartes interactives</h2>
            </div>
            <p className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700">{terms.length} mots clés</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {terms.map((term) => {
              const isFlipped = Boolean(flipped[term.word])
              return (
                <button
                  className="min-h-40 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-1 hover:border-cyan-200 hover:bg-cyan-50/60 hover:shadow-lg"
                  key={term.word}
                  onClick={() => { setActiveTerm(term); setFlipped((current) => ({ ...current, [term.word]: !current[term.word] })) }}
                  type="button"
                >
                  <p className="text-lg font-black text-slate-950">{term.word}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{isFlipped ? term.explanation : term.definition}</p>
                  <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">{isFlipped ? 'Explication' : 'Définition'}</span>
                </button>
              )
            })}
          </div>
        </div>
        <aside className="h-fit rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Carte sélectionnée</p>
          <h3 className="mt-2 text-3xl font-black text-slate-950">{activeTerm.word}</h3>
          <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm font-bold leading-6 text-cyan-900">{activeTerm.definition}</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{activeTerm.explanation}</p>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Panneaux de signalisation</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-[1.65rem]">Les panneaux les plus rencontrés</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Une galerie visuelle pour reconnaître rapidement les panneaux essentiels et comprendre leur signification en conduite.</p>
          </div>
          <p className="rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">{signs.length} panneaux à reconnaître</p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {signs.map((sign, index) => (
            <article
              key={sign.type}
              lang="fr"
              className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_-18px_rgba(15,23,42,0.35)]"
            >
              <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.18]"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 18% 22%, rgba(15,23,42,0.18) 0, transparent 38%), radial-gradient(circle at 82% 78%, rgba(15,23,42,0.12) 0, transparent 45%)',
                  }}
                />
                <span className="absolute left-3 top-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500 shadow-sm ring-1 ring-slate-200">{String(index + 1).padStart(2, '0')}</span>
                <span className={`absolute right-3 top-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${accentBadge[sign.accent]}`} style={{ letterSpacing: '0.04em' }}>{sign.category}</span>
                <div className="relative grid h-32 w-32 place-items-center transition duration-300 group-hover:scale-105">
                  <SignVisual type={sign.type} size="lg" />
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                <h3
                  className="text-left text-lg font-extrabold text-slate-950 sm:text-xl"
                  style={{ overflowWrap: 'break-word', wordBreak: 'normal', hyphens: 'manual', letterSpacing: 'normal', lineHeight: '1.3' }}
                >
                  {sign.name}
                </h3>
                <p
                  className="text-left text-[15px] text-slate-600"
                  style={{ overflowWrap: 'break-word', wordBreak: 'normal', hyphens: 'manual', letterSpacing: 'normal', lineHeight: '1.65', textAlign: 'left' }}
                >
                  {sign.explanation}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)] sm:p-7" lang="fr">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Quiz aléatoire</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-[1.65rem]">Quiz QCU aléatoire</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{QUIZ_SAMPLE_SIZE} questions tirées au hasard parmi {quiz.length}. Une seule bonne réponse par question.</p>
          </div>
          {session && !finished && (
            <p className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-800">Question {Math.min(currentIndex + 1, session.length)} / {session.length}</p>
          )}
        </div>

        {!session && (
          <div className="mt-6 grid place-items-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-cyan-100 text-3xl">🎯</div>
            <h3 className="mt-5 text-xl font-black text-slate-950">Prêt pour le défi ?</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Vocabulaire auto-école et panneaux mélangés. {QUIZ_SAMPLE_SIZE} questions à choix unique, ordre et propositions aléatoires.</p>
            <button
              type="button"
              onClick={startQuiz}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-600/20 transition hover:shadow-xl hover:shadow-cyan-600/30 active:scale-[0.98]"
            >
              Lancer le quiz aléatoire
            </button>
          </div>
        )}

        {currentQuestion && (
          <div className="mt-6">
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <article className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
              {currentQuestion.visualType && (
                <div className="mb-5 grid place-items-center rounded-[1.5rem] bg-white p-5 shadow-inner">
                  <SignVisual type={currentQuestion.visualType} size="lg" />
                </div>
              )}
              <h3
                className="text-left text-lg font-extrabold text-slate-950 sm:text-xl"
                style={{ overflowWrap: 'break-word', wordBreak: 'normal', hyphens: 'manual', letterSpacing: 'normal', lineHeight: '1.35' }}
              >
                {currentIndex + 1}. {currentQuestion.question}
              </h3>

              <div className="mt-5 grid gap-2.5">
                {currentQuestion.choices.map((choice) => {
                  const isSelected = selectedChoice === choice
                  const isCorrect = choice === currentQuestion.answer
                  const showResult = Boolean(selectedChoice)
                  let style = 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
                  if (showResult) {
                    if (isCorrect) style = 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    else if (isSelected) style = 'border-rose-300 bg-rose-50 text-rose-900'
                    else style = 'border-slate-200 bg-white text-slate-500'
                  }
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => handleSelect(choice)}
                      disabled={showResult}
                      className={`rounded-2xl border px-4 py-3.5 text-left text-[15px] font-bold transition ${style}`}
                      style={{ overflowWrap: 'break-word', wordBreak: 'normal', hyphens: 'manual', letterSpacing: 'normal', lineHeight: '1.45' }}
                    >
                      {choice}
                    </button>
                  )
                })}
              </div>

              {selectedChoice && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p
                    className={`text-sm font-black ${
                      selectedChoice === currentQuestion.answer ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {selectedChoice === currentQuestion.answer ? '✓ Bonne réponse' : `✗ Mauvaise réponse — la bonne réponse est : ${currentQuestion.answer}`}
                  </p>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-cyan-700 active:scale-[0.98]"
                  >
                    {currentIndex + 1 >= session.length ? 'Voir le score' : 'Question suivante'} →
                  </button>
                </div>
              )}
            </article>
          </div>
        )}

        {finished && session && (
          <div className="mt-6 grid place-items-center rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50 px-6 py-10 text-center">
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Score final</p>
            <p className="mt-3 text-5xl font-black text-slate-950">{score} <span className="text-slate-400">/ {session.length}</span></p>
            <p className="mt-2 text-base font-bold text-slate-600">{percentage} % de bonnes réponses</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
              {percentage >= 80
                ? 'Excellent ! Tu maîtrises bien le lexique et les panneaux.'
                : percentage >= 50
                  ? 'Bon début. Revois les définitions et panneaux puis recommence le quiz.'
                  : 'Pas de panique. Relis les cartes et les panneaux puis relance le quiz pour progresser.'}
            </p>
            <button
              type="button"
              onClick={startQuiz}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-600/20 transition hover:shadow-xl active:scale-[0.98]"
            >
              Recommencer un quiz aléatoire
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
