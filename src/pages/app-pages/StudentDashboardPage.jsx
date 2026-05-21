import { useMemo } from 'react'
import { useStudentTrackingStore } from '../../data/studentTrackingStore'

function buildUpcomingLessons(student) {
  const lessons = [
    {
      time: '10:00',
      dateLabel: 'Mardi 20/05/2026',
      type: 'Leçon de conduite',
      duration: '2h',
      status: 'À venir',
    },
    {
      time: '14:00',
      dateLabel: 'Jeudi 22/05/2026',
      type: 'Leçon de conduite',
      duration: '2h',
      status: 'Planifiée',
    },
  ]

  const isAac = student.formationType?.includes('AAC')
  const remcValidated = student.progress.global === 100

  if (isAac) {
    lessons.push({
      time: '09:00',
      dateLabel: 'Samedi 24/05/2026',
      type: 'Rendez-vous préalable RVP1',
      duration: '2h',
      status: 'Planifié',
    })
  }

  if (remcValidated) {
    lessons.push({
      time: '16:00',
      dateLabel: 'Lundi 26/05/2026',
      type: 'Préparation examen',
      duration: '2h',
      status: 'Autorisée',
    })
  }

  return lessons
}

export default function StudentDashboardPage() {
  const { students } = useStudentTrackingStore()
  const student = students[0]

  const lessons = useMemo(() => (student ? buildUpcomingLessons(student) : []), [student])

  if (!student) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6">Aucun élève disponible.</div>
  }

  const isAac = student.formationType?.includes('AAC')
  const remcValidated = student.progress.global === 100

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          Espace élève
        </p>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
          Bonjour {student.firstName} {student.lastName}
        </h1>
        <p className="mt-3 text-sm leading-7 text-cyan-50/85">
          Formation : {student.formationType} · Progression REMC : {student.progress.global}%
        </p>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-2xl font-extrabold text-slate-900">Prochaines leçons</h2>
        <p className="mt-1 text-sm text-slate-500">
          Affichage simple : heure, jour, date/année et durée.
        </p>
        {!isAac && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
            RVP non affiché : réservé à la conduite accompagnée (AAC).
          </p>
        )}
        {!remcValidated && (
          <p className="mt-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
            Préparation examen non disponible : toutes les compétences doivent être validées par l’enseignant.
          </p>
        )}

        <div className="mt-5 grid gap-3">
          {lessons.map((lesson) => (
            <article
              key={`${lesson.time}-${lesson.dateLabel}-${lesson.type}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white px-3 py-2 text-center">
                  <p className="text-sm font-black text-slate-900">{lesson.time}</p>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">{lesson.dateLabel}</h3>
                  <p className="text-sm text-slate-600">
                    {lesson.type} · Durée {lesson.duration}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                {lesson.status}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
