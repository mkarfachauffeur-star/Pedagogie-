import { supabase } from '../lib/supabase'
import { assertOrgCanWrite } from '../lib/orgAccess'
import { listAttachmentsForMessages, uploadAttachment } from './attachments'
import { listStudentSecretaryContacts } from './directory'
import { subscribePostgresChanges } from './realtime'
import { contactDisplayName } from '../utils/messagingLabels'

function logDbError(prefix, error) {
  if (!error) return
  console.error(prefix, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  })
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// Service de messagerie — accès aux tables Supabase (conversations, messages,
// participants, accusés de lecture). Toutes les fonctions dégradent proprement
// (retour vide / null) tant que la base n'est pas en place / pas de session.

// Liste des conversations du profil, avec participants et indicateur non-lu.
export async function listConversations(profileId) {
  if (!profileId) return []
  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', profileId)
      .maybeSingle()
    if (prof?.role === 'student' && prof.organization_id) {
      await ensureStudentSecretaryConversation({ profileId, organizationId: prof.organization_id })
    }

    const { data: parts, error: partsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('profile_id', profileId)
    if (partsError) throw partsError
    const ids = (parts || []).map((p) => p.conversation_id)
    if (!ids.length) return []
    const readMap = new Map((parts || []).map((p) => [p.conversation_id, p.last_read_at]))

    const { data: convs, error } = await supabase
      .from('conversations')
      .select('id, kind, subject, last_message_at, conversation_participants(profile_id, profiles(id, full_name, role))')
      .in('id', ids)
    if (error) throw error

    return (convs || [])
      .map((c) => {
        const participants = (c.conversation_participants || [])
          .map((cp) => cp.profiles)
          .filter(Boolean)
        const others = participants.filter((p) => p.id !== profileId)
        const lastReadAt = readMap.get(c.id)
        const unread = Boolean(c.last_message_at) && (!lastReadAt || new Date(c.last_message_at) > new Date(lastReadAt))
        return {
          id: c.id,
          kind: c.kind,
          subject: c.subject,
          lastMessageAt: c.last_message_at,
          participants,
          others,
          title: others.map((p) => contactDisplayName(p.full_name, p.role)).join(', ') || c.subject || 'Conversation',
          unread,
        }
      })
      .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
  } catch (error) {
    console.error('[messaging] listConversations', error)
    return []
  }
}

// Messages d'une conversation + statut d'accusé de lecture (Envoyé/Reçu/Lu)
// pour les messages envoyés par le profil courant.
export async function listMessagesWithReads(conversationId, profileId) {
  if (!conversationId) return []
  try {
    const { data: msgs, error } = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) throw error
    const ids = (msgs || []).map((m) => m.id)
    let reads = []
    let attachmentsByMessage = {}
    if (ids.length) {
      const { data } = await supabase
        .from('message_reads')
        .select('message_id, profile_id, delivered_at, read_at')
        .in('message_id', ids)
      reads = data || []
      attachmentsByMessage = await listAttachmentsForMessages(ids)
    }
    return (msgs || []).map((m) => {
      let status = null
      if (m.sender_id === profileId) {
        const others = reads.filter((r) => r.message_id === m.id && r.profile_id !== profileId)
        if (others.some((r) => r.read_at)) status = 'Lu'
        else if (others.some((r) => r.delivered_at)) status = 'Reçu'
        else status = 'Envoyé'
      }
      return {
        ...m,
        status,
        mine: m.sender_id === profileId,
        attachments: attachmentsByMessage[m.id] || [],
      }
    })
  } catch {
    return []
  }
}

export async function sendMessage({ conversationId, organizationId, senderId, body }) {
  await assertOrgCanWrite()
  const messageId = newId()
  const { error } = await supabase.from('messages').insert({
    id: messageId,
    conversation_id: conversationId,
    organization_id: organizationId,
    sender_id: senderId,
    body,
  })
  if (error) throw error
  if (organizationId) {
    const { trackFirstMessageMilestone } = await import('../lib/analytics')
    void trackFirstMessageMilestone(organizationId)
  }
  return {
    id: messageId,
    conversation_id: conversationId,
    organization_id: organizationId,
    sender_id: senderId,
    body,
  }
}

// Envoie un message avec d'éventuelles pièces jointes (Storage + table).
export async function sendMessageWithAttachments({ conversationId, organizationId, senderId, body, files = [] }) {
  const text = (body || '').trim() || (files.length ? 'Pièce(s) jointe(s)' : '')
  if (!text && !files.length) return null
  const message = await sendMessage({ conversationId, organizationId, senderId, body: text })
  for (const file of files) {
    try {
      await uploadAttachment({ conversationId, messageId: message.id, file })
    } catch (error) {
      logDbError('[messaging] uploadAttachment', error)
    }
  }
  return message
}

// Crée (ou réutilise) une conversation directe entre deux profils.
export async function findOrCreateDirectConversation({
  organizationId,
  kind = 'internal',
  createdBy,
  otherProfileId,
  subject = null,
}) {
  try {
    const { data: mine } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', createdBy)
    const ids = (mine || []).map((row) => row.conversation_id)
    if (ids.length) {
      const { data: shared } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('profile_id', otherProfileId)
        .in('conversation_id', ids)
      if (shared && shared.length) {
        return { id: shared[0].conversation_id, reused: true }
      }
    }
  } catch {
    // recherche existante optionnelle
  }

  const conversationId = newId()
  const { error: convError } = await supabase.from('conversations').insert({
    id: conversationId,
    organization_id: organizationId,
    kind,
    subject,
    created_by: createdBy,
  })
  if (convError) {
    logDbError('[messaging] insert conversation', convError)
    throw convError
  }

  const { error: selfError } = await supabase.from('conversation_participants').insert({
    conversation_id: conversationId,
    profile_id: createdBy,
  })
  if (selfError) {
    logDbError('[messaging] insert participant (creator)', selfError)
    throw selfError
  }

  const { error: otherError } = await supabase.from('conversation_participants').insert({
    conversation_id: conversationId,
    profile_id: otherProfileId,
  })
  if (otherError) {
    logDbError('[messaging] insert participant (contact)', otherError)
    throw otherError
  }

  return { id: conversationId, reused: false }
}

// Provisionne la conversation élève ↔ secrétariat (idempotent).
export async function ensureStudentSecretaryConversation({ profileId, organizationId }) {
  if (!profileId || !organizationId) return null
  const contacts = await listStudentSecretaryContacts(profileId)
  const secretary = contacts[0]
  if (!secretary?.id) return null
  try {
    return await findOrCreateDirectConversation({
      organizationId,
      kind: 'student',
      createdBy: profileId,
      otherProfileId: secretary.id,
      subject: secretary.full_name || 'Secrétariat',
    })
  } catch (error) {
    logDbError('[messaging] ensureStudentSecretaryConversation', error)
    return null
  }
}

// Marque la conversation comme lue pour le profil courant (pointeur + accusés).
export async function markConversationRead(conversationId, profileId) {
  if (!conversationId || !profileId) return
  const now = new Date().toISOString()
  try {
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: now })
      .eq('conversation_id', conversationId)
      .eq('profile_id', profileId)

    const { data: msgs } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .neq('sender_id', profileId)
    const ids = (msgs || []).map((m) => m.id)
    if (ids.length) {
      await supabase
        .from('message_reads')
        .update({ read_at: now })
        .eq('profile_id', profileId)
        .is('read_at', null)
        .in('message_id', ids)
    }

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', profileId)
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
  } catch {
    // dégradation silencieuse
  }
}

// Rafraîchit la liste des conversations (nouvelle conv, dernier message).
export function subscribeToConversationList(profileId, onChange) {
  if (!profileId) return () => {}
  return subscribePostgresChanges({
    topicBase: `conv-list:${profileId}`,
    listeners: [
      {
        config: {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
          filter: `profile_id=eq.${profileId}`,
        },
        callback: onChange,
      },
      {
        config: {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        callback: onChange,
      },
      {
        config: {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        callback: onChange,
      },
      {
        config: {
          event: 'INSERT',
          schema: 'public',
          table: 'message_attachments',
        },
        callback: onChange,
      },
    ],
  })
}

// Abonnement temps réel d'une conversation : nouveaux messages ET accusés de
// lecture. Déclenche `onChange` à chaque évènement. Retourne un cleanup.
export function subscribeToConversation(conversationId, onChange) {
  if (!conversationId) return () => {}
  return subscribePostgresChanges({
    topicBase: `conversation:${conversationId}`,
    listeners: [
      {
        config: {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback: onChange,
      },
      {
        config: { event: '*', schema: 'public', table: 'message_reads' },
        callback: onChange,
      },
      {
        config: { event: 'INSERT', schema: 'public', table: 'message_attachments' },
        callback: onChange,
      },
    ],
  })
}
