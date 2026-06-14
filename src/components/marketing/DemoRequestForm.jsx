import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getUserFacingError } from '../../lib/userFacingError'
import { submitDemoRequest } from '../../services/demoRequests'

const ACTIVE_STUDENT_OPTIONS = [
  '1 à 50 élèves',
  '50 à 100 élèves',
  '100 à 300 élèves',
  '300 et +',
]

export default function DemoRequestForm({ id = 'demonstration', isDark = true }) {
  const inputClass = isDark
    ? 'mt-2 min-h-12 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white outline-none placeholder:text-slate-500 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20'
    : 'mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  const selectClass = isDark
    ? 'min-h-12 w-full appearance-none rounded-2xl border border-white/15 bg-white/[0.06] py-3 pl-4 pr-12 text-sm font-medium text-white outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20'
    : 'min-h-12 w-full appearance-none rounded-2xl border border-slate-300 bg-white py-3 pl-4 pr-12 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

  const [form, setForm] = useState({
    schoolName: '',
    contactName: '',
    phone: '',
    email: '',
    activeStudents: ACTIVE_STUDENT_OPTIONS[0],
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (feedback) setFeedback(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.schoolName.trim() || !form.contactName.trim() || !form.phone.trim() || !form.email.trim()) {
      setFeedback({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires.' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    const { error } = await submitDemoRequest(form)
    setSubmitting(false)

    if (error) {
      setFeedback({ type: 'error', message: getUserFacingError(error, 'save') })
      return
    }

    setFeedback({
      type: 'ok',
      message: 'Demande enregistrée. Nous vous recontacterons rapidement pour organiser une démonstration.',
    })
    setForm({
      schoolName: '',
      contactName: '',
      phone: '',
      email: '',
      activeStudents: ACTIVE_STUDENT_OPTIONS[0],
      message: '',
    })
  }

  return (
    <section className="relative scroll-mt-28" id={id}>
      <div
        className={
          isDark
            ? 'rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-blue-950/20 sm:p-8'
            : 'rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8'
        }
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className={`text-xs font-black uppercase tracking-[0.16em] ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
            Accès sur invitation
          </p>
          <h2 className={`mt-3 text-2xl font-black sm:text-3xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Demander une démonstration
          </h2>
          <p className={`mt-3 text-sm leading-7 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Décrivez votre auto-école : nous vous présenterons Pedagogia Drive et les conditions d&apos;accès à la bêta privée.
          </p>
        </div>

        <form className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className={`block text-sm font-bold sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            Nom de l&apos;auto-école
            <input
              className={inputClass}
              onChange={(event) => update('schoolName', event.target.value)}
              placeholder="Ex : Auto-École Horizon"
              required
              value={form.schoolName}
            />
          </label>
          <label className={`block text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            Nom du responsable
            <input
              className={inputClass}
              onChange={(event) => update('contactName', event.target.value)}
              placeholder="Nom et prénom"
              required
              value={form.contactName}
            />
          </label>
          <label className={`block text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            Téléphone
            <input
              className={inputClass}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="06 12 34 56 78"
              required
              type="tel"
              value={form.phone}
            />
          </label>
          <label className={`block text-sm font-bold sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            E-mail
            <input
              className={inputClass}
              onChange={(event) => update('email', event.target.value)}
              placeholder="contact@auto-ecole.fr"
              required
              type="email"
              value={form.email}
            />
          </label>
          <label className={`block text-sm font-bold sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            Nombre d&apos;élèves actifs
            <div className="relative mt-2">
              <select
                className={selectClass}
                onChange={(event) => update('activeStudents', event.target.value)}
                required
                value={form.activeStudents}
              >
                {ACTIVE_STUDENT_OPTIONS.map((option) => (
                  <option className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              />
            </div>
          </label>
          <label className={`block text-sm font-bold sm:col-span-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            Message
            <textarea
              className={`${inputClass} min-h-28 resize-y py-3`}
              onChange={(event) => update('message', event.target.value)}
              placeholder="Vos besoins, votre organisation, vos questions…"
              value={form.message}
            />
          </label>

          {feedback && (
            <p
              className={`rounded-2xl px-4 py-3 text-sm font-semibold sm:col-span-2 ${
                feedback.type === 'error'
                  ? isDark
                    ? 'border border-rose-400/30 bg-rose-500/10 text-rose-100'
                    : 'border border-rose-200 bg-rose-50 text-rose-700'
                  : isDark
                    ? 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {feedback.message}
            </p>
          )}

          <div className="sm:col-span-2">
            <button
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Envoi en cours…' : 'Demander une démonstration'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
