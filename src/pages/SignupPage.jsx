import { ArrowLeft } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import BetaDevelopmentBanner from '../components/marketing/BetaDevelopmentBanner'
import PublicFooter from '../components/marketing/PublicFooter'
import { submitOrganizationSignupRequest } from '../services/organizationSignupRequests'
import { GENDER_OPTIONS, normalizeGender } from '../lib/genderedRoles'
import {
  isValidSiret,
  sanitizePhoneInput,
  sanitizePostalCode,
  sanitizeSiret,
  validateOrgProfileForm,
} from '../lib/orgProfile'
import { getUserFacingError } from '../lib/userFacingError'

const inputClass =
  'mt-2 min-h-12 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100'

function validatePreRegistrationForm(form) {
  const { message, errors } = validateOrgProfileForm(
    {
      orgName: form.orgName,
      managerFirstName: form.managerFirstName,
      managerLastName: form.managerLastName,
      address: form.address,
      postalCode: form.postalCode,
      city: form.city,
      email: form.email,
      phone: form.phone,
      siret: form.siret,
      prefectureApproval: form.prefectureApproval,
      website: form.website,
    },
    { requireApproval: false },
  )
  if (message) return { message, errors }

  if (!normalizeGender(form.managerGender)) {
    return { message: 'Le genre est obligatoire.', errors: { managerGender: 'Le genre est obligatoire.' } }
  }

  return { message: null, errors: {} }
}

function SiretInput({ value, onChange, invalid, error }) {
  const inputRef = useRef(null)
  const [focused, setFocused] = useState(false)

  const handleChange = (raw) => {
    onChange(sanitizeSiret(raw))
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
      {error && <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
      {!error && value.length > 0 && value.length < 14 && (
        <p className="mt-1 text-xs font-medium text-slate-500">{value.length}/14 chiffres</p>
      )}
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
    website: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }
  const siretInvalid = form.siret.length > 0 && !isValidSiret(form.siret)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    const { message, errors } = validatePreRegistrationForm(form)
    if (message) {
      setFieldErrors(errors)
      setError(message)
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
      website: form.website,
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
              Pedagogia Drive est en version bêta. Déposez le profil de votre auto-école — notre équipe vous
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
              <form className="mt-8 space-y-8" onSubmit={handleSubmit} noValidate>
                <section>
                  <h2 className="text-lg font-extrabold text-slate-900">Auto-école</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">Nom de l&apos;auto-école *</span>
                      <input className={inputClass} required value={form.orgName} onChange={(e) => update('orgName', e.target.value)} />
                      {fieldErrors.orgName && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.orgName}</p>}
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
                      {fieldErrors.address && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.address}</p>}
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
                        onChange={(e) => update('postalCode', sanitizePostalCode(e.target.value))}
                      />
                      {fieldErrors.postalCode && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.postalCode}</p>}
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
                      {fieldErrors.city && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.city}</p>}
                    </label>
                    <label className="block" htmlFor="siret">
                      <span className="text-sm font-bold text-slate-700">SIRET *</span>
                      <SiretInput
                        error={fieldErrors.siret}
                        invalid={siretInvalid || Boolean(fieldErrors.siret)}
                        value={form.siret}
                        onChange={(value) => update('siret', value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">N° agrément préfectoral</span>
                      <span className="ml-1 text-xs font-medium text-slate-400">(facultatif)</span>
                      <input className={inputClass} value={form.prefectureApproval} onChange={(e) => update('prefectureApproval', e.target.value)} />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-bold text-slate-700">Site internet</span>
                      <span className="ml-1 text-xs font-medium text-slate-400">(facultatif)</span>
                      <input
                        className={inputClass}
                        placeholder="https://www.exemple.fr"
                        type="url"
                        value={form.website}
                        onChange={(e) => update('website', e.target.value)}
                      />
                      {fieldErrors.website && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.website}</p>}
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
                    {(fieldErrors.managerName) && (
                      <p className="sm:col-span-2 text-xs font-semibold text-rose-600">{fieldErrors.managerName}</p>
                    )}
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
                      {fieldErrors.managerGender && (
                        <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.managerGender}</p>
                      )}
                    </fieldset>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">E-mail *</span>
                      <input className={inputClass} required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
                      {fieldErrors.email && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.email}</p>}
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">Téléphone *</span>
                      <input
                        className={inputClass}
                        required
                        type="tel"
                        inputMode="tel"
                        placeholder="06 12 34 56 78"
                        value={form.phone}
                        onChange={(e) => update('phone', sanitizePhoneInput(e.target.value))}
                      />
                      {fieldErrors.phone && <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.phone}</p>}
                    </label>
                  </div>
                </section>

                {error && (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
                )}

                <button
                  className="pd-btn-primary w-full disabled:opacity-60"
                  disabled={busy || !isValidSiret(form.siret)}
                  type="submit"
                >
                  {busy ? 'Envoi en cours…' : 'Envoyer ma pré-inscription'}
                </button>
                {!isValidSiret(form.siret) && form.siret.length > 0 && (
                  <p className="text-center text-xs font-medium text-rose-600">
                    Le SIRET doit contenir exactement 14 chiffres pour valider le formulaire.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
      <PublicFooter isDark compact />
    </div>
  )
}
