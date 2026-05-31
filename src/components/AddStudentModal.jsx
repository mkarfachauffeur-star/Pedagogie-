import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createStudent, listOrganizationTeachers, PACKAGE_OPTIONS } from '../services/students'

const EMPTY_FORM = {
  lastName: '',
  firstName: '',
  email: '',
  phone: '',
  birthDate: '',
  address: '',
  packageName: PACKAGE_OPTIONS[0],
  teacherId: '',
}

function Field({ label, required, children, error }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </label>
  )
}

const inputClass =
  'mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100'

export default function AddStudentModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [teachers, setTeachers] = useState([])
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    let active = true
    listOrganizationTeachers().then((rows) => active && setTeachers(rows))
    return () => {
      active = false
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose?.()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, busy, onClose])

  if (!open) return null

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: null }))
    setSubmitError(null)
  }

  const validate = () => {
    const next = {}
    if (!form.lastName.trim()) next.lastName = 'Le nom est obligatoire.'
    if (!form.firstName.trim()) next.firstName = 'Le prénom est obligatoire.'
    if (!form.email.trim()) next.email = 'L’e-mail est obligatoire.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Adresse e-mail invalide.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setBusy(true)
    setSubmitError(null)
    const { error, student, tempPassword, email, fullName } = await createStudent({
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      birth_date: form.birthDate || null,
      address: form.address.trim() || null,
      package_name: form.packageName || null,
      teacher_id: form.teacherId || null,
    })
    setBusy(false)
    if (error) {
      setSubmitError(error.message || 'Création impossible.')
      return
    }
    setSuccess({ student, tempPassword, email, fullName })
    onCreated?.(student)
  }

  const handleClose = () => {
    if (busy) return
    setForm(EMPTY_FORM)
    setErrors({})
    setSubmitError(null)
    setSuccess(null)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Ajouter un élève</h2>
            <p className="mt-1 text-sm text-slate-500">Création du compte, du dossier et des accès.</p>
          </div>
          <button type="button" onClick={handleClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="space-y-4 p-5 md:p-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-800">Élève créé avec succès</p>
              <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                <li><span className="font-semibold">Nom :</span> {success.fullName}</li>
                <li><span className="font-semibold">E-mail :</span> {success.email}</li>
                <li><span className="font-semibold">Mot de passe temporaire :</span> <code className="rounded bg-white px-2 py-0.5 font-mono text-xs">{success.tempPassword}</code></li>
                {success.student?.file_number && (
                  <li><span className="font-semibold">N° dossier :</span> {success.student.file_number}</li>
                )}
              </ul>
              <p className="mt-3 text-xs text-emerald-700">Communiquez ces identifiants à l’élève. Il pourra se connecter et accéder à la messagerie.</p>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={handleClose} className="pd-btn-primary">Fermer</button>
            </div>
          </div>
        ) : (
          <form className="space-y-4 p-5 md:p-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom" required error={errors.lastName}>
                <input className={inputClass} value={form.lastName} onChange={(e) => update('lastName', e.target.value)} autoComplete="family-name" />
              </Field>
              <Field label="Prénom" required error={errors.firstName}>
                <input className={inputClass} value={form.firstName} onChange={(e) => update('firstName', e.target.value)} autoComplete="given-name" />
              </Field>
              <Field label="E-mail" required error={errors.email}>
                <input className={inputClass} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" />
              </Field>
              <Field label="Téléphone">
                <input className={inputClass} type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} autoComplete="tel" />
              </Field>
              <Field label="Date de naissance">
                <input className={inputClass} type="date" value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} />
              </Field>
              <Field label="Formule choisie">
                <select className={inputClass} value={form.packageName} onChange={(e) => update('packageName', e.target.value)}>
                  {PACKAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Adresse">
              <input className={inputClass} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Numéro, rue, code postal, ville" autoComplete="street-address" />
            </Field>

            <Field label="Enseignant référent (optionnel)">
              <select className={inputClass} value={form.teacherId} onChange={(e) => update('teacherId', e.target.value)}>
                <option value="">Aucun pour le moment</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </Field>

            {submitError && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{submitError}</p>
            )}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleClose} className="pd-btn-secondary" disabled={busy}>Annuler</button>
              <button type="submit" className="pd-btn-primary" disabled={busy}>
                {busy ? 'Création…' : 'Créer l’élève'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
