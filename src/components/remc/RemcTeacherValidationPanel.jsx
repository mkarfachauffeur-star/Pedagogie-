import { useCallback, useEffect, useMemo, useState } from 'react'
import { REMC_COMPETENCY_ORDER, REMC_COMPETENCIES } from '../../data/remcCompetencies'
import {
  computeGlobalRemcProgress,
  competencyStatusIcon,
  fetchCompetencyValidations,
  revokeCompetencyValidation,
  validateCompetency,
} from '../../services/remcProgress'
import { subscribePostgresChanges } from '../../services/realtime'
import RemcProgressOverview from './RemcProgressOverview'

function RemcCompetencyAction({ studentId, organizationId, teacherId, competencyCode, entry, onUpdated }) {
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const handleValidate = async () => {
    setBusy(true)
    setFeedback(null)
    const { unlockState, error } = await validateCompetency({
      studentId,
      organizationId,
      competencyCode,
      teacherId,
    })
    if (unlockState) onUpdated(unlockState)
    if (error) setFeedback('Enregistré localement — synchronisation en attente.')
    setBusy(false)
  }

  const handleRevoke = async () => {
    const label = REMC_COMPETENCIES[competencyCode]?.shortTitle || competencyCode
    const confirmed = window.confirm(
      `Retirer la validation de ${competencyCode} (${label}) ? Les compétences suivantes seront reverrouillées pour l'élève.`,
    )
    if (!confirmed) return

    setBusy(true)
    setFeedback(null)
    const { unlockState, error } = await revokeCompetencyValidation({ studentId, competencyCode })
    if (unlockState) onUpdated(unlockState)
    if (error) setFeedback('Modification locale — synchronisation en attente.')
    setBusy(false)
  }

  if (!entry?.unlocked && competencyCode !== 'C1') {
    return (
      <p className="text-xs font-semibold text-slate-500">
        🔒 Validez la compétence précédente pour débloquer celle-ci.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {entry.validated && entry.validatedAt && (
        <p className="text-xs font-semibold text-slate-500">
          Validée le {new Date(entry.validatedAt).toLocaleDateString('fr-FR')}
          {entry.teacherName ? ` · ${entry.teacherName}` : ''}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        {entry.validated ? (
          <button
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
            disabled={busy}
            onClick={handleRevoke}
            type="button"
          >
            Retirer la validation
          </button>
        ) : (
          <button
            className="rounded-xl bg-navy-950 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-cyan-700 disabled:opacity-60"
            disabled={busy}
            onClick={handleValidate}
            type="button"
          >
            Valider la compétence
          </button>
        )}
      </div>
      {feedback && <p className="text-xs font-semibold text-amber-700">{feedback}</p>}
    </div>
  )
}

export default function RemcTeacherValidationPanel({ studentId, organizationId, teacherId }) {
  const [unlockState, setUnlockState] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!studentId) {
      setUnlockState(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { unlockState: nextState } = await fetchCompetencyValidations(studentId)
    setUnlockState(nextState)
    setLoading(false)
  }, [studentId])

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
            Validez chaque compétence pour débloquer la suivante dans le livret numérique de l&apos;élève.
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
                  <RemcCompetencyAction
                    competencyCode={code}
                    entry={entry}
                    onUpdated={setUnlockState}
                    organizationId={organizationId}
                    studentId={studentId}
                    teacherId={teacherId}
                  />
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
