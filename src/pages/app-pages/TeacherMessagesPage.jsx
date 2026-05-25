import { useMemo, useState } from 'react'

const contacts = [
  {
    id: 'secretary',
    name: 'Secrétariat',
    role: 'Isabelle Lemoine',
    status: 'En ligne',
    tone: 'cyan',
    messages: [
      { from: 'contact', text: 'Bonjour, peux-tu confirmer le planning de Thomas demain ?', time: '09:12' },
      { from: 'me', text: 'Oui, confirmé pour 10h00.', time: '09:14' },
    ],
  },
  {
    id: 'manager',
    name: 'Gérant',
    role: 'Direction',
    status: 'Actif il y a 5 min',
    tone: 'violet',
    messages: [
      { from: 'contact', text: 'Peux-tu me faire un retour sur les élèves prêts examen ?', time: '08:40' },
      { from: 'me', text: 'Oui, je t’envoie la synthèse après les leçons de ce matin.', time: '08:45' },
    ],
  },
]

export default function TeacherMessagesPage() {
  const [activeContactId, setActiveContactId] = useState('secretary')
  const [newMessage, setNewMessage] = useState('')
  const [chatState, setChatState] = useState(contacts)

  const activeContact = useMemo(
    () => chatState.find((contact) => contact.id === activeContactId) || chatState[0],
    [activeContactId, chatState],
  )

  const sendMessage = (event) => {
    event.preventDefault()
    if (!newMessage.trim()) return
    setChatState((current) =>
      current.map((contact) =>
        contact.id === activeContact.id
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
        <div className="pd-hero-banner">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(107,143,178,0.22),transparent_42%)]"
          />
          <p className="relative z-10 pd-eyebrow">Messagerie enseignant</p>
          <h1 className="relative z-10 mt-4 pd-title-page">Échanges instantanés internes</h1>
          <p className="relative z-10 mt-3 max-w-4xl pd-subtitle">
            Cette messagerie est dédiée aux échanges rapides avec le secrétariat et le gérant.
          </p>
        </div>
      </section>

      <div className="pd-msg-panel grid gap-0 lg:grid-cols-[320px_1fr]">
        <aside className="pd-msg-sidebar">
          <h2 className="pd-msg-sidebar-title">Contacts internes</h2>
          <p className="pd-msg-sidebar-muted mt-1">Un seul fil actif à la fois</p>
          <div className="mt-4 grid gap-3">
            {chatState.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => setActiveContactId(contact.id)}
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                  activeContact.id === contact.id ? 'pd-msg-thread-active' : 'pd-msg-thread hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{contact.name}</p>
                  <span className="pd-msg-chip">Interne</span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">{contact.role}</p>
                <p className="mt-2 text-xs font-medium text-cyan-200/90">
                  {contact.status} · {contact.messages.length} messages
                </p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-col bg-slate-50/80 p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-white/16 pb-4">
            <div>
              <h2 className="pd-title-section text-xl">{activeContact.name}</h2>
              <p className="text-sm text-slate-600">{activeContact.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="pd-msg-chip">Interne</span>
              <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                {activeContact.status}
              </span>
            </div>
          </div>

          <div className="mt-4 grid max-h-[420px] gap-3 overflow-y-auto pr-1">
            {activeContact.messages.map((message, index) => (
              <article
                key={`${message.time}-${index}`}
                className={`max-w-[85%] ${message.from === 'me' ? 'ml-auto pd-msg-bubble-sent' : 'pd-msg-bubble-received'}`}
              >
                <p>{message.text}</p>
                <p
                  className={`mt-2 text-[11px] font-medium ${message.from === 'me' ? 'text-white/75' : 'text-slate-500'}`}
                >
                  {message.time}
                </p>
              </article>
            ))}
          </div>

          <form
            className="mt-4 flex flex-col gap-3 border-t border-white/16 pt-4 sm:flex-row"
            onSubmit={sendMessage}
          >
            <input
              className="pd-input-dark"
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Écrire un message..."
              value={newMessage}
            />
            <button
              className="rounded-2xl bg-gradient-to-r from-cyan-600/95 to-cyan-500/90 px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(6,182,212,0.18)] transition hover:-translate-y-0.5 hover:brightness-[1.03]"
              type="submit"
            >
              Envoyer
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
