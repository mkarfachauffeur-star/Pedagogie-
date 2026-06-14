import { supabase } from '../lib/supabase'
import { subscribePostgresChanges } from './realtime'

// Service de notifications (badge cloche + compteur non-lus).
// Dégrade proprement (0 / no-op) tant que la base n'est pas en place.

export async function getUnreadCount(profileId) {
  if (!profileId) return 0
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('is_read', false)
    if (error) throw error
    return count || 0
  } catch {
    return 0
  }
}

export async function markAllNotificationsRead(profileId) {
  if (!profileId) return
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', profileId)
      .eq('is_read', false)
  } catch {
    // dégradation silencieuse
  }
}

async function enrichNotifications(rows) {
  if (!rows?.length) return []

  const messageIds = [...new Set(rows.map((row) => row.message_id).filter(Boolean))]
  const messageMap = new Map()
  if (messageIds.length) {
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, body, sender_id')
        .in('id', messageIds)
      if (messagesError) throw messagesError

      const senderIds = [...new Set((messages || []).map((message) => message.sender_id).filter(Boolean))]
      const senderNames = new Map()
      if (senderIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds)
        for (const profile of profiles || []) {
          senderNames.set(profile.id, profile.full_name)
        }
      }

      for (const message of messages || []) {
        messageMap.set(message.id, {
          body: message.body,
          sender: { full_name: senderNames.get(message.sender_id) || 'Expéditeur' },
        })
      }
    } catch {
      // Les notifications restent visibles même si le détail du message est indisponible.
    }
  }

  return rows.map((row) => ({
    ...row,
    message: row.message_id ? messageMap.get(row.message_id) || null : null,
  }))
}

function previewMessageBody(body) {
  const text = (body || '').trim()
  if (!text) return 'Nouveau message'
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

export function getNotificationPreview(item) {
  if (item.notification_type && item.notification_type !== 'message') {
    return item.body || item.title || 'Notification'
  }
  return previewMessageBody(item.message?.body)
}

export function getNotificationTitle(item) {
  if (item.notification_type && item.notification_type !== 'message') {
    return item.title || 'Notification'
  }
  return item.message?.sender?.full_name || 'Expéditeur'
}

export async function listUnreadNotifications(profileId, limit = 10) {
  if (!profileId) return []
  try {
    const { data: rows, error } = await supabase
      .from('notifications')
      .select('id, conversation_id, message_id, notification_type, title, body, pre_registration_id, is_read, created_at')
      .eq('profile_id', profileId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return enrichNotifications(rows)
  } catch {
    return []
  }
}

export async function listRecentNotifications(profileId, limit = 15) {
  if (!profileId) return []
  try {
    const { data: rows, error } = await supabase
      .from('notifications')
      .select('id, conversation_id, message_id, notification_type, title, body, pre_registration_id, is_read, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return enrichNotifications(rows)
  } catch {
    return []
  }
}

export async function markNotificationRead(notificationId) {
  if (!notificationId) return
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
  } catch {
    // dégradation silencieuse
  }
}

// Abonnement temps réel aux notifications personnelles. Renvoie un cleanup.
// scope : suffixe logique pour éviter deux hooks sur le même topic Realtime.
export function subscribeToNotifications(profileId, onChange, scope = 'default') {
  if (!profileId) return () => {}
  return subscribePostgresChanges({
    topicBase: `notifications:${profileId}:${scope}`,
    listeners: [
      {
        config: {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profileId}`,
        },
        callback: onChange,
      },
    ],
  })
}
