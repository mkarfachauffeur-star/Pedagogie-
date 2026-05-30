import { supabase } from '../lib/supabase'
import { listAttachmentsForMessages, uploadAttachment } from './attachments'

// Service de messagerie — accès aux tables Supabase (conversations, messages,
// participants, accusés de lecture). Toutes les fonctions dégradent proprement
// (retour vide / null) tant que la base n'est pas en place / pas de session.

// Liste des conversations du profil, avec participants et indicateur non-lu.
export async function listConversations(profileId) {
  if (!profileId) return []
  try {
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
          title: others.map((p) => p.full_name).join(', ') || c.subject || 'Conversation',
          unread,
        }
      })
      .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
  } catch {
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
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, organization_id: organizationId, sender_id: senderId, body })
    .select()
    .single()
  if (error) throw error
  return data
}

// Envoie un message avec d'éventuelles pièces jointes (Storage + table).
export async function sendMessageWithAttachments({ conversationId, organizationId, senderId, body, files = [] }) {
  const text = (body || '').trim() || (files.length ? 'Pièce(s) jointe(s)' : '')
  if (!text && !files.length) return null
  const message = await sendMessage({ conversationId, organizationId, senderId, body: text })
  for (const file of files) {
    try {
      // upload séquentiel pour conserver l'ordre et limiter la charge
      await uploadAttachment({ conversationId, messageId: message.id, file })
    } catch {
      // une pièce jointe en échec ne bloque pas le message
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
      if (shared && shared.length) return { id: shared[0].conversation_id, reused: true }
    }
  } catch {
    // on tente la création
  }

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({ organization_id: organizationId, kind, subject, created_by: createdBy })
    .select()
    .single()
  if (error) throw error

  const { error: participantsError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: conversation.id, profile_id: createdBy },
      { conversation_id: conversation.id, profile_id: otherProfileId },
    ])
  if (participantsError) throw participantsError

  return { id: conversation.id, reused: false }
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

// Abonnement temps réel d'une conversation : nouveaux messages ET accusés de
// lecture. Déclenche `onChange` à chaque évènement. Retourne un cleanup.
export function subscribeToConversation(conversationId, onChange) {
  if (!conversationId) return () => {}
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      () => onChange?.(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'message_reads' },
      () => onChange?.(),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'message_attachments' },
      () => onChange?.(),
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
