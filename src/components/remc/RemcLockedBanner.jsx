import { REMC_LOCKED_MESSAGE, REMC_COMPETENCIES, previousCompetency } from '../../data/remcCompetencies'

export default function RemcLockedBanner({ competencyCode }) {
  const previous = previousCompetency(competencyCode)
  const previousLabel = previous ? REMC_COMPETENCIES[previous]?.shortTitle : null

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center shadow-[var(--shadow-card)]">
      <span className="text-4xl" aria-hidden="true">🔒</span>
      <h3 className="mt-4 text-2xl font-black text-slate-950">Compétence verrouillée</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-7 text-slate-600">
        {REMC_LOCKED_MESSAGE}
      </p>
      {previousLabel && (
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-cyan-700">
          Prérequis : {previous} — {previousLabel}
        </p>
      )}
    </div>
  )
}
