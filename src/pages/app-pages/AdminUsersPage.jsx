import { useCallback, useEffect, useMemo, useState } from 'react'
import CreateUserModal from '../../components/users/CreateUserModal'
import AppModal, { AppModalFooter } from '../../components/ui/AppModal'
import EmptyState from '../../components/ui/EmptyState'
import ListSearchField from '../../components/ui/ListSearchField'
import PaginationBar from '../../components/ui/PaginationBar'
import { useAuth } from '../../context/AuthContext'
import { normalizeSearchText, useClientPagination } from '../../hooks/useClientPagination'
import {
  computeAccountStatus,
  formatDateTimeFr,
  STATUS_BADGE,
  USER_ROLE_LABELS,
} from '../../lib/staffAccounts'
import { getUserFacingError } from '../../lib/userFacingError'
import { listOrganizationUsers, manageUser, sendStaffPasswordReset, setStaffAccountActive, subscribeOrganizationUsers } from '../../services/users'

export default function AdminUsersPage() {
  const { profileId, canWrite } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [resetConfirmUser, setResetConfirmUser] = useState(null)
  const [actionBusy, setActionBusy] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    pageItems,
    pageSize,
  } = useClientPagination(users, {
    pageSize: 10,
    query: searchQuery,
    filterFn: (user, query) => {
      const haystack = normalizeSearchText(
        `${user.full_name || ''} ${user.email || ''} ${USER_ROLE_LABELS[user.role] || user.role || ''}`,
      )
      const q = normalizeSearchText(query)
      return q.split(/\s+/).filter(Boolean).every((part) => haystack.includes(part))
    },
  })

  const refresh = useCallback(async () => {
    if (!profileId) {
      setUsers([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    const { users: rows, error } = await listOrganizationUsers()
    if (error) setLoadError('Impossible de charger les utilisateurs.')
    setUsers(rows)
    setLoading(false)
  }, [profileId])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    if (!profileId) return undefined
    return subscribeOrganizationUsers(refresh)
  }, [profileId, refresh])

  const runAction = async (action, user) => {
    if (!canWrite) return
    const userId = user.id

    if (action === 'delete' && !window.confirm('Supprimer définitivement ce compte ?')) return
    if (action === 'disable' && !window.confirm('Désactiver ce compte ?')) return
    if (action === 'reset_password') {
      setResetConfirmUser(user)
      return
    }

    setActionBusy(userId + action)
    setFeedback(null)

    let result
    if (action === 'disable') {
      result = await setStaffAccountActive(userId, false)
    } else if (action === 'enable') {
      result = await setStaffAccountActive(userId, true)
    } else {
      result = await manageUser(action, userId)
    }

    const { error, message } = result
    setActionBusy(null)
    if (error) {
      setFeedback({
        type: 'error',
        text: getUserFacingError(error, 'permission'),
      })
    } else {
      setFeedback({ type: 'ok', text: message })
      refresh()
    }
  }

  const confirmPasswordReset = async () => {
    if (!resetConfirmUser || !canWrite) return
    const userId = resetConfirmUser.id

    setActionBusy(userId + 'reset_password')
    setFeedback(null)

    const { error, message } = await sendStaffPasswordReset(userId)

    setActionBusy(null)
    setResetConfirmUser(null)

    if (error) {
      setFeedback({ type: 'error', text: getUserFacingError(error, 'password') })
    } else {
      setFeedback({ type: 'ok', text: message })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          Utilisateurs
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Comptes et accès</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
              Gérez les comptes de connexion, les rôles et les invitations de votre auto-école.
            </p>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="pd-btn-primary shrink-0" disabled={!canWrite}>
            Créer un utilisateur
          </button>
        </div>
      </section>

      {feedback && (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${feedback.type === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
          {feedback.text}
        </p>
      )}

      <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
        {!profileId ? (
          <div className="p-5"><EmptyState title="Connexion requise" message="Connectez-vous avec votre compte gérant." icon="🔐" /></div>
        ) : loading ? (
          <p className="p-5 text-sm font-medium text-slate-500">Chargement…</p>
        ) : loadError ? (
          <div className="p-5"><EmptyState title="Erreur" message={loadError} icon="⚠️" /></div>
        ) : users.length === 0 ? (
          <div className="p-5"><EmptyState title="Aucun utilisateur" message="Créez le premier compte staff de votre auto-école." icon="👤" /></div>
        ) : (
          <>
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <ListSearchField onChange={setSearchQuery} value={searchQuery} />
            <p className="text-xs font-semibold text-slate-500">{totalItems} utilisateur(s)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nom complet</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Dernière connexion</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((user) => {
                  const status = computeAccountStatus({
                    isActive: user.is_active,
                    invitedAt: user.invited_at,
                    emailConfirmedAt: user.email_confirmed_at,
                    lastSignInAt: user.last_sign_in_at,
                  })
                  const busy = actionBusy?.startsWith(user.id)
                  const isSelf = user.id === profileId
                  const isRegistered = status.label === 'Actif'
                  return (
                    <tr key={user.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-extrabold text-slate-900">
                        {user.full_name || '—'}
                        {isSelf && (
                          <span className="ml-2 text-xs font-bold text-slate-400">(vous)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">
                          {USER_ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${STATUS_BADGE[status.tone]}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTimeFr(user.last_sign_in_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {status.label === 'Invitation en attente' && (
                            <ActionBtn disabled={busy || !canWrite} onClick={() => runAction('resend_invite', user)} label="Renvoyer" />
                          )}
                          {isRegistered && (
                            <ActionBtn disabled={busy || !canWrite} onClick={() => runAction('reset_password', user)} label="Mot de passe" />
                          )}
                          {user.is_active ? (
                            !isSelf && (
                              <ActionBtn disabled={busy || !canWrite} onClick={() => runAction('disable', user)} label="Désactiver" tone="amber" />
                            )
                          ) : (
                            <ActionBtn disabled={busy || !canWrite} onClick={() => runAction('enable', user)} label="Réactiver" tone="emerald" />
                          )}
                          {!isSelf && (
                            <ActionBtn disabled={busy || !canWrite} onClick={() => runAction('delete', user)} label="Supprimer" tone="rose" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar
            className="p-4"
            onPageChange={setPage}
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
          />
          </>
        )}
      </section>

      <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => refresh()} />

      <AppModal
        open={Boolean(resetConfirmUser)}
        onClose={() => !actionBusy && setResetConfirmUser(null)}
        eyebrow="Utilisateurs"
        title="Réinitialiser le mot de passe ?"
        size="sm"
        disableClose={Boolean(actionBusy)}
        footer={(
          <AppModalFooter
            onClose={() => setResetConfirmUser(null)}
            closeLabel="Annuler"
            hideSubmit
          >
            <button
              type="button"
              disabled={Boolean(actionBusy)}
              onClick={confirmPasswordReset}
              className="pd-btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionBusy ? 'Envoi…' : 'Réinitialiser le mot de passe'}
            </button>
          </AppModalFooter>
        )}
      >
        {resetConfirmUser && (
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>
              Voulez-vous réinitialiser le mot de passe de{' '}
              <span className="font-bold text-slate-900">{resetConfirmUser.full_name || 'cet utilisateur'}</span>
              {' '}?
            </p>
            <p>
              Un e-mail sera envoyé à{' '}
              <span className="font-semibold text-slate-800">{resetConfirmUser.email || '—'}</span>
              {' '}avec un lien pour définir un nouveau mot de passe.
            </p>
          </div>
        )}
      </AppModal>
    </div>
  )
}

function ActionBtn({ label, onClick, disabled, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 text-slate-700 hover:bg-slate-50',
    amber: 'border-amber-200 text-amber-800 hover:bg-amber-50',
    emerald: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    rose: 'border-rose-200 text-rose-700 hover:bg-rose-50',
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-50 ${tones[tone]}`}
    >
      {label}
    </button>
  )
}
