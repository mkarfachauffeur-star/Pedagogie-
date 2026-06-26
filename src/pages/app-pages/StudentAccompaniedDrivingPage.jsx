import { useEffect, useMemo, useState } from 'react'
import { getStudentAacTracking } from '../../data/aacTracking'
import { useAuth } from '../../context/AuthContext'
import { useStudentAccount } from '../../hooks/useStudentAccount'
import { useStudentRemcProgress } from '../../hooks/useStudentRemcProgress'
import EmptyState from '../../components/ui/EmptyState'
import { formatPersonName } from '../../lib/staffAccounts'

const FAMILY_OBJECTIVES_KEY = 'pedagogia:aac-family-objectives'

const defaultFamilyObjectives = [
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
  {
    id: 'parking',
    title: 'Manœuvres variées',
    description: 'Créneaux, demi-tour et stationnements en conditions réelles.',
    done: false,
  },
]

function formatDateFr(dateString) {
  if (!dateString) return '—'
  const [year, month, day] = dateString.split('-')
  if (!year || !month || !day) return dateString
  return `${day}/${month}/${year}`
}

function monthsBetween(startDate, endDate = new Date()) {
  if (!startDate) return 0
  const start = new Date(startDate)
  const end = endDate instanceof Date ? endDate : new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()),
  )
}

function isAccompaniedFormation(formationType = '') {
  return formationType.includes('AAC') || formationType.toLowerCase().includes('supervis')
}

function loadFamilyObjectives(studentId) {
  if (typeof window === 'undefined' || !studentId) return defaultFamilyObjectives
  try {
    const raw = window.localStorage.getItem(`${FAMILY_OBJECTIVES_KEY}:${studentId}`)
    if (!raw) return defaultFamilyObjectives
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : defaultFamilyObjectives
  } catch {
    return defaultFamilyObjectives
  }
}

function rvpStatusClasses(status) {
  if (status === 'Validé') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }
  if (status === 'À planifier') {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }
  return 'border-slate-300 bg-slate-50 text-slate-600'
}

export default function StudentAccompaniedDrivingPage() {
  const { student: studentRecord, loading: accountLoading } = useStudentAccount()
  const { organizationId } = useAuth()
  const { remc, loading: remcLoading } = useStudentRemcProgress(studentRecord?.id, { organizationId })

  const student = useMemo(() => {
    if (!studentRecord) return null
    return {
      id: studentRecord.id,
      firstName: studentRecord.first_name,
      lastName: studentRecord.last_name,
      formationType: studentRecord.package_name || studentRecord.formation_type || 'Permis B traditionnel',
    }
  }, [studentRecord])
  const isAac = student?.formationType?.includes('AAC')
  const modeLabel = isAac ? 'Conduite accompagnée (AAC)' : 'Conduite supervisée'

  const [familyObjectives, setFamilyObjectives] = useState(() =>
    loadFamilyObjectives(student?.id),
  )
  const [activeRvpId, setActiveRvpId] = useState(null)

  useEffect(() => {
    if (!student?.id) return
    setFamilyObjectives(loadFamilyObjectives(student.id))
  }, [student?.id])

  useEffect(() => {
    if (!student?.id) return
    window.localStorage.setItem(
      `${FAMILY_OBJECTIVES_KEY}:${student.id}`,
      JSON.stringify(familyObjectives),
    )
  }, [familyObjectives, student?.id])

  const tracking = getStudentAacTracking(student)
  const appointments = tracking?.pedagogicalAppointments || []
  const activeRvp =
    appointments.find((item) => item.id === activeRvpId) || appointments[0] || null

  useEffect(() => {
    if (appointments.length && !activeRvpId) {
      setActiveRvpId(appointments[0].id)
    }
  }, [appointments, activeRvpId])

  const currentKilometers = tracking?.kilometersCurrent || 0
  const targetKilometers = tracking?.kilometersTarget || (isAac ? 3000 : 2000)
  const kilometerProgress = Math.min(100, Math.round((currentKilometers / targetKilometers) * 100))
  const monthsFollowed = monthsBetween(tracking?.startDate)
  const completedAppointments = appointments.filter((item) => item.status === 'Validé').length
  const completedObjectives = familyObjectives.filter((item) => item.done).length

  const allSkills = useMemo(
    () => (remc || []).flatMap((competency) => competency.items || []),
    [remc],
  )
  const checkedByTeacher = allSkills
    .filter((item) => item.status === 'En cours' || item.status === 'Validé')
    .map((item) => item.label)
  const toImprove = allSkills
    .filter((item) => item.status === 'Non commencé')
    .map((item) => item.label)

  if (accountLoading || remcLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-sm font-semibold text-slate-500">Chargement du suivi AAC…</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <EmptyState
          title="Aucune donnée disponible"
          message="Aucune donnée disponible pour le moment. Le suivi s’activera dès l’ajout de votre dossier de conduite accompagnée."
          icon="🚗"
        />
      </div>
    )
  }

  if (!isAccompaniedFormation(student.formationType)) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border-2 border-slate-300 bg-white shadow-[var(--shadow-card)]">
          <div className="grid gap-6 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:grid-cols-[1fr_320px] md:p-8">
            <div>
              <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
                Suivi accompagné
              </span>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Suivi conduite accompagnée
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50/85">
                Cet espace est réservé aux élèves en conduite accompagnée (AAC) ou en conduite
                supervisée. Contactez le secrétariat si vous souhaitez basculer sur cette formule.
              </p>
            </div>
            <aside className="rounded-[1.5rem] border border-white/15 bg-white p-5 text-slate-900 shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Votre formule
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">{student.formationType}</p>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Une fois inscrit en AAC ou conduite supervisée, vous retrouverez ici vos kilomètres,
                RVP et objectifs famille.
              </p>
            </aside>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border-2 border-slate-300 bg-white shadow-[var(--shadow-card)]">
        <div className="grid gap-6 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:grid-cols-[1fr_320px] md:p-8">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
                {modeLabel}
              </span>
              <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                Suivi conduite accompagnée
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50/85">
                Kilomètres, rendez-vous pédagogiques, bilan REMC et objectifs famille : tout votre
                parcours hors auto-école, au même endroit que vos leçons et examens.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold text-cyan-100">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                  {formatPersonName(student)}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                  Moniteur : {student.teacher}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                  Début : {formatDateFr(tracking?.startDate)}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-extrabold">{currentKilometers}</p>
                <p className="text-sm text-cyan-50/75">Kilomètres réalisés</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-extrabold">
                  {completedAppointments}/{appointments.length || 3}
                </p>
                <p className="text-sm text-cyan-50/75">RVP validés</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-extrabold">{monthsFollowed}</p>
                <p className="text-sm text-cyan-50/75">
                  {isAac ? 'Mois de parcours AAC' : 'Mois de parcours'}
                </p>
              </div>
            </div>

            {isAac && (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 backdrop-blur">
                <p className="text-sm font-bold leading-6 text-cyan-50/90">
                  Minimum réglementaire : 3 000 km et 1 an jour pour jour — fin possible à partir du{' '}
                  {formatDateFr(tracking?.minimumEndDate)}.
                </p>
              </div>
            )}
          </div>

          <aside className="rounded-[1.5rem] border border-white/15 bg-white p-5 text-slate-900 shadow-2xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Objectif kilométrique
                </p>
                <p className="mt-1 text-5xl font-black text-cyan-600">{kilometerProgress}%</p>
              </div>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-bold text-cyan-700">
                {currentKilometers} / {targetKilometers} km
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500 ease-out"
                style={{ width: `${kilometerProgress}%` }}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              {completedObjectives}/{familyObjectives.length} objectifs famille cochés · progression
              REMC {student.progress?.global || 0} %
            </p>
          </aside>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <div className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-cyan-700">
                  Rendez-vous pédagogiques
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Vos RVP avec l’auto-école</h2>
              </div>
              <p className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700">
                {appointments.length || 3} étapes
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {appointments.map((appointment) => {
                const isActive = activeRvp?.id === appointment.id
                return (
                  <button
                    className={`min-h-36 rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                      isActive
                        ? 'border-cyan-300/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 text-white shadow-2xl shadow-cyan-950/20'
                        : 'border-slate-300 bg-slate-50 hover:border-cyan-200 hover:bg-cyan-50/60'
                    }`}
                    key={appointment.id}
                    onClick={() => setActiveRvpId(appointment.id)}
                    type="button"
                  >
                    <p className={`text-lg font-black ${isActive ? 'text-white' : 'text-slate-950'}`}>
                      {appointment.label}
                    </p>
                    <p className={`mt-2 text-sm leading-6 ${isActive ? 'text-cyan-50/85' : 'text-slate-600'}`}>
                      {appointment.date
                        ? `${formatDateFr(appointment.date)} · ${appointment.duration}`
                        : `Durée ${appointment.duration} · date à confirmer`}
                    </p>
                    <span
                      className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${isActive ? 'bg-white/15 text-cyan-50' : rvpStatusClasses(appointment.status)}`}
                    >
                      {appointment.status}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-cyan-700">
                  Objectifs famille
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Trajets avec accompagnateur</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Coche les situations déjà travaillées en dehors de l’auto-école.
                </p>
              </div>
              <p className="rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700">
                {completedObjectives}/{familyObjectives.length} validés
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {familyObjectives.map((objective) => (
                <button
                  className={`flex min-h-32 items-start gap-3 rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                    objective.done
                      ? 'border-cyan-200 bg-cyan-50/80'
                      : 'border-slate-300 bg-slate-50 hover:border-cyan-200 hover:bg-cyan-50/40'
                  }`}
                  key={objective.id}
                  onClick={() =>
                    setFamilyObjectives((previous) =>
                      previous.map((item) =>
                        item.id === objective.id ? { ...item, done: !item.done } : item,
                      ),
                    )
                  }
                  type="button"
                >
                  <span
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                      objective.done
                        ? 'bg-cyan-600 text-white'
                        : 'border-2 border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {objective.done ? '✓' : ''}
                  </span>
                  <div>
                    <p className="text-lg font-black text-slate-950">{objective.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{objective.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-[2rem] border-2 border-slate-300 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-700">RVP sélectionné</p>
          {activeRvp ? (
            <>
              <h3 className="mt-2 text-2xl font-black text-slate-950">{activeRvp.label}</h3>
              <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm font-bold leading-6 text-cyan-900">
                {activeRvp.date
                  ? `Prévu le ${formatDateFr(activeRvp.date)} · ${activeRvp.duration}`
                  : `Durée ${activeRvp.duration} · date à confirmer avec le secrétariat`}
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Points d’étape obligatoires pour valider votre progression entre les trajets avec
                l’accompagnateur.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Aucun rendez-vous pédagogique planifié.</p>
          )}

          <div className="mt-8 border-t-2 border-slate-200 pt-6">
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Bilan REMC</p>
            <h3 className="mt-2 text-xl font-black text-slate-950">Synthèse pédagogique</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-amber-800">
                  À améliorer
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {(toImprove.slice(0, 3).length ? toImprove.slice(0, 3) : ['Aucun point identifié.']).map(
                    (item) => (
                      <li key={item}>{item}</li>
                    ),
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-emerald-800">
                  Validé par l’enseignant
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {(checkedByTeacher.slice(0, 3).length
                    ? checkedByTeacher.slice(0, 3)
                    : ['Aucun point coché pour le moment.']
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
