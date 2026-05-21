import { useMemo, useState } from 'react'
import { useStudentTrackingStore } from '../../data/studentTrackingStore'

const initialFamilyObjectives = [
  {
    id: 'city',
    title: 'Trajets urbains',
    description: 'Circuler en ville avec intersections et usagers vulnérables.',
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
    title: 'Trajet long',
    description: 'Planifier un trajet long avec pauses et itinéraire.',
    done: false,
  },
]

function ProgressBar({ value }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-cyan-500 transition-all duration-500 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function formatDateFr(dateString) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  if (!year || !month || !day) return dateString
  return `${day}/${month}/${year}`
}

function InsightList({ title, items, emptyLabel, accent = 'slate' }) {
  const accentMap = {
    amber: 'border-l-amber-400',
    emerald: 'border-l-emerald-400',
    cyan: 'border-l-cyan-400',
    slate: 'border-l-slate-300',
  }

  return (
    <article className={`pd-insight-card border-l-4 ${accentMap[accent]}`}>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-cyan-50/80">
        {items.length
          ? items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/70" />
                <span>{item}</span>
              </li>
            ))
          : (
              <li className="text-cyan-50/60">{emptyLabel}</li>
            )}
      </ul>
    </article>
  )
}

export default function StudentAccompaniedDrivingPage() {
  const { students } = useStudentTrackingStore()
  const [familyObjectives, setFamilyObjectives] = useState(initialFamilyObjectives)
  const student = useMemo(
    () => students.find((item) => item.formationType?.includes('AAC')) || students[0],
    [students],
  )
  const mode = student?.formationType?.includes('AAC') ? 'AAC' : 'Supervisée'

  const allSkills = useMemo(
    () => (student?.remc || []).flatMap((competency) => competency.items || []),
    [student],
  )
  const checkedByTeacher = allSkills
    .filter((item) => item.status === 'En cours' || item.status === 'Validé')
    .map((item) => item.label)
  const toImprove = allSkills
    .filter((item) => item.status === 'Non commencé')
    .map((item) => item.label)
  const completedObjectives = familyObjectives.filter((item) => item.done).length

  const currentKilometers = student?.aacTracking?.kilometersCurrent || 0
  const targetKilometers = student?.aacTracking?.kilometersTarget || 3000
  const kilometerProgress = Math.min(
    100,
    Math.round((currentKilometers / targetKilometers) * 100),
  )

  if (!student) {
    return <div className="pd-card">Aucun élève disponible.</div>
  }

  return (
    <div className="pd-page">
      <section className="overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.04] shadow-[var(--shadow-card)] backdrop-blur-md animate-slide-up">
        <div className="grid gap-6 bg-gradient-to-br from-[#10304f] via-[#133a5d] to-[#1a4870] p-6 text-white md:p-8 lg:grid-cols-[1fr_340px]">
          <div>
            <span className="pd-eyebrow">{mode}</span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Suivi conduite accompagnée</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50/85">
              RVP 1, progression REMC et objectifs famille pour préparer sereinement les prochains rendez-vous.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-bold">
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-sm text-cyan-50/75">Élève concerné</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-bold">
                  {currentKilometers} km / {targetKilometers} km
                </p>
                <p className="text-sm text-cyan-50/75">Objectif kilométrique AAC</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-bold">{formatDateFr(student.aacTracking?.startDate)}</p>
                <p className="text-sm text-cyan-50/75">Début conduite accompagnée</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-white/15 bg-white/[0.08] p-5 text-white shadow-2xl backdrop-blur-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-50/65">
              Conditions AAC obligatoires
            </p>
            <p className="mt-2 text-lg font-bold">Minimum 3000 km + 1 an jour pour jour</p>
            <p className="mt-2 text-sm font-medium text-cyan-50/75">
              Date minimale de fin AAC : {formatDateFr(student.aacTracking?.minimumEndDate)}
            </p>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm font-semibold text-cyan-50/80">
                <span>Objectif kilomètres</span>
                <span className="text-cyan-200">{kilometerProgress}%</span>
              </div>
              <ProgressBar value={kilometerProgress} />
            </div>
          </aside>
        </div>
      </section>

      <section className="pd-card animate-slide-up-delayed">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <span className="pd-eyebrow">RVP 1</span>
            <h2 className="pd-title-section mt-4">Bilan pédagogique initial</h2>
            <p className="mt-2 text-sm text-cyan-50/65">Dernière mise à jour : 20/05/2026</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 px-5 py-4 text-center shadow-sm backdrop-blur-sm">
            <p className="text-3xl font-semibold tracking-tight text-cyan-200">{student.progress.global}%</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-cyan-50/70">
              Progression REMC
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <InsightList title="Ce qui est à améliorer" items={toImprove.slice(0, 6)} emptyLabel="Aucun point identifié." accent="amber" />
          <InsightList
            title="Ce qui a été coché par l’enseignant"
            items={checkedByTeacher.slice(0, 6)}
            emptyLabel="Aucun point coché pour le moment."
            accent="emerald"
          />
          <InsightList
            title="À retravailler pour les prochains RVP"
            items={toImprove.slice(0, 4)}
            emptyLabel="Rien à retravailler pour l’instant."
            accent="cyan"
          />
        </div>
      </section>

      <section className="pd-card relative animate-slide-up-delayed overflow-hidden p-0">
        <div className="pd-card-dark-bg" aria-hidden />
        <div className="relative z-10 p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Objectifs famille</h2>
              <p className="mt-2 text-sm leading-7 text-cyan-50/85">
                Coche les objectifs déjà réalisés pendant la conduite accompagnée.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-200/30 bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-cyan-100 backdrop-blur-sm">
              {completedObjectives}/{familyObjectives.length} objectifs cochés
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {familyObjectives.map((objective) => (
              <button
                key={objective.id}
                type="button"
                onClick={() =>
                  setFamilyObjectives((previous) =>
                    previous.map((item) =>
                      item.id === objective.id ? { ...item, done: !item.done } : item,
                    ),
                  )
                }
                className={`group flex w-full items-start gap-3 rounded-2xl border p-4 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 ${
                  objective.done
                    ? 'border-cyan-200/40 bg-white/[0.12] shadow-[0_8px_24px_rgba(6,182,212,0.14)]'
                    : 'border-white/15 bg-white/[0.06] shadow-[0_8px_24px_rgba(2,6,23,0.16)] hover:border-cyan-200/30 hover:bg-white/[0.1]'
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                    objective.done
                      ? 'bg-cyan-300 text-[#06203f]'
                      : 'border border-cyan-200/50 bg-cyan-500/10 text-cyan-100 group-hover:border-cyan-200/70 group-hover:bg-cyan-400/20'
                  }`}
                >
                  {objective.done ? '✓' : '+'}
                </span>
                <div>
                  <p className="font-semibold text-white">{objective.title}</p>
                  <p className="mt-1 text-sm leading-6 text-cyan-50/80">{objective.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
