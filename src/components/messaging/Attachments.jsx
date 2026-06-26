import { useState } from 'react'
import { ImagePreviewModal, downloadAttachment, isImageAttachment } from '../ui/ImagePreviewModal'

const DOC_TYPES = [
  'Pièce d’identité recto/verso',
  'Justificatif domicile (-3 mois)',
  'ASSR/JDC',
  'E-photo',
  'Contrat auto-école retourné signé',
  'Résultat ETG (code de la route)',
  'Autre',
]

function isPdf(mime) {
  return mime === 'application/pdf'
}

// Liste des pièces jointes d'un message (aperçu image/PDF + téléchargement).
// `classify` (optionnel) = (attachment, type) => void : action de classement
// administratif (réservée au secrétariat sur les conversations élève).
export function AttachmentList({ attachments, classify }) {
  const [types, setTypes] = useState({})
  const [preview, setPreview] = useState(null)
  if (!attachments || !attachments.length) return null
  return (
    <>
      <div className="mt-2 grid gap-2">
        {attachments.map((a) => {
          const image = isImageAttachment(a)
          const pdf = isPdf(a.mime_type)
          return (
            <div key={a.id} className="rounded-xl border-2 border-slate-300 bg-white/90 p-2 text-xs text-slate-700">
              {image && a.url && (
                <button
                  type="button"
                  onClick={() => setPreview(a)}
                  className="block w-full cursor-zoom-in overflow-hidden rounded-lg border-2 border-slate-300 transition hover:border-cyan-300 hover:shadow-sm"
                  title="Agrandir l'image"
                >
                  <img
                    src={a.url}
                    alt={a.file_name}
                    className="max-h-44 w-auto"
                    draggable={false}
                  />
                </button>
              )}
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{a.file_name}</span>
                {a.url ? (
                  <span className="flex shrink-0 gap-2">
                    {image && (
                      <button
                        type="button"
                        className="font-bold text-cyan-700 underline"
                        onClick={() => setPreview(a)}
                      >
                        Aperçu
                      </button>
                    )}
                    {pdf && (
                      <a className="font-bold text-cyan-700 underline" href={a.url} target="_blank" rel="noreferrer">Aperçu</a>
                    )}
                    <button
                      type="button"
                      className="font-bold text-cyan-700 underline"
                      onClick={() => (image ? downloadAttachment(a) : window.open(a.url, '_blank', 'noopener,noreferrer'))}
                    >
                      Télécharger
                    </button>
                  </span>
                ) : (
                  <span className="opacity-60">Indisponible</span>
                )}
              </div>
              {classify && (
                <div className="mt-2 flex items-center gap-2">
                  <select
                    className="min-h-8 flex-1 rounded-lg border-2 border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none"
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
      {preview && <ImagePreviewModal attachment={preview} onClose={() => setPreview(null)} />}
    </>
  )
}

// Bouton « trombone » pour joindre des fichiers.
export function AttachButton({ onAdd, disabled }) {
  return (
    <label
      className={`pd-msg-btn-attach ${disabled ? 'pointer-events-none opacity-50' : ''}`}
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
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700"
        >
          {file.name}
          <button type="button" onClick={() => onRemove(index)} className="text-slate-500 hover:text-slate-800">×</button>
        </span>
      ))}
    </div>
  )
}
