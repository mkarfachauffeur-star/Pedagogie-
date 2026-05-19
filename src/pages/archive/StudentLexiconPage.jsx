import { useMemo, useState } from 'react'

const labels = {
  studentOnly: 'Élève uniquement',
  title: 'Lexique auto-école',
  subtitle: 'Comprendre les mots souvent mal interprétés en conduite grâce à des définitions simples, des flashcards, des panneaux et un mini QCM.',
}

const terms = [
  { word: 'Décélérer', definition: 'Réduire progressivement son allure.', explanation: 'On décélère en relâchant l’accélérateur, en freinant doucement ou en rétrogradant selon la situation.' },
  { word: 'Accélérer', definition: 'Augmenter la vitesse du véhicule.', explanation: 'L’accélération doit être progressive pour éviter les à-coups et garder le contrôle.' },
  { word: 'Embrayer', definition: 'Relier le moteur aux roues avec l’embrayage.', explanation: 'Quand on relâche progressivement la pédale d’embrayage, la puissance du moteur revient vers les roues.' },
  { word: 'Débrayer', definition: 'Séparer le moteur des roues avec l’embrayage.', explanation: 'On débraye en appuyant à fond sur la pédale d’embrayage pour changer de vitesse ou s’arrêter.' },
  { word: 'Point de patinage', definition: 'Moment où le véhicule commence à vouloir avancer.', explanation: 'C’est le point d’équilibre entre l’embrayage et le moteur, très utile pour démarrer en douceur.' },
  { word: 'Frein moteur', definition: 'Ralentissement naturel du véhicule quand on relâche l’accélérateur.', explanation: 'Le frein moteur aide à ralentir sans freiner fortement, surtout en descente ou avant un virage.' },
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
    category: 'Intersection',
    accent: 'amber',
    explanation: 'Rappelle qu’un véhicule venant de droite est prioritaire à l’intersection.',
    question: 'À quoi sert ce panneau triangulaire jaune ?',
    answer: 'Indiquer que la règle de la priorité à droite s’applique à la prochaine intersection.',
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
    name: 'Danger / dos d’âne',
    type: 'bump',
    category: 'Danger',
    accent: 'amber',
    explanation: 'Annonce un ralentisseur ou un dos d’âne : ralentir franchement.',
    question: 'Comment franchir un dos d’âne ?',
    answer: 'Très lentement et dans l’axe, pour éviter de heurter le bas du véhicule.',
  },
]

const quiz = [
  { question: 'Que signifie débrayer ?', answer: 'Appuyer sur l’embrayage pour séparer le moteur des roues', choices: ['Accélérer fortement', 'Appuyer sur l’embrayage pour séparer le moteur des roues'] },
  { question: 'Qu’est-ce qu’un angle mort ?', answer: 'Une zone invisible dans les rétroviseurs', choices: ['Une zone invisible dans les rétroviseurs', 'Une voie d’insertion'] },
  { question: 'À quoi sert une voie d’insertion ?', answer: 'Entrer progressivement dans une circulation rapide', choices: ['Stationner sur le côté', 'Entrer progressivement dans une circulation rapide'] },
  { question: 'Que veut dire rétrograder ?', answer: 'Passer à un rapport inférieur', choices: ['Passer à un rapport supérieur', 'Passer à un rapport inférieur'] },
  { question: 'Le clignotant sert principalement à :', answer: 'Informer les autres usagers', choices: ['Obtenir automatiquement la priorité', 'Informer les autres usagers'] },
  { question: 'Quel est ce panneau ?', visualType: 'stop', answer: 'STOP', choices: ['STOP', 'Cédez le passage'] },
  { question: 'Quel est ce panneau ?', visualType: 'yield', answer: 'Cédez le passage', choices: ['Sens interdit', 'Cédez le passage'] },
  { question: 'Quel est ce panneau ?', visualType: 'noEntry', answer: 'Sens interdit', choices: ['Sens interdit', 'Stationnement interdit'] },
  { question: 'Quel est ce panneau ?', visualType: 'roundabout', answer: 'Rond-point', choices: ['Priorité à droite', 'Rond-point'] },
  { question: 'Quel est ce panneau ?', visualType: 'speed50', answer: 'Limitation de vitesse', choices: ['Limitation de vitesse', 'Passage piéton'] },
  { question: 'Quel est ce panneau ?', visualType: 'pedestrian', answer: 'Passage piéton', choices: ['Passage piéton', 'Feu tricolore'] },
  { question: 'Quel est ce panneau ?', visualType: 'trafficLight', answer: 'Feu tricolore', choices: ['Rond-point', 'Feu tricolore'] },
  { question: 'Quel est ce panneau ?', visualType: 'priority', answer: 'Priorité à droite', choices: ['Priorité à droite', 'Danger / dos d’âne'] },
  { question: 'Quel est ce panneau ?', visualType: 'noParking', answer: 'Stationnement interdit', choices: ['Stationnement interdit', 'Sens interdit'] },
  { question: 'Quel est ce panneau ?', visualType: 'bump', answer: 'Danger / dos d’âne', choices: ['Limitation de vitesse', 'Danger / dos d’âne'] },
]

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
          <polygon points="60,10 110,60 60,110 10,60" fill="#ffffff" />
          <polygon points="60,18 102,60 60,102 18,60" fill="#fcd116" />
          <rect x="56" y="42" width="8" height="36" fill="#0f172a" />
          <rect x="42" y="56" width="36" height="8" fill="#0f172a" />
          <rect x="56" y="56" width="22" height="8" fill="#d4101a" />
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
        <svg className={className} viewBox="0 0 120 120" role="img" aria-label="Panneau dos d'âne">
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
  const [answers, setAnswers] = useState({})
  const score = useMemo(() => quiz.reduce((total, item, index) => total + (answers[index] === item.answer ? 1 : 0), 0), [answers])
  const answered = Object.keys(answers).length

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
              <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Définitions</p>
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
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Photos & panneaux</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-[1.65rem]">Les panneaux les plus rencontrés</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Une galerie visuelle pour reconnaître rapidement les panneaux essentiels et comprendre leur signification en conduite.</p>
          </div>
          <p className="rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">{signs.length} panneaux essentiels</p>
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

      <section className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Mini QCM</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Vérifier le vocabulaire et les panneaux</h2>
          </div>
          <p className="rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-700">Score : {score}/{quiz.length} · {answered}/{quiz.length} réponses</p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {quiz.map((item, index) => (
            <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4" key={`${item.question}-${index}`}>
              {item.visualType && (
                <div className="mb-4 grid place-items-center rounded-[1.25rem] bg-white p-4 shadow-inner">
                  <SignVisual type={item.visualType} size="md" />
                </div>
              )}
              <h3 className="font-black text-slate-950">{index + 1}. {item.question}</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {item.choices.map((choice) => {
                  const selected = answers[index] === choice
                  const isCorrect = choice === item.answer
                  const revealed = answers[index]
                  return (
                    <button
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                        selected
                          ? isCorrect
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-rose-200 bg-rose-50 text-rose-800'
                          : revealed && isCorrect
                          ? 'border-emerald-200 bg-white text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50'
                      }`}
                      key={choice}
                      onClick={() => setAnswers((current) => ({ ...current, [index]: choice }))}
                      type="button"
                    >
                      {choice}
                    </button>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
