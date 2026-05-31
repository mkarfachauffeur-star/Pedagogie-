import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import { registerOrganization } from '../services/organization'

const inputClass =
  'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100'

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

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    orgName: '',
    managerFirstName: '',
    managerLastName: '',
    email: '',
    phone: '',
    address: '',
    siret: '',
    prefectureApproval: '',
    password: '',
    passwordConfirm: '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const update = (field, value) => setForm((c) => ({ ...c, [field]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (form.password !== form.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.')
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
      siret: form.siret.trim(),
      prefecture_approval: form.prefectureApproval.trim(),
      password: form.password,
      logo_base64: logoBase64,
      logo_mime: logoMime,
    })
    setBusy(false)
    if (regError) {
      setError(regError.message || 'Inscription impossible.')
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
          <Link to="/" className="text-sm font-bold text-cyan-200 hover:text-white">Retour accueil</Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl md:p-8">
          <h1 className="text-3xl font-extrabold text-slate-950">Créer mon auto-école</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Essai gratuit 30 jours — toutes les fonctionnalités — jusqu&apos;à 20 élèves.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <section>
              <h2 className="text-lg font-extrabold text-slate-900">Auto-école</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">Nom de l&apos;auto-école *</span>
                  <input className={inputClass} required value={form.orgName} onChange={(e) => update('orgName', e.target.value)} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">Adresse</span>
                  <input className={inputClass} value={form.address} onChange={(e) => update('address', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">SIRET</span>
                  <input className={inputClass} value={form.siret} onChange={(e) => update('siret', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">N° agrément préfectoral</span>
                  <input className={inputClass} value={form.prefectureApproval} onChange={(e) => update('prefectureApproval', e.target.value)} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">Logo (optionnel)</span>
                  <input className={inputClass} type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                </label>
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
                  <input className={inputClass} type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Téléphone</span>
                  <input className={inputClass} type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Mot de passe *</span>
                  <input className={inputClass} type="password" required minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Confirmer le mot de passe *</span>
                  <input className={inputClass} type="password" required value={form.passwordConfirm} onChange={(e) => update('passwordConfirm', e.target.value)} />
                </label>
              </div>
            </section>

            {error && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
            )}

            <button type="submit" disabled={busy} className="pd-btn-primary w-full disabled:opacity-60">
              {busy ? 'Création en cours…' : 'Créer mon auto-école'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
