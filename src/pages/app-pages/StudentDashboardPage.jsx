import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import PageShell from '../../components/ui/PageShell'
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
      type: 'Rendez-vous pédagogique RVP 1',
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

const quickLinks = [
  { href: '/student/lessons', label: 'Mes leçons', desc: 'Modules REMC et QCU' },
  { href: '/student/exams', label: 'Examens', desc: 'Banque vérifications' },
  { href: '/student/lexicon', label: 'Lexique', desc: 'Définitions clés' },
  { href: '/student/accompanied-driving', label: 'Suivi accompagné', desc: 'Km et RVP' },
]

export default function StudentDashboardPage() {
  const { students } = useStudentTrackingStore()
  const student = students[0]

  const lessons = useMemo(() => (student ? buildUpcomingLessons(student) : []), [student])

  if (!student) {
    return (
      <PageShell>
        <div className="pd-section-card pd-section-card-body">Aucun élève disponible.</div>
      </PageShell>
    )
  }

  const remcValidated = student.progress.global === 100
  const isAac = student.formationType?.includes('AAC')

  return (
    <PageShell>
      <section className="pd-section-card">
        <div className="grid gap-6 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:grid-cols-[1fr_280px] md:p-8">
          <div>
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
              Espace élève
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bonjour {student.firstName}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-cyan-50/85">
              {student.formationType} · Moniteur {student.teacher}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {quickLinks.slice(0, 2).map((link) => (
                <Link
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-300/40 hover:bg-white/15"
                  key={link.href}
                  to={link.href}
                >
                  {link.label}
                  <span className="mt-0.5 block text-xs font-medium text-cyan-100/80">{link.desc}</span>
                </Link>
              ))}
            </div>
          </div>
          <aside className="rounded-[1.5rem] border border-white/15 bg-white p-5 text-slate-900 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Progression REMC</p>
            <p className="mt-1 text-5xl font-black text-cyan-600">{student.progress.global}%</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                style={{ width: `${student.progress.global}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {remcValidated
                ? 'Parcours REMC complet — examen praticable.'
                : 'Continuez les modules pour débloquer l’examen.'}
            </p>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            className="group card-tile"
            key={link.href}
            to={link.href}
          >
            <p className="text-base font-black text-slate-950 group-hover:text-cyan-800">{link.label}</p>
            <p className="mt-1 text-sm text-slate-500">{link.desc}</p>
          </Link>
        ))}
      </section>

      <section className="pd-card">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Planning</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Prochaines séances</h2>
          </div>
          <p className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700">
            {lessons.length} rendez-vous
          </p>
        </div>

        {!remcValidated && (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Examen pratique : toutes les compétences REMC doivent être validées par votre enseignant.
          </p>
        )}

        {isAac && (
          <p className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-900">
            Parcours AAC : consultez votre suivi km et vos rendez-vous pédagogiques.
          </p>
        )}

        <div className="mt-5 grid gap-3">
          {lessons.map((lesson) => (
            <article
              className="card-muted flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              key={`${lesson.time}-${lesson.dateLabel}-${lesson.type}`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                  <p className="text-sm font-black text-slate-900">{lesson.time}</p>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">{lesson.dateLabel}</h3>
                  <p className="text-sm text-slate-600">
                    {lesson.type} · {lesson.duration}
                  </p>
                </div>
              </div>
              <span className="w-fit rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                {lesson.status}
              </span>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
