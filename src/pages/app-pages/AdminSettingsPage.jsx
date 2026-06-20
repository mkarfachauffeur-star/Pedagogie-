import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import EmptyState from '../../components/ui/EmptyState'
import PageHero from '../../components/ui/PageHero'
import { useAuth } from '../../context/AuthContext'
import {
  fetchOrganization,
  orgLogoUrl,
  updateOrganization,
  uploadOrgLogo,
} from '../../services/organization'
import {
  SIMULATOR_SESSION_SUPERVISOR_MODE_OPTIONS,
  normalizeSupervisorMode,
} from '../../lib/simulatorSessions'
import StudentCharterAdminSection from '../../components/students/StudentCharterAdminSection'

export default function AdminSettingsPage() {
  const { profileId, user, organizationId, organization, canWrite, refreshOrg } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    website: '',
    siret: '',
    prefecture_approval: '',
    simulator_session_supervisor_mode: 'admin_supervisor',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (!organization) return
    setForm({
      name: organization.name || '',
      email: organization.email || '',
      phone: organization.phone || '',
      address: organization.address || '',
      city: organization.city || '',
      postal_code: organization.postal_code || '',
      website: organization.website || '',
      siret: organization.siret || '',
      prefecture_approval: organization.prefecture_approval || '',
      simulator_session_supervisor_mode: organization.simulator_session_supervisor_mode || 'admin_supervisor',
    })
  }, [organization])

  const save = async (e) => {
    e.preventDefault()
    if (!canWrite || !organizationId) return
    setSaving(true)
    const { error } = await updateOrganization(organizationId, form)
    setSaving(false)
    setMessage(error ? 'Erreur de sauvegarde.' : 'Paramètres enregistrés.')
    if (!error) refreshOrg?.(user?.id)
  }

  const onLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !organizationId || !canWrite) return
    const { path, error } = await uploadOrgLogo(organizationId, file)
    if (!error && path) {
      await updateOrganization(organizationId, { logo_storage_path: path })
      refreshOrg?.(profileId)
    }
  }

  const logoUrl = orgLogoUrl(organization?.logo_storage_path)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHero
        eyebrow="Paramètres"
        title="Configuration de l'auto-école"
        subtitle="Identité, coordonnées et logo de votre établissement."
      />

      {!profileId ? (
        <EmptyState title="Connexion requise" message="Connectez-vous en tant que gérant." icon="⚙️" />
      ) : (
        <>
          <StudentCharterAdminSection canWrite={canWrite} />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-extrabold text-slate-950">Formules & tarifs</h2>
            <p className="mt-1 text-sm text-slate-500">Forfaits, heures incluses et tarifs AAC / CS de votre auto-école.</p>
            <Link
              to="/manager/packages"
              className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800 transition hover:bg-cyan-100"
            >
              Gérer les formules
              <ChevronRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-extrabold text-slate-950">Séances simulateur</h2>
            <p className="mt-1 text-sm text-slate-500">
              Paramètre enregistré avec le formulaire ci-dessous — compatible RdvPermis.
            </p>
          </section>

      <form className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6" onSubmit={save}>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Mode d&apos;encadrement simulateur</h3>
          <div className="mt-4 space-y-3">
            {SIMULATOR_SESSION_SUPERVISOR_MODE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                  normalizeSupervisorMode(form.simulator_session_supervisor_mode) === option.value
                    ? 'border-cyan-300 bg-cyan-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                } ${!canWrite ? 'cursor-default opacity-80' : ''}`}
              >
                <input
                  checked={normalizeSupervisorMode(form.simulator_session_supervisor_mode) === option.value}
                  className="mt-1"
                  disabled={!canWrite}
                  name="simulator_session_supervisor_mode"
                  onChange={() => setForm((current) => ({
                    ...current,
                    simulator_session_supervisor_mode: option.value,
                  }))}
                  type="radio"
                  value={option.value}
                />
                <span>
                  <span className="block text-sm font-extrabold text-slate-900">{option.label}</span>
                  <span className="mt-1 block text-sm text-slate-600">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-slate-200" />
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-xl bg-slate-100 text-2xl">🏫</div>
          )}
          {canWrite && (
            <label className="text-sm font-bold text-cyan-700 cursor-pointer">
              Changer le logo
              <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
            </label>
          )}
        </div>

        <Field label="Nom auto-école" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} disabled={!canWrite} />
        <Field label="E-mail" value={form.email} onChange={(v) => setForm((c) => ({ ...c, email: v }))} disabled={!canWrite} />
        <Field label="Téléphone" value={form.phone} onChange={(v) => setForm((c) => ({ ...c, phone: v }))} disabled={!canWrite} />
        <Field label="Adresse" value={form.address} onChange={(v) => setForm((c) => ({ ...c, address: v }))} disabled={!canWrite} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code postal" value={form.postal_code} onChange={(v) => setForm((c) => ({ ...c, postal_code: v }))} disabled={!canWrite} />
          <Field label="Ville" value={form.city} onChange={(v) => setForm((c) => ({ ...c, city: v }))} disabled={!canWrite} />
        </div>
        <Field label="Site web" value={form.website} onChange={(v) => setForm((c) => ({ ...c, website: v }))} disabled={!canWrite} />
        <Field label="SIRET" value={form.siret} onChange={(v) => setForm((c) => ({ ...c, siret: v }))} disabled={!canWrite} />
        <Field label="N° agrément préfectoral" value={form.prefecture_approval} onChange={(v) => setForm((c) => ({ ...c, prefecture_approval: v }))} disabled={!canWrite} />

        {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}
        {canWrite && (
          <button type="submit" disabled={saving} className="pd-btn-primary">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        )}
      </form>
        </>
      )}
    </div>
  )
}

function Field({ label, value, onChange, disabled }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input className="pd-input mt-2 w-full disabled:bg-slate-50" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </label>
  )
}
