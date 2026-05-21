import { useMemo, useState } from 'react'
import { useStudentTrackingStore } from '../../data/studentTrackingStore'

const remcStatuses = ['Non commencé', 'En cours', 'Validé']
const lessonStatuses = ['Débuté', 'En cours', 'Terminé']

function nowDateTime() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 5)
  return { date, time }
}

export default function TeacherStudentsPage() {
  const formatDateFr = (dateString) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    if (!year || !month || !day) return dateString
    return `${day}/${month}/${year}`
  }

  const { students, updateRemcStatus, addLesson, updateLesson } = useStudentTrackingStore()
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id)
  const [teacherName, setTeacherName] = useState('Mohamed Karfa')
  const [lessonFormOpen, setLessonFormOpen] = useState(false)
  const [skillsPanelOpen, setSkillsPanelOpen] = useState(false)
  const [newLesson, setNewLesson] = useState({
    date: '',
    time: '',
    duration: '2h',
    observations: '',
    status: 'Débuté',
  })

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || students[0],
    [selectedStudentId, students],
  )

  const openLesson = () => {
    const { date, time } = nowDateTime()
    setNewLesson({
      date,
      time,
      duration: '2h',
      observations: '',
      status: 'Débuté',
    })
    setLessonFormOpen(true)
  }

  const handleCreateLesson = (event) => {
    event.preventDefault()
    if (!selectedStudent) return
    const selectedSkills = selectedStudent.remc
      .flatMap((competency) => competency.items)
      .filter((item) => item.status !== 'Non commencé')
      .map((item) => item.label)
    addLesson(selectedStudent.id, {
      ...newLesson,
      openedBy: teacherName || 'Enseignant',
      skills: selectedSkills,
    })
    setLessonFormOpen(false)
  }

  if (!selectedStudent) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6">Aucun élève disponible.</div>
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          Mes élèves
        </p>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Suivi REMC et leçons terrain</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-cyan-50/85">
          Cliquez un élève, ouvrez une leçon, cochez les compétences et ajoutez vos observations en quelques secondes.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-extrabold text-slate-900">Liste élèves</h2>
          <div className="mt-4 grid gap-3">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  setSelectedStudentId(student.id)
                  setLessonFormOpen(false)
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedStudent.id === student.id
                    ? 'border-cyan-300 bg-cyan-50 ring-2 ring-cyan-100'
                    : 'border-slate-200 bg-slate-50 hover:border-cyan-200'
                }`}
              >
                <p className="font-extrabold text-slate-900">
                  {student.firstName} {student.lastName}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{student.formationType}</p>
                {student.aacTracking && (
                  <p className="mt-1 text-[11px] font-bold text-cyan-700">
                    AAC début : {formatDateFr(student.aacTracking.startDate)} · Min fin : {formatDateFr(student.aacTracking.minimumEndDate)}
                  </p>
                )}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                    style={{ width: `${student.progress.global}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-black text-cyan-700">Progression REMC : {student.progress.global}%</p>
              </button>
            ))}
          </div>
        </aside>

        <main className="grid gap-6">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Progression globale REMC {selectedStudent.progress.global}% · Formation {selectedStudent.formationType}
                </p>
                {selectedStudent.aacTracking && (
                  <p className="mt-1 text-xs font-bold text-cyan-700">
                    AAC {selectedStudent.aacTracking.kilometersCurrent}/{selectedStudent.aacTracking.kilometersTarget} km · Début {formatDateFr(selectedStudent.aacTracking.startDate)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openLesson}
                  className="rounded-xl bg-navy-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-cyan-700"
                >
                  Ouvrir une leçon
                </button>
                <button
                  type="button"
                  onClick={() => setSkillsPanelOpen((current) => !current)}
                  className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-extrabold text-cyan-700"
                >
                  Ajouter compétences travaillées
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm font-bold text-slate-700">
                Sélectionner un élève
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                  value={selectedStudent.id}
                  onChange={(event) => {
                    setSelectedStudentId(event.target.value)
                    setLessonFormOpen(false)
                  }}
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} · {student.formationType}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {lessonFormOpen && (
              <form
                className="mt-4 grid gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 md:grid-cols-2"
                onSubmit={handleCreateLesson}
              >
                <label className="text-sm font-bold text-slate-700">
                  Enseignant
                  <input
                    className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm outline-none"
                    value={teacherName}
                    onChange={(event) => setTeacherName(event.target.value)}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Élève
                  <input
                    className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm outline-none"
                    value={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    disabled
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Date d’ouverture automatique
                  <input className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm" value={newLesson.date} disabled />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Heure d’ouverture automatique
                  <input className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm" value={newLesson.time} disabled />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Durée
                  <input
                    className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm outline-none"
                    value={newLesson.duration}
                    onChange={(event) => setNewLesson((current) => ({ ...current, duration: event.target.value }))}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  État
                  <select
                    className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm outline-none"
                    value={newLesson.status}
                    onChange={(event) => setNewLesson((current) => ({ ...current, status: event.target.value }))}
                  >
                    {lessonStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700 md:col-span-2">
                  Observations pour la prochaine leçon
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm outline-none"
                    value={newLesson.observations}
                    onChange={(event) => setNewLesson((current) => ({ ...current, observations: event.target.value }))}
                    placeholder="Ex : retravailler priorités à droite, manque d’anticipation, revoir installation poste."
                  />
                </label>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700"
                  >
                    Enregistrer et démarrer la leçon
                  </button>
                </div>
              </form>
            )}
          </section>

          {skillsPanelOpen && (
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
              <h2 className="text-2xl font-extrabold text-slate-900">Compétences et sous-compétences REMC</h2>
              <div className="mt-4 grid gap-4">
                {selectedStudent.remc.map((competency) => (
                  <article key={competency.code} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {competency.code} · {competency.title}
                      </h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">
                        {selectedStudent.progress.byCompetency[competency.code]}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                        style={{ width: `${selectedStudent.progress.byCompetency[competency.code]}%` }}
                      />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {competency.items.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-sm font-bold text-slate-700">{item.label}</p>
                          <select
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                            value={item.status}
                            onChange={(event) =>
                              updateRemcStatus(selectedStudent.id, competency.code, item.id, event.target.value)
                            }
                          >
                            {remcStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-2xl font-extrabold text-slate-900">Historique des leçons</h2>
            <div className="mt-4 grid gap-3">
              {(selectedStudent.lessonHistory || []).map((lesson) => (
                <article key={lesson.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-extrabold text-slate-900">
                      Leçon du {lesson.date || 'date non renseignée'} · {lesson.time || '--:--'}
                    </h3>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">{lesson.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Ouverture : <strong>{lesson.openedBy}</strong> · {new Date(lesson.openedAt).toLocaleString('fr-FR')}
                  </p>
                  <p className="text-sm text-slate-600">
                    Clôture : <strong>{lesson.closedBy || 'Non clôturée'}</strong>{' '}
                    {lesson.closedAt ? `· ${new Date(lesson.closedAt).toLocaleString('fr-FR')}` : ''}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">Durée : {lesson.duration}</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Observations pour la prochaine leçon : {lesson.observations || 'Aucune'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(lesson.skills || []).map((skill) => (
                      <span key={skill} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                      value={lesson.status}
                      onChange={(event) => updateLesson(selectedStudent.id, lesson.id, { status: event.target.value })}
                    >
                      {lessonStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {lesson.status !== 'Terminé' && (
                      <button
                        type="button"
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white"
                        onClick={() =>
                          updateLesson(selectedStudent.id, lesson.id, {
                            status: 'Terminé',
                            closedBy: teacherName || 'Enseignant',
                            closedAt: new Date().toISOString(),
                          })
                        }
                      >
                        Clôturer la leçon
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
