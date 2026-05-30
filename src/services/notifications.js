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
