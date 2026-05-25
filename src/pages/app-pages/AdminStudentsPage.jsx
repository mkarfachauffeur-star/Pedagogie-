import { useStudentTrackingStore } from '../../data/studentTrackingStore'

export default function AdminStudentsPage() {
  const { students } = useStudentTrackingStore()
  const formatDateFr = (dateString) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    if (!year || !month || !day) return dateString
    return `${day}/${month}/${year}`
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          Gérant
        </p>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Élèves et suivi formation</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
          Vision unifiée des élèves, type de formation et avancement REMC.
        </p>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="grid gap-3">
          {students.map((student) => (
            <article key={student.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {student.firstName} {student.lastName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{student.id}</p>
                  {student.aacTracking && (
                    <p className="mt-1 text-xs font-bold text-cyan-700">
                      AAC début {formatDateFr(student.aacTracking.startDate)} · minimum {formatDateFr(student.aacTracking.minimumEndDate)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                    {student.formationType}
                  </span>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                    REMC {student.progress.global}%
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    {student.lessonHistory?.length || 0} leçons
                  </span>
                  {student.aacTracking && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                      {student.aacTracking.kilometersCurrent}/{student.aacTracking.kilometersTarget} km
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
