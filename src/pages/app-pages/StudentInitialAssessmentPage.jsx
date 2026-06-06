import { useEffect, useState } from 'react'
import InitialAssessmentWizard from '../../components/initial-assessment/InitialAssessmentWizard'
import EmptyState from '../../components/ui/EmptyState'
import PageHero from '../../components/ui/PageHero'
import PageShell from '../../components/ui/PageShell'
import { useAuth } from '../../context/AuthContext'
import { useStudentTrack } from '../../hooks/useStudentTrack'
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
  const { profileId, organizationId } = useAuth()
  const { student, isPermisB, loading: trackLoading } = useStudentTrack(profileId)
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student?.id) {
      setAssessment(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getInitialAssessmentForStudent(student.id).then(({ assessment: row }) => {
      setAssessment(row)
      setLoading(false)
    })
  }, [student?.id])

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
  const readOnly = completed

  return (
    <PageShell>
      <PageHero
        eyebrow="Permis B"
        subtitle="Évaluation réalisée par votre enseignant lors de la première heure de conduite."
        title="Évaluation de départ"
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Statut', value: formatAssessmentStatus(assessment?.status || 'pending') },
          { label: 'Date de réalisation', value: formatDateFr(assessment?.completed_at) },
          {
            label: 'Heures recommandées',
            value: assessment?.recommended_hours_min
              ? assessment.recommended_hours_max === assessment.recommended_hours_min
                ? `${assessment.recommended_hours_min} h`
                : `${assessment.recommended_hours_min} à ${assessment.recommended_hours_max} h`
              : '—',
          },
        ].map((item) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={item.label}>
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-1 text-xl font-black text-slate-950">{item.value}</p>
          </article>
        ))}
      </section>

      {!completed && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Votre évaluation de départ est {formatAssessmentStatus(assessment?.status || 'pending').toLowerCase()}.
          Elle sera complétée par votre enseignant pendant la première heure de conduite.
        </p>
      )}

      {assessment && (
        <InitialAssessmentWizard
          assessment={assessment}
          completedBy={null}
          onSaved={setAssessment}
          organizationId={organizationId}
          readOnly={readOnly}
          studentId={student.id}
        />
      )}
    </PageShell>
  )
}
