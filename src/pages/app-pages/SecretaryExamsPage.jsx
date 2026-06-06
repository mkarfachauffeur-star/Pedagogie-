import { useMemo, useState } from 'react'
import EmptyState from '../../components/ui/EmptyState'
import AppModal, { AppModalFooter } from '../../components/ui/AppModal'
import WeekdayDatePicker from '../../components/ui/WeekdayDatePicker'

const initialExams = []

// Créneaux horaires disponibles : 8h → 16h par tranches de 30 min,
// pause déjeuner 12h-13h exclue. (Avant 8h et après 16h non proposés.)
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
]

// Les dimanches ne sont pas sélectionnables (lundi au samedi uniquement).
function isSunday(value) {
  if (!value) return false
  return new Date(`${value}T12:00:00`).getDay() === 0
}

export default function SecretaryExamsPage() {
  const [exams, setExams] = useState(initialExams)
  const [selectedId, setSelectedId] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    student: '',
    type: 'Permis B',
    date: '2026-05-30',
    hour: '09:00',
    teacher: '',
    center: '',
    status: 'À confirmer',
  })

  const handleDateChange = (value) => setForm((current) => ({ ...current, date: value }))

  const dateInvalid = !form.date || isSunday(form.date)

  const openCreate = () => {
    setEditingId(null)
    setForm({ student: '', type: 'Permis B', date: '2026-05-30', hour: '09:00', teacher: '', center: '', status: 'À confirmer' })
    setShowForm(true)
  }

  const openEdit = (exam) => {
    setEditingId(exam.id)
    setSelectedId(exam.id)
    setForm({
      student: exam.student,
      type: exam.type,
      date: exam.date,
      hour: exam.hour,
      teacher: exam.teacher,
      center: exam.center,
      status: exam.status,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
  }

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
    if (dateInvalid) return
    if (editingId) {
      setExams((current) => current.map((exam) => (exam.id === editingId ? { ...exam, ...form } : exam)))
      setSelectedId(editingId)
    } else {
      const nextExam = { ...form, id: Date.now() }
      setExams((current) => [nextExam, ...current])
      setSelectedId(nextExam.id)
    }
    closeForm()
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
            <button className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-navy-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-white" onClick={openCreate} type="button">
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
            {exams.length === 0 ? (
              <EmptyState title="Aucun résultat disponible" message="Aucun résultat disponible pour le moment." icon="🎫" />
            ) : (
              exams.map((exam) => (
                <button className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${selectedId === exam.id ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-slate-50'}`} key={exam.id} onClick={() => openEdit(exam)} type="button">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-extrabold text-slate-950">{exam.student}</h3>
                      <p className="mt-1 text-sm text-slate-500">{exam.type} · {exam.date} à {exam.hour} · {exam.center}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">{exam.status}</span>
                  </div>
                </button>
              ))
            )}
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

      <AppModal
        open={showForm}
        onClose={closeForm}
        eyebrow={editingId ? 'Modification' : 'Nouvelle session'}
        title={editingId ? 'Modifier l\u2019examen' : 'Planifier un examen'}
        size="lg"
        footer={(
          <AppModalFooter
            onClose={closeForm}
            submitForm="exam-form"
            submitLabel={editingId ? 'Enregistrer les modifications' : 'Enregistrer'}
            submitDisabled={dateInvalid}
          />
        )}
      >
        <form id="exam-form" className="grid gap-4 md:grid-cols-2" onSubmit={saveExam}>
          <Field label="Élève" onChange={(value) => setForm((current) => ({ ...current, student: value }))} value={form.student} />
          <Select label="Type" onChange={(value) => setForm((current) => ({ ...current, type: value }))} options={['Code', 'Permis B', 'AAC', 'Boîte auto', 'Examen blanc']} value={form.type} />
          <WeekdayDatePicker label="Date (lundi au samedi)" value={form.date} onChange={handleDateChange} />
          <Select label="Heure" onChange={(value) => setForm((current) => ({ ...current, hour: value }))} options={TIME_SLOTS} value={form.hour} />
          <Field label="Enseignant référent" onChange={(value) => setForm((current) => ({ ...current, teacher: value }))} value={form.teacher} />
          <Field label="Centre d'examen" onChange={(value) => setForm((current) => ({ ...current, center: value }))} value={form.center} />
          <Select label="Statut" onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={['Confirmé', 'À confirmer', 'Dossier incomplet']} value={form.status} />
        </form>
      </AppModal>
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
