import { useCallback, useEffect, useMemo, useState } from 'react'
import { REMC_COMPETENCY_ORDER, REMC_COMPETENCIES } from '../../data/remcCompetencies'
import {
  computeGlobalRemcProgress,
  competencyStatusIcon,
  fetchCompetencyValidations,
  syncAutoCompetencyValidations,
} from '../../services/remcProgress'
import { subscribePostgresChanges } from '../../services/realtime'
import RemcProgressOverview from './RemcProgressOverview'

function RemcCompetencyStatus({ competencyCode, entry }) {
  if (!entry?.unlocked && competencyCode !== 'C1') {
    return (
      <p className="text-xs font-semibold text-slate-500">
        🔒 Validez la compétence précédente pour débloquer celle-ci.
      </p>
    )
  }

  if (entry?.validated && entry.validatedAt) {
    return (
      <div className="text-right">
        <p className="text-xs font-extrabold text-emerald-700">✅ Compétence validée</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Validée le {new Date(entry.validatedAt).toLocaleDateString('fr-FR')}
          {entry.teacherName ? ` · ${entry.teacherName}` : ''}
        </p>
      </div>
    )
  }

  return (
    <p className="text-right text-xs font-semibold text-slate-500">
      Validation automatique lorsque toutes les sous-compétences sont « Validé ».
    </p>
  )
}

export default function RemcTeacherValidationPanel({
  studentId,
  organizationId,
  teacherId,
  remcCompetencies = [],
  onUnlockStateChange,
}) {
  const [unlockState, setUnlockState] = useState(null)
  const [loading, setLoading] = useState(true)

  const applyUnlockState = useCallback((nextState) => {
    setUnlockState(nextState)
    onUnlockStateChange?.(nextState)
  }, [onUnlockStateChange])

  const refresh = useCallback(async () => {
    if (!studentId) {
      applyUnlockState(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { unlockState: fetched } = await fetchCompetencyValidations(studentId)
    let nextState = fetched

    if (remcCompetencies.length && organizationId && teacherId) {
      const { unlockState: synced } = await syncAutoCompetencyValidations({
        studentId,
        organizationId,
        teacherId,
        remcCompetencies,
        unlockState: fetched,
      })
      nextState = synced || fetched
    }

    applyUnlockState(nextState)
    setLoading(false)
  }, [studentId, organizationId, teacherId, remcCompetencies, applyUnlockState])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!studentId) return undefined
    return subscribePostgresChanges({
      topicBase: `remc-teacher:${studentId}`,
      listeners: [
        {
          config: {
            event: '*',
            schema: 'public',
            table: 'student_competency_validations',
            filter: `student_id=eq.${studentId}`,
          },
          callback: refresh,
        },
      ],
    })
  }, [studentId, refresh])

  const globalProgress = useMemo(
    () => (unlockState ? computeGlobalRemcProgress(unlockState) : 0),
    [unlockState],
  )

  if (!studentId) return null

  return (
    <section className="card-panel-lg">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Validation des compétences REMC</h2>
          <p className="mt-1 text-sm text-slate-500">
            Chaque compétence est validée automatiquement lorsque toutes ses sous-compétences sont
            marquées « Validé » ci-dessous.
          </p>
        </div>
        {!loading && (
          <p className="text-3xl font-black text-cyan-700">{globalProgress} %</p>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-sm font-semibold text-slate-500">Chargement de la progression…</p>
      ) : (
        <>
          <div className="mt-4">
            <RemcProgressOverview compact globalProgress={globalProgress} unlockState={unlockState} />
          </div>

          <div className="mt-4 grid gap-3">
            {REMC_COMPETENCY_ORDER.map((code) => {
              const entry = unlockState?.[code]
              const meta = REMC_COMPETENCIES[code]
              const icon = competencyStatusIcon(entry, code)
              return (
                <article
                  key={code}
                  className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                    entry?.unlocked || code === 'C1' ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/80'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {icon && (
                        <span className="text-xl" aria-hidden="true">
                          {icon}
                        </span>
                      )}
                      <p className="text-sm font-black text-slate-900">
                        {code} · {meta?.shortTitle}
                      </p>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{meta?.title}</p>
                  </div>
                  <RemcCompetencyStatus competencyCode={code} entry={entry} />
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
