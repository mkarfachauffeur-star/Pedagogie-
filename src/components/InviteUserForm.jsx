import { useState } from 'react'
import { inviteUser } from '../services/invitations'

const ROLE_OPTIONS = [
  { value: 'teacher', label: 'Enseignant' },
  { value: 'secretary', label: 'Secrétariat' },
  { value: 'student', label: 'Élève' },
  { value: 'manager', label: 'Gérant' },
]

// Formulaire d'invitation d'un utilisateur (gérant/secrétariat).
// S'appuie sur la Edge Function `invite-user` (création de compte côté serveur).
export default function InviteUserForm() {
  const [form, setForm] = useState({ email: '', fullName: '', role: 'teacher' })
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!form.email) return
    setBusy(true)
    setStatus(null)
    const { error } = await inviteUser({ email: form.email, role: form.role, fullName: form.fullName })
    setBusy(false)
    if (error) {
      setStatus({ type: 'error', message: error.message || 'Échec de l’invitation.' })
    } else {
      setStatus({ type: 'ok', message: `Invitation envoyée à ${form.email}.` })
      setForm({ email: '', fullName: '', role: 'teacher' })
    }
  }

  return (
    <form className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5" onSubmit={submit}>
      <h2 className="text-xl font-extrabold text-slate-950">Inviter un utilisateur</h2>
      <p className="mt-1 text-sm text-slate-500">Le compte est créé puis invité par e-mail, rattaché à votre auto-école.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Nom complet</span>
          <input
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
            onChange={(event) => update('fullName', event.target.value)}
            value={form.fullName}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">E-mail</span>
          <input
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
            onChange={(event) => update('email', event.target.value)}
            type="email"
            value={form.email}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Rôle</span>
          <select
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
            onChange={(event) => update('role', event.target.value)}
            value={form.role}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
      {status && (
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
            status.type === 'ok'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {status.message}
        </p>
      )}
      <div className="mt-4 flex justify-end">
        <button
          className="rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={busy || !form.email}
        >
          {busy ? 'Envoi…' : 'Envoyer l’invitation'}
        </button>
      </div>
    </form>
  )
}
