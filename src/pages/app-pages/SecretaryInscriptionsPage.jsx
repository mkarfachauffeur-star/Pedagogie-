import { useCallback, useEffect, useMemo, useState } from 'react'
import AddStudentModal from '../../components/AddStudentModal'
import EmptyState from '../../components/ui/EmptyState'
import ListSearchField from '../../components/ui/ListSearchField'
import PaginationBar from '../../components/ui/PaginationBar'
import { useAuth } from '../../context/AuthContext'
import { matchStudentSearch, useClientPagination } from '../../hooks/useClientPagination'
import { listStudents, subscribeStudents } from '../../services/students'
import { contractsMap, getStudentSummary } from '../../services/finance'
import { supabase } from '../../lib/supabase'

function formatDateFr(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('fr-FR')
  } catch {
    return value
  }
}

export default function SecretaryInscriptionsPage() {
  const { profileId } = useAuth()
  const [students, setStudents] = useState([])
  const [contracts, setContracts] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    page,
    setPage,
    totalPages,
    totalItems,
    pageItems,
    pageSize,
  } = useClientPagination(students, {
    pageSize: 8,
    query: searchQuery,
    filterFn: matchStudentSearch,
  })

  const refresh = useCallback(async () => {
    if (!profileId) {
      setStudents([])
      setContracts([])
      setPayments([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    const [{ students: rows, error }, contractsRes, paymentsRes] = await Promise.all([
      listStudents(),
      supabase.from('contracts').select('student_id, contract_total'),
      supabase.from('payments').select('student_id, amount'),
    ])
    if (error) setLoadError('Impossible de charger les dossiers.')
    setStudents(rows)
    setContracts(contractsRes.data || [])
    setPayments(paymentsRes.data || [])
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!profileId) return undefined
    const cleanupStudents = subscribeStudents(refresh)
    const cleanupContracts = supabase
      .channel(`secretary-contracts:${profileId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, refresh)
      .subscribe()
    const cleanupPayments = supabase
      .channel(`secretary-payments:${profileId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, refresh)
      .subscribe()

    return () => {
      cleanupStudents()
      supabase.removeChannel(cleanupContracts)
      supabase.removeChannel(cleanupPayments)
    }
  }, [profileId, refresh])

  const contractTotals = useMemo(() => contractsMap(contracts), [contracts])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            Secrétariat
          </span>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Inscriptions auto-école
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-blue-50">
                Créez un dossier élève avec le même formulaire que le gérant. Les inscriptions sont synchronisées en temps réel.
              </p>
            </div>
            <button
              className="pd-btn-primary shrink-0"
              onClick={() => setShowForm(true)}
              type="button"
            >
              + Nouvelle inscription
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">Dossiers enregistrés</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chaque inscription enregistrée apparaît immédiatement ici.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ListSearchField onChange={setSearchQuery} value={searchQuery} />
          {!loading && students.length > 0 && (
            <p className="text-xs font-semibold text-slate-500">{totalItems} dossier(s)</p>
          )}
        </div>
        <div className="mt-5 grid gap-3">
          {!profileId ? (
            <EmptyState title="Connexion requise" message="Connectez-vous avec votre compte secrétariat." icon="🗂️" />
          ) : loading ? (
            <p className="text-sm font-medium text-slate-500">Chargement des dossiers…</p>
          ) : loadError ? (
            <EmptyState title="Erreur de chargement" message={loadError} icon="⚠️" />
          ) : students.length === 0 ? (
            <EmptyState title="Aucun dossier disponible" message="Créez une nouvelle inscription pour commencer." icon="🗂️" />
          ) : pageItems.length === 0 ? (
            <EmptyState title="Aucun résultat" message="Aucun dossier ne correspond à votre recherche." icon="🔍" />
          ) : (
            pageItems.map((student) => {
              const summary = getStudentSummary(student.id, payments, contractTotals)
              return (
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={student.id}>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-extrabold text-slate-950">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {student.file_number || 'Dossier en cours'} · {student.package_name || student.formation_type || 'Formule non renseignée'}
                      </p>
                      {student.email && <p className="mt-1 text-xs text-slate-500">{student.email}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                        {student.package_name || student.formation_type || 'Formule non renseignée'}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          student.code_status === 'Obtenu'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        Code {student.code_status === 'Obtenu' ? 'obtenu' : 'non obtenu'}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {student.status || 'En attente'}
                      </span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                        Reste {summary.remaining.toFixed(0)} €
                      </span>
                      {student.registration_date && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          Inscrit le {formatDateFr(student.registration_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
        {!loading && students.length > 0 && (
          <PaginationBar
            className="mt-4"
            onPageChange={setPage}
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
          />
        )}
      </section>

      <AddStudentModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onCreated={() => refresh()}
      />
    </div>
  )
}
