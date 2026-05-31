import { useEffect, useState } from 'react'
import { listAllSubscriptions } from '../../services/platform'

export default function PlatformSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])

  useEffect(() => {
    listAllSubscriptions().then(({ subscriptions: rows }) => setSubscriptions(rows))
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-950">Abonnements</h1>
      <p className="text-sm text-slate-500">Gestion manuelle V1 — Stripe désactivé.</p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs font-black uppercase text-slate-400">
              <th className="p-4">Auto-école</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Fin période</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-b">
                <td className="p-4 font-bold">{sub.organization?.name}</td>
                <td className="p-4">{sub.plan?.name}</td>
                <td className="p-4">{sub.status}</td>
                <td className="p-4">{sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString('fr-FR') : sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('fr-FR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
