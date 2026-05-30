import { useMemo, useState } from 'react'
import EmptyState from '../../components/ui/EmptyState'
import { useStudentTrackingStore } from '../../data/studentTrackingStore'
import {
  PAYMENT_METHODS,
  PAYMENT_NATURES,
  usePaymentsStore,
} from '../../data/encaissementsStore'

const todayIso = () => new Date().toISOString().slice(0, 10)
const formatEur = (value) => `${Number(value || 0).toLocaleString('fr-FR')} €`
const formatDateFr = (value) => {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

const emptyForm = {
  studentId: '',
  nature: PAYMENT_NATURES[0],
  amount: '',
  date: todayIso(),
  method: PAYMENT_METHODS[0],
  comment: '',
  contractTotal: '',
}

export default function SecretaryPaiementsPage() {
  const { students } = useStudentTrackingStore()
  const { encaissements, addEncaissement, getStudentSummary, getStudentEncaissements } = usePaymentsStore()

  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const studentName = (student) => (student ? `${student.firstName} ${student.lastName}` : '')

  const totals = useMemo(() => {
    const paid = encaissements.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const remaining = students.reduce((sum, student) => sum + getStudentSummary(student.id).remaining, 0)
    return { paid, remaining, count: encaissements.length }
  }, [encaissements, students, getStudentSummary])

  const selectedStudent = students.find((student) => student.id === selectedStudentId) || students[0] || null
  const selectedSummary = selectedStudent ? getStudentSummary(selectedStudent.id) : { contractTotal: 0, paid: 0, remaining: 0 }
  const selectedHistory = selectedStudent ? getStudentEncaissements(selectedStudent.id) : []

  // Récapitulatif automatique du formulaire (calcul en direct).
  const formSummary = useMemo(() => {
    const base = form.studentId ? getStudentSummary(form.studentId) : { contractTotal: 0, paid: 0 }
    const contractTotal = form.contractTotal !== '' ? Number(form.contractTotal) || 0 : base.contractTotal
    const alreadyPaid = base.paid
    const remainingBefore = Math.max(contractTotal - alreadyPaid, 0)
    const remainingAfter = Math.max(contractTotal - alreadyPaid - Number(form.amount || 0), 0)
    return { contractTotal, alreadyPaid, remainingBefore, remainingAfter }
  }, [form.studentId, form.contractTotal, form.amount, getStudentSummary])

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const openForm = () => {
    const presetId = selectedStudent?.id || ''
    const presetContract = presetId ? getStudentSummary(presetId).contractTotal : 0
    setForm({
      ...emptyForm,
      date: todayIso(),
      studentId: presetId,
      contractTotal: presetContract ? String(presetContract) : '',
    })
    setShowForm(true)
  }

  const handleSelectStudentInForm = (studentId) => {
    const summary = studentId ? getStudentSummary(studentId) : { contractTotal: 0 }
    setForm((current) => ({
      ...current,
      studentId,
      contractTotal: summary.contractTotal ? String(summary.contractTotal) : '',
    }))
  }

  const canSubmit = Boolean(form.studentId) && Number(form.amount) > 0 && Boolean(form.date) && Boolean(form.method)

  const saveEncaissement = (event) => {
    event.preventDefault()
    if (!canSubmit) return
    const student = students.find((item) => item.id === form.studentId)
    addEncaissement({
      studentId: form.studentId,
      studentName: studentName(student),
      amount: form.amount,
      date: form.date,
      method: form.method,
      nature: form.nature,
      comment: form.comment,
      contractTotal: form.contractTotal,
    })
    setSelectedStudentId(form.studentId)
    setShowForm(false)
    setForm(emptyForm)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            Paiements
          </span>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Gestion des encaissements</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-blue-50">
                Encaissements rattachés aux dossiers élèves, restes à payer et historique financier.
              </p>
            </div>
            <button
              className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-navy-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={openForm}
              type="button"
              disabled={students.length === 0}
            >
              + Nouvel encaissement
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Kpi label="Total encaissé" value={formatEur(totals.paid)} />
        <Kpi label="Reste à payer" value={formatEur(totals.remaining)} tone="amber" />
        <Kpi label="Encaissements enregistrés" value={totals.count} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-slate-950">Dossiers financiers</h2>
          <div className="mt-5 grid gap-3">
            {students.length === 0 && (
              <EmptyState
                title="Aucun dossier élève"
                message="Créez d'abord une inscription pour pouvoir enregistrer un encaissement."
                icon="💳"
              />
            )}
            {students.map((student) => {
              const summary = getStudentSummary(student.id)
              const progress = summary.contractTotal > 0
                ? Math.min(100, Math.round((summary.paid / summary.contractTotal) * 100))
                : 0
              const status = summary.contractTotal === 0
                ? 'À configurer'
                : summary.remaining === 0
                  ? 'Soldé'
                  : 'Partiel'
              return (
                <button
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${selectedStudent?.id === student.id ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-slate-50'}`}
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  type="button"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-extrabold text-slate-950">{studentName(student)}</h3>
                      <p className="mt-1 text-sm text-slate-500">{student.formationType || 'Formation'} · {student.id}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">{status}</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-600">{formatEur(summary.paid)} / {formatEur(summary.contractTotal)}</p>
                </button>
              )
            })}
          </div>
        </div>

        {selectedStudent && (
          <aside className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Fiche financière</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">{studentName(selectedStudent)}</h2>
            <p className="mt-2 text-sm text-slate-500">{selectedStudent.formationType || 'Formation'}</p>
            <div className="mt-5 grid gap-3">
              <Info label="Montant du contrat" value={formatEur(selectedSummary.contractTotal)} />
              <Info label="Déjà encaissé" value={formatEur(selectedSummary.paid)} />
              <Info label="Reste à payer" value={formatEur(selectedSummary.remaining)} />
            </div>

            <div className="mt-6">
              <p className="text-sm font-black text-slate-700">Historique des encaissements</p>
              <div className="mt-3 grid gap-2">
                {selectedHistory.length === 0 && <InlineNotice label="Aucun encaissement enregistré." />}
                {selectedHistory.map((item) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3" key={item.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-slate-950">{formatEur(item.amount)}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">{item.method}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatDateFr(item.paidAt)} · {item.nature}
                    </p>
                    {item.comment && <p className="mt-1 text-xs text-slate-500">{item.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
          <form className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-5 shadow-2xl" onSubmit={saveEncaissement}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Encaissement</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Nouvel encaissement</h2>
              </div>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600" onClick={() => setShowForm(false)} type="button">Fermer</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-700">Élève (dossier) *</span>
                <select
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                  onChange={(event) => handleSelectStudentInForm(event.target.value)}
                  value={form.studentId}
                >
                  <option value="">Sélectionner un dossier élève…</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {studentName(student)} · {student.id}
                    </option>
                  ))}
                </select>
              </label>

              <Select label="Nature du paiement *" onChange={(value) => updateForm('nature', value)} options={PAYMENT_NATURES} value={form.nature} />
              <Select label="Mode de paiement *" onChange={(value) => updateForm('method', value)} options={PAYMENT_METHODS} value={form.method} />
              <Field label="Montant encaissé (€) *" onChange={(value) => updateForm('amount', value)} type="number" value={form.amount} />
              <Field label="Date d'encaissement *" onChange={(value) => updateForm('date', value)} type="date" value={form.date} />
              <Field label="Montant du contrat (€)" onChange={(value) => updateForm('contractTotal', value)} type="number" value={form.contractTotal} />
              <Textarea label="Commentaire (optionnel)" onChange={(value) => updateForm('comment', value)} value={form.comment} />
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 p-4">
              <p className="text-sm font-black text-cyan-800">Récapitulatif</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Info label="Montant du contrat" value={formatEur(formSummary.contractTotal)} />
                <Info label="Déjà encaissé" value={formatEur(formSummary.alreadyPaid)} />
                <Info label="Reste à payer avant paiement" value={formatEur(formSummary.remainingBefore)} />
                <Info label="Reste à payer après validation" value={formatEur(formSummary.remainingAfter)} />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-400">
                {canSubmit ? 'Prêt à enregistrer.' : 'Renseignez l\u2019élève, le montant, la date et le mode de paiement.'}
              </p>
              <button
                className="rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={!canSubmit}
              >
                Enregistrer l'encaissement
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, tone = 'cyan', value }) {
  const color = tone === 'rose' ? 'text-rose-600' : tone === 'amber' ? 'text-amber-600' : 'text-cyan-600'
  return (
    <article className="rounded-[1.5rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-soft)]">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </article>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-extrabold text-slate-900">{value}</p>
    </div>
  )
}

function InlineNotice({ label }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
      {label}
    </div>
  )
}

function Field({ label, onChange, type = 'text', value }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  )
}

function Textarea({ label, onChange, value }) {
  return (
    <label className="block md:col-span-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <textarea className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  )
}

function Select({ label, onChange, options, value }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <select className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}
