import { useMemo, useState } from 'react'

const initialPayments = [
  { id: 1, student: 'Thomas Martin', formula: 'AAC 30h', paid: 1250, total: 1600, status: 'Partiel', method: 'CB' },
  { id: 2, student: 'Camille Leroy', formula: 'Permis B 20h', paid: 890, total: 1290, status: 'Relance', method: 'Virement' },
  { id: 3, student: 'Lucas Bernard', formula: 'Boîte auto', paid: 1490, total: 1490, status: 'Soldé', method: 'Chèque' },
]

export default function SecretaryPaiementsPage() {
  const [payments, setPayments] = useState(initialPayments)
  const [selectedId, setSelectedId] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    student: '',
    formula: 'Permis B 20h',
    amount: '',
    total: '1290',
    method: 'CB',
    note: '',
  })

  const selectedPayment = payments.find((payment) => payment.id === selectedId) || payments[0]
  const totals = useMemo(
    () => ({
      paid: payments.reduce((sum, payment) => sum + payment.paid, 0),
      remaining: payments.reduce((sum, payment) => sum + Math.max(payment.total - payment.paid, 0), 0),
      alerts: payments.filter((payment) => payment.status === 'Relance').length,
    }),
    [payments],
  )

  const savePayment = (event) => {
    event.preventDefault()
    const nextPayment = {
      id: Date.now(),
      student: form.student || 'Nouvel élève',
      formula: form.formula,
      paid: Number(form.amount || 0),
      total: Number(form.total || 0),
      method: form.method,
      status: Number(form.amount || 0) >= Number(form.total || 0) ? 'Soldé' : 'Partiel',
    }
    setPayments((current) => [nextPayment, ...current])
    setSelectedId(nextPayment.id)
    setShowForm(false)
  }

  const addReminder = (paymentId) => {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId ? { ...payment, status: 'Relance' } : payment,
      ),
    )
  }

  const markPaid = (paymentId) => {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId ? { ...payment, paid: payment.total, status: 'Soldé' } : payment,
      ),
    )
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
              <p className="mt-3 max-w-3xl text-base leading-7 text-cyan-50/85">
                Encaissements, restes à payer, relances et fiches financières élève.
              </p>
            </div>
            <button className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-navy-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-white" onClick={() => setShowForm(true)} type="button">
              + Nouvel encaissement
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Kpi label="Total encaissé" value={`${totals.paid} €`} />
        <Kpi label="Reste à payer" value={`${totals.remaining} €`} tone="amber" />
        <Kpi label="Relances actives" value={totals.alerts} tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-slate-950">Dossiers financiers</h2>
          <div className="mt-5 grid gap-3">
            {payments.map((payment) => {
              const progress = Math.min(100, Math.round((payment.paid / payment.total) * 100))
              return (
                <button className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${selectedId === payment.id ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-slate-50'}`} key={payment.id} onClick={() => setSelectedId(payment.id)} type="button">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-extrabold text-slate-950">{payment.student}</h3>
                      <p className="mt-1 text-sm text-slate-500">{payment.formula} · {payment.method}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">{payment.status}</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-600">{payment.paid} € / {payment.total} €</p>
                </button>
              )
            })}
          </div>
        </div>

        {selectedPayment && (
          <aside className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Fiche paiement</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">{selectedPayment.student}</h2>
            <p className="mt-2 text-sm text-slate-500">{selectedPayment.formula}</p>
            <div className="mt-5 grid gap-3">
              <Info label="Payé" value={`${selectedPayment.paid} €`} />
              <Info label="Reste" value={`${Math.max(selectedPayment.total - selectedPayment.paid, 0)} €`} />
              <Info label="Statut" value={selectedPayment.status} />
              <Info label="Moyen" value={selectedPayment.method} />
            </div>
            <div className="mt-5 grid gap-2">
              <button className="rounded-2xl bg-navy-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700" onClick={() => markPaid(selectedPayment.id)} type="button">
                Marquer comme soldé
              </button>
              <button className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-700 transition hover:bg-amber-100" onClick={() => addReminder(selectedPayment.id)} type="button">
                Envoyer une relance
              </button>
            </div>
          </aside>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
          <form className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white p-5 shadow-2xl" onSubmit={savePayment}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Encaissement</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Nouveau paiement</h2>
              </div>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600" onClick={() => setShowForm(false)} type="button">Fermer</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Élève" onChange={(value) => setForm((current) => ({ ...current, student: value }))} value={form.student} />
              <Field label="Formule" onChange={(value) => setForm((current) => ({ ...current, formula: value }))} value={form.formula} />
              <Field label="Montant encaissé" onChange={(value) => setForm((current) => ({ ...current, amount: value }))} type="number" value={form.amount} />
              <Field label="Total dossier" onChange={(value) => setForm((current) => ({ ...current, total: value }))} type="number" value={form.total} />
              <Select label="Moyen paiement" onChange={(value) => setForm((current) => ({ ...current, method: value }))} options={['CB', 'Virement', 'Chèque', 'Espèces']} value={form.method} />
              <Field label="Note" onChange={(value) => setForm((current) => ({ ...current, note: value }))} value={form.note} />
            </div>
            <div className="mt-5 flex justify-end">
              <button className="rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700" type="submit">Enregistrer</button>
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

function Field({ label, onChange, type = 'text', value }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} type={type} value={value} />
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
