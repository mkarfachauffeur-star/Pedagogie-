import { useState } from 'react'

const DOC_TYPES = [
  'Pièce d’identité recto/verso',
  'Justificatif domicile (-3 mois)',
  'ASSR/JDC',
  'E-photo',
  'Contrat auto-école retourné signé',
  'Résultat ETG (code de la route)',
  'Autre',
]

function isImage(mime) {
  return (mime || '').startsWith('image/')
}
function isPdf(mime) {
  return mime === 'application/pdf'
}

// Liste des pièces jointes d'un message (aperçu image/PDF + téléchargement).
// `classify` (optionnel) = (attachment, type) => void : action de classement
// administratif (réservée au secrétariat sur les conversations élève).
export function AttachmentList({ attachments, classify }) {
  const [types, setTypes] = useState({})
  if (!attachments || !attachments.length) return null
  return (
    <div className="mt-2 grid gap-2">
      {attachments.map((a) => {
        const image = isImage(a.mime_type)
        const pdf = isPdf(a.mime_type)
        return (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-white/90 p-2 text-xs text-slate-700">
            {image && a.url && (
              <a href={a.url} target="_blank" rel="noreferrer">
                <img src={a.url} alt={a.file_name} className="max-h-44 w-auto rounded-lg border border-slate-200" />
              </a>
            )}
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{a.file_name}</span>
              {a.url ? (
                <span className="flex shrink-0 gap-2">
                  {(image || pdf) && (
                    <a className="font-bold text-cyan-700 underline" href={a.url} target="_blank" rel="noreferrer">Aperçu</a>
                  )}
                  <a className="font-bold text-cyan-700 underline" href={a.url} download={a.file_name}>Télécharger</a>
                </span>
              ) : (
                <span className="opacity-60">Indisponible</span>
              )}
            </div>
            {classify && (
              <div className="mt-2 flex items-center gap-2">
                <select
                  className="min-h-8 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none"
                  value={types[a.id] || DOC_TYPES[0]}
                  onChange={(event) => setTypes((current) => ({ ...current, [a.id]: event.target.value }))}
                >
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  type="button"
                  className="rounded-lg bg-navy-950 px-2 py-1 text-[11px] font-bold text-white transition hover:bg-cyan-700"
                  onClick={() => classify(a, types[a.id] || DOC_TYPES[0])}
                >
                  Classer
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Bouton « trombone » pour joindre des fichiers.
export function AttachButton({ onAdd, disabled }) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-500/10 px-3 text-cyan-100 transition hover:bg-cyan-500/20 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      title="Joindre des fichiers"
    >
      <span aria-hidden className="text-lg">📎</span>
      <input
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          onAdd(Array.from(event.target.files || []))
          event.target.value = ''
        }}
      />
    </label>
  )
}

// Liste des fichiers en attente d'envoi (avant l'envoi du message).
export function PendingFiles({ files, onRemove }) {
  if (!files || !files.length) return null
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {files.map((file, index) => (
        <span
          key={`${file.name}-${index}`}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700"
        >
          {file.name}
          <button type="button" onClick={() => onRemove(index)} className="text-slate-500 hover:text-slate-800">×</button>
        </span>
      ))}
    </div>
  )
}
