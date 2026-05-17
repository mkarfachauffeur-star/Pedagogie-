import { useMemo, useState } from 'react'

const initialConversations = [
  {
    id: 'teacher',
    name: 'Jean Moniteur',
    role: 'Enseignant',
    subject: 'Compte-rendu de leçon',
    unread: 1,
    tone: 'cyan',
    messages: [
      {
        from: 'Jean Moniteur',
        time: 'Hier 18:20',
        text: 'Bonne séance sur les contrôles visuels. Continue à verbaliser tes observations avant chaque changement de direction.',
      },
      {
        from: 'Thomas',
        time: 'Hier 19:04',
        text: 'Merci, je vais revoir la vidéo sur les intersections avant la prochaine leçon.',
      },
      {
        from: 'Jean Moniteur',
        time: 'Aujourd’hui 09:12',
        text: 'Parfait. Pour demain, objectif : trajectoire plus fluide et contrôles rétroviseurs plus réguliers.',
      },
    ],
  },
  {
    id: 'secretary',
    name: 'Secrétariat',
    role: 'Secrétariat',
    subject: 'Document reçu',
    unread: 0,
    tone: 'emerald',
    messages: [
      {
        from: 'Secrétariat',
        time: 'Lundi 10:30',
        text: 'Votre justificatif de domicile a bien été ajouté au dossier.',
      },
      {
        from: 'Thomas',
        time: 'Lundi 11:02',
        text: 'Merci, est-ce que mon dossier est complet pour la suite ?',
      },
      {
        from: 'Secrétariat',
        time: 'Lundi 11:15',
        text: 'Oui, il reste seulement le prochain rendez-vous pédagogique à confirmer.',
      },
    ],
  },
  {
    id: 'planning',
    name: 'Planning PEDAGOGIA',
    role: 'Réservations',
    subject: 'Question planning',
    unread: 2,
    tone: 'violet',
    messages: [
      {
        from: 'Planning PEDAGOGIA',
        time: 'Aujourd’hui 08:45',
        text: 'Un créneau s’est libéré vendredi à 16h30 pour une leçon C2.',
      },
      {
        from: 'Planning PEDAGOGIA',
        time: 'Aujourd’hui 08:46',
        text: 'Souhaitez-vous remplacer votre créneau de samedi matin ?',
      },
    ],
  },
]

const toneClasses = {
  cyan: 'from-cyan-400 to-sky-500 shadow-cyan-950/30',
  emerald: 'from-emerald-400 to-cyan-500 shadow-emerald-950/30',
  violet: 'from-violet-400 to-cyan-500 shadow-violet-950/30',
  amber: 'from-amber-300 to-cyan-500 shadow-amber-950/30',
  rose: 'from-rose-300 to-cyan-500 shadow-rose-950/30',
}

const recipientOptions = [
  {
    id: 'student',
    label: 'Élève',
    name: 'Camille Leroy',
    role: 'Élève',
    subject: 'Échange entre élèves',
    tone: 'amber',
    intro: 'Conversation créée avec une élève fictive pour échanger sur les révisions et le parcours.',
  },
  {
    id: 'secretary',
    label: 'Secrétariat',
    name: 'Secrétariat',
    role: 'Secrétariat',
    subject: 'Demande manageristrative',
    tone: 'emerald',
    intro: 'Conversation créée avec le secrétariat pour les dossiers, documents, paiements ou rendez-vous.',
  },
  {
    id: 'manager',
    label: 'Gérant',
    name: 'Gérant PEDAGOGIA',
    role: 'Direction',
    subject: 'Demande au Gérant',
    tone: 'rose',
    intro: 'Conversation créée avec le gérant pour une demande de suivi ou une question importante.',
  },
  {
    id: 'teacher',
    label: 'Enseignant',
    name: 'Jean Moniteur',
    role: 'Enseignant',
    subject: 'Question pédagogique',
    tone: 'cyan',
    intro: 'Conversation créée avec votre enseignant pour parler conduite, REMC ou prochaine leçon.',
  },
]

export default function ÉlèveMessagesPage() {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeId, setActiveId] = useState(initialConversations[0].id)
  const [draft, setDraft] = useState('')
  const [selectedRecipientId, setSelectedRecipientId] = useState(recipientOptions[3].id)

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) || conversations[0],
    [activeId, conversations],
  )

  const unreadCount = conversations.reduce((total, conversation) => total + conversation.unread, 0)

  const openConversation = (conversationId) => {
    setActiveId(conversationId)
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation,
      ),
    )
  }

  const createConversation = () => {
    const nextIndex = conversations.length + 1
    const recipient =
      recipientOptions.find((option) => option.id === selectedRecipientId) || recipientOptions[0]
    const newConversation = {
      id: `new-${Date.now()}`,
      name: recipient.name,
      role: recipient.role,
      subject: recipient.subject,
      unread: 0,
      tone: recipient.tone,
      messages: [
        {
          from: recipient.name,
          time: 'Maintenant',
          text: `${recipient.intro} Référence démo #${nextIndex}.`,
        },
      ],
    }

    setConversations((current) => [newConversation, ...current])
    setActiveId(newConversation.id)
  }

  const sendMessage = () => {
    const message = draft.trim()
    if (!message) return

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                { from: 'Thomas', time: 'Maintenant', text: message },
              ],
            }
          : conversation,
      ),
    )
    setDraft('')
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[var(--shadow-card)]">
        <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white md:p-8">
          <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
            Messagerie élève
          </span>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Conversations PEDAGOGIA DRIVE
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-cyan-50/85">
                Échangez avec votre enseignant, le secrétariat et l’équipe planning sans quitter
                votre espace élève.
              </p>
            </div>
            <div className="w-full max-w-xl rounded-[1.5rem] border border-white/10 bg-white/10 p-3 shadow-xl shadow-cyan-950/20 backdrop-blur-xl lg:w-[520px]">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/80">
                Choisir un destinataire
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {recipientOptions.map((recipient) => {
                  const selected = recipient.id === selectedRecipientId

                  return (
                    <button
                      aria-pressed={selected}
                      className={`rounded-2xl border px-3 py-2 text-sm font-extrabold transition-all duration-200 ${
                        selected
                          ? 'border-cyan-200 bg-cyan-300 text-navy-950 shadow-lg shadow-cyan-950/20'
                          : 'border-white/15 bg-white/10 text-white/80 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white'
                      }`}
                      key={recipient.id}
                      onClick={() => setSelectedRecipientId(recipient.id)}
                      type="button"
                    >
                      {recipient.label}
                    </button>
                  )
                })}
              </div>
              <button
                className="mt-3 w-full rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-navy-950 shadow-xl shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-100"
                onClick={createConversation}
                type="button"
              >
                Nouvelle conversation avec{' '}
                {recipientOptions.find((option) => option.id === selectedRecipientId)?.label}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-h-[680px] overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[var(--shadow-card)] backdrop-blur-xl lg:grid-cols-[360px_1fr]">
        <aside className="border-b border-slate-200 bg-gradient-to-b from-white/90 to-cyan-50/70 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-cyan-100 bg-white/80 p-3">
              <p className="text-2xl font-black text-slate-950">{conversations.length}</p>
              <p className="text-xs font-semibold text-slate-500">Discussions</p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-white/80 p-3">
              <p className="text-2xl font-black text-cyan-600">{unreadCount}</p>
              <p className="text-xs font-semibold text-slate-500">Non lus</p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-white/80 p-3">
              <p className="text-2xl font-black text-slate-950">2h</p>
              <p className="text-xs font-semibold text-slate-500">Réponse</p>
            </div>
          </div>

          <div className="space-y-3">
            {conversations.map((conversation) => {
              const active = conversation.id === activeConversation.id

              return (
                <button
                  className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                    active
                      ? 'border-cyan-300 bg-navy-950 text-white shadow-xl shadow-cyan-950/20'
                      : 'border-white/80 bg-white/80 text-slate-800 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50'
                  }`}
                  key={conversation.id}
                  onClick={() => openConversation(conversation.id)}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${
                        toneClasses[conversation.tone]
                      } font-black text-white shadow-lg`}
                    >
                      {conversation.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate font-extrabold">{conversation.name}</span>
                        {conversation.unread > 0 && (
                          <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-xs font-black text-navy-950">
                            {conversation.unread}
                          </span>
                        )}
                      </span>
                      <span className={active ? 'text-sm text-cyan-50/70' : 'text-sm text-slate-500'}>
                        {conversation.role}
                      </span>
                      <span className="mt-2 block truncate text-sm font-semibold">
                        {conversation.subject}
                      </span>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col bg-slate-50/80">
          <header className="border-b border-slate-200 bg-white/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${
                  toneClasses[activeConversation.tone]
                } font-black text-white shadow-lg`}
              >
                {activeConversation.name.charAt(0)}
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">{activeConversation.name}</h2>
                <p className="text-sm text-slate-500">{activeConversation.subject}</p>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
            {activeConversation.messages.map((message, index) => {
              const mine = message.from === 'Thomas'

              return (
                <article
                  className={`flex animate-slide-up ${mine ? 'justify-end' : 'justify-start'}`}
                  key={`${message.time}-${index}`}
                >
                  <div
                    className={`max-w-xl rounded-[1.5rem] border p-4 shadow-sm ${
                      mine
                        ? 'border-cyan-200 bg-gradient-to-br from-cyan-500 to-cyan-400 text-navy-950'
                        : 'border-white/80 bg-white text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold opacity-70">
                      {message.from} · {message.time}
                    </p>
                    <p className="mt-2 leading-7">{message.text}</p>
                  </div>
                </article>
              )
            })}
          </div>

          <footer className="border-t border-slate-200 bg-white/85 p-4 backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') sendMessage()
                }}
                placeholder="Écrire un message fictif..."
                value={draft}
              />
              <button
                className="rounded-2xl bg-navy-950 px-5 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-700"
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
