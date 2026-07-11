import { supabase } from '../lib/supabase'
import { subscribePostgresChanges } from './realtime'

export async function getPlatformUnreadCount(profileId) {
  if (!profileId) return 0
  try {
    const { count, error } = await supabase
      .from('platform_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('is_read', false)
    if (error) throw error
    return count || 0
  } catch {
    return 0
  }
}

export async function listRecentPlatformNotifications(profileId, limit = 15) {
  if (!profileId) return []
  try {
    const { data, error } = await supabase
      .from('platform_notifications')
      .select('id, notification_type, title, body, review_id, is_read, is_priority, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

export async function markPlatformNotificationRead(notificationId) {
  if (!notificationId) return
  try {
    await supabase
      .from('platform_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
  } catch {
    // dégradation silencieuse
  }
}

export function subscribeToPlatformNotifications(profileId, onChange) {
  if (!profileId) return () => {}
  return subscribePostgresChanges({
    topicBase: `platform-notifications:${profileId}`,
    listeners: [
      {
        config: {
          event: '*',
          schema: 'public',
          table: 'platform_notifications',
          filter: `profile_id=eq.${profileId}`,
        },
        callback: onChange,
      },
    ],
  })
}
