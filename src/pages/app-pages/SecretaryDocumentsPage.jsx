import { useMemo, useState } from 'react'

const existingStudents = [
  {
    id: 'PD-2026-001',
    name: 'Thomas Martin',
    email: 'thomas.martin@example.com',
    phone: '06 12 34 56 78',
    status: 'Dossier validé',
  },
  {
    id: 'PD-2026-002',
    name: 'Camille Leroy',
    email: 'camille.leroy@example.com',
    phone: '06 98 76 54 32',
    status: 'Pièces manquantes',
  },
  {
    id: 'PD-2026-003',
    name: 'Lucas Bernard',
    email: 'lucas.bernard@example.com',
    phone: '07 22 44 66 88',
    status: 'En attente paiement',
  },
]

export default function SecretaryDocumentsPage() {
  const [associationMode, setAssociationMode] = useState('existing')
  const [query, setQuery] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(existingStudents[0].id)
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    note: '',
  })
  const [documentForm, setDocumentForm] = useState({
    type: 'Pièce identité',
    reference: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    status: 'À vérifier',
    folder: 'Dossier administratif',
    fileName: '',
    comment: '',
  })
  const [documents, setDocuments] = useState([
    {
      id: 'DOC-001',
      studentName: 'Thomas Martin',
      type: 'Pièce identité',
      status: 'Validé',
      receivedDate: '2026-01-12',
    },
    {
      id: 'DOC-002',
      studentName: 'Camille Leroy',
      type: 'Justificatif domicile',
      status: 'À vérifier',
      receivedDate: '2026-01-14',
    },
  ])

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return existingStudents

    return existingStudents.filter((student) =>
      [student.name, student.email, student.id].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [query])

  const selectedStudent = useMemo(
    () => existingStudents.find((student) => student.id === selectedStudentId) || existingStudents[0],
    [selectedStudentId],
  )

  const linkedStudent =
    associationMode === 'existing'
      ? selectedStudent
      : {
          id: 'NOUVEAU',
          name: newStudent.name || 'Nouvel élève non inscrit',
          email: newStudent.email || 'Courriel à compléter',
          phone: newStudent.phone || 'Téléphone à compléter',
          status: 'Pré-inscription document',
        }

  const updateDocument = (field, value) => {
    setDocumentForm((current) => ({ ...current, [field]: value }))
  }

  const saveDocument = (event) => {
    event.preventDefault()
    const nextDocument = {
      id: `DOC-${String(documents.length + 1).padStart(3, '0')}`,
      studentName: linkedStudent.name,
      type: documentForm.type,
      status: documentForm.status,
      receivedDate: documentForm.receivedDate,
      folder: documentForm.folder,
      fileName: documentForm.fileName || 'Upload simulé',
    }
    setDocuments((current) => [nextDocument, ...current])
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            Documents
          </span>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Enregistrement et liaison documentaire
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-blue-50">
                Associez chaque document à un élève existant ou à un nouvel élève non encore
                inscrit.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <p className="text-sm font-bold text-blue-100">Documents suivis</p>
              <p className="mt-1 text-4xl font-black">{documents.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <aside className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <h2 className="text-2xl font-extrabold text-slate-950">Associer à un élève</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ['existing', 'Élève existant'],
              ['new', 'Nouvel élève'],
            ].map(([id, label]) => (
              <button
                className={`rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                  associationMode === id
                    ? 'bg-navy-950 text-white shadow-lg'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-cyan-50'
                }`}
                key={id}
                onClick={() => setAssociationMode(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {associationMode === 'existing' ? (
            <div className="mt-5">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Recherche élève</span>
                <input
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nom, email ou numéro dossier..."
                  value={query}
                />
              </label>
              <div className="mt-4 space-y-3">
                {filteredStudents.map((student) => (
                  <button
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedStudentId === student.id
                        ? 'border-cyan-300 bg-cyan-50 shadow-md'
                        : 'border-slate-200 bg-white hover:bg-cyan-50'
                    }`}
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    type="button"
                  >
                    <span className="block font-extrabold text-slate-950">{student.name}</span>
                    <span className="mt-1 block text-sm text-slate-500">{student.id} · {student.status}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              <Field label="Nom complet" onChange={(value) => setNewStudent((current) => ({ ...current, name: value }))} value={newStudent.name} />
              <Field label="Courriel" onChange={(value) => setNewStudent((current) => ({ ...current, email: value }))} value={newStudent.email} type="email" />
              <Field label="Téléphone" onChange={(value) => setNewStudent((current) => ({ ...current, phone: value }))} value={newStudent.phone} />
              <Field label="Note pré-inscription" onChange={(value) => setNewStudent((current) => ({ ...current, note: value }))} value={newStudent.note} />
            </div>
          )}

          <article className="mt-5 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Fiche élève liée</p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-950">{linkedStudent.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{linkedStudent.id} · {linkedStudent.status}</p>
            <p className="mt-3 text-sm text-slate-600">{linkedStudent.email}</p>
            <p className="text-sm text-slate-600">{linkedStudent.phone}</p>
          </article>
        </aside>

        <form
          className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl"
          onSubmit={saveDocument}
        >
          <h2 className="text-2xl font-extrabold text-slate-950">Document à enregistrer</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SelectField label="Type de document" onChange={(value) => updateDocument('type', value)} value={documentForm.type} options={['Pièce identité', 'Justificatif domicile', 'ASSR/JDC', 'Photo signature', 'Contrat signé', 'Mandat de paiement', 'Dossier ANTS']} />
            <Field label="Référence document" onChange={(value) => updateDocument('reference', value)} value={documentForm.reference} />
            <Field label="Date de réception" onChange={(value) => updateDocument('receivedDate', value)} value={documentForm.receivedDate} type="date" />
            <SelectField label="Statut" onChange={(value) => updateDocument('status', value)} value={documentForm.status} options={['À vérifier', 'Validé', 'Refusé', 'À compléter', 'Archivé']} />
            <SelectField label="Classement dossier" onChange={(value) => updateDocument('folder', value)} value={documentForm.folder} options={['Dossier administratif', 'Paiement', 'ANTS', 'Contrat', 'Examen', 'Archive']} />
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Upload simulé</span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-dashed border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-navy-950 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                onChange={(event) => updateDocument('fileName', event.target.files?.[0]?.name || '')}
                type="file"
              />
              {documentForm.fileName && (
                <span className="mt-2 block text-xs font-bold text-cyan-700">
                  Fichier sélectionné : {documentForm.fileName}
                </span>
              )}
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-slate-700">Commentaire</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                onChange={(event) => updateDocument('comment', event.target.value)}
                value={documentForm.comment}
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-700">Payload futur API</p>
            <pre className="mt-3 overflow-x-auto text-xs text-slate-600">
              {JSON.stringify({ linkedStudent, document: documentForm }, null, 2)}
            </pre>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              className="rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700"
              type="submit"
            >
              Enregistrer le document
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">Documents enregistrés</h2>
            <p className="mt-1 text-sm text-slate-500">
              Classement par élève et dossier pour retrouver rapidement chaque pièce.
            </p>
          </div>
          <span className="w-fit rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700">
            {documents.length} pièces
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {documents.map((document) => (
            <button className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/50 hover:shadow-lg" key={document.id} type="button">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-950">{document.type}</h3>
                  <p className="mt-1 text-sm text-slate-500">{document.studentName} · {document.receivedDate}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {document.folder || 'Dossier administratif'} · {document.fileName || 'Fichier simulé'}
                  </p>
                </div>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                  {document.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function Field({ label, onChange, type = 'text', value }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  )
}

function SelectField({ label, onChange, options, value }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <select
        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
        onChange={(event) => onChange(event.target.value)}
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
