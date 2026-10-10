import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Award,
  CalendarClock,
  CheckCircle2,
  Flag,
  Hourglass,
  IdCard,
  Play,
} from 'lucide-react'
import { AAC_KM_TARGET, daysBetween, formatDateFr } from '../../lib/aacRules'
import { buildRvpMilestones, journeyProgress } from '../../lib/aacJourney'
import { formatKm } from '../../lib/geolocation'

const KM_TICKS = [500, 1000, 1500, 2000, 2500]

const STATE_LABELS = {
  realise: 'Réalisé',
  en_retard: 'En retard',
  a_effectuer: 'À effectuer',
}

function stateChipClass(state) {
  if (state === 'realise') return 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200'
  if (state === 'en_retard') return 'border-rose-300/40 bg-rose-400/15 text-rose-200'
  return 'border-sky-300/40 bg-sky-400/15 text-sky-200'
}

function StateChip({ state, pulse = false }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${stateChipClass(state)} ${pulse ? 'aac-journey-chip-pulse' : ''}`}
    >
      {state === 'realise' && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
      {state === 'en_retard' && <Hourglass className="h-3 w-3" aria-hidden="true" />}
      {STATE_LABELS[state]}
    </span>
  )
}

function CheckeredFlag({ className = '' }) {
  return (
    <span className={`inline-flex items-end ${className}`} aria-hidden="true">
      <span className="h-8 w-[3px] rounded-full bg-slate-200/90 shadow-[0_0_6px_rgba(255,255,255,0.35)]" />
      <span className="aac-flag-checker mb-1 ml-px h-5 w-7 rounded-r-[3px] rounded-tl-[2px] shadow-[0_2px_10px_rgba(2,6,23,0.45)]" />
    </span>
  )
}

function LicenseCard() {
  return (
    <div
      aria-hidden="true"
      className="aac-license relative w-24 rotate-3 rounded-xl border border-sky-200/50 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 p-2 shadow-[0_10px_30px_rgba(56,132,244,0.45)]"
    >
      <div className="flex items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20">
          <IdCard className="h-3.5 w-3.5 text-white" />
        </span>
        <span className="text-[9px] font-black tracking-[0.18em] text-white">PERMIS</span>
      </div>
      <div className="mt-2 space-y-1">
        <span className="block h-1 w-4/5 rounded-full bg-white/70" />
        <span className="block h-1 w-3/5 rounded-full bg-white/45" />
        <span className="block h-1 w-2/3 rounded-full bg-white/30" />
      </div>
      <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/25 to-transparent opacity-60" />
    </div>
  )
}

function RvpMilestone({ icon: Icon, title, detail, state, due = false }) {
  return (
    <li
      className={`flex min-w-[13rem] flex-1 items-start gap-3 rounded-2xl border p-3 backdrop-blur-sm ${
        due
          ? 'border-amber-300/50 bg-amber-400/10 shadow-[0_0_24px_rgba(251,191,36,0.18)]'
          : 'border-white/12 bg-white/[0.06]'
      }`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-sky-300/30 bg-sky-400/15 text-sky-200">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-sky-100/70">{detail}</p>
        <div className="mt-2">
          <StateChip pulse={due} state={state} />
        </div>
      </div>
    </li>
  )
}

/**
 * Parcours visuel AAC vers les 3 000 km. Aucune carte : les kilomètres
 * affichés viennent uniquement des trajets validés (agrégat serveur).
 */
export default function AacJourneyCard({
  progress,
  startedAt,
  examEligibleAt,
  statusText,
  tripCount = 0,
  rvpCompleted = 0,
  rvpRequired = 2,
  rvp = [],
  ffiAt = null,
  tripActive = false,
}) {
  const km = Math.max(0, Number(progress?.km) || 0)
  const target = Number(progress?.target) || AAC_KM_TARGET
  const { remaining, percentDisplay, finished } = journeyProgress(km, target)
  const fillPercent = Math.min(100, (km / target) * 100)

  const [displayKm, setDisplayKm] = useState(km)
  const [pulse, setPulse] = useState(false)
  const prevKmRef = useRef(km)

  useEffect(() => {
    const from = prevKmRef.current
    const to = km
    prevKmRef.current = km
    if (to === from) return undefined
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const start = performance.now()
    const duration = 900
    let raf = 0
    let timeout = null
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - p) ** 3
      setDisplayKm(from + (to - from) * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    if (to > from && !reduceMotion) timeout = setTimeout(() => setPulse(false), 1700)
    raf = requestAnimationFrame(() => {
      setPulse(to > from && !reduceMotion)
      if (reduceMotion) setDisplayKm(to)
      else step(performance.now())
    })
    return () => {
      cancelAnimationFrame(raf)
      if (timeout) clearTimeout(timeout)
    }
  }, [km])

  const daysElapsed = useMemo(() => (startedAt ? daysBetween(startedAt) : null), [startedAt])
  const daysToEligible = useMemo(
    () => (examEligibleAt ? daysBetween(new Date(), examEligibleAt) : null),
    [examEligibleAt],
  )

  const milestones = useMemo(
    () => buildRvpMilestones({ rvp, km, target, ffiAt }),
    [rvp, km, target, ffiAt],
  )
  const [rvp1, rvp2] = milestones.mandatory
  const rvp1Detail = rvp1.deadline
    ? `Entre le ${formatDateFr(rvp1.windowStart)} et le ${formatDateFr(rvp1.deadline)} (d’après la FFI du ${formatDateFr(ffiAt)})`
    : rvp1.requirement
  const extras = milestones.extras.map(({ row, state }) => ({
    row,
    state,
    detail: row.heldOn ? `Prévu le ${formatDateFr(row.heldOn)}` : 'Date à définir avec l’enseignant',
    key: row.id || row.sequence,
  }))

  return (
    <section
      aria-label="Mon parcours AAC"
      className="relative overflow-hidden rounded-3xl border border-sky-400/25 bg-gradient-to-br from-[#081a33] via-[#0b2a52] to-[#103a75] p-5 text-white shadow-[0_24px_60px_rgba(6,20,50,0.45)] sm:p-6"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Mon parcours AAC</p>
          <div className="flex flex-wrap items-center gap-2">
            {statusText && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-sky-100">
                {statusText}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-[11px] font-bold text-amber-200">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              Objectif permis
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="flex items-baseline gap-2">
              <span className={`text-5xl font-black tabular-nums tracking-tight text-white sm:text-6xl ${pulse ? 'aac-journey-number-pulse' : ''}`}>
                {formatKm(Math.round(displayKm * 10) / 10)}
              </span>
              <span className="text-lg font-semibold text-sky-200">km</span>
            </p>
            <p className="mt-1 text-sm text-sky-100/70">
              {tripCount} trajet{tripCount > 1 ? 's' : ''} validé{tripCount > 1 ? 's' : ''} · RVP {rvpCompleted}/{rvpRequired}
              {tripActive ? ' · trajet en cours (s’ajoutera à l’arrivée)' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black tabular-nums text-sky-300 sm:text-5xl">{percentDisplay}%</p>
            <p className="mt-1 text-sm text-sky-100/70">
              {finished ? 'Objectif des 3 000 km atteint' : `Encore ${formatKm(remaining)} km avant l’objectif`}
            </p>
          </div>
        </div>

        <div className="relative mt-16 pb-10 pt-2">
          <div className="relative h-2.5 rounded-full bg-white/10">
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 shadow-[0_0_18px_rgba(56,189,248,0.65)] transition-[width] duration-700 ease-out ${pulse ? 'aac-journey-fill-pulse' : ''}`}
              style={{ width: `${fillPercent}%` }}
            />
            {KM_TICKS.map((tick) => (
              <span
                aria-hidden="true"
                className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-white/25"
                key={tick}
                style={{ left: `${(tick / target) * 100}%` }}
              />
            ))}
            {km > 0 && !finished && (
              <span
                aria-hidden="true"
                className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-400 shadow-[0_0_14px_rgba(125,211,252,0.9)] transition-[left] duration-700 ease-out ${pulse ? 'aac-journey-tip-pulse' : ''}`}
                style={{ left: `${fillPercent}%` }}
              />
            )}
          </div>

          <div className="absolute left-0 top-0 flex -translate-y-1 flex-col items-start">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-400/20 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.35)]">
              <Play className="ml-0.5 h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-200">Départ</span>
            <span className="text-[11px] tabular-nums text-sky-100/60">{formatDateFr(startedAt)}</span>
          </div>

          {KM_TICKS.map((tick) => (
            <span
              aria-hidden={tick % 1000 !== 0}
              className={`absolute top-full mt-2 -translate-x-1/2 text-[10px] tabular-nums text-sky-100/55 ${tick % 1000 !== 0 ? 'hidden sm:block' : ''}`}
              key={tick}
              style={{ left: `${(tick / target) * 100}%` }}
            >
              {formatKm(tick)}
            </span>
          ))}

          <div className="absolute right-0 top-0 flex -translate-y-1 flex-col items-end">
            <LicenseCard />
            <CheckeredFlag className="mt-2" />
            <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-200">Arrivée</span>
            <span className="text-[11px] tabular-nums text-sky-100/60">{formatKm(target)} km</span>
          </div>
        </div>

        <ul className="mt-2 flex flex-wrap gap-3 border-t border-white/10 pt-4">
          <RvpMilestone
            detail={rvp1Detail}
            icon={CalendarClock}
            state={rvp1.state}
            title="RVP 1 · Obligatoire"
          />
          {extras.map(({ row, state, detail, key }) => (
            <RvpMilestone
              detail={detail}
              icon={Flag}
              key={key}
              state={state}
              title={`${row.label || `Rendez-vous ${row.sequence}`} · Facultatif`}
            />
          ))}
          <RvpMilestone
            detail={rvp2.requirement}
            due={rvp2.due}
            icon={Flag}
            state={rvp2.state}
            title="RVP 2 · Obligatoire · 3 000 km"
          />
        </ul>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm lg:grid-cols-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-sky-300/70">Début</dt>
            <dd className="mt-0.5 text-sky-50">{formatDateFr(startedAt)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-sky-300/70">Jours écoulés</dt>
            <dd className="mt-0.5 tabular-nums text-sky-50">{daysElapsed ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-sky-300/70">Jours avant un an</dt>
            <dd className="mt-0.5 tabular-nums text-sky-50">{daysToEligible == null ? '—' : Math.max(0, daysToEligible)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-sky-300/70">Examen possible le</dt>
            <dd className="mt-0.5 text-sky-50">{formatDateFr(examEligibleAt)}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
