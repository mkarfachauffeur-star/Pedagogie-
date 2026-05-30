import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { useConversations } from '../../hooks/useConversations'
import { useConversationMessages } from '../../hooks/useConversationMessages'
import { findOrCreateDirectConversation, sendMessageWithAttachments } from '../../services/messaging'
import { listStudentAllowedContacts } from '../../services/directory'
import { AttachButton, AttachmentList, PendingFiles } from '../../components/messaging/Attachments'

const formatTime = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function StudentMessagesPage() {
  const { profileId, organizationId } = useAuth()
  const { conversations, refresh } = useConversations()

  const [activeId, setActiveId] = useState(null)
  const [draft, setDraft] = useState('')
  const [files, setFiles] = useState([])
  const [contacts, setContacts] = useState([])

  const messages = useConversationMessages(activeId)
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId],
  )

  // Contacts autorisés pour l'élève : secrétariat + enseignant(s) référent(s).
  useEffect(() => {
    if (!profileId) return undefined
    let active = true
    listStudentAllowedContacts(profileId).then((rows) => active && setContacts(rows))
    return () => {
      active = false
    }
  }, [profileId])

  const startConversation = async (contact) => {
    if (!profileId || !organizationId || !contact?.id) return
    try {
      const { id } = await findOrCreateDirectConversation({
        organizationId,
        kind: contact.role === 'secretary' ? 'student' : 'student',
        createdBy: profileId,
        otherProfileId: contact.id,
      })
      await refresh()
      setActiveId(id)
    } catch {
      // ignore
    }
  }

  const handleSend = async () => {
    const body = draft.trim()
    if ((!body && !files.length) || !activeId || !profileId) return
    const toSend = files
    setDraft('')
    setFiles([])
    try {
      await sendMessageWithAttachments({ conversationId: activeId, organizationId, senderId: profileId, body, files: toSend })
    } catch {
      // ignore
    }
    refresh()
  }

  return (
    <div className="pd-page">
      <section className="pd-card overflow-hidden p-0">
        <div className="pd-hero-banner">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(107,143,178,0.22),transparent_42%)]" />
          <span className="relative z-10 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-sm font-semibold text-cyan-100/90">
            Messagerie élève
          </span>
          <h1 className="relative z-10 mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Mes conversations</h1>
          <p className="pd-hero-lead relative z-10 mt-3 max-w-3xl text-base leading-7">
            Échangez avec le secrétariat et votre enseignant référent, en temps réel.
          </p>
        </div>
      </section>

      {!profileId ? (
        <EmptyState title="Connexion requise" message="Connectez-vous avec votre compte pour accéder à la messagerie." icon="💬" />
      ) : (
        <section className="pd-msg-panel grid min-h-[680px] lg:grid-cols-[320px_1fr]">
          <aside className="pd-msg-sidebar">
            <h2 className="pd-msg-sidebar-title">Mes conversations</h2>
            <p className="pd-msg-sidebar-muted mt-1">Secrétariat et enseignant référent</p>

            <div className="mt-4 grid gap-3">
              {conversations.length === 0 && (
                <p className="text-xs font-medium text-slate-300">Démarrez une conversation ci-dessous.</p>
              )}
              {conversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-200 ${activeId === item.id ? 'pd-msg-thread-active' : 'pd-msg-thread hover:-translate-y-0.5'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <span className="pd-msg-chip">{item.unread ? 'Nouveau' : 'Actif'}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-cyan-200/90">{formatTime(item.lastMessageAt)}</p>
                </button>
              ))}
            </div>

            <div className="mt-5">
              <p className="pd-msg-sidebar-muted">Démarrer une conversation</p>
              <div className="mt-2 grid gap-2">
                {contacts.length === 0 && <p className="text-xs text-slate-300">Aucun contact disponible.</p>}
                {contacts.map((c) => (
                  <button key={c.id} type="button" onClick={() => startConversation(c)} className="pd-msg-thread rounded-xl px-3 py-2 text-left text-xs">
                    <span className="font-semibold text-slate-100">{c.full_name || (c.role === 'secretary' ? 'Secrétariat' : 'Enseignant')}</span>
                    <span className="ml-1 text-cyan-200/80">· {c.role === 'secretary' ? 'Secrétariat' : 'Enseignant référent'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="pd-stat-pill p-3">
                <p className="text-2xl font-semibold text-slate-900">{messages.length}</p>
                <p className="text-xs font-medium text-slate-500">Messages</p>
              </div>
              <div className="pd-stat-pill p-3">
                <p className="text-2xl font-semibold text-blue-600">{conversations.length}</p>
                <p className="text-xs font-medium text-slate-500">Conversations</p>
              </div>
            </div>
          </aside>

          <div className="pd-msg-chat-body">
            <header className="pd-msg-chat-header">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-slate-900">{activeConversation?.title || 'Conversation'}</h2>
                <span className="pd-msg-chip">{activeConversation?.kind === 'student' ? 'Suivi' : 'Conversation'}</span>
              </div>
              <p className="text-sm text-slate-600">Échanges et suivi administratif</p>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
              {!activeConversation && (
                <EmptyState title="Aucune conversation sélectionnée" message="Choisissez ou démarrez une conversation." icon="💬" />
              )}
              {activeConversation && messages.length === 0 && (
                <EmptyState title="Aucun message" message="Envoyez votre premier message." icon="💬" />
              )}
              {messages.map((message) => (
                <article key={message.id} className={`flex animate-slide-up ${message.mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl ${message.mine ? 'pd-msg-bubble-sent' : 'pd-msg-bubble-received'}`}>
                    <p className="leading-7">{message.body}</p>
                    <AttachmentList attachments={message.attachments} />
                    <p className={`mt-2 text-[11px] font-medium ${message.mine ? 'text-white/75' : 'text-slate-500'}`}>
                      {formatTime(message.created_at)}{message.mine && message.status ? ` · ${message.status}` : ''}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <footer className="pd-msg-chat-footer">
              <PendingFiles files={files} onRemove={(i) => setFiles((cur) => cur.filter((_, idx) => idx !== i))} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <AttachButton onAdd={(f) => setFiles((cur) => [...cur, ...f])} disabled={!activeConversation} />
                <input
                  className="pd-input-dark"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSend()
                  }}
                  placeholder="Écrire un message…"
                  value={draft}
                  disabled={!activeConversation}
                />
                <button
                  className="rounded-2xl bg-gradient-to-r from-cyan-700 to-cyan-600 px-5 py-3 text-sm font-semibold text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSend}
                  type="button"
                  disabled={!activeConversation}
                >
                  Envoyer
                </button>
              </div>
            </footer>
          </div>
        </section>
      )}
    </div>
  )
}
