import { useMemo, useState } from 'react'

const initialExams = [
  { id: 1, student: 'Nadia Roux', type: 'Permis B', date: '2026-05-22', hour: '08:30', teacher: 'Jean Moniteur', center: 'Centre Nord', status: 'Confirmé' },
  { id: 2, student: 'Camille Leroy', type: 'Code', date: '2026-05-24', hour: '10:00', teacher: 'Sofia Bernard', center: 'La Poste', status: 'À confirmer' },
  { id: 3, student: 'Lucas Bernard', type: 'Boîte auto', date: '2026-05-28', hour: '14:00', teacher: 'Karim Lefevre', center: 'Centre Sud', status: 'Dossier incomplet' },
]

export default function SecretaryExamsPage() {
  const [exams, setExams] = useState(initialExams)
  const [selectedId, setSelectedId] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    student: '',
    type: 'Permis B',
    date: '2026-05-30',
    hour: '09:00',
    teacher: 'Jean Moniteur',
    center: 'Centre Nord',
    status: 'À confirmer',
  })

  const selectedExam = exams.find((exam) => exam.id === selectedId) || exams[0]
  const stats = useMemo(
    () => ({
      confirmed: exams.filter((exam) => exam.status === 'Confirmé').length,
      pending: exams.filter((exam) => exam.status === 'À confirmer').length,
      blocked: exams.filter((exam) => exam.status === 'Dossier incomplet').length,
    }),
    [exams],
  )

  const saveExam = (event) => {
    event.preventDefault()
    const nextExam = { ...form, id: Date.now() }
    setExams((current) => [nextExam, ...current])
    setSelectedId(nextExam.id)
    setShowForm(false)
  }

  const updateStatus = (examId, status) => {
    setExams((current) => current.map((exam) => (exam.id === examId ? { ...exam, status } : exam)))
  }

  const deleteExam = (examId) => {
    setExams((current) => current.filter((exam) => exam.id !== examId))
    setSelectedId(exams[0]?.id || null)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            Examens
          </span>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Planification des examens</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-blue-50">
                Réservations, centres, enseignants référents, statuts et dossiers incomplets.
              </p>
            </div>
            <button className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-navy-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-white" onClick={() => setShowForm(true)} type="button">
              + Planifier un examen
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Kpi label="Confirmés" value={stats.confirmed} />
        <Kpi label="À confirmer" value={stats.pending} tone="amber" />
        <Kpi label="Dossiers bloqués" value={stats.blocked} tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold text-slate-950">Sessions à venir</h2>
          <div className="mt-5 grid gap-3">
            {exams.map((exam) => (
              <button className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${selectedId === exam.id ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-slate-50'}`} key={exam.id} onClick={() => setSelectedId(exam.id)} type="button">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-950">{exam.student}</h3>
                    <p className="mt-1 text-sm text-slate-500">{exam.type} · {exam.date} à {exam.hour} · {exam.center}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">{exam.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedExam && (
          <aside className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Fiche examen</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">{selectedExam.student}</h2>
            <p className="mt-2 text-sm text-slate-500">{selectedExam.type} · {selectedExam.center}</p>
            <div className="mt-5 grid gap-3">
              <Info label="Date" value={`${selectedExam.date} à ${selectedExam.hour}`} />
              <Info label="Enseignant" value={selectedExam.teacher} />
              <Info label="Statut" value={selectedExam.status} />
            </div>
            <div className="mt-5 grid gap-2">
              <button className="rounded-2xl bg-navy-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700" onClick={() => updateStatus(selectedExam.id, 'Confirmé')} type="button">
                Confirmer
              </button>
              <button className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-700 transition hover:bg-amber-100" onClick={() => updateStatus(selectedExam.id, 'À confirmer')} type="button">
                Mettre en attente
              </button>
              <button className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100" onClick={() => updateStatus(selectedExam.id, 'Dossier incomplet')} type="button">
                Dossier incomplet
              </button>
              <button className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-rose-500" onClick={() => deleteExam(selectedExam.id)} type="button">
                Supprimer
              </button>
            </div>
          </aside>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
          <form className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white p-5 shadow-2xl" onSubmit={saveExam}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Nouvelle session</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Planifier un examen</h2>
              </div>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600" onClick={() => setShowForm(false)} type="button">Fermer</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Élève" onChange={(value) => setForm((current) => ({ ...current, student: value }))} value={form.student} />
              <Select label="Type" onChange={(value) => setForm((current) => ({ ...current, type: value }))} options={['Code', 'Permis B', 'AAC', 'Boîte auto', 'Examen blanc']} value={form.type} />
              <Field label="Date" onChange={(value) => setForm((current) => ({ ...current, date: value }))} type="date" value={form.date} />
              <Field label="Heure" onChange={(value) => setForm((current) => ({ ...current, hour: value }))} type="time" value={form.hour} />
              <Field label="Enseignant référent" onChange={(value) => setForm((current) => ({ ...current, teacher: value }))} value={form.teacher} />
              <Field label="Centre" onChange={(value) => setForm((current) => ({ ...current, center: value }))} value={form.center} />
              <Select label="Statut" onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={['Confirmé', 'À confirmer', 'Dossier incomplet']} value={form.status} />
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
