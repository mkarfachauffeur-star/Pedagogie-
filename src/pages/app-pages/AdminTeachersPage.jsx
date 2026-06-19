import { useCallback, useEffect, useState } from 'react'
import TeacherDetailModal from '../../components/teachers/TeacherDetailModal'
import TeacherFormModal from '../../components/teachers/TeacherFormModal'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import {
  computeTeacherStatus,
  formatDateFr,
  STATUS_BADGE,
} from '../../lib/staffAccounts'
import { getResourceTypeLabel } from '../../lib/teachingResources'
import { getUserFacingError } from '../../lib/userFacingError'
import {
  deleteTeacher,
  listTeachers,
  setTeacherActive,
  subscribeTeachers,
} from '../../services/teachers'

export default function AdminTeachersPage() {
  const { profileId, canWrite } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [selected, setSelected] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const refresh = useCallback(async () => {
    if (!profileId) {
      setTeachers([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    const { teachers: rows, error } = await listTeachers()
    if (error) setLoadError('Impossible de charger la liste des enseignants.')
    setTeachers(rows)
    setLoading(false)
  }, [profileId])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    if (!profileId) return undefined
    return subscribeTeachers(refresh)
  }, [profileId, refresh])

  const openCreate = () => {
    setSelected(null)
    setFormMode('create')
    setFormOpen(true)
  }

  const openEdit = (teacher) => {
    setSelected(teacher)
    setFormMode('edit')
    setDetailOpen(false)
    setFormOpen(true)
  }

  const openView = (teacher) => {
    setSelected(teacher)
    setDetailOpen(true)
  }

  const runDisable = async (teacher) => {
    if (!canWrite) return
    const activate = !teacher.is_active
    const msg = activate ? 'Réactiver cet enseignant ?' : 'Désactiver cet enseignant et son compte ?'
    if (!window.confirm(msg)) return
    setActionBusy(teacher.profile_id)
    const { error } = await setTeacherActive(teacher.profile_id, activate)
    setActionBusy(null)
    if (error) setFeedback({ type: 'error', text: getUserFacingError(error, 'save') })
    else {
      setFeedback({ type: 'ok', text: activate ? 'Enseignant réactivé.' : 'Enseignant désactivé.' })
      refresh()
    }
  }

  const runDelete = async (teacher) => {
    if (!canWrite) return
    if (!window.confirm(`Supprimer ${teacher.full_name} et son compte associé ?`)) return
    setActionBusy(teacher.profile_id + 'del')
    const { error } = await deleteTeacher(teacher.profile_id)
    setActionBusy(null)
    if (error) setFeedback({ type: 'error', text: getUserFacingError(error, 'permission') })
    else {
      setFeedback({ type: 'ok', text: 'Enseignant supprimé.' })
      refresh()
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          Équipe pédagogique
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Enseignants & simulateurs</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
              Fiches métier des moniteurs et simulateurs : autorisations RdvPermis, catégories et comptes utilisateurs.
            </p>
          </div>
          <button type="button" onClick={openCreate} className="pd-btn-primary shrink-0" disabled={!canWrite}>
            Ajouter une ressource
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
          <div className="p-5"><EmptyState title="Connexion requise" message="Connectez-vous avec votre compte gérant." icon="👨‍🏫" /></div>
        ) : loading ? (
          <p className="p-5 text-sm font-medium text-slate-500">Chargement des enseignants…</p>
        ) : loadError ? (
          <div className="p-5"><EmptyState title="Erreur de chargement" message={loadError} icon="⚠️" /></div>
        ) : teachers.length === 0 ? (
          <div className="p-5"><EmptyState title="Aucune ressource" message="Ajoutez un enseignant ou un simulateur." icon="👨‍🏫" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">N° autorisation</th>
                  <th className="px-4 py-3">Validité</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => {
                  const status = computeTeacherStatus({
                    isActive: teacher.is_active && teacher.account_is_active,
                    employmentStatus: teacher.employment_status,
                  })
                  const busy = actionBusy === teacher.profile_id || actionBusy === teacher.profile_id + 'del'
                  return (
                    <tr key={teacher.profile_id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-extrabold text-slate-900">{teacher.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{getResourceTypeLabel(teacher.resource_type)}</td>
                      <td className="px-4 py-3 text-slate-600">{teacher.phone || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{teacher.email || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{teacher.authorization_number || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateFr(teacher.authorization_expires_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${STATUS_BADGE[status.tone]}`}>
                          {!teacher.is_active || !teacher.account_is_active ? 'Désactivé' : status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <ActionBtn label="Voir" onClick={() => openView(teacher)} />
                          <ActionBtn label="Modifier" onClick={() => openEdit(teacher)} disabled={!canWrite} />
                          <ActionBtn
                            label={teacher.is_active && teacher.account_is_active ? 'Désactiver' : 'Réactiver'}
                            tone={teacher.is_active ? 'amber' : 'emerald'}
                            onClick={() => runDisable(teacher)}
                            disabled={!canWrite || busy}
                          />
                          <ActionBtn label="Supprimer" tone="rose" onClick={() => runDelete(teacher)} disabled={!canWrite || busy} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <TeacherFormModal
        open={formOpen}
        mode={formMode}
        teacher={selected}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
      />
      <TeacherDetailModal
        open={detailOpen}
        teacher={selected}
        onClose={() => setDetailOpen(false)}
        onEdit={openEdit}
      />
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
