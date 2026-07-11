import { useCallback, useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import { formatPlatformDate, formatPlatformEur } from '../../lib/platformPlans'
import {
  cancelSubscription,
  listAllSubscriptions,
  listPlatformPlans,
  reactivateSubscription,
  suspendSubscription,
  updateSubscriptionBySuperAdmin,
} from '../../services/platform'

const OFFER_BADGE = {
  Essai: 'bg-amber-100 text-amber-900',
  Starter: 'bg-blue-100 text-blue-900',
  Premium: 'bg-indigo-100 text-indigo-900',
}

const STATUS_BADGE = {
  Actif: 'bg-emerald-100 text-emerald-800',
  Suspendu: 'bg-rose-100 text-rose-800',
  Résilié: 'bg-slate-200 text-slate-700',
  'Paiement échoué': 'bg-orange-100 text-orange-900',
}

const PAYMENT_METHODS = ['Virement', 'Carte bancaire', 'Prélèvement SEPA', 'Chèque', 'Autre']

export default function PlatformSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [subsRes, plansRes] = await Promise.all([listAllSubscriptions(), listPlatformPlans()])
    setSubscriptions(subsRes.subscriptions)
    setPlans(plansRes.plans.filter((p) => p.code !== 'trial'))
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleSuspend = async (row) => {
    if (!window.confirm(`Suspendre « ${row.organization?.name} » ?`)) return
    await suspendSubscription(row.id, row.organization.id)
    refresh()
  }

  const handleReactivate = async (row) => {
    await reactivateSubscription(row.id, row.organization.id)
    refresh()
  }

  const handleCancel = async (row) => {
    if (!window.confirm(`Résilier définitivement « ${row.organization?.name} » ?`)) return
    await cancelSubscription(row.id, row.organization.id)
    refresh()
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!editing) return
    const form = new FormData(event.currentTarget)
    const planCode = form.get('planCode') || undefined
    const payload = {
      planCode,
      trialEndsAt: form.get('trialEndsAt') || null,
      currentPeriodEnd: form.get('currentPeriodEnd') || null,
      paymentMethod: form.get('paymentMethod') || null,
    }
    if (planCode && planCode !== 'trial') {
      payload.status = 'active'
    }
    const { error } = await updateSubscriptionBySuperAdmin(editing.id, payload)
    if (error) {
      setFeedback({ type: 'error', message: error.message || 'Enregistrement impossible.' })
      return
    }
    setFeedback({ type: 'ok', message: 'Abonnement mis à jour.' })
    setEditing(null)
    refresh()
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHero
        eyebrow="Super Admin"
        title="Abonnements"
        subtitle="Abonnements SaaS des auto-écoles clientes — tarifs lus depuis la base (page Tarifs)."
      />

      {feedback && (
        <p
          className={`rounded-xl border-2 px-4 py-3 text-sm font-bold ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.message}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border-2 border-slate-300 bg-white">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs font-black uppercase text-slate-400">
              <th className="p-3">Auto-école</th>
              <th className="p-3">Gérant</th>
              <th className="p-3">Offre</th>
              <th className="p-3">Début</th>
              <th className="p-3">Fin essai / période</th>
              <th className="p-3">Prochaine facturation</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-6 text-slate-500" colSpan={9}>
                  Chargement…
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td className="p-6 text-slate-500" colSpan={9}>
                  Aucun abonnement.
                </td>
              </tr>
            ) : (
              subscriptions.map((row) => (
                <tr className="border-b align-top" key={row.id}>
                  <td className="p-3 font-bold">{row.organization?.name || '—'}</td>
                  <td className="p-3">
                    <p className="font-semibold">{row.managerName}</p>
                    <p className="text-xs text-slate-500">{row.managerEmail}</p>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${OFFER_BADGE[row.offer] || 'bg-slate-100'}`}
                    >
                      {row.offer}
                    </span>
                  </td>
                  <td className="p-3">{formatPlatformDate(row.trialStartAt)}</td>
                  <td className="p-3">{formatPlatformDate(row.trialEndAt || row.current_period_end)}</td>
                  <td className="p-3">{formatPlatformDate(row.nextBillingAt)}</td>
                  <td className="p-3 font-bold text-cyan-700">
                    {row.amountCents > 0 ? formatPlatformEur(row.amountCents, { fromCents: true }) : '—'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${STATUS_BADGE[row.billingStatus] || 'bg-slate-100'}`}
                    >
                      {row.billingStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-bold hover:bg-slate-50"
                        onClick={() => setEditing(row)}
                        type="button"
                      >
                        Modifier
                      </button>
                      {row.billingStatus === 'Suspendu' || row.billingStatus === 'Résilié' ? (
                        <button
                          className="rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-700"
                          onClick={() => handleReactivate(row)}
                          type="button"
                        >
                          Réactiver
                        </button>
                      ) : (
                        <button
                          className="rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-bold text-rose-700"
                          onClick={() => handleSuspend(row)}
                          type="button"
                        >
                          Suspendre
                        </button>
                      )}
                      {row.billingStatus !== 'Résilié' && (
                        <button
                          className="rounded-lg border border-slate-400 px-2.5 py-1 text-xs font-bold text-slate-700"
                          onClick={() => handleCancel(row)}
                          type="button"
                        >
                          Résilier
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
          <form
            className="w-full max-w-md rounded-2xl border-2 border-slate-300 bg-white p-5 shadow-xl"
            onSubmit={handleSave}
          >
            <h2 className="text-lg font-extrabold">Modifier — {editing.organization?.name}</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-bold text-slate-600">
                Offre
                <select
                  className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2"
                  defaultValue={editing.plan?.code === 'monthly' ? 'starter' : editing.plan?.code || 'trial'}
                  name="planCode"
                >
                  <option value="trial">Essai</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.code}>
                      {plan.name} — {formatPlatformEur(plan.price_cents, { fromCents: true })}/mois
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold text-slate-600">
                Fin essai
                <input
                  className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2"
                  defaultValue={editing.trialEndAt?.slice(0, 10) || ''}
                  name="trialEndsAt"
                  type="date"
                />
              </label>
              <label className="block text-sm font-bold text-slate-600">
                Prochaine facturation
                <input
                  className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2"
                  defaultValue={editing.nextBillingAt?.slice(0, 10) || ''}
                  name="currentPeriodEnd"
                  type="date"
                />
              </label>
              <label className="block text-sm font-bold text-slate-600">
                Moyen de paiement
                <select
                  className="mt-1 w-full rounded-xl border-2 border-slate-300 px-3 py-2"
                  defaultValue={editing.paymentMethod === '—' ? '' : editing.paymentMethod}
                  name="paymentMethod"
                >
                  <option value="">—</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-xl border px-4 py-2 text-sm font-bold" onClick={() => setEditing(null)} type="button">
                Annuler
              </button>
              <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white" type="submit">
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
