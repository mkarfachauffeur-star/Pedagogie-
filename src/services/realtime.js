import { supabase } from '../lib/supabase'

function uniqueTopic(base) {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return `${base}:${suffix}`
}

/**
 * Enregistre tous les listeners postgres_changes puis subscribe().
 * Topic unique par appel pour éviter "cannot add callbacks after subscribe()".
 * Retourne un cleanup no-op si la souscription échoue (pas de crash React).
 */
export function subscribePostgresChanges({ topicBase, listeners = [], onStatus }) {
  if (!topicBase || !listeners.length) return () => {}

  const topic = uniqueTopic(topicBase)

  try {
    let channel = supabase.channel(topic)

    listeners.forEach(({ config, callback }) => {
      channel = channel.on('postgres_changes', config, () => {
        try {
          callback?.()
        } catch (error) {
          console.warn(`[realtime] listener error (${topic})`, error)
        }
      })
    })

    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn(`[realtime] channel error (${topic})`, err)
      }
      onStatus?.(status, err)
    })

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch {
        // ignore cleanup errors
      }
    }
  } catch (error) {
    console.warn(`[realtime] subscribe failed (${topic})`, error)
    return () => {}
  }
}
