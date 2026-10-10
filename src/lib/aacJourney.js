/** Calculs du parcours visuel AAC (kilomètres validés + repères RVP). */

import { AAC_KM_TARGET, kmProgress, parseLocalDate, rvpRequirementLabel } from './aacRules.js'

export function addMonths(dateInput, months) {
  const d = parseLocalDate(dateInput)
  if (!d) return null
  const next = new Date(d)
  next.setMonth(next.getMonth() + months)
  return next
}

/** État d'un repère : 'realise' | 'en_retard' | 'a_effectuer'. */
export function milestoneState({ completed, overdue }) {
  if (completed) return 'realise'
  if (overdue) return 'en_retard'
  return 'a_effectuer'
}

/**
 * Progression issue exclusivement des kilomètres validés (agrégat serveur).
 * percent suit la formule km / cible × 100 plafonnée à 100 ; percentDisplay
 * évite l'affichage contradictoire « 100 % » tant qu'il reste des kilomètres.
 */
export function journeyProgress(kmTotal, target = AAC_KM_TARGET) {
  const { km, remaining, percent } = kmProgress(kmTotal, target)
  const finished = km >= target
  return {
    km,
    target,
    remaining: finished ? 0 : remaining,
    percent,
    percentDisplay: finished ? 100 : Math.min(99, percent),
    finished,
  }
}

/**
 * Repères sur le parcours : RVP 1 (échéance temporelle, jamais de distance),
 * rendez-vous supplémentaires (facultatifs), RVP 2 (seuil des 3 000 km).
 * « En retard » n'est déterminé que sur une donnée fiable : date de dépôt
 * de la FFI pour RVP 1 (l'attestation existe forcément à cette date), date
 * du rendez-vous pour les supplémentaires. RVP 2 n'a pas d'échéance
 * temporelle : franchir les 3 000 km le rend « à effectuer », jamais en retard.
 */
export function buildRvpMilestones({ rvp = [], km = 0, target = AAC_KM_TARGET, ffiAt = null, today = new Date() }) {
  const rows = Array.isArray(rvp) ? rvp : []
  const bySequence = (sequence) => rows.find((item) => Number(item.sequence) === sequence) || { sequence, completed: false }

  const rvp1 = bySequence(1)
  const ffiDate = parseLocalDate(ffiAt)
  const rvp1Deadline = ffiDate ? addMonths(ffiDate, 6) : null
  const rvp1Overdue = Boolean(!rvp1.completed && rvp1Deadline && today > rvp1Deadline)

  const rvp2 = bySequence(2)
  const rvp2Due = !rvp2.completed && (Number(km) || 0) >= target

  const extras = rows
    .filter((item) => Number(item.sequence) > 2)
    .sort((a, b) => Number(a.sequence) - Number(b.sequence))
    .map((row) => {
      const held = parseLocalDate(row.heldOn)
      const overdue = Boolean(!row.completed && held && held < today)
      return {
        row,
        optional: true,
        state: milestoneState({ completed: row.completed, overdue }),
        due: false,
        detail: row.heldOn ? 'date' : 'a_planifier',
      }
    })

  return {
    mandatory: [
      {
        sequence: 1,
        row: rvp1,
        optional: false,
        state: milestoneState({ completed: rvp1.completed, overdue: rvp1Overdue }),
        due: false,
        deadline: rvp1Deadline,
        windowStart: ffiDate ? addMonths(ffiDate, 4) : null,
        requirement: rvpRequirementLabel(1),
      },
      {
        sequence: 2,
        row: rvp2,
        optional: false,
        state: milestoneState({ completed: rvp2.completed, overdue: false }),
        due: rvp2Due,
        deadline: null,
        windowStart: null,
        requirement: rvpRequirementLabel(2),
      },
    ],
    extras,
  }
}
