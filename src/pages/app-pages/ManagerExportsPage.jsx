import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import {
  exportLessonsCsv,
  exportPrefectureCsv,
  exportStudentsCsv,
  exportTeachersCsv,
  fetchExportFilterOptions,
} from '../../services/adminExports'

function defaultDateFrom() {
  const now = new Date()
  return `${now.getFullYear()}-01-01`
}

function defaultDateTo() {
  return new Date().toISOString().slice(0, 10)
}

function ExportCard({ title, description, onExport, busy, icon: Icon = Download }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          <button
            type="button"
            onClick={onExport}
            disabled={busy}
            className="pd-btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Génération…' : 'Télécharger CSV'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function ManagerExportsPage() {
  const { profileId } = useAuth()
  const [dateFrom, setDateFrom] = useState(defaultDateFrom)
  const [dateTo, setDateTo] = useState(defaultDateTo)
  const [teacherId, setTeacherId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [options, setOptions] = useState({ students: [], teachers: [] })
  const [busyKey, setBusyKey] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profileId) return undefined
    let active = true
    fetchExportFilterOptions().then((data) => active && setOptions(data))
    return () => {
      active = false
    }
  }, [profileId])

  const filters = useMemo(() => ({
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    teacherId: teacherId || null,
    studentId: studentId || null,
    teacherLabel: options.teachers.find((t) => t.id === teacherId)?.label || null,
    studentLabel: options.students.find((s) => s.id === studentId)?.label || null,
  }), [dateFrom, dateTo, teacherId, studentId, options])

  const runExport = async (key, exporter) => {
    setBusyKey(key)
    setError(null)
    try {
      await exporter(filters)
    } catch (err) {
      setError(err?.message || 'Export impossible.')
    } finally {
      setBusyKey(null)
    }
  }

  if (!profileId) {
    return (
      <EmptyState
        title="Connexion requise"
        message="Connectez-vous avec votre compte gérant pour accéder aux exports."
        icon="📤"
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          Exports administratifs
        </p>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Exports CSV</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
          Téléchargez vos données au format CSV UTF-8 (séparateur point-virgule) compatible Excel France.
          Chaque fichier inclut la date et l&apos;heure de génération.
        </p>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-extrabold text-slate-950">Filtres communs</h2>
        <p className="mt-1 text-sm text-slate-500">Appliqués aux exports élèves, leçons et dossier préfecture.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Du</span>
            <input className="pd-input mt-2" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Au</span>
            <input className="pd-input mt-2" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Enseignant</span>
            <select className="pd-input mt-2" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">Tous</option>
              {options.teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Élève</span>
            <select className="pd-input mt-2" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Tous</option>
              {options.students.map((student) => (
                <option key={student.id} value={student.id}>{student.label}</option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ExportCard
          title="Export des élèves"
          description="Nom, prénom, coordonnées, dossier, inscription, enseignant référent et statut."
          busy={busyKey === 'students'}
          onExport={() => runExport('students', exportStudentsCsv)}
        />
        <ExportCard
          title="Export des enseignants"
          description="Identité, coordonnées et date d'affectation dans l'auto-école (filtre période)."
          busy={busyKey === 'teachers'}
          onExport={() => runExport('teachers', exportTeachersCsv)}
        />
        <ExportCard
          title="Export des leçons"
          description="Justificatif administratif : élève, enseignant, horaires, durée, formation, véhicule et statut."
          busy={busyKey === 'lessons'}
          onExport={() => runExport('lessons', exportLessonsCsv)}
        />
        <ExportCard
          title="Export complet Préfecture"
          description="Dossier global : élèves, affectations enseignants et leçons réalisées, prêt pour Excel."
          busy={busyKey === 'prefecture'}
          icon={FileSpreadsheet}
          onExport={() => runExport('prefecture', exportPrefectureCsv)}
        />
      </div>
    </div>
  )
}
