import { useMemo, useState } from 'react'

const contacts = [
  {
    id: 'teacher',
    name: 'Jean Moniteur',
    role: 'Enseignant',
    status: 'En ligne',
    messages: [
      { from: 'contact', text: "Je te partage le suivi des \u00e9l\u00e8ves pr\u00eats \u00e0 l'examen.", time: '09:05' },
      { from: 'me', text: 'Parfait, merci. Je valide les prochaines pr\u00e9sentations.', time: '09:09' },
    ],
  },
  {
    id: 'secretary',
    name: 'Secr\u00e9tariat',
    role: 'Isabelle Lemoine',
    status: 'Actif il y a 2 min',
    messages: [
      { from: 'contact', text: 'Deux dossiers sont incomplets, je te les envoie pour d\u00e9cision.', time: '08:48' },
      { from: 'me', text: 'Bien re\u00e7u, on les traite en priorit\u00e9 ce matin.', time: '08:53' },
    ],
  },
]

export default function ManagerMessagesPage() {
  const [activeContactId, setActiveContactId] = useState('teacher')
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
        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#10304f] via-[#133a5d] to-[#1a4870] p-6 text-white md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(107,143,178,0.22),transparent_42%)]"
          />
          <p className="relative z-10 pd-eyebrow">Messagerie g\u00e9rant</p>
          <h1 className="relative z-10 mt-4 pd-title-page">\u00c9changes internes direction</h1>
          <p className="relative z-10 mt-3 max-w-4xl pd-subtitle">
            Cette messagerie est r\u00e9serv\u00e9e aux \u00e9changes avec l'enseignant et le secr\u00e9tariat.
            Les \u00e9l\u00e8ves ne sont pas accessibles.
          </p>
        </div>
      </section>

      <div className="pd-msg-panel grid gap-0 lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-white/16 bg-white/[0.1] p-4 backdrop-blur-md lg:border-b-0 lg:border-r md:p-5">
          <h2 className="pd-title-section text-lg">Contacts internes</h2>
          <p className="mt-1 text-xs text-cyan-50/65">Canal direction simplifi\u00e9</p>
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
                  <p className="font-semibold text-white">{contact.name}</p>
                  <span className="pd-msg-chip">Interne</span>
                </div>
                <p className="mt-1 text-xs font-medium text-cyan-50/65">{contact.role}</p>
                <p className="mt-2 text-xs font-medium text-cyan-200/90">
                  {contact.status} - {contact.messages.length} messages
                </p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-col bg-white/[0.08] p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-white/16 pb-4">
            <div>
              <h2 className="pd-title-section text-xl">{activeContact.name}</h2>
              <p className="text-sm text-cyan-50/70">{activeContact.role}</p>
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
              placeholder="\u00c9crire un message interne..."
              value={newMessage}
            />
            <button
              className="rounded-2xl bg-gradient-to-r from-cyan-700/95 to-cyan-600/90 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(69,98,121,0.22)] transition hover:-translate-y-0.5 hover:brightness-[1.03]"
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
