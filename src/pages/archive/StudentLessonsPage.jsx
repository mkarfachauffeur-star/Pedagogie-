import { useState } from 'react'

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
        'Maîtriser la tenue du volant, la trajectoire et les gestes adaptés en courbe ou manoeuvre.',
      accent: 'amber',
      video: '15 min',
      qcm: 'À faire',
    },
    {
      id: 'SC1.4',
      title: 'Démarrer et s’arrêter',
      description:
        'Démarrer, s’arrêter, repartir et immobiliser le véhicule en sécurité dans un trafic faible.',
      accent: 'violet',
      video: '12 min',
      qcm: 'À faire',
    },
    {
      id: 'SC1.5',
      title: 'Doser accélération et freinage',
      description:
        'Utiliser les pédales avec progressivité pour obtenir une allure régulière et un arrêt maîtrisé.',
      accent: 'rose',
      video: '14 min',
      qcm: 'À faire',
    },
    {
      id: 'SC1.6',
      title: 'Utiliser la boîte de vitesses',
      description:
        'Adapter le rapport de vitesse, gérer l’embrayage et éviter les à-coups.',
      accent: 'teal',
      video: '11 min',
      qcm: 'À faire',
    },
    {
      id: 'SC1.7',
      title: 'Diriger en marche avant et arrière',
      description:
        'Conserver une trajectoire précise en marche avant, marche arrière et manoeuvres simples.',
      accent: 'cyan',
      video: '13 min',
      qcm: 'À faire',
    },
    {
      id: 'SC1.8',
      title: 'Regarder autour et avertir',
      description:
        'Observer avant d’agir, contrôler les angles morts et avertir les autres usagers au bon moment.',
      accent: 'emerald',
      video: '10 min',
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

export default function StudentLessonsPage() {
  const [activeCompetencyId, setActiveCompetencyId] = useState('C1')
  const activeCompetency =
    competencies.find((competency) => competency.id === activeCompetencyId) || competencies[0]
  const activeSubcompetencies = subcompetenciesByCompetency[activeCompetency.id] || []

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

            return (
              <article
                className={`rounded-[1.5rem] border bg-white p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] ${styles.card}`}
                key={item.id}
              >
                <div className="flex items-start gap-4">
                  <span className={`mt-1 h-3 w-3 rounded-full ${styles.icon}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${styles.badge}`}
                      >
                        {item.id}
                      </span>
                      {item.done && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                          En cours
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-extrabold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <StatusPill complete={item.done} label="Vidéo" value={item.video} />
                  <StatusPill complete={item.qcm !== 'À faire'} label="QCM" value={item.qcm} />
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
