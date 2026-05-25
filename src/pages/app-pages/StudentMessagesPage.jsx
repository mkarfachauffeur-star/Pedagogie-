import { useMemo, useState } from 'react'
import {
  appendStudentMessageToSecretary,
  getStudentSecretaryThread,
} from '../../utils/messagingStore'

function formatFileSize(size) {
  if (size < 1024) return `${size} o`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`Impossible de lire ${file.name}`))
    reader.readAsDataURL(file)
  })
}

export default function StudentMessagesPage() {
  const [conversation, setConversation] = useState(() => {
    const thread = getStudentSecretaryThread()
    return {
      id: 'secretary',
      name: thread.secretaryName || 'Secrétariat',
      role: 'Secrétariat',
      subject: thread.subject || 'Envoi de documents élève',
      messages: thread.messages || [],
    }
  })
  const [draft, setDraft] = useState('')
  const [pendingFiles, setPendingFiles] = useState([])

  const totalDocuments = useMemo(
    () => conversation.messages.filter((item) => item.documents?.length).length,
    [conversation.messages],
  )

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setPendingFiles((current) => [
      ...current,
      ...files.map((file, index) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        file,
      })),
    ])
    event.target.value = ''
  }

  const removePendingFile = (fileId) => {
    setPendingFiles((current) => current.filter((file) => file.id !== fileId))
  }

  const sendMessage = async () => {
    const message = draft.trim()
    if (!message && !pendingFiles.length) return

    const documents = await Promise.all(
      pendingFiles.map(async (file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: await fileToDataUrl(file.file),
      })),
    )

    const updatedThread = appendStudentMessageToSecretary({
      studentName: 'Thomas',
      text: message || 'Documents envoyés au secrétariat.',
      documents,
    })
    setConversation((current) => ({
      ...current,
      messages: updatedThread.messages,
    }))
    setDraft('')
    setPendingFiles([])
  }

  return (
    <div className="pd-page">
      <section className="pd-card overflow-hidden p-0">
        <div className="pd-hero-banner">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(107,143,178,0.22),transparent_42%)]"
          />
          <span className="relative z-10 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-sm font-semibold text-cyan-100/90">
            Messagerie élève
          </span>
          <h1 className="relative z-10 mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Contact secrétariat
          </h1>
          <p className="pd-hero-lead relative z-10 mt-3 max-w-3xl text-base leading-7">
            Cette messagerie élève est dédiée uniquement au secrétariat pour envoyer des documents
            et suivre votre dossier administratif.
          </p>
        </div>
      </section>

      <section className="pd-msg-panel grid min-h-[680px] lg:grid-cols-[320px_1fr]">
        <aside className="pd-msg-sidebar">
          <h2 className="pd-msg-sidebar-title">Canal disponible</h2>
          <p className="pd-msg-sidebar-muted mt-1">Conversation unique avec le secrétariat</p>
          <button className="pd-msg-contact-active mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{conversation.name}</p>
              <span className="pd-msg-chip">Actif</span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600">{conversation.role}</p>
            <p className="mt-2 text-xs font-medium text-slate-600">{conversation.subject}</p>
          </button>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="pd-stat-pill p-3">
              <p className="text-2xl font-semibold text-slate-900">{conversation.messages.length}</p>
              <p className="text-xs font-medium text-slate-500">Messages</p>
            </div>
            <div className="pd-stat-pill p-3">
              <p className="text-2xl font-semibold text-blue-600">{totalDocuments}</p>
              <p className="text-xs font-medium text-slate-500">Envois docs</p>
            </div>
          </div>

          <label className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
            Ajouter un document
            <input className="hidden" multiple onChange={handleFiles} type="file" />
          </label>

          {!!pendingFiles.length && (
            <div className="mt-3 space-y-2">
              {pendingFiles.map((file) => (
                <div
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                  key={file.id}
                >
                  <span className="truncate text-slate-700">
                    {file.name} · {formatFileSize(file.size)}
                  </span>
                  <button
                    className="rounded-lg px-2 py-0.5 text-slate-500 hover:bg-slate-100"
                    onClick={() => removePendingFile(file.id)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>

        <div className="pd-msg-chat-body">
          <header className="pd-msg-chat-header">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-slate-900">{conversation.name}</h2>
              <span className="pd-msg-chip">Secrétariat</span>
            </div>
            <p className="text-sm text-slate-600">Envoi de documents et suivi administratif</p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
            {conversation.messages.map((message, index) => {
              const mine = message.from === 'Thomas'
              return (
                <article
                  className={`flex animate-slide-up ${mine ? 'justify-end' : 'justify-start'}`}
                  key={`${message.time}-${index}`}
                >
                  <div className={`max-w-xl ${mine ? 'pd-msg-bubble-sent' : 'pd-msg-bubble-received'}`}>
                    <p className="text-xs font-bold opacity-70">
                      {message.from} · {message.time}
                    </p>
                    <p className="mt-2 leading-7">{message.text}</p>
                    {!!message.documents?.length && (
                      <ul className={`mt-3 space-y-1 text-xs ${mine ? 'text-white/90' : 'text-slate-600'}`}>
                        {message.documents.map((doc) => (
                          <li key={`${doc.name}-${doc.size}`}>- {doc.name} ({formatFileSize(doc.size)})</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <footer className="pd-msg-chat-footer">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="pd-input-dark"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') sendMessage()
                }}
                placeholder="Écrire un message au secrétariat..."
                value={draft}
              />
              <button
                className="rounded-2xl bg-gradient-to-r from-cyan-700 to-cyan-600 px-5 py-3 text-sm font-semibold text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:brightness-[1.03]"
                onClick={sendMessage}
                type="button"
              >
                Envoyer
              </button>
            </div>
          </footer>
        </div>
      </section>
    </div>
  )
}
