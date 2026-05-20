import { useEffect, useMemo, useState } from 'react'
import { getStudentSecretaryThread } from '../../utils/messagingStore'

const contacts = [
  {
    id: 'teacher',
    name: 'Jean Moniteur',
    role: 'Enseignant',
    status: 'En ligne',
    messages: [
      { from: 'contact', text: 'Peux-tu confirmer les disponibilités de jeudi ?', time: '09:18' },
      { from: 'me', text: 'Oui, je bloque les créneaux sur le planning.', time: '09:22' },
    ],
  },
  {
    id: 'manager',
    name: 'Gérant',
    role: 'Direction',
    status: 'Actif il y a 3 min',
    messages: [
      { from: 'contact', text: 'Merci de me transmettre la synthèse des dossiers incomplets.', time: '08:51' },
      { from: 'me', text: 'C’est en cours, je t’envoie la liste ce matin.', time: '08:55' },
    ],
  },
]

export default function SecretaryMessagesPage() {
  const [activeConversationId, setActiveConversationId] = useState('teacher')
  const [conversationFilter, setConversationFilter] = useState('all')
  const [newMessage, setNewMessage] = useState('')
  const [chatState, setChatState] = useState(contacts)

  const studentThread = useMemo(() => getStudentSecretaryThread(), [])
  const studentDocumentCount = studentThread.messages.reduce(
    (total, message) => total + (message.documents?.length || 0),
    0,
  )
  const activeInternalContact = useMemo(
    () => chatState.find((contact) => contact.id === activeConversationId) || null,
    [activeConversationId, chatState],
  )
  const isStudentConversationActive = activeConversationId === 'student-thread'
  const conversationItems = useMemo(
    () => [
      ...chatState.map((contact) => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        status: contact.status,
        type: 'internal',
      })),
      {
        id: 'student-thread',
        name: `${studentThread.studentName} -> Secrétariat`,
        role: 'Canal élève',
        status: `${studentThread.messages.length} messages · ${studentDocumentCount} document(s)`,
        type: 'student',
      },
    ],
    [chatState, studentDocumentCount, studentThread.messages.length, studentThread.studentName],
  )
  const filteredConversationItems = useMemo(() => {
    if (conversationFilter === 'internal') {
      return conversationItems.filter((item) => item.type === 'internal')
    }
    if (conversationFilter === 'student') {
      return conversationItems.filter((item) => item.type === 'student')
    }
    return conversationItems
  }, [conversationFilter, conversationItems])

  useEffect(() => {
    if (!filteredConversationItems.some((item) => item.id === activeConversationId)) {
      setActiveConversationId(filteredConversationItems[0]?.id ?? null)
    }
  }, [activeConversationId, filteredConversationItems])

  const sendMessage = (event) => {
    event.preventDefault()
    if (!newMessage.trim()) return
    setChatState((current) =>
      current.map((contact) =>
        contact.id === activeInternalContact?.id
          ? {
              ...contact,
              messages: [
                ...contact.messages,
                { from: 'me', text: newMessage.trim(), time: new Date().toTimeString().slice(0, 5) },
              ],
            }
          : contact,
      ),
    )
    setNewMessage('')
  }

  return (
    <div className="pd-page">
      <section className="pd-card overflow-hidden p-0">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#10304f] via-[#133a5d] to-[#1a4870] p-6 text-white md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(107,143,178,0.22),transparent_42%)]"
          />
          <p className="relative z-10 pd-eyebrow">Messagerie secrétariat</p>
          <h1 className="relative z-10 mt-4 pd-title-page">Conversations internes</h1>
          <p className="relative z-10 mt-3 max-w-4xl pd-subtitle">
            Canal interne réservé aux échanges avec les enseignants et le gérant. Aucun message élève n’apparaît ici.
          </p>
        </div>
      </section>

      <div className="pd-msg-panel grid gap-0 lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-white/16 bg-white/[0.1] p-4 backdrop-blur-md lg:border-b-0 lg:border-r md:p-5">
          <h2 className="pd-title-section text-lg">Conversations</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setConversationFilter('all')}
              className={`rounded-xl px-2 py-2 text-xs font-semibold ${conversationFilter === 'all' ? 'pd-msg-thread-active' : 'pd-msg-thread'}`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setConversationFilter('internal')}
              className={`rounded-xl px-2 py-2 text-xs font-semibold ${conversationFilter === 'internal' ? 'pd-msg-thread-active' : 'pd-msg-thread'}`}
            >
              Internes
            </button>
            <button
              type="button"
              onClick={() => setConversationFilter('student')}
              className={`rounded-xl px-2 py-2 text-xs font-semibold ${conversationFilter === 'student' ? 'pd-msg-thread-active' : 'pd-msg-thread'}`}
            >
              Élève
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {filteredConversationItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveConversationId(item.id)}
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                  activeConversationId === item.id ? 'pd-msg-thread-active' : 'pd-msg-thread hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white">{item.name}</p>
                  <span className="pd-msg-chip">{item.type === 'student' ? 'Élève' : 'Interne'}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-cyan-50/65">{item.role}</p>
                <p className="mt-2 text-xs font-medium text-cyan-200/90">{item.status}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-col bg-white/[0.08] p-5 md:p-6">
          {activeConversationId ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-white/16 pb-4">
                <div>
                  <h2 className="pd-title-section text-xl">
                    {isStudentConversationActive ? `${studentThread.studentName} -> Secrétariat` : activeInternalContact?.name}
                  </h2>
                  <p className="text-sm text-cyan-50/70">
                    {isStudentConversationActive ? 'Canal élève (lecture)' : activeInternalContact?.role}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pd-msg-chip">{isStudentConversationActive ? 'Lecture seule' : 'Conversation interne'}</span>
                  {!isStudentConversationActive && activeInternalContact?.status && (
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      {activeInternalContact.status}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveConversationId(null)}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-50 transition hover:bg-white/20"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              <div className="mt-4 grid max-h-[420px] gap-3 overflow-y-auto pr-1">
                {(isStudentConversationActive ? studentThread.messages : activeInternalContact?.messages || []).map(
                  (message, index) => (
                    <article
                      className={`max-w-[92%] ${
                        (isStudentConversationActive ? message.fromRole === 'student' : message.from === 'me')
                          ? 'ml-auto pd-msg-bubble-sent'
                          : 'pd-msg-bubble-received'
                      }`}
                      key={`${message.time}-${index}`}
                    >
                      {isStudentConversationActive && (
                        <p className="text-xs font-semibold opacity-80">
                          {message.from} · {message.time}
                        </p>
                      )}
                      <p className={isStudentConversationActive ? 'mt-1' : ''}>{message.text}</p>
                      {!isStudentConversationActive && (
                        <p
                          className={`mt-2 text-[11px] font-medium ${message.from === 'me' ? 'text-cyan-100/75' : 'text-cyan-50/55'}`}
                        >
                          {message.time}
                        </p>
                      )}
                      {!!message.documents?.length && (
                        <ul className="mt-2 space-y-2 text-xs">
                          {message.documents.map((doc) => (
                            <li
                              className="flex items-center justify-between gap-2 rounded-lg border border-white/12 bg-white/10 px-2 py-1"
                              key={`${doc.name}-${doc.size}`}
                            >
                              <span className="truncate">{doc.name}</span>
                              {doc.dataUrl ? (
                                <a
                                  className="rounded-md border border-cyan-300/35 bg-cyan-500/10 px-2 py-0.5 text-cyan-100 hover:bg-cyan-500/20"
                                  download={doc.name}
                                  href={doc.dataUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  Ouvrir
                                </a>
                              ) : (
                                <span className="text-cyan-50/60">Indisponible</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ),
                )}
              </div>

              {!isStudentConversationActive && (
                <form
                  className="mt-4 flex flex-col gap-3 border-t border-white/16 pt-4 sm:flex-row"
                  onSubmit={sendMessage}
                >
                  <input
                    className="pd-input-dark"
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder="Écrire un message interne..."
                    value={newMessage}
                  />
                  <button
                    className="rounded-2xl bg-gradient-to-r from-cyan-600/95 to-cyan-500/90 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(6,182,212,0.18)] transition hover:-translate-y-0.5 hover:brightness-[1.03]"
                    type="submit"
                  >
                    Envoyer
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="pd-msg-empty">Sélectionnez une conversation dans la colonne de gauche.</div>
          )}
        </section>
      </div>
    </div>
  )
}
