import { useCallback, useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import { listAllOrganizations, updateOrganizationStatus } from '../../services/platform'

const STATUS_LABELS = { trial: 'Essai', active: 'Active', suspended: 'Suspendue', cancelled: 'Annulée' }

export default function PlatformOrganizationsPage() {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { organizations: rows } = await listAllOrganizations()
    setOrganizations(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setStatus = async (orgId, status) => {
    await updateOrganizationStatus(orgId, status)
    refresh()
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHero
        eyebrow="Super Admin"
        title="Auto-écoles"
        subtitle="Liste et gestion des établissements inscrits sur la plateforme."
      />
      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-black uppercase text-slate-400">
                <th className="p-4">Nom</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Abonnement</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="border-b border-slate-100">
                  <td className="p-4 font-bold">{org.name}</td>
                  <td className="p-4 text-slate-600">{org.email || '—'}</td>
                  <td className="p-4">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black">{STATUS_LABELS[org.status] || org.status}</span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {(() => {
                      const sub = Array.isArray(org.subscriptions) ? org.subscriptions[0] : org.subscriptions
                      return (
                        <>
                          {sub?.plan?.name || '—'}
                          {sub?.trial_ends_at && (
                            <span className="block text-xs">Fin essai : {new Date(sub.trial_ends_at).toLocaleDateString('fr-FR')}</span>
                          )}
                        </>
                      )
                    })()}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {org.status !== 'active' && org.status !== 'trial' && (
                        <button type="button" className="text-xs font-bold text-emerald-600" onClick={() => setStatus(org.id, 'active')}>Réactiver</button>
                      )}
                      {org.status !== 'suspended' && (
                        <button type="button" className="text-xs font-bold text-amber-600" onClick={() => setStatus(org.id, 'suspended')}>Suspendre</button>
                      )}
                      {org.status !== 'cancelled' && (
                        <button type="button" className="text-xs font-bold text-rose-600" onClick={() => setStatus(org.id, 'cancelled')}>Annuler</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
