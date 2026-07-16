import { ArrowLeft } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import BetaDevelopmentBanner from '../components/marketing/BetaDevelopmentBanner'
import PublicFooter from '../components/marketing/PublicFooter'
import { submitOrganizationSignupRequest } from '../services/organizationSignupRequests'
import { GENDER_OPTIONS, normalizeGender } from '../lib/genderedRoles'
import { getUserFacingError } from '../lib/userFacingError'

const inputClass =
  'mt-2 min-h-12 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100'

function validatePreRegistrationForm(form) {
  const requiredFields = [
    ['orgName', "Le nom de l'auto-école est obligatoire."],
    ['address', "L'adresse est obligatoire."],
    ['postalCode', 'Le code postal est obligatoire.'],
    ['city', 'La ville est obligatoire.'],
    ['prefectureApproval', "Le numéro d'agrément préfectoral est obligatoire."],
    ['managerFirstName', 'Le prénom est obligatoire.'],
    ['managerLastName', 'Le nom est obligatoire.'],
    ['email', "L'e-mail est obligatoire."],
    ['phone', 'Le téléphone est obligatoire.'],
  ]

  for (const [field, message] of requiredFields) {
    if (!String(form[field] || '').trim()) return message
  }

  if (form.siret.length !== 14) {
    return 'Le SIRET doit contenir exactement 14 chiffres.'
  }

  if (!/^\d{5}$/.test(form.postalCode.trim())) {
    return 'Le code postal doit contenir 5 chiffres.'
  }

  if (!normalizeGender(form.managerGender)) {
    return 'Le genre est obligatoire.'
  }

  const email = form.email.trim()
  if (!email.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "L'e-mail doit être valide et contenir un @."
  }

  return null
}

function SiretInput({ value, onChange, invalid }) {
  const inputRef = useRef(null)
  const [focused, setFocused] = useState(false)

  const handleChange = (raw) => {
    onChange(raw.replace(/\D/g, '').slice(0, 14))
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        autoComplete="off"
        className="sr-only"
        id="siret"
        inputMode="numeric"
        required
        value={value}
        onBlur={() => setFocused(false)}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
      />
      <div
        className={`cursor-text rounded-2xl border bg-white px-2 py-3 transition sm:px-3 ${
          invalid
            ? 'border-rose-300 ring-4 ring-rose-100'
            : focused
              ? 'border-cyan-300 ring-4 ring-cyan-100'
              : 'border-slate-300'
        }`}
        onClick={() => inputRef.current?.focus()}
        onKeyDown={() => inputRef.current?.focus()}
        role="presentation"
      >
        <div className="flex justify-between gap-px sm:gap-0.5">
          {Array.from({ length: 14 }).map((_, index) => {
            const digit = value[index] || ''
            const isActive = focused && index === value.length && value.length < 14
            return (
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5" key={index}>
                <span className="flex h-6 items-center text-sm font-bold tabular-nums text-slate-800 sm:text-base">
                  {digit}
                </span>
                <span
                  className={`h-0.5 w-full max-w-4 rounded-full transition-colors ${
                    digit ? 'bg-cyan-500' : isActive ? 'bg-cyan-400' : 'bg-slate-300'
                  }`}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const [form, setForm] = useState({
    orgName: '',
    managerFirstName: '',
    managerLastName: '',
    managerGender: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    siret: '',
    prefectureApproval: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const siretInvalid = form.siret.length > 0 && form.siret.length !== 14

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    const validationError = validatePreRegistrationForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setBusy(true)
    const { error: saveError } = await submitOrganizationSignupRequest({
      orgName: form.orgName,
      managerFirstName: form.managerFirstName,
      managerLastName: form.managerLastName,
      managerGender: form.managerGender,
      email: form.email,
      phone: form.phone,
      address: form.address,
      postalCode: form.postalCode,
      city: form.city,
      siret: form.siret,
      prefectureApproval: form.prefectureApproval,
    })
    setBusy(false)

    if (saveError) {
      setError(getUserFacingError(saveError, 'save'))
      return
    }

    setSuccess(true)
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-950">
      <BetaDevelopmentBanner isDark />
      <div className="flex-1 px-4 py-10">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <BrandLogo />
            <Link
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-cyan-100 shadow-sm backdrop-blur transition hover:border-white/25 hover:bg-white/10 hover:text-white"
              to="/"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" />
              Retour accueil
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl md:p-8">
            <h1 className="text-3xl font-extrabold text-slate-950">Pré-inscription</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pedagogia Drive est en version bêta. Déposez votre demande — notre équipe vous
              contactera pour activer votre accès.
            </p>

            {success ? (
              <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-sm font-semibold leading-7 text-emerald-800">
                  Votre demande a bien été enregistrée. Notre équipe vous contactera prochainement.
                </p>
                <Link className="pd-btn-primary mt-6 inline-flex" to="/">
                  Retour à l&apos;accueil
                </Link>
              </div>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <section>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">Nom de l&apos;auto-école *</span>
                      <input className={inputClass} required value={form.orgName} onChange={(e) => update('orgName', e.target.value)} />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">Adresse *</span>
                      <input
                        autoComplete="street-address"
                        className={inputClass}
                        placeholder="Numéro et rue"
                        required
                        value={form.address}
                        onChange={(e) => update('address', e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">Code postal *</span>
                      <input
                        autoComplete="postal-code"
                        className={inputClass}
                        inputMode="numeric"
                        maxLength={5}
                        required
                        value={form.postalCode}
                        onChange={(e) => update('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">Ville *</span>
                      <input
                        autoComplete="address-level2"
                        className={inputClass}
                        required
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                      />
                    </label>
                    <label className="block" htmlFor="siret">
                      <span className="text-sm font-bold text-slate-700">SIRET *</span>
                      <SiretInput invalid={siretInvalid} value={form.siret} onChange={(value) => update('siret', value)} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">N° agrément préfectoral *</span>
                      <input className={inputClass} required value={form.prefectureApproval} onChange={(e) => update('prefectureApproval', e.target.value)} />
                    </label>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-extrabold text-slate-900">Contact gérant</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">Nom *</span>
                      <input className={inputClass} required value={form.managerLastName} onChange={(e) => update('managerLastName', e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">Prénom *</span>
                      <input className={inputClass} required value={form.managerFirstName} onChange={(e) => update('managerFirstName', e.target.value)} />
                    </label>
                    <fieldset className="block sm:col-span-2">
                      <legend className="text-sm font-bold text-slate-700">Genre *</legend>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {GENDER_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border-2 px-4 text-sm font-semibold transition ${
                              form.managerGender === option.value
                                ? 'border-cyan-400 bg-cyan-50 text-cyan-900'
                                : 'border-slate-300 bg-white text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="manager-gender"
                              className="accent-cyan-600"
                              checked={form.managerGender === option.value}
                              onChange={() => update('managerGender', option.value)}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">E-mail *</span>
                      <input className={inputClass} required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">Téléphone *</span>
                      <input className={inputClass} required type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                    </label>
                  </div>
                </section>

                {error && (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
                )}

                <button className="pd-btn-primary w-full disabled:opacity-60" disabled={busy} type="submit">
                  {busy ? 'Envoi en cours…' : 'Envoyer ma pré-inscription'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <PublicFooter isDark compact />
    </div>
  )
}
