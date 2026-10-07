import { REMC_LOCKED_MESSAGE, REMC_COMPETENCIES, previousCompetency } from '../../data/remcCompetencies'

export default function RemcLockedBanner({ competencyCode }) {
  const previous = previousCompetency(competencyCode)
  const previousLabel = previous ? REMC_COMPETENCIES[previous]?.shortTitle : null

  return (
    <div className="lesson-chip px-6 py-8 text-center">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white/70 text-slate-400" aria-hidden="true">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
        </svg>
      </span>
      <h3 className="mt-3 text-base font-semibold text-slate-900">Compétence verrouillée</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {REMC_LOCKED_MESSAGE}
      </p>
      {previousLabel && (
        <p className="mt-3 text-xs font-medium text-sky-700">
          Prérequis : {previous} — {previousLabel}
        </p>
      )}
    </div>
  )
}
