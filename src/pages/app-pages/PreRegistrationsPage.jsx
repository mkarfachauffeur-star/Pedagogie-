import { useCallback, useEffect, useMemo, useState } from 'react'
import EmptyState from '../../components/ui/EmptyState'
import ListSearchField from '../../components/ui/ListSearchField'
import PaginationBar from '../../components/ui/PaginationBar'
import { useAuth } from '../../context/AuthContext'
import { normalizeSearchText, useClientPagination } from '../../hooks/useClientPagination'
import {
  PRE_REGISTRATION_STATUS_LABELS,
  preRegistrationStatusClass,
} from '../../data/preRegistration'
import {
  listPreRegistrations,
  reviewPreRegistration,
  subscribePreRegistrations,
} from '../../services/preRegistrations'
import { formatPersonName } from '../../lib/staffAccounts'

function formatDateFr(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('fr-FR')
  } catch {
    return value
  }
}

export default function PreRegistrationsPage({ roleLabel = 'Administration' }) {
  const { profileId } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actionId, setActionId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')

  const refresh = useCallback(async () => {
    if (!profileId) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    const { preRegistrations, error } = await listPreRegistrations()
    if (error) setLoadError(error.message || String(error))
    setRows(preRegistrations)
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!profileId) return undefined
    return subscribePreRegistrations(refresh)
  }, [profileId, refresh])

  const filteredRows = useMemo(() => {
    let list = rows
    if (filter !== 'all') list = list.filter((row) => row.status === filter)
    const q = normalizeSearchText(searchQuery)
    if (!q) return list
    return list.filter((row) => {
      const haystack = normalizeSearchText(
        `${formatPersonName(row)} ${row.email || ''} ${row.phone || ''} ${row.teacherName || ''} ${row.desired_training || ''}`,
      )
      return q.split(/\s+/).filter(Boolean).every((part) => haystack.includes(part))
    })
  }, [filter, rows, searchQuery])

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    pageItems,
    pageSize,
  } = useClientPagination(filteredRows, { pageSize: 10 })

  const pendingCount = useMemo(
    () => rows.filter((row) => row.status === 'pending').length,
    [rows],
  )

  const handleReview = async (row, action) => {
    if (action === 'approve' && !row.email) {
      setFeedback({
        type: 'error',
        message: 'Un e-mail est requis pour accepter et créer le dossier élève.',
      })
      return
    }

    const confirmMessage = action === 'approve'
      ? `Accepter la pré-inscription de ${formatPersonName(row)} et créer le dossier élève ?`
      : `Refuser la pré-inscription de ${formatPersonName(row)} ?`

    if (!window.confirm(confirmMessage)) return

    setActionId(row.id)
    setFeedback(null)

    const { error, message, tempPassword } = await reviewPreRegistration(row.id, action)
    setActionId(null)

    if (error) {
      setFeedback({ type: 'error', message: error.message || String(error) })
      return
    }

    setFeedback({
      type: 'success',
      message: action === 'approve' && tempPassword
        ? `${message} Mot de passe provisoire du compte de ${formatPersonName(row)} (${row.email}) — à transmettre à cet élève pour sa première connexion : ${tempPassword}`
        : message,
    })
    await refresh()
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            {roleLabel}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold">Pré-inscriptions</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
            Validez les demandes transmises par les enseignants avant la création du dossier élève.
          </p>
          {pendingCount > 0 && (
            <p className="mt-3 inline-flex rounded-full bg-amber-400/20 px-4 py-1 text-sm font-bold text-amber-100">
              {pendingCount} en attente
            </p>
          )}
        </div>
      </section>

      <section className="card-panel-lg">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'pending', label: 'En attente' },
            { id: 'approved', label: 'Acceptées' },
            { id: 'rejected', label: 'Refusées' },
            { id: 'all', label: 'Toutes' },
          ].map((item) => (
            <button
              className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                filter === item.id
                  ? 'bg-navy-950 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-200'
              }`}
              key={item.id}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ListSearchField onChange={setSearchQuery} value={searchQuery} />
          {!loading && filteredRows.length > 0 && (
            <p className="text-xs font-semibold text-slate-500">{totalItems} demande(s)</p>
          )}
        </div>

        {feedback && (
          <p
            className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
              feedback.type === 'error'
                ? 'border border-rose-200 bg-rose-50 text-rose-700'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {feedback.message}
          </p>
        )}

        {loading ? (
          <p className="mt-6 text-sm font-semibold text-slate-500">Chargement…</p>
        ) : loadError ? (
          <EmptyState className="mt-6" icon="⚠️" message={loadError} title="Erreur de chargement" />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon="📋"
            message="Aucune pré-inscription dans cette catégorie."
            title="Aucune demande"
          />
        ) : (
          <>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Élève</th>
                  <th className="px-3 py-3">Téléphone</th>
                  <th className="px-3 py-3">E-mail</th>
                  <th className="px-3 py-3">Formation</th>
                  <th className="px-3 py-3">Enseignant</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((row) => (
                  <tr className="border-b border-slate-100 align-top" key={row.id}>
                    <td className="px-3 py-4 font-semibold text-slate-700">{formatDateFr(row.created_at)}</td>
                    <td className="px-3 py-4">
                      <p className="font-extrabold text-slate-900">
                        {formatPersonName(row)}
                      </p>
                      {row.notes && (
                        <p className="mt-1 max-w-xs text-xs text-slate-500">{row.notes}</p>
                      )}
                    </td>
                    <td className="px-3 py-4 text-slate-600">{row.phone || '—'}</td>
                    <td className="px-3 py-4 text-slate-600">{row.email || '—'}</td>
                    <td className="px-3 py-4 font-semibold text-slate-700">{row.desired_training}</td>
                    <td className="px-3 py-4 text-slate-600">{row.teacherName}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${preRegistrationStatusClass(row.status)}`}>
                        {PRE_REGISTRATION_STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {row.status === 'pending' ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white disabled:opacity-60"
                            disabled={actionId === row.id}
                            onClick={() => handleReview(row, 'approve')}
                            type="button"
                          >
                            Accepter
                          </button>
                          <button
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-extrabold text-rose-700 disabled:opacity-60"
                            disabled={actionId === row.id}
                            onClick={() => handleReview(row, 'reject')}
                            type="button"
                          >
                            Refuser
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Traitée le {formatDateFr(row.reviewed_at)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            className="mt-4"
            onPageChange={setPage}
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
          />
          </>
        )}
      </section>
    </div>
  )
}
