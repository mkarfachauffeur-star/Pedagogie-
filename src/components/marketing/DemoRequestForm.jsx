import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { trackBookDemo, trackDemoFormSubmit } from '../../lib/analytics'
import { getUserFacingError } from '../../lib/userFacingError'
import { submitDemoRequest } from '../../services/demoRequests'
import {
  isValidSiret,
  sanitizePhoneInput,
  sanitizePostalCode,
  sanitizeSiret,
  validateOrgProfileForm,
} from '../../lib/orgProfile'

const ACTIVE_STUDENT_OPTIONS = [
  '1 à 50 élèves',
  '50 à 100 élèves',
  '100 à 300 élèves',
  '300 et +',
]

const emptyForm = {
  schoolName: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  postalCode: '',
  city: '',
  siret: '',
  prefectureApproval: '',
  website: '',
  activeStudents: ACTIVE_STUDENT_OPTIONS[0],
  message: '',
}

export default function DemoRequestForm({ id = 'demonstration', isDark = true }) {
  const inputClass = isDark
    ? 'mt-2 min-h-12 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white outline-none placeholder:text-slate-500 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20'
    : 'mt-2 min-h-12 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  const selectClass = isDark
    ? 'min-h-12 w-full appearance-none rounded-2xl border border-white/15 bg-white/[0.06] py-3 pl-4 pr-12 text-sm font-medium text-white outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20'
    : 'min-h-12 w-full appearance-none rounded-2xl border-2 border-slate-300 bg-white py-3 pl-4 pr-12 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  const labelClass = `block text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`
  const errorClass = isDark ? 'mt-1 text-xs font-semibold text-rose-300' : 'mt-1 text-xs font-semibold text-rose-600'
  const hintClass = isDark ? 'ml-1 text-xs font-medium text-slate-500' : 'ml-1 text-xs font-medium text-slate-400'

  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (feedback) setFeedback(null)
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const { ok, errors, message } = validateOrgProfileForm({
      orgName: form.schoolName,
      managerName: form.contactName,
      address: form.address,
      postalCode: form.postalCode,
      city: form.city,
      email: form.email,
      phone: form.phone,
      siret: form.siret,
      prefectureApproval: form.prefectureApproval,
      website: form.website,
    })

    if (!ok) {
      setFieldErrors({
        schoolName: errors.orgName,
        contactName: errors.managerName,
        address: errors.address,
        postalCode: errors.postalCode,
        city: errors.city,
        email: errors.email,
        phone: errors.phone,
        siret: errors.siret,
        website: errors.website,
      })
      setFeedback({ type: 'error', message })
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
    trackDemoFormSubmit()
    trackBookDemo({ school_name: form.schoolName.trim() || undefined })
    setForm(emptyForm)
    setFieldErrors({})
  }

  const siretOk = isValidSiret(form.siret)

  return (
    <section className="relative scroll-mt-28" id={id}>
      <div
        className={
          isDark
            ? 'rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-blue-950/20 sm:p-8'
            : 'rounded-[1.75rem] border-2 border-slate-300 bg-white p-6 shadow-xl sm:p-8'
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
            Renseignez le profil de votre auto-école : nous vous présenterons Pedagogia Drive et les conditions d&apos;accès à la bêta privée.
          </p>
        </div>

        <form className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2" noValidate onSubmit={handleSubmit}>
          <label className={`${labelClass} sm:col-span-2`}>
            Nom de l&apos;auto-école *
            <input
              className={inputClass}
              onChange={(event) => update('schoolName', event.target.value)}
              placeholder="Ex : Auto-École Horizon"
              required
              value={form.schoolName}
            />
            {fieldErrors.schoolName && <p className={errorClass}>{fieldErrors.schoolName}</p>}
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            Nom du gérant *
            <input
              className={inputClass}
              onChange={(event) => update('contactName', event.target.value)}
              placeholder="Nom et prénom"
              required
              value={form.contactName}
            />
            {fieldErrors.contactName && <p className={errorClass}>{fieldErrors.contactName}</p>}
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            Adresse de l&apos;auto-école *
            <input
              autoComplete="street-address"
              className={inputClass}
              onChange={(event) => update('address', event.target.value)}
              placeholder="Numéro et rue"
              required
              value={form.address}
            />
            {fieldErrors.address && <p className={errorClass}>{fieldErrors.address}</p>}
          </label>

          <label className={labelClass}>
            Code postal *
            <input
              autoComplete="postal-code"
              className={inputClass}
              inputMode="numeric"
              maxLength={5}
              onChange={(event) => update('postalCode', sanitizePostalCode(event.target.value))}
              placeholder="75001"
              required
              value={form.postalCode}
            />
            {fieldErrors.postalCode && <p className={errorClass}>{fieldErrors.postalCode}</p>}
          </label>

          <label className={labelClass}>
            Ville *
            <input
              autoComplete="address-level2"
              className={inputClass}
              onChange={(event) => update('city', event.target.value)}
              placeholder="Paris"
              required
              value={form.city}
            />
            {fieldErrors.city && <p className={errorClass}>{fieldErrors.city}</p>}
          </label>

          <label className={labelClass}>
            Téléphone *
            <input
              className={inputClass}
              inputMode="tel"
              onChange={(event) => update('phone', sanitizePhoneInput(event.target.value))}
              placeholder="06 12 34 56 78"
              required
              type="tel"
              value={form.phone}
            />
            {fieldErrors.phone && <p className={errorClass}>{fieldErrors.phone}</p>}
          </label>

          <label className={labelClass}>
            E-mail *
            <input
              className={inputClass}
              onChange={(event) => update('email', event.target.value)}
              placeholder="contact@auto-ecole.fr"
              required
              type="email"
              value={form.email}
            />
            {fieldErrors.email && <p className={errorClass}>{fieldErrors.email}</p>}
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            SIRET *
            <input
              className={inputClass}
              inputMode="numeric"
              maxLength={14}
              onChange={(event) => update('siret', sanitizeSiret(event.target.value))}
              placeholder="14 chiffres"
              required
              value={form.siret}
            />
            {fieldErrors.siret && <p className={errorClass}>{fieldErrors.siret}</p>}
            {!fieldErrors.siret && form.siret.length > 0 && !siretOk && (
              <p className={errorClass}>Le SIRET doit contenir exactement 14 chiffres ({form.siret.length}/14).</p>
            )}
          </label>

          <label className={labelClass}>
            N° agrément préfectoral
            <span className={hintClass}>(facultatif)</span>
            <input
              className={inputClass}
              onChange={(event) => update('prefectureApproval', event.target.value)}
              value={form.prefectureApproval}
            />
          </label>

          <label className={labelClass}>
            Site internet
            <span className={hintClass}>(facultatif)</span>
            <input
              className={inputClass}
              onChange={(event) => update('website', event.target.value)}
              placeholder="https://www.exemple.fr"
              type="url"
              value={form.website}
            />
            {fieldErrors.website && <p className={errorClass}>{fieldErrors.website}</p>}
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            Nombre d&apos;élèves actifs par année
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

          <label className={`${labelClass} sm:col-span-2`}>
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

          <div className="flex flex-col items-center gap-2 sm:col-span-2">
            <button
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
              disabled={submitting || (form.siret.length > 0 && !siretOk)}
              type="submit"
            >
              {submitting ? 'Envoi en cours…' : 'Demander une démonstration'}
            </button>
            {form.siret.length > 0 && !siretOk && (
              <p className={errorClass}>Le SIRET doit contenir exactement 14 chiffres pour envoyer le formulaire.</p>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
