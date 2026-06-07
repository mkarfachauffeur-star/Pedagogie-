import { useEffect, useMemo, useState } from 'react'
import { useStudentTrackingStore } from '../../data/studentTrackingStore'
import { useAuth } from '../../context/AuthContext'
import InitialAssessmentWizard from '../../components/initial-assessment/InitialAssessmentWizard'
import { isPermisBStudent } from '../../lib/studentTrack'
import { normalizeInitialAssessment } from '../../lib/initialAssessmentUtils'
import { getInitialAssessmentForStudent } from '../../services/initialAssessment'
import { listStudents } from '../../services/students'
import RemcTeacherValidationPanel from '../../components/remc/RemcTeacherValidationPanel'
import PracticeExamTeacherPanel from '../../components/practice-exam/PracticeExamTeacherPanel'
import EmptyState from '../../components/ui/EmptyState'

function StudentPanelTab({ active, children, onClick }) {
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
        active
          ? 'bg-navy-950 text-white shadow-md'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-800'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

const lessonStatuses = ['Débuté', 'En cours', 'Terminé']
const lessonDurations = ['45 MIN', '1h', '2H']

function nowDateTime() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 5)
  return { date, time }
}

function mapApiStudentToTracking(student) {
  const referent = student.student_assignments?.find((assignment) => assignment.is_referent)?.teacher
  return {
    id: student.id,
    firstName: student.first_name,
    lastName: student.last_name,
    teacher: referent?.full_name || 'Non assigné',
    formationType: student.package_name || student.formation_type || 'Permis B traditionnel',
    licenseCategory: student.license_category,
    codeStatus: 'Non obtenu',
  }
}

export default function TeacherStudentsPage() {
  const formatDateFr = (dateString) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    if (!year || !month || !day) return dateString
    return `${day}/${month}/${year}`
  }

  const { students, updateRemcStatus, addLesson, updateLesson, upsertStudents } = useStudentTrackingStore()
  const { profileId, organizationId, role, loading: authLoading, profile, isAuthenticated } = useAuth()
  const [apiStudents, setApiStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [teacherName, setTeacherName] = useState('')
  const [lessonFormOpen, setLessonFormOpen] = useState(false)
  const [studentPanelTab, setStudentPanelTab] = useState('remc')
  const [initialAssessment, setInitialAssessment] = useState(null)
  const [newLesson, setNewLesson] = useState({
    date: '',
    time: '',
    duration: '2H',
    observations: '',
    status: 'Débuté',
  })

  useEffect(() => {
    if (authLoading) return undefined

    if (!isAuthenticated || !profileId) {
      setStudentsLoading(false)
      setStudentsError('Session enseignant introuvable. Reconnectez-vous.')
      return undefined
    }

    let cancelled = false

    async function loadStudents() {
      setStudentsLoading(true)
      setStudentsError(null)

      console.group('[TeacherStudentsPage] Chargement des élèves')
      console.info('teacherId', profileId)
      console.info('organizationId', organizationId ?? null)
      console.info('role', role ?? null)
      console.info('profileLoaded', Boolean(profile))

      try {
        const { students: rows, error, teacherProfile } = await listStudents({
          teacherId: profileId,
          organizationId,
          logContext: 'TeacherStudentsPage',
        })

        if (cancelled) return

        if (error) {
          const message = error.message || String(error)
          console.error('[TeacherStudentsPage] Erreur Supabase', {
            message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          })
          setStudentsError(message)
          setApiStudents([])
          return
        }

        console.info('[TeacherStudentsPage] Élèves trouvés', rows.length)
        console.info('[TeacherStudentsPage] Profil enseignant', teacherProfile ?? profile ?? null)
        setApiStudents(rows)
      } finally {
        if (!cancelled) {
          setStudentsLoading(false)
          console.groupEnd()
        }
      }
    }

    void loadStudents()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, profileId, organizationId])

  useEffect(() => {
    if (!apiStudents.length) return
    upsertStudents(apiStudents.map(mapApiStudentToTracking))
  }, [apiStudents, upsertStudents])

  const displayStudents = useMemo(() => {
    if (!apiStudents.length) return students
    return apiStudents.map((row) => {
      const tracked = students.find((student) => student.id === row.id)
      const mapped = mapApiStudentToTracking(row)
      if (tracked) {
        return {
          ...tracked,
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          teacher: mapped.teacher,
          formationType: mapped.formationType,
        }
      }
      return mapped
    })
  }, [apiStudents, students])

  useEffect(() => {
    if (!displayStudents.length) return
    if (!selectedStudentId || !displayStudents.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(displayStudents[0].id)
    }
  }, [displayStudents, selectedStudentId])

  const selectedStudent = useMemo(
    () => displayStudents.find((student) => student.id === selectedStudentId) || displayStudents[0],
    [selectedStudentId, displayStudents],
  )

  const selectedApiStudent = useMemo(
    () => apiStudents.find((student) => student.id === selectedStudent?.id) || null,
    [apiStudents, selectedStudent?.id],
  )

  const selectedIsPermisB = isPermisBStudent(selectedApiStudent || selectedStudent)

  useEffect(() => {
    if (!selectedStudent?.id || !selectedIsPermisB) {
      setInitialAssessment(null)
      return
    }
    getInitialAssessmentForStudent(selectedStudent.id).then(({ assessment }) => {
      setInitialAssessment(normalizeInitialAssessment(assessment))
    })
  }, [selectedStudent?.id, selectedIsPermisB])

  useEffect(() => {
    setStudentPanelTab('remc')
  }, [selectedStudentId])

  const openLesson = () => {
    const { date, time } = nowDateTime()
    setNewLesson({
      date,
      time,
      duration: '2H',
      observations: '',
      status: 'Débuté',
    })
    setLessonFormOpen(true)
  }

  const handleCreateLesson = (event) => {
    event.preventDefault()
    if (!selectedStudent) return
    const selectedSkills = (selectedStudent.remc || [])
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

  if (studentsLoading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
          <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            Mes élèves
          </p>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Suivi REMC et leçons terrain</h1>
        </section>
        <p className="text-sm font-semibold text-slate-500">Chargement des élèves…</p>
      </div>
    )
  }

  if (studentsError) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
          <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            Mes élèves
          </p>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Suivi REMC et leçons terrain</h1>
        </section>
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Impossible de charger les élèves : {studentsError}
        </p>
        <p className="text-xs text-slate-500">
          Ouvrez la console du navigateur (F12) pour voir teacherId, organizationId et le détail de l&apos;erreur Supabase.
        </p>
      </div>
    )
  }

  if (!selectedStudent) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
          <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            Mes élèves
          </p>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Suivi REMC et leçons terrain</h1>
        </section>
        <EmptyState title="Aucun élève enregistré" message="Aucun élève enregistré pour le moment." icon="🎓" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          Mes élèves
        </p>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Suivi REMC et leçons terrain</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-blue-50">
          Cliquez un élève, ouvrez une leçon, cochez les compétences et ajoutez vos observations en quelques secondes.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="card-panel">
          <h2 className="text-lg font-extrabold text-slate-900">Liste élèves</h2>
          <div className="mt-4 grid gap-3">
            {displayStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  setSelectedStudentId(student.id)
                  setLessonFormOpen(false)
                }}
                className={`card-list-item ${
                  selectedStudent.id === student.id
                    ? 'border-cyan-300 bg-cyan-50 ring-2 ring-cyan-100'
                    : 'border-slate-200 bg-slate-50 hover:border-cyan-200 hover:shadow-sm'
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
                {student.progress && (
                  <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                    style={{ width: `${student.progress.global}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-black text-cyan-700">Progression sous-compétences : {student.progress.global}%</p>
                  </>
                )}
              </button>
            ))}
          </div>
        </aside>

        <main className="grid gap-6">
          <section className="card-panel-lg">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Formation {selectedStudent.formationType}
                  {selectedStudent.progress ? ` · Sous-compétences ${selectedStudent.progress.global}%` : ''}
                </p>
                {selectedStudent.aacTracking && (
                  <p className="mt-1 text-xs font-bold text-cyan-700">
                    AAC {selectedStudent.aacTracking.kilometersCurrent}/{selectedStudent.aacTracking.kilometersTarget} km · Début {formatDateFr(selectedStudent.aacTracking.startDate)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {studentPanelTab === 'remc' && (
                  <>
                <button
                  type="button"
                  onClick={openLesson}
                  className="rounded-xl bg-navy-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-cyan-700"
                >
                  Ouvrir une leçon
                </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedIsPermisB ? (
                <>
                  <StudentPanelTab active={studentPanelTab === 'initial-assessment'} onClick={() => setStudentPanelTab('initial-assessment')}>
                    Évaluation de départ
                  </StudentPanelTab>
                  <StudentPanelTab active={studentPanelTab === 'remc'} onClick={() => setStudentPanelTab('remc')}>
                    Suivi REMC
                  </StudentPanelTab>
                  <StudentPanelTab active={studentPanelTab === 'examen-blanc'} onClick={() => setStudentPanelTab('examen-blanc')}>
                    Examen blanc
                  </StudentPanelTab>
                </>
              ) : (
                <StudentPanelTab active onClick={() => {}}>
                  Suivi Moto / AM
                </StudentPanelTab>
              )}
            </div>

            <div className="card-muted mt-4">
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
                  {displayStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} · {student.formationType}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {studentPanelTab === 'remc' && lessonFormOpen && (
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
                  Date d’ouverture
                  <input
                    className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    type="date"
                    required
                    value={newLesson.date}
                    onChange={(event) => setNewLesson((current) => ({ ...current, date: event.target.value }))}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Heure d’ouverture
                  <input
                    className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    type="time"
                    value={newLesson.time}
                    onChange={(event) => setNewLesson((current) => ({ ...current, time: event.target.value }))}
                  />
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Durée
                  <select
                    className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    value={newLesson.duration}
                    onChange={(event) => setNewLesson((current) => ({ ...current, duration: event.target.value }))}
                  >
                    {lessonDurations.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration}
                      </option>
                    ))}
                  </select>
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

          {selectedIsPermisB && studentPanelTab === 'remc' && (
            <>
          <RemcTeacherValidationPanel
            onRemcStatusChange={updateRemcStatus}
            organizationId={organizationId}
            remcCompetencies={selectedStudent.remc || []}
            studentId={selectedStudent.id}
            teacherId={profileId}
          />

          <section className="card-panel-lg">
            <h2 className="text-2xl font-extrabold text-slate-900">Historique des leçons</h2>
            <div className="mt-4 grid gap-3">
              {(selectedStudent.lessonHistory || []).map((lesson) => (
                <article key={lesson.id} className="card-muted">
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
            </>
          )}

          {studentPanelTab === 'initial-assessment' && selectedIsPermisB && (
            <InitialAssessmentWizard
              assessment={initialAssessment}
              completedBy={profileId}
              onSaved={(saved) => setInitialAssessment(normalizeInitialAssessment(saved))}
              organizationId={organizationId}
              readOnly={initialAssessment?.status === 'completed'}
              student={selectedApiStudent || selectedStudent}
              studentId={selectedStudent.id}
              teacherMode
            />
          )}

          {studentPanelTab === 'examen-blanc' && selectedIsPermisB && (
            <PracticeExamTeacherPanel
              organizationId={organizationId}
              student={selectedStudent}
              teacherId={profileId}
            />
          )}

          {!selectedIsPermisB && (
            <section className="card-panel-lg">
              <EmptyState
                icon="🏍️"
                message="Le suivi REMC, les examens blancs et l'évaluation de départ ne concernent pas les parcours Moto et AM."
                title="Parcours Moto / AM"
              />
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
