import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../../components/ui/PageShell'
import EmptyState from '../../components/ui/EmptyState'
import RemcProgressOverview from '../../components/remc/RemcProgressOverview'
import { useAuth } from '../../context/AuthContext'
import { useRemcUnlock } from '../../hooks/useRemcUnlock'
import { useStudentTrack } from '../../hooks/useStudentTrack'
import { getStudentNavItems } from '../../config/navigation'
import { getTrackLabel } from '../../lib/studentTrack'
import {
  formatAssessmentStatus,
  getStudentHoursSummary,
} from '../../services/initialAssessment'
import { listPracticeExamsForStudent } from '../../services/practiceExams'
import {
  computeStudentPracticeExamStats,
  estimateSuccessProbability,
} from '../../services/practiceExamScoring'
import { supabase } from '../../lib/supabase'

function formatDateFr(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('fr-FR')
  } catch {
    return '—'
  }
}

function StatCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </article>
  )
}

export default function StudentDashboardPage() {
  const { profile, profileId } = useAuth()
  const { student, track, isPermisB, loading: trackLoading } = useStudentTrack(profileId)
  const { studentId, unlockState, globalProgress, isCompetencyValidated, loading: remcLoading } = useRemcUnlock(profileId)
  const [teacherName, setTeacherName] = useState('Non assigné')
  const [hoursSummary, setHoursSummary] = useState(null)
  const [practiceExamStats, setPracticeExamStats] = useState(null)
  const [practiceExams, setPracticeExams] = useState([])

  useEffect(() => {
    if (!student?.id) return
    getStudentHoursSummary(student.id).then(setHoursSummary)
  }, [student?.id])

  useEffect(() => {
    if (!profileId) return
    supabase
      .from('students')
      .select(`
        student_assignments(is_referent, teacher:teacher_id(full_name))
      `)
      .eq('profile_id', profileId)
      .maybeSingle()
      .then(({ data }) => {
        const referent = data?.student_assignments?.find((row) => row.is_referent)?.teacher
        setTeacherName(referent?.full_name || 'Non assigné')
      })
  }, [profileId])

  useEffect(() => {
    const resolvedId = studentId || student?.id
    if (!resolvedId || !isPermisB) {
      setPracticeExams([])
      setPracticeExamStats(null)
      return
    }
    listPracticeExamsForStudent(resolvedId).then(({ exams }) => {
      setPracticeExams(exams)
      setPracticeExamStats(computeStudentPracticeExamStats(exams))
    })
  }, [studentId, student?.id, isPermisB])

  const displayName = useMemo(() => {
    if (student?.first_name) return student.first_name
    if (profile?.full_name) return profile.full_name.split(' ')[0]
    return 'Élève'
  }, [student, profile])

  const formationLabel = student?.package_name || student?.formation_type || getTrackLabel(track)
  const navLinks = getStudentNavItems(track, student).filter((item) => item.href !== '/student/dashboard')
  const assessment = hoursSummary?.assessment
  const assessmentDone = assessment?.status === 'completed'
  const remcValidatedCount = ['C1', 'C2', 'C3', 'C4'].filter((code) => isCompetencyValidated(code)).length
  const practiceExamProbability = estimateSuccessProbability(practiceExams, remcValidatedCount)

  if (!profileId && !remcLoading && !trackLoading) {
    return (
      <PageShell>
        <EmptyState
          icon="🎓"
          message="Aucune donnée disponible pour le moment. Votre espace s'activera dès l'ajout de votre dossier élève."
          title="Aucune donnée disponible"
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <section className="pd-section-card">
        <div className="grid gap-6 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:grid-cols-[1fr_280px] md:p-8">
          <div>
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
              {getTrackLabel(track)}
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bonjour {displayName}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-cyan-50/85">
              {formationLabel} · Moniteur {teacherName}
            </p>
          </div>
          {isPermisB ? (
            <aside className="rounded-[1.5rem] border border-white/15 bg-white p-5 text-slate-900 shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Progression REMC</p>
              <p className="mt-1 text-5xl font-black text-cyan-600">{globalProgress}%</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                  style={{ width: `${globalProgress}%` }}
                />
              </div>
            </aside>
          ) : (
            <aside className="rounded-[1.5rem] border border-white/15 bg-white p-5 text-slate-900 shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Prochaine leçon</p>
              <p className="mt-2 text-lg font-black text-slate-900">À venir</p>
              <Link className="mt-4 inline-flex text-sm font-bold text-cyan-700" to="/student/next-lesson">
                Voir le détail →
              </Link>
            </aside>
          )}
        </div>
      </section>

      {isPermisB && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Évaluation de départ réalisée"
              value={assessmentDone ? 'Oui' : 'Non'}
            />
            <StatCard label="Date de réalisation" value={formatDateFr(assessment?.completed_at)} />
            <StatCard
              label="Heures recommandées"
              value={hoursSummary?.recommendedHours ? `${hoursSummary.recommendedHours} h` : '—'}
            />
            <StatCard label="Heures au contrat" value={`${hoursSummary?.contractHours ?? 0} h`} />
            <StatCard label="Heures effectuées" value={`${hoursSummary?.completedHours ?? 0} h`} />
            <StatCard label="Heures restantes" value={`${hoursSummary?.remainingHours ?? 0} h`} />
          </section>

          {!assessmentDone && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Évaluation de départ : {formatAssessmentStatus(assessment?.status || 'pending').toLowerCase()}.
              Elle doit être réalisée avant le début complet du suivi pédagogique.
              <Link className="ml-2 font-black text-amber-950 underline" to="/student/initial-assessment">
                Consulter
              </Link>
            </p>
          )}

          {unlockState && (
            <RemcProgressOverview globalProgress={globalProgress} unlockState={unlockState} />
          )}

          {practiceExamStats?.count > 0 && (
            <section className="pd-section-card pd-section-card-body">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Examen blanc</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">Préparation à l&apos;épreuve pratique</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Dernier score', value: `${practiceExamStats.lastScore}/31` },
                  { label: 'Meilleur score', value: `${practiceExamStats.bestScore}/31` },
                  { label: 'Examens blancs', value: practiceExamStats.count },
                  {
                    label: 'Probabilité estimée',
                    value: practiceExamProbability != null ? `${practiceExamProbability} %` : '—',
                  },
                ].map((item) => (
                  <article className="card-muted" key={item.label}>
                    <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{item.value}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navLinks.map((link) => (
          <Link className="group card-tile" key={link.href} to={link.href}>
            <p className="text-base font-black text-slate-950 group-hover:text-cyan-800">{link.label}</p>
          </Link>
        ))}
      </section>
    </PageShell>
  )
}
