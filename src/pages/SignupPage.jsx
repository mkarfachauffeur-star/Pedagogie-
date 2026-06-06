import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import { registerOrganization } from '../services/organization'
import { getUserFacingError } from '../lib/userFacingError'

const inputClass =
  'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100'

function validateSignupForm(form) {
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
    ['password', 'Le mot de passe est obligatoire.'],
    ['passwordConfirm', 'La confirmation du mot de passe est obligatoire.'],
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

  const email = form.email.trim()
  if (!email.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "L'e-mail doit être valide et contenir un @."
  }

  if (form.password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères.'
  }
  if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password)) {
    return 'Le mot de passe doit contenir au moins une majuscule et une minuscule.'
  }

  if (form.password !== form.passwordConfirm) {
    return 'Les mots de passe ne correspondent pas.'
  }

  return null
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function LogoUploadField({ file, onChange }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pickFile = (nextFile) => {
    if (!nextFile?.type.startsWith('image/')) return
    onChange(nextFile)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    pickFile(event.dataTransfer.files?.[0])
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        type="file"
        onChange={(e) => pickFile(e.target.files?.[0] || null)}
      />

      {file && preview ? (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            <img alt="Aperçu du logo" className="h-full w-full object-contain" src={preview} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {(file.size / 1024).toFixed(0)} Ko · PNG, JPG ou WebP
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                Changer
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                type="button"
                onClick={() => {
                  onChange(null)
                  if (inputRef.current) inputRef.current.value = ''
                }}
              >
                <X className="h-3 w-3" />
                Retirer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragOver
              ? 'border-cyan-400 bg-cyan-50/80'
              : 'border-slate-200 bg-slate-50/80 hover:border-cyan-300 hover:bg-cyan-50/50'
          }`}
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragLeave={() => setDragOver(false)}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDrop={handleDrop}
        >
          <span className="inline-flex rounded-xl border border-cyan-200 bg-white p-2.5 text-cyan-600 shadow-sm">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold text-slate-800">Ajouter le logo de l&apos;auto-école</span>
          <span className="text-xs text-slate-500">Glissez une image ou cliquez pour parcourir</span>
          <span className="text-[11px] font-medium text-slate-400">PNG, JPG, WebP · max. recommandé 2 Mo</span>
        </button>
      )}
    </div>
  )
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
              : 'border-slate-200'
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
  const navigate = useNavigate()
  const [form, setForm] = useState({
    orgName: '',
    managerFirstName: '',
    managerLastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    siret: '',
    prefectureApproval: '',
    password: '',
    passwordConfirm: '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const update = (field, value) => setForm((c) => ({ ...c, [field]: value }))

  const siretInvalid = form.siret.length > 0 && form.siret.length !== 14
  const passwordsMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm
  const passwordsMatch =
    form.passwordConfirm.length > 0 && form.password === form.passwordConfirm

  const fieldClass = (invalid = false) =>
    `${inputClass}${invalid ? ' border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''}`

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    const validationError = validateSignupForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setBusy(true)
    let logoBase64 = null
    let logoMime = null
    if (logoFile) {
      logoBase64 = await fileToBase64(logoFile)
      logoMime = logoFile.type || 'image/png'
    }
    const { data, error: regError } = await registerOrganization({
      org_name: form.orgName.trim(),
      manager_first_name: form.managerFirstName.trim(),
      manager_last_name: form.managerLastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      postal_code: form.postalCode.trim(),
      city: form.city.trim(),
      siret: form.siret.trim(),
      prefecture_approval: form.prefectureApproval.trim(),
      password: form.password,
      logo_base64: logoBase64,
      logo_mime: logoMime,
    })
    setBusy(false)
    if (regError) {
      setError(getUserFacingError(regError, 'signup'))
      return
    }
    navigate('/login', {
      state: {
        email: form.email.trim(),
        message: `Auto-école créée. Essai gratuit 30 jours (${data?.max_students ?? 20} élèves max). Connectez-vous avec votre e-mail.`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <BrandLogo />
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-cyan-100 shadow-sm backdrop-blur transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            Retour accueil
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl md:p-8">
          <h1 className="text-3xl font-extrabold text-slate-950">Créer mon auto-école</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Essai gratuit 30 jours — toutes les fonctionnalités — jusqu&apos;à 20 élèves.
          </p>

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
                    placeholder="75001"
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
                    placeholder="Paris"
                    required
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                  />
                </label>
                <label className="block" htmlFor="siret">
                  <span className="text-sm font-bold text-slate-700">SIRET *</span>
                  <SiretInput invalid={siretInvalid} value={form.siret} onChange={(v) => update('siret', v)} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">N° agrément préfectoral *</span>
                  <input className={inputClass} required value={form.prefectureApproval} onChange={(e) => update('prefectureApproval', e.target.value)} />
                </label>
                <div className="block sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">Logo (optionnel)</span>
                  <LogoUploadField file={logoFile} onChange={setLogoFile} />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-extrabold text-slate-900">Gérant</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Prénom *</span>
                  <input className={inputClass} required value={form.managerFirstName} onChange={(e) => update('managerFirstName', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Nom *</span>
                  <input className={inputClass} required value={form.managerLastName} onChange={(e) => update('managerLastName', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">E-mail *</span>
                  <input
                    className={inputClass}
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Téléphone *</span>
                  <input className={inputClass} type="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">Mot de passe *</span>
                  <input
                    className={fieldClass(passwordsMismatch)}
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    8 caractères minimum · 1 majuscule · 1 minuscule · chiffres et caractères spéciaux acceptés
                  </p>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">Confirmer le mot de passe *</span>
                  <input
                    className={fieldClass(passwordsMismatch)}
                    type="password"
                    required
                    minLength={8}
                    value={form.passwordConfirm}
                    onChange={(e) => update('passwordConfirm', e.target.value)}
                  />
                  {passwordsMismatch && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-600">
                      Les deux mots de passe doivent être identiques.
                    </p>
                  )}
                  {passwordsMatch && (
                    <p className="mt-1.5 text-xs font-semibold text-emerald-600">Les mots de passe correspondent.</p>
                  )}
                </label>
              </div>
            </section>

            {error && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy || passwordsMismatch}
              className="pd-btn-primary w-full disabled:opacity-60"
            >
              {busy ? 'Création en cours…' : 'Créer mon auto-école'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
