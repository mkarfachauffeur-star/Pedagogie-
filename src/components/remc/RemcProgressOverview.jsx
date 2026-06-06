import { REMC_COMPETENCY_ORDER, REMC_COMPETENCIES } from '../../data/remcCompetencies'
import { competencyStatusIcon } from '../../services/remcProgress'

export default function RemcProgressOverview({ unlockState, globalProgress, compact = false }) {
  if (!unlockState) return null

  return (
    <section className={compact ? 'space-y-3' : 'rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]'}>
      {!compact && (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Progression REMC</h2>
            <p className="mt-1 text-sm text-slate-500">Parcours progressif — compétences débloquées par votre enseignant.</p>
          </div>
          <p className="text-3xl font-black text-cyan-700">{globalProgress} %</p>
        </div>
      )}

      <div className={`grid gap-2 ${compact ? '' : 'mt-4'}`}>
        {REMC_COMPETENCY_ORDER.map((code) => {
          const entry = unlockState[code]
          const meta = REMC_COMPETENCIES[code]
          const icon = competencyStatusIcon(entry, code)
          return (
            <div
              key={code}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                entry?.unlocked || code === 'C1' ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-slate-50/60 opacity-80'
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900">
                  {code} · {meta?.shortTitle || meta?.title}
                </p>
                {!compact && entry?.validated && entry.validatedAt && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Validée le {new Date(entry.validatedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
              {icon && (
                <span className="shrink-0 text-xl" aria-hidden="true">
                  {icon}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!compact && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-all duration-500"
            style={{ width: `${globalProgress}%` }}
          />
        </div>
      )}
    </section>
  )
}
