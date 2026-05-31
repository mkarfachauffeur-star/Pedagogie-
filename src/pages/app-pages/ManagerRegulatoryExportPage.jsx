import { useState } from 'react'
import { FileSpreadsheet, Download } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { exportRegulatoryCsv, exportRegulatoryXlsx } from '../../services/regulatoryExport'

function defaultDateFrom() {
  return `${new Date().getFullYear()}-01-01`
}

export default function ManagerRegulatoryExportPage() {
  const { profileId } = useAuth()
  const [dateFrom, setDateFrom] = useState(defaultDateFrom())
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const filters = { dateFrom, dateTo }

  const run = async (format) => {
    setBusy(format)
    setError(null)
    try {
      if (format === 'csv') await exportRegulatoryCsv(filters)
      else await exportRegulatoryXlsx(filters)
    } catch (err) {
      setError(err?.message || 'Export impossible.')
    } finally {
      setBusy(null)
    }
  }

  if (!profileId) {
    return <EmptyState title="Connexion requise" message="Connectez-vous pour exporter." icon="📋" />
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-navy-950 to-cyan-900 p-8 text-white">
        <p className="text-sm font-semibold text-cyan-200">Administration</p>
        <h1 className="mt-2 text-3xl font-extrabold">Export réglementaire</h1>
        <p className="mt-3 text-sm leading-6 text-blue-50">
          Dossier complet pour contrôle administratif et préfecture : élèves, enseignants, leçons, examens, contrats, véhicules et paiements.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-extrabold text-slate-950">Période</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold">Du<input className="pd-input mt-2 w-full" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
          <label className="block text-sm font-bold">Au<input className="pd-input mt-2 w-full" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
        </div>
        {error && <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => run('xlsx')} className="pd-btn-primary inline-flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {busy === 'xlsx' ? 'Génération…' : 'Télécharger Excel (.xlsx)'}
          </button>
          <button type="button" disabled={busy} onClick={() => run('csv')} className="pd-btn-secondary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            {busy === 'csv' ? 'Génération…' : 'Télécharger CSV'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-bold text-slate-800">Contenu inclus</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Élèves (identité, dossier, NEPH)</li>
          <li>Enseignants (autorisation, validité, catégories)</li>
          <li>Leçons réalisées</li>
          <li>Examens</li>
          <li>Contrats (détail tarifaire)</li>
          <li>Véhicules</li>
          <li>Paiements</li>
        </ul>
      </section>
    </div>
  )
}
