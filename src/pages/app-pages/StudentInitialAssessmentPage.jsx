import { useEffect, useMemo, useState } from 'react'
import InitialAssessmentWizard from '../../components/initial-assessment/InitialAssessmentWizard'
import EmptyState from '../../components/ui/EmptyState'
import PageHero from '../../components/ui/PageHero'
import PageShell from '../../components/ui/PageShell'
import { useAuth } from '../../context/AuthContext'
import { useStudentTrack } from '../../hooks/useStudentTrack'
import { PROFILE_LABELS } from '../../data/initialAssessmentForm'
import {
  formatRecommendedHours,
  normalizeInitialAssessment,
  toDisplayText,
} from '../../lib/initialAssessmentUtils'
import {
  formatAssessmentStatus,
  getInitialAssessmentForStudent,
} from '../../services/initialAssessment'

function formatDateFr(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('fr-FR')
  } catch {
    return '—'
  }
}

export default function StudentInitialAssessmentPage() {
  const { profileId, organizationId, user } = useAuth()
  const { student, isPermisB, loading: trackLoading } = useStudentTrack(profileId)
  const [assessment, setAssessment] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student?.id) {
      setAssessment(null)
      setFetchError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getInitialAssessmentForStudent(student.id).then(({ assessment: row, error }) => {
      setAssessment(normalizeInitialAssessment(row))
      setFetchError(error ? toDisplayText(error.message, 'Erreur de chargement') : null)
      setLoading(false)
    })
  }, [student?.id])

  const statCards = useMemo(() => [
    { label: 'Statut', value: formatAssessmentStatus(assessment?.status || 'pending') },
    { label: 'Profil', value: assessment?.result_level ? (PROFILE_LABELS[assessment.result_level] || assessment.result_level) : '—' },
    { label: 'Date de réalisation', value: formatDateFr(assessment?.completed_at) },
    { label: 'Heures recommandées', value: formatRecommendedHours(assessment) },
    ...(assessment?.teacherName ? [{ label: 'Évaluateur', value: assessment.teacherName }] : []),
  ], [assessment])

  useEffect(() => {
    if (loading || trackLoading) return
    console.info('[StudentInitialAssessmentPage] render', {
      userId: user?.id ?? profileId,
      userEmail: user?.email ?? null,
      studentId: student?.id ?? null,
      assessment,
      fetchError,
      isPermisB,
      statCards,
    })
  }, [loading, trackLoading, user, profileId, student, assessment, fetchError, isPermisB, statCards])

  if (trackLoading || loading) {
    return (
      <PageShell>
        <p className="text-sm font-semibold text-slate-500">Chargement de l&apos;évaluation de départ…</p>
      </PageShell>
    )
  }

  if (!isPermisB) {
    return (
      <PageShell>
        <EmptyState
          icon="🏍️"
          message="L'évaluation de départ concerne uniquement les parcours Permis B."
          title="Rubrique non disponible"
        />
      </PageShell>
    )
  }

  const completed = assessment?.status === 'completed'
  const readOnly = true

  return (
    <PageShell>
      <PageHero
        eyebrow="Permis B"
        subtitle="Évaluation réalisée par votre enseignant lors de la première heure de conduite."
        title="Évaluation de départ"
      />

      {fetchError && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {fetchError}
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {statCards.map((item) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={item.label}>
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-1 text-xl font-black text-slate-950">{toDisplayText(item.value)}</p>
          </article>
        ))}
      </section>

      {!completed && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Votre évaluation de départ est {toDisplayText(formatAssessmentStatus(assessment?.status || 'pending')).toLowerCase()}.
          Elle sera complétée par votre enseignant pendant la première heure de conduite.
        </p>
      )}

      {assessment && student?.id && (
        <InitialAssessmentWizard
          assessment={assessment}
          completedBy={null}
          onSaved={(saved) => setAssessment(normalizeInitialAssessment(saved))}
          organizationId={organizationId}
          readOnly={readOnly}
          student={student}
          studentId={student.id}
        />
      )}
    </PageShell>
  )
}
