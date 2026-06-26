import { useCallback, useEffect, useState } from 'react'
import AddStudentModal from '../../components/AddStudentModal'
import EmptyState from '../../components/ui/EmptyState'
import ListSearchField from '../../components/ui/ListSearchField'
import PaginationBar from '../../components/ui/PaginationBar'
import { useAuth } from '../../context/AuthContext'
import { matchStudentSearch, useClientPagination } from '../../hooks/useClientPagination'
import { resolveStudentTrack, getTrackLabel } from '../../lib/studentTrack'
import { getAssessmentStatusStyles } from '../../data/initialAssessmentForm'
import { formatPersonName } from '../../lib/staffAccounts'
import { formatAssessmentStatus, listInitialAssessmentsForStudents } from '../../services/initialAssessment'
import { listStudents, resendStudentAccessEmail, subscribeStudents } from '../../services/students'
import { getUserFacingError } from '../../lib/userFacingError'
import StudentCharterStatusBadge from '../../components/students/StudentCharterStatusBadge'

function formatDateFr(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('fr-FR')
  } catch {
    return value
  }
}

function referentTeacher(student) {
  const assignments = student.student_assignments || []
  const referent = assignments.find((row) => row.is_referent) || assignments[0]
  return referent?.teacher?.full_name || null
}

export default function AdminStudentsPage() {
  const { profileId, canWrite } = useAuth()
  const [students, setStudents] = useState([])
  const [assessmentsByStudent, setAssessmentsByStudent] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionBusy, setActionBusy] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    pageItems,
    pageSize,
  } = useClientPagination(students, {
    pageSize: 8,
    query: searchQuery,
    filterFn: matchStudentSearch,
  })

  const refresh = useCallback(async () => {
    if (!profileId) {
      setStudents([])
      setAssessmentsByStudent({})
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    const { students: rows, error } = await listStudents()
    if (error) setLoadError('Impossible de charger la liste des élèves.')
    setStudents(rows)
    const studentIds = rows.map((row) => row.id)
    const { assessments } = await listInitialAssessmentsForStudents(studentIds)
    const map = Object.fromEntries((assessments || []).map((row) => [row.student_id, row]))
    setAssessmentsByStudent(map)
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!profileId) return undefined
    return subscribeStudents(refresh)
  }, [profileId, refresh])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('new') === '1') setModalOpen(true)
  }, [])

  const runResendAccess = async (student) => {
    if (!canWrite || !student.profile_id || !student.email) return
    const name = formatPersonName(student)
    if (!window.confirm(`Renvoyer un e-mail d'accès avec mot de passe provisoire à ${name} ?`)) return

    setActionBusy(student.id)
    setFeedback(null)
    const { error, message, emailSent } = await resendStudentAccessEmail(student.id)
    setActionBusy(null)

    if (error) {
      setFeedback({ type: 'error', text: getUserFacingError(error, 'invite') })
      return
    }

    setFeedback({
      type: emailSent ? 'ok' : 'warn',
      text: message || 'Accès renvoyé.',
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border-2 border-slate-300 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          Gérant
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Élèves inscrits</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
              Créez les comptes élèves, consultez les dossiers et suivez les inscriptions de votre auto-école.
            </p>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="pd-btn-primary shrink-0">
            Ajouter un élève
          </button>
        </div>
      </section>

      {feedback && (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
          feedback.type === 'ok'
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
            : feedback.type === 'warn'
              ? 'border border-amber-200 bg-amber-50 text-amber-800'
              : 'border border-rose-200 bg-rose-50 text-rose-700'
        }`}>
          {feedback.text}
        </p>
      )}

      <section className="rounded-[1.5rem] border-2 border-slate-300 bg-white p-5 shadow-[var(--shadow-soft)]">
        {!profileId ? (
          <EmptyState title="Connexion requise" message="Connectez-vous avec votre compte gérant." icon="🎓" />
        ) : loading ? (
          <p className="text-sm font-medium text-slate-500">Chargement des élèves…</p>
        ) : loadError ? (
          <EmptyState title="Erreur de chargement" message={loadError} icon="⚠️" />
        ) : students.length === 0 ? (
          <EmptyState title="Aucun élève enregistré" message="Ajoutez votre premier élève pour créer son compte et son dossier." icon="🎓" />
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <ListSearchField onChange={setSearchQuery} value={searchQuery} />
              <p className="text-xs font-semibold text-slate-500">{totalItems} élève(s)</p>
            </div>
            {pageItems.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon="🔍"
                message="Aucun élève ne correspond à votre recherche."
                title="Aucun résultat"
              />
            ) : (
          <div className="mt-4 grid gap-3">
            {pageItems.map((student) => {
              const track = resolveStudentTrack(student)
              const assessment = assessmentsByStudent[student.id]
              const formationLabel = student.package_name || student.formation_type || getTrackLabel(track)
              const assessmentStatus = assessment?.status || 'pending'
              const assessmentStyles = getAssessmentStatusStyles(assessmentStatus)
              return (
              <article key={student.id} className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {formatPersonName(student)}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-cyan-700">{student.file_number || 'Dossier en cours'}</p>
                    <p className="mt-2 text-sm text-slate-600">{student.email || '—'}</p>
                    {student.phone && <p className="text-sm text-slate-500">{student.phone}</p>}
                    {referentTeacher(student) && (
                      <p className="mt-1 text-xs font-medium text-slate-500">Référent : {referentTeacher(student)}</p>
                    )}
                    <p className="mt-3 text-sm"><span className="font-bold text-slate-500">Formation :</span> {formationLabel}</p>
                    {track === 'permis_b' && (
                      <details className={`mt-3 rounded-xl border px-3 py-2 ${assessmentStyles.container}`}>
                        <summary className={`cursor-pointer text-sm font-bold ${assessmentStyles.summary}`}>
                          Évaluation de départ · {formatAssessmentStatus(assessmentStatus)}
                        </summary>
                        <div className="mt-3 grid gap-2 pb-2 text-sm sm:grid-cols-2">
                          <p><span className="font-bold text-slate-500">Date :</span> {assessment?.completed_at ? formatDateFr(assessment.completed_at) : '—'}</p>
                          <p><span className="font-bold text-slate-500">Score obtenu :</span> {assessment?.status === 'completed' ? assessment.final_score : '—'}</p>
                          <p><span className="font-bold text-slate-500">Heures recommandées :</span> {assessment?.recommended_hours_min ? `${assessment.recommended_hours_min}${assessment.recommended_hours_max !== assessment.recommended_hours_min ? ` à ${assessment.recommended_hours_max}` : ''} h` : '—'}</p>
                          <p className="sm:col-span-2"><span className="font-bold text-slate-500">Enseignant évaluateur :</span> {assessment?.teacher?.full_name || '—'}</p>
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                        {getTrackLabel(track)}
                      </span>
                      <StudentCharterStatusBadge studentId={student.id} />
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {student.status || 'En attente'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                        Inscrit le {formatDateFr(student.registration_date)}
                      </span>
                    </div>
                    {canWrite && student.profile_id && student.email && (
                      <button
                        type="button"
                        className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-bold text-cyan-800 transition hover:bg-cyan-50 disabled:opacity-50"
                        disabled={actionBusy === student.id}
                        onClick={() => runResendAccess(student)}
                      >
                        {actionBusy === student.id ? 'Envoi…' : 'Renvoyer l\'accès par e-mail'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
              )
            })}
          </div>
            )}
            <PaginationBar
              className="mt-4"
              onPageChange={setPage}
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
            />
          </>
        )}
      </section>

      <AddStudentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => refresh()}
      />
    </div>
  )
}
