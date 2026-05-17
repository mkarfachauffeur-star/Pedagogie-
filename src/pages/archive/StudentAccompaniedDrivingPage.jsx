import { useMemo, useState } from 'react'

const studentSituation = {
  name: 'Thomas Martin',
  age: 17,
  initialTrainingDone: true,
  insuranceAgreement: true,
  wantsExperienceBeforeExam: true,
  kilometers: 1250,
  targetKilometers: 3000,
}

const rvpData = [
  {
    id: 'rvp-1',
    title: 'RVP 1 - Bilan initial accompagnateur',
    date: '12 janvier 2026',
    status: 'Réalisé',
    progress: 72,
    remarks:
      'Bonne installation au poste de conduite et bonne compréhension des consignes. Les contrôles doivent devenir plus spontanés.',
    improvements: 'Angles morts, anticipation des intersections, régularité des contrôles rétroviseurs.',
    nextObjectives:
      'Réaliser 350 km supplémentaires sur trajets variés et verbaliser les contrôles avant chaque changement de direction.',
  },
  {
    id: 'rvp-2',
    title: 'RVP 2 - Autonomie progressive',
    date: 'À planifier',
    status: 'À venir',
    progress: 35,
    remarks:
      'Rendez-vous prévu après consolidation des trajets route et ville avec accompagnateur.',
    improvements: 'Gestion des priorités, insertion en circulation dense, adaptation de l’allure.',
    nextObjectives:
      'Préparer un trajet complet avec l’accompagnateur et noter les situations difficiles rencontrées.',
  },
  {
    id: 'rvp-3',
    title: 'RVP 3 - Préparation examen',
    date: 'À venir',
    status: 'Prévisionnel',
    progress: 12,
    remarks:
      'Dernier rendez-vous pédagogique pour valider l’autonomie et la préparation examen.',
    improvements: 'Conduite indépendante, décisions complexes, gestion du stress.',
    nextObjectives:
      'Atteindre le volume d’expérience requis et réaliser un examen blanc complet.',
  },
]

const initialFamilyObjectives = [
  {
    id: 'city',
    title: 'Trajets urbains',
    description: 'Circuler en ville avec intersections, stationnements et usagers vulnérables.',
    done: true,
  },
  {
    id: 'road',
    title: 'Route et départementale',
    description: 'Maintenir trajectoire, allure et distances sur routes variées.',
    done: true,
  },
  {
    id: 'night',
    title: 'Conduite de nuit',
    description: 'Travailler visibilité, anticipation et fatigue sur trajet court.',
    done: false,
  },
  {
    id: 'weather',
    title: 'Météo difficile',
    description: 'Adapter l’allure sous pluie, vent ou faible visibilité.',
    done: false,
  },
  {
    id: 'long-trip',
    title: 'Trajet long préparé',
    description: 'Planifier un trajet de plus de 45 minutes avec pauses et itinéraire.',
    done: false,
  },
]

function getDrivingMode(situation) {
  if (situation.age < 18 && situation.age >= 15 && situation.initialTrainingDone && situation.insuranceAgreement) {
    return {
      key: 'aac',
      title: 'Conduite accompagnée',
      short: 'AAC',
      eligibility: 'Accessible dès 15 ans après formation initiale et accord assurance.',
      description:
        'Thomas est éligible à la conduite accompagnée : le suivi se concentre sur les kilomètres, les rendez-vous pédagogiques et la progression avec accompagnateur.',
    }
  }

  if (situation.age >= 18 && situation.initialTrainingDone && situation.wantsExperienceBeforeExam) {
    return {
      key: 'supervised',
      title: 'Conduite supervisée',
      short: 'Supervisée',
      eligibility: 'Accessible à partir de 18 ans après formation initiale.',
      description:
        'Thomas relève de la conduite supervisée : l’objectif est de gagner de l’expérience avant l’examen pratique.',
    }
  }

  return {
    key: 'pending',
    title: 'Parcours à compléter',
    short: 'À vérifier',
    eligibility: 'Formation initiale, âge ou assurance à vérifier.',
    description:
      'Certaines conditions réglementaires ne sont pas encore validées pour afficher un parcours AAC ou supervisé.',
  }
}

function ProgressBar({ value }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export default function StudentAccompaniedDrivingPage() {
  const [activeRvpId, setActiveRvpId] = useState(rvpData[0].id)
  const [familyObjectives, setFamilyObjectives] = useState(initialFamilyObjectives)
  const mode = getDrivingMode(studentSituation)
  const activeRvp = rvpData.find((rvp) => rvp.id === activeRvpId) || rvpData[0]
  const completedObjectives = familyObjectives.filter((objective) => objective.done).length
  const objectiveProgress = Math.round((completedObjectives / familyObjectives.length) * 100)
  const kilometerProgress = Math.min(
    100,
    Math.round((studentSituation.kilometers / studentSituation.targetKilometers) * 100),
  )

  const nextRvpReadiness = useMemo(
    () => Math.round((objectiveProgress + kilometerProgress + activeRvp.progress) / 3),
    [activeRvp.progress, kilometerProgress, objectiveProgress],
  )

  const toggleObjective = (objectiveId) => {
    setFamilyObjectives((current) =>
      current.map((objective) =>
        objective.id === objectiveId ? { ...objective, done: !objective.done } : objective,
      ),
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="grid gap-6 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white lg:grid-cols-[1fr_340px] md:p-8">
          <div>
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
              {mode.short}
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {mode.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50/85">
              {mode.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-black">{studentSituation.age} ans</p>
                <p className="text-sm text-cyan-50/75">Âge élève</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-black">{studentSituation.kilometers} km</p>
                <p className="text-sm text-cyan-50/75">Expérience suivie</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-black">{nextRvpReadiness}%</p>
                <p className="text-sm text-cyan-50/75">Préparation RVP</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-white/15 bg-white p-5 text-slate-900 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Critère code de la route
            </p>
            <p className="mt-2 text-lg font-extrabold text-slate-950">{mode.eligibility}</p>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm font-bold text-slate-500">
                <span>Objectif kilomètres</span>
                <span>{kilometerProgress}%</span>
              </div>
              <ProgressBar value={kilometerProgress} />
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-2xl font-extrabold text-slate-950">RVP / Suivi pédagogique</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cliquez sur un rendez-vous pour ouvrir l’historique et les objectifs.
            </p>
          </div>
          <div className="space-y-3">
            {rvpData.map((rvp) => {
              const active = rvp.id === activeRvp.id

              return (
                <button
                  aria-pressed={active}
                  className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-200 ${
                    active
                      ? 'border-cyan-300 bg-navy-950 text-white shadow-xl shadow-cyan-950/20'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50'
                  }`}
                  key={rvp.id}
                  onClick={() => setActiveRvpId(rvp.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold">{rvp.title}</h3>
                      <p className={active ? 'mt-1 text-sm text-cyan-50/70' : 'mt-1 text-sm text-slate-500'}>
                        {rvp.date}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        active ? 'bg-cyan-300 text-navy-950' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rvp.status}
                    </span>
                  </div>
                  <div className={`mt-4 h-2 overflow-hidden rounded-full ${active ? 'bg-white/15' : 'bg-slate-100'}`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300"
                      style={{ width: `${rvp.progress}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <article
          className="rounded-[1.75rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)] animate-slide-up"
          key={activeRvp.id}
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 ring-1 ring-cyan-100">
                Historique RVP
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-slate-950">{activeRvp.title}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{activeRvp.date}</p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-center">
              <p className="text-3xl font-black text-cyan-700">{activeRvp.progress}%</p>
              <p className="text-xs font-bold text-slate-500">Progression</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-extrabold text-slate-950">Remarques</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{activeRvp.remarks}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <h3 className="font-extrabold text-slate-950">Points à améliorer</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{activeRvp.improvements}</p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
              <h3 className="font-extrabold text-slate-950">Prochains objectifs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{activeRvp.nextObjectives}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">Objectifs famille</h2>
              <p className="mt-1 text-sm text-slate-500">
                Validez les objectifs réalisés pour suivre la préparation avant le prochain RVP.
              </p>
            </div>
            <span className="w-fit rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700">
              {completedObjectives}/{familyObjectives.length} validés
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {familyObjectives.map((objective) => (
              <button
                className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                  objective.done
                    ? 'border-cyan-200 bg-cyan-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-cyan-200'
                }`}
                key={objective.id}
                onClick={() => toggleObjective(objective.id)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black ${
                      objective.done ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {objective.done ? '✓' : '+'}
                  </span>
                  <span>
                    <span className="block font-extrabold text-slate-950">{objective.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      {objective.description}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-5 text-white shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-extrabold">Prévoir la suite</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-50/75">
            Espace prêt pour les futurs exercices QCM, statistiques et vidéos pédagogiques.
          </p>
          <div className="mt-5 space-y-4">
            {[
              ['Réussite QCM', '78%', 78],
              ['Progression vidéo', '54%', 54],
              ['Statistiques conduite', `${nextRvpReadiness}%`, nextRvpReadiness],
            ].map(([label, value, progress]) => (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur" key={label}>
                <div className="mb-2 flex justify-between text-sm font-bold">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-white"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
