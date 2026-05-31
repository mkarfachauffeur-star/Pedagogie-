import { useCallback, useEffect, useMemo, useState } from 'react'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import {
  PACKAGE_CATEGORIES,
  categoryLabel,
  deletePricingPackage,
  listPricingPackages,
  upsertPricingPackage,
} from '../../services/pricing'

const emptyForm = {
  id: null,
  name: '',
  category: 'b_manuelle',
  priceTtc: '',
  includedHours: '',
  adminFeeTtc: '',
  examPresentationIncluded: false,
  examPresentationTtc: '',
  extraHourPriceTtc: '',
  isActive: true,
}

export default function ManagerPackagesPage() {
  const { profileId, organizationId, canWrite } = useAuth()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    if (!profileId) return
    setLoading(true)
    const { packages: rows } = await listPricingPackages()
    setPackages(rows)
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openEdit = (pkg) => {
    setForm({
      id: pkg.id,
      name: pkg.name,
      category: pkg.category,
      priceTtc: String(pkg.price_ttc ?? ''),
      includedHours: String(pkg.included_hours ?? ''),
      adminFeeTtc: String(pkg.admin_fee_ttc ?? ''),
      examPresentationIncluded: pkg.exam_presentation_included,
      examPresentationTtc: String(pkg.exam_presentation_ttc ?? ''),
      extraHourPriceTtc: String(pkg.extra_hour_price_ttc ?? ''),
      isActive: pkg.is_active,
    })
    setModal(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!canWrite || !organizationId) return
    setSaving(true)
    await upsertPricingPackage({ ...form, organizationId })
    setSaving(false)
    setModal(false)
    setForm(emptyForm)
    refresh()
  }

  if (!profileId) return <EmptyState title="Connexion requise" icon="💶" message="Connectez-vous en tant que gérant." />

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-navy-950 to-cyan-900 p-8 text-white">
        <h1 className="text-3xl font-extrabold">Formules & tarifs</h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-50">Grille tarifaire de votre auto-école — base du chiffre d&apos;affaires et des contrats.</p>
        {canWrite && (
          <button type="button" className="pd-btn-primary mt-4" onClick={() => { setForm(emptyForm); setModal(true) }}>
            + Nouvelle formule
          </button>
        )}
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((pkg) => (
            <article key={pkg.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-cyan-700">{categoryLabel(pkg.category)}</p>
                  <h2 className="text-xl font-extrabold text-slate-950">{pkg.name}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${pkg.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {pkg.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-slate-400">Prix TTC</dt><dd className="font-black">{Number(pkg.price_ttc).toLocaleString('fr-FR')} €</dd></div>
                <div><dt className="text-slate-400">Heures</dt><dd className="font-black">{pkg.included_hours}h</dd></div>
                <div><dt className="text-slate-400">Frais admin</dt><dd className="font-black">{Number(pkg.admin_fee_ttc).toLocaleString('fr-FR')} €</dd></div>
                <div><dt className="text-slate-400">Examen</dt><dd className="font-black">{pkg.exam_presentation_included ? `${Number(pkg.exam_presentation_ttc).toLocaleString('fr-FR')} €` : 'Non'}</dd></div>
              </dl>
              {canWrite && (
                <div className="mt-4 flex gap-2">
                  <button type="button" className="text-sm font-bold text-cyan-700" onClick={() => openEdit(pkg)}>Modifier</button>
                  <button type="button" className="text-sm font-bold text-rose-600" onClick={() => deletePricingPackage(pkg.id).then(refresh)}>Supprimer</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onSubmit={save}>
            <h2 className="text-xl font-extrabold">{form.id ? 'Modifier' : 'Nouvelle formule'}</h2>
            <div className="mt-4 grid gap-3">
              <Field label="Nom *" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} />
              <label className="block text-sm font-bold">Catégorie *
                <select className="pd-input mt-1 w-full" value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}>
                  {PACKAGE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
              <Field label="Prix TTC (€) *" type="number" value={form.priceTtc} onChange={(v) => setForm((c) => ({ ...c, priceTtc: v }))} />
              <Field label="Heures incluses *" type="number" value={form.includedHours} onChange={(v) => setForm((c) => ({ ...c, includedHours: v }))} />
              <Field label="Frais administratifs TTC (€)" type="number" value={form.adminFeeTtc} onChange={(v) => setForm((c) => ({ ...c, adminFeeTtc: v }))} />
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={form.examPresentationIncluded} onChange={(e) => setForm((c) => ({ ...c, examPresentationIncluded: e.target.checked }))} />
                Présentation examen incluse
              </label>
              {form.examPresentationIncluded && (
                <Field label="Montant présentation examen TTC (€)" type="number" value={form.examPresentationTtc} onChange={(v) => setForm((c) => ({ ...c, examPresentationTtc: v }))} />
              )}
              <Field label="Prix heure supplémentaire TTC (€)" type="number" value={form.extraHourPriceTtc} onChange={(v) => setForm((c) => ({ ...c, extraHourPriceTtc: v }))} />
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))} />
                Formule active
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="pd-btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button type="submit" disabled={saving} className="pd-btn-primary">{saving ? '…' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input className="pd-input mt-1 w-full" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
