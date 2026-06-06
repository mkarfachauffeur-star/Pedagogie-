import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import PageHero from '../../components/ui/PageHero'
import { useAuth } from '../../context/AuthContext'
import {
  exportLessonsCsv,
  exportPrefectureCsv,
  exportStudentsCsv,
  exportTeachersCsv,
  fetchExportFilterOptions,
} from '../../services/adminExports'
import { exportRegulatoryCsv, exportRegulatoryXlsx } from '../../services/regulatoryExport'
import { getUserFacingError } from '../../lib/userFacingError'

function defaultDateFrom() {
  return `${new Date().getFullYear()}-01-01`
}

function defaultDateTo() {
  return todayIso()
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function clampExportDate(value, { min, max } = {}) {
  if (!value) return value
  let next = value
  if (max && next > max) next = max
  if (min && next < min) next = min
  return next
}

function applyDateFromChange(nextFrom, currentTo) {
  const today = todayIso()
  const from = clampExportDate(nextFrom, { max: today })
  let to = currentTo
  if (from && to && from > to) to = from
  if (to && to > today) to = today
  return { from, to }
}

function applyDateToChange(currentFrom, nextTo) {
  const today = todayIso()
  const to = clampExportDate(nextTo, { max: today })
  let from = currentFrom
  if (from && to && to < from) from = to
  return { from, to }
}

function validateExportDates(dateFrom, dateTo) {
  const today = todayIso()
  if (!dateFrom || !dateTo) return 'Indiquez une période complète (Du et Au).'
  if (dateFrom > today || dateTo > today) return 'Les dates ne peuvent pas être postérieures à aujourd\'hui.'
  if (dateFrom > dateTo) return 'La date « Du » doit être antérieure ou égale à la date « Au ».'
  return null
}

function ExportDateInput({ label, value, onChange, min, max }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        className="pd-input mt-2 w-full"
        max={max}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        type="date"
        value={value}
      />
    </label>
  )
}

function ExportCard({ title, description, onExport, busy, disabled = false, buttonLabel = 'Télécharger CSV', icon: Icon = Download }) {
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
            className="pd-btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy || disabled}
            onClick={onExport}
            type="button"
          >
            {busy ? 'Génération…' : buttonLabel}
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

  const dateRangeError = useMemo(
    () => validateExportDates(dateFrom, dateTo),
    [dateFrom, dateTo],
  )

  const handleDateFromChange = (value) => {
    const { from, to } = applyDateFromChange(value, dateTo)
    setDateFrom(from)
    setDateTo(to)
    setError(null)
  }

  const handleDateToChange = (value) => {
    const { from, to } = applyDateToChange(dateFrom, value)
    setDateFrom(from)
    setDateTo(to)
    setError(null)
  }

  const runExport = async (key, exporter) => {
    const validationError = validateExportDates(dateFrom, dateTo)
    if (validationError) {
      setError(validationError)
      return
    }
    setBusyKey(key)
    setError(null)
    try {
      await exporter(filters)
    } catch (err) {
      setError(getUserFacingError(err, 'export'))
    } finally {
      setBusyKey(null)
    }
  }

  const runRegulatory = async (format) => {
    const validationError = validateExportDates(dateFrom, dateTo)
    if (validationError) {
      setError(validationError)
      return
    }
    setBusyKey(format === 'xlsx' ? 'regulatory-xlsx' : 'regulatory-csv')
    setError(null)
    try {
      if (format === 'xlsx') await exportRegulatoryXlsx({ dateFrom, dateTo })
      else await exportRegulatoryCsv({ dateFrom, dateTo })
    } catch (err) {
      setError(getUserFacingError(err, 'export'))
    } finally {
      setBusyKey(null)
    }
  }

  const today = todayIso()
  const dateFromMax = dateTo && dateTo < today ? dateTo : today

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHero
        eyebrow="Gérant"
        title="Exports"
        subtitle="Téléchargez vos données : dossier réglementaire complet pour la préfecture, ou exports CSV ciblés pour la gestion quotidienne."
      />

      {!profileId ? (
        <EmptyState
          icon="📤"
          message="Connectez-vous avec votre compte gérant pour accéder aux exports."
          title="Connexion requise"
        />
      ) : (
        <>
          <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
            <div className="border-b border-slate-100 bg-gradient-to-r from-navy-950 to-cyan-900 px-5 py-4 text-white md:px-6">
              <h2 className="text-lg font-extrabold">Dossier réglementaire</h2>
              <p className="mt-1 text-sm text-cyan-50/85">
                Export complet pour contrôle administratif et préfecture sur la période choisie.
              </p>
            </div>
            <div className="p-5 md:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <ExportDateInput
                  label="Du"
                  max={dateFromMax}
                  onChange={handleDateFromChange}
                  value={dateFrom}
                />
                <ExportDateInput
                  label="Au"
                  max={today}
                  min={dateFrom || undefined}
                  onChange={handleDateToChange}
                  value={dateTo}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-500">
                Période limitée à aujourd&apos;hui — impossible d&apos;exporter des données futures.
              </p>
              {dateRangeError && (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  {dateRangeError}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="pd-btn-primary inline-flex items-center gap-2"
                  disabled={Boolean(busyKey) || Boolean(dateRangeError)}
                  onClick={() => runRegulatory('xlsx')}
                  type="button"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {busyKey === 'regulatory-xlsx' ? 'Génération…' : 'Télécharger Excel (.xlsx)'}
                </button>
                <button
                  className="pd-btn-secondary inline-flex items-center gap-2"
                  disabled={Boolean(busyKey) || Boolean(dateRangeError)}
                  onClick={() => runRegulatory('csv')}
                  type="button"
                >
                  <Download className="h-4 w-4" />
                  {busyKey === 'regulatory-csv' ? 'Génération…' : 'Télécharger CSV'}
                </button>
              </div>
              <ul className="mt-5 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                {[
                  'Élèves (identité, dossier, NEPH)',
                  'Enseignants (autorisation, catégories)',
                  'Leçons réalisées',
                  'Examens',
                  'Contrats élèves (détail tarifaire)',
                  'Véhicules et paiements',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-extrabold text-slate-950">Exports CSV ciblés</h2>
            <p className="mt-1 text-sm text-slate-500">
              Fichiers UTF-8 (point-virgule) compatibles Excel France. Filtres appliqués aux exports ci-dessous.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ExportDateInput
                label="Du"
                max={dateFromMax}
                onChange={handleDateFromChange}
                value={dateFrom}
              />
              <ExportDateInput
                label="Au"
                max={today}
                min={dateFrom || undefined}
                onChange={handleDateToChange}
                value={dateTo}
              />
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Enseignant</span>
                <select className="pd-input mt-2 w-full" onChange={(e) => setTeacherId(e.target.value)} value={teacherId}>
                  <option value="">Tous</option>
                  {options.teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Élève</span>
                <select className="pd-input mt-2 w-full" onChange={(e) => setStudentId(e.target.value)} value={studentId}>
                  <option value="">Tous</option>
                  {options.students.map((student) => (
                    <option key={student.id} value={student.id}>{student.label}</option>
                  ))}
                </select>
              </label>
            </div>
            {(error || dateRangeError) && (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error || dateRangeError}
              </p>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <ExportCard
              busy={busyKey === 'students'}
              description="Nom, prénom, coordonnées, dossier, inscription, enseignant référent et statut."
              disabled={Boolean(dateRangeError)}
              onExport={() => runExport('students', exportStudentsCsv)}
              title="Export des élèves"
            />
            <ExportCard
              busy={busyKey === 'teachers'}
              description="Identité, coordonnées et date d'affectation dans l'auto-école."
              disabled={Boolean(dateRangeError)}
              onExport={() => runExport('teachers', exportTeachersCsv)}
              title="Export des enseignants"
            />
            <ExportCard
              busy={busyKey === 'lessons'}
              description="Élève, enseignant, horaires, durée, formation, véhicule et statut."
              disabled={Boolean(dateRangeError)}
              onExport={() => runExport('lessons', exportLessonsCsv)}
              title="Export des leçons"
            />
            <ExportCard
              busy={busyKey === 'prefecture'}
              description="Synthèse élèves, affectations enseignants et leçons réalisées."
              disabled={Boolean(dateRangeError)}
              icon={FileSpreadsheet}
              onExport={() => runExport('prefecture', exportPrefectureCsv)}
              title="Synthèse préfecture (CSV)"
            />
          </div>
        </>
      )}
    </div>
  )
}
