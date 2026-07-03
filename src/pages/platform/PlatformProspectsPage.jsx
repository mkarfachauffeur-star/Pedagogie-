import { useCallback, useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import { formatPlatformDateTime } from '../../lib/platformPlans'
import { supabase } from '../../lib/supabase'
import { acceptProspect, deleteProspectRecord, listProspects, refuseProspect, resendManagerInvite } from '../../services/prospects'
import { deleteOrganization } from '../../services/platform'
import { useProspectNotifications } from '../../hooks/useProspectNotifications'

const STATUS_BADGE = {
  'Nouvelle demande': 'bg-amber-100 text-amber-900',
  Refusée: 'bg-rose-100 text-rose-900',
  Acceptée: 'bg-cyan-100 text-cyan-900',
  'Essai gratuit': 'bg-cyan-100 text-cyan-900',
}

const TERMINAL_STATUSES = new Set(['Refusée', 'Acceptée', 'Essai gratuit'])

export default function PlatformProspectsPage() {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const { refresh: refreshBadge } = useProspectNotifications()

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const { prospects: rows, error } = await listProspects()
    if (error) {
      setLoadError(
        error.message
          || 'Impossible de lire demo_requests. Vérifiez que vous êtes Super Admin et que la migration RLS est appliquée.',
      )
      setProspects([])
    } else {
      setProspects(rows)
    }
    setLoading(false)
    refreshBadge()
  }, [refreshBadge])

  useEffect(() => {
    refresh()

    const channel = supabase
      .channel('platform-demo-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demo_requests' },
        () => {
          refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  const handleAccept = async (prospect) => {
    if (prospect.organization_id || TERMINAL_STATUSES.has(prospect.status)) return
    if (
      !window.confirm(
        `Accepter « ${prospect.school_name} » ?\n\nCréation de l'auto-école, du compte gérant (${prospect.email}), essai 30 jours Starter et envoi d'un lien sécurisé pour définir le mot de passe.`,
      )
    ) {
      return
    }
    setBusyId(prospect.id)
    setFeedback(null)
    const { data, error } = await acceptProspect(prospect.id)
    setBusyId(null)
    if (error) {
      setFeedback({
        type: 'error',
        message: error.message || 'Acceptation impossible.',
        steps: null,
      })
      return
    }
    setFeedback({
      type: 'ok',
      message: data?.email_sent
        ? `Demande acceptée. Invitation envoyée à ${prospect.email}.`
        : 'Demande acceptée.',
    })
    refresh()
  }

  const handleResendInvite = async (prospect) => {
    if (!window.confirm(`Renvoyer l'e-mail d'activation à ${prospect.email} ?`)) return
    setBusyId(prospect.id)
    setFeedback(null)
    const { data, error } = await resendManagerInvite(prospect.id)
    setBusyId(null)
    if (error) {
      setFeedback({ type: 'error', message: error.message || 'Renvoi impossible.', steps: null })
      return
    }
    console.info('[platform-prospect][resend_invite]', data)
    setFeedback({
      type: 'ok',
      message: `Invitation envoyée à ${prospect.email}.`,
      debug: data,
    })
  }

  const handleRefuse = async (prospect) => {
    if (!window.confirm(`Refuser la demande de « ${prospect.school_name} » ?`)) return
    setBusyId(prospect.id)
    const { error } = await refuseProspect(prospect.id)
    setBusyId(null)
    if (error) {
      setFeedback({ type: 'error', message: error.message || 'Refus impossible.' })
      return
    }
    setFeedback({ type: 'ok', message: 'Demande refusée.' })
    refresh()
  }

  const handleDelete = async (prospect) => {
    const hasOrg = Boolean(prospect.organization_id)
    const message = hasOrg
      ? `Supprimer définitivement « ${prospect.school_name} » ?\n\nL'auto-école, tous ses comptes utilisateurs et cette demande seront supprimés. Cette action est irréversible.`
      : `Supprimer la demande « ${prospect.school_name} » ?\n\nCette action est irréversible.`
    if (!window.confirm(message)) return

    setBusyId(prospect.id)
    setFeedback(null)

    if (hasOrg) {
      const { error: orgError } = await deleteOrganization(prospect.organization_id)
      if (orgError && !String(orgError.message || '').includes('déjà supprimée')) {
        setBusyId(null)
        setFeedback({ type: 'error', message: orgError.message || 'Suppression de l\'auto-école impossible.' })
        return
      }
    }

    const { error } = await deleteProspectRecord(prospect.id)
    setBusyId(null)
    if (error) {
      setFeedback({ type: 'error', message: error.message || 'Suppression impossible.' })
      return
    }

    setFeedback({
      type: 'ok',
      message: hasOrg
        ? `« ${prospect.school_name} » et son auto-école ont été supprimés.`
        : `Demande « ${prospect.school_name} » supprimée.`,
    })
    refresh()
  }

  const pending = prospects.filter(
    (row) => !row.organization_id && !TERMINAL_STATUSES.has(row.status),
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHero
        eyebrow="Super Admin"
        title="Demandes de démonstration"
        subtitle="Lecture directe de public.demo_requests — aucun compte créé tant qu'une demande n'est pas acceptée."
      />

      {loadError && (
        <p className="rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {loadError}
        </p>
      )}

      {feedback && (
        <div
          className={`rounded-xl border-2 px-4 py-3 text-sm font-bold ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <p className="whitespace-pre-wrap">{feedback.message}</p>
          {feedback.debug && (
            <details className="mt-3 rounded-lg bg-white/70 p-3 text-xs font-normal text-slate-700">
              <summary className="cursor-pointer font-bold text-slate-800">Logs envoi (platform-prospect)</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(feedback.debug, null, 2)}
              </pre>
            </details>
          )}
          {feedback.type === 'error' && feedback.steps && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-white/70 p-3 text-xs font-normal text-slate-700">
              {feedback.steps}
            </pre>
          )}
        </div>
      )}

      <p className="text-sm font-semibold text-slate-600">
        {pending.length} demande{pending.length > 1 ? 's' : ''} en attente · {prospects.length} au total
      </p>

      <div className="overflow-x-auto rounded-2xl border-2 border-slate-300 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs font-black uppercase text-slate-400">
              <th className="p-4">Auto-école</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Téléphone</th>
              <th className="p-4">E-mail</th>
              <th className="p-4">Créée le</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-6 text-slate-500" colSpan={7}>
                  Chargement…
                </td>
              </tr>
            ) : prospects.length === 0 ? (
              <tr>
                <td className="p-6 text-slate-500" colSpan={7}>
                  {loadError ? 'Erreur de lecture — voir le message ci-dessus.' : 'Aucune demande enregistrée.'}
                </td>
              </tr>
            ) : (
              prospects.map((row) => {
                const status = row.status || 'Nouvelle demande'
                const canAct =
                  !row.organization_id && !TERMINAL_STATUSES.has(status)
                const isBusy = busyId === row.id
                return (
                  <tr className="border-b" key={row.id}>
                    <td className="p-4 font-bold">{row.school_name}</td>
                    <td className="p-4">{row.contact_name}</td>
                    <td className="p-4">{row.phone}</td>
                    <td className="p-4">
                      <a className="font-semibold text-cyan-700" href={`mailto:${row.email}`}>
                        {row.email}
                      </a>
                    </td>
                    <td className="p-4">{formatPlatformDateTime(row.created_at)}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${STATUS_BADGE[status] || 'bg-slate-100 text-slate-700'}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {canAct ? (
                          <>
                            <button
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                              disabled={isBusy}
                              onClick={() => handleAccept(row)}
                              type="button"
                            >
                              ✓ Accepter
                            </button>
                            <button
                              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                              disabled={isBusy}
                              onClick={() => handleRefuse(row)}
                              type="button"
                            >
                              ✗ Refuser
                            </button>
                          </>
                        ) : status === 'Acceptée' || status === 'Essai gratuit' ? (
                          <button
                            className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-800 hover:bg-cyan-100 disabled:opacity-50"
                            disabled={isBusy}
                            onClick={() => handleResendInvite(row)}
                            type="button"
                          >
                            ↻ Renvoyer l&apos;invitation
                          </button>
                        ) : null}
                        <button
                          className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          disabled={isBusy}
                          onClick={() => handleDelete(row)}
                          type="button"
                        >
                          🗑 Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
