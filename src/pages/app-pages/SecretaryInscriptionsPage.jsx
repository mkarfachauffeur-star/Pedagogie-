import { useMemo, useState } from 'react'
import { formationTypeOptions, useStudentTrackingStore } from '../../data/studentTrackingStore'

export default function SecretaryInscriptionsPage() {
  const { students, addStudent } = useStudentTrackingStore()
  const formatDateFr = (dateString) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    if (!year || !month || !day) return dateString
    return `${day}/${month}/${year}`
  }
  const [activeTab, setActiveTab] = useState('list')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    birthDate: '',
    address: '',
    phone: '',
    email: '',
    neph: '',
    licenseCategory: 'Permis B',
    packageName: 'Forfait 20h',
    formationType: '',
    registrationDate: new Date().toISOString().slice(0, 10),
    drivingType: 'classique',
    payment: '',
    remainingPayment: '',
    documents: [],
    fileNumber: `PD-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, '0')}`,
    status: 'En attente',
  })

  const completedFields = useMemo(() => {
    const required = [
      'lastName',
      'firstName',
      'birthDate',
      'phone',
      'email',
      'neph',
      'packageName',
      'formationType',
      'drivingType',
      'payment',
      'status',
    ]

    return (
      required.filter((field) => {
        if (field === 'formationType') return form.formationType && form.formationType !== 'Sélectionner...'
        return String(form[field]).trim()
      }).length + (form.documents.length ? 1 : 0)
    )
  }, [form])

  const completion = Math.round((completedFields / 12) * 100)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const toggleDocument = (documentName) => {
    setForm((current) => ({
      ...current,
      documents: current.documents.includes(documentName)
        ? current.documents.filter((item) => item !== documentName)
        : [...current.documents, documentName],
    }))
  }

  const saveRegistration = (event) => {
    event.preventDefault()
    if (!form.formationType || form.formationType === 'Sélectionner...') {
      return
    }
    addStudent({
      id: form.fileNumber,
      firstName: form.firstName || 'Nouvel',
      lastName: form.lastName || 'Élève',
      teacher: 'À assigner',
      formationType: form.formationType,
    })
    setActiveTab('list')
    setShowForm(false)
    setForm((current) => ({
      ...current,
      formationType: '',
      lastName: '',
      firstName: '',
      birthDate: '',
      address: '',
      phone: '',
      email: '',
      neph: '',
      payment: '',
      remainingPayment: '',
      documents: [],
      fileNumber: `PD-${new Date().getFullYear()}-${String(students.length + 2).padStart(3, '0')}`,
      status: 'En attente',
    }))
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            Secrétariat
          </span>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Inscriptions auto-école
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-blue-50">
                Créez un dossier élève depuis une vraie fenêtre formulaire et suivez les inscriptions.
              </p>
            </div>
            <button
              className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-navy-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-white"
              onClick={() => setShowForm(true)}
              type="button"
            >
              + Nouvelle inscription
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        {[
          ['list', 'Dossiers enregistrés'],
          ['api', 'Préparation base de données'],
        ].map(([id, label]) => (
          <button
            className={`rounded-2xl px-4 py-2 text-sm font-extrabold transition ${
              activeTab === id
                ? 'bg-navy-950 text-white shadow-lg'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-cyan-50'
            }`}
            key={id}
            onClick={() => setActiveTab(id)}
            type="button"
          >
            {label}
          </button>
        ))}
        <button
          className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-extrabold text-cyan-700 transition hover:bg-cyan-100"
          onClick={() => setShowForm(true)}
          type="button"
        >
          Ouvrir le formulaire d’inscription
        </button>
      </div>

      {activeTab === 'list' && (
        <section className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">Dossiers enregistrés</h2>
              <p className="mt-1 text-sm text-slate-500">
                Chaque inscription enregistrée apparaît immédiatement ici.
              </p>
            </div>
            <button
              className="rounded-2xl bg-navy-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-cyan-700"
              onClick={() => setShowForm(true)}
              type="button"
            >
              Nouvelle inscription
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            {students.map((student) => (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={student.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-950">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {student.id} · {student.formationType || 'Permis B traditionnel'}
                    </p>
                    {student.aacTracking && (
                      <p className="text-xs font-bold text-cyan-700">
                        AAC début {formatDateFr(student.aacTracking.startDate)} · minimum {formatDateFr(student.aacTracking.minimumEndDate)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                      {student.formationType || 'Permis B traditionnel'}
                    </span>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                      REMC {student.progress?.global || 0}%
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                      Reste {student.remainingPayment || '0'} €
                    </span>
                    {student.aacTracking && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {student.aacTracking.kilometersCurrent}/{student.aacTracking.kilometersTarget} km
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'api' && (
        <section className="rounded-[2rem] border border-white/70 bg-navy-950 p-5 text-white shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-extrabold">Structure prête pour base de données</h2>
          <p className="mt-2 text-sm text-blue-100">
            Les champs sont déjà structurés en objet `studentRegistration` pour une future API.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-cyan-50">
            {JSON.stringify({ studentRegistration: form }, null, 2)}
          </pre>
        </section>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
          <form
            className="pointer-events-auto max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            onSubmit={saveRegistration}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-cyan-700">
                  Nouvelle inscription
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                  Formulaire élève auto-école
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Remplissez les informations puis enregistrez pour créer le dossier simulé.
                </p>
              </div>
              <button
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                onClick={() => setShowForm(false)}
                type="button"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-black text-cyan-800">Complétion dossier</p>
                <p className="text-xl font-black text-cyan-700">{completion}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-6">
              <FormSection title="Informations élève">
                <TextField label="Nom" onChange={updateField} value={form.lastName} name="lastName" />
                <TextField label="Prénom" onChange={updateField} value={form.firstName} name="firstName" />
                <TextField label="Téléphone" onChange={updateField} value={form.phone} name="phone" type="tel" />
                <TextField label="Courriel" onChange={updateField} value={form.email} name="email" type="email" />
                <TextField label="Date de naissance" onChange={updateField} value={form.birthDate} name="birthDate" type="date" />
                <TextField label="NEPH" onChange={updateField} value={form.neph} name="neph" />
                <SelectField label="Formule" name="packageName" onChange={updateField} value={form.packageName} options={['Forfait 20h', 'Forfait 30h', 'Code + conduite', 'Conduite accompagnée', 'Conduite supervisée']} />
                <SelectField label="Type de formation (obligatoire)" name="formationType" onChange={updateField} value={form.formationType} options={['Sélectionner...', ...formationTypeOptions]} />
                <SelectField label="Type de conduite" name="drivingType" onChange={updateField} value={form.drivingType} options={['classique', 'accompagnée', 'supervisée']} />
              </FormSection>

              <FormSection title="Informations administratives">
                <TextField label="Paiement encaissé (€)" onChange={updateField} value={form.payment} name="payment" type="number" />
                <TextField label="Reste à payer (€)" onChange={updateField} value={form.remainingPayment} name="remainingPayment" type="number" />
                <TextField label="Numéro dossier" onChange={updateField} value={form.fileNumber} name="fileNumber" />
                <SelectField label="Statut du dossier" name="status" onChange={updateField} value={form.status} options={['En attente', 'En cours', 'Validé', 'Pièces manquantes', 'Archivé']} />
                <div className="md:col-span-2 xl:col-span-4">
                  <p className="mb-3 text-sm font-bold text-slate-700">Documents fournis</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {['Pièce identité', 'Justificatif domicile', 'ASSR/JDC', 'Photo signature'].map((documentName) => (
                      <button
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                          form.documents.includes(documentName)
                            ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-cyan-50'
                        }`}
                        key={documentName}
                        onClick={() => toggleDocument(documentName)}
                        type="button"
                      >
                        {form.documents.includes(documentName) ? '✓ ' : '+ '}
                        {documentName}
                      </button>
                    ))}
                  </div>
                </div>
              </FormSection>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50"
                onClick={() => setActiveTab('api')}
                type="button"
              >
                Voir payload futur API
              </button>
              <button
                className="rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700"
                type="submit"
              >
                Enregistrer l’inscription
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function FormSection({ title, children }) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5">
      <h2 className="mb-4 text-xl font-extrabold text-slate-950">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  )
}

function TextField({ className = '', label, name, onChange, type = 'text', value }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
        onChange={(event) => onChange(name, event.target.value)}
        type={type}
        value={value}
      />
    </label>
  )
}

function SelectField({ label, name, onChange, options, value }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <select
        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
        onChange={(event) => onChange(name, event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
