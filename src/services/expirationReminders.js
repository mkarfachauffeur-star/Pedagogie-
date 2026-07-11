import { trackAutomaticNotificationSent } from '../lib/analytics'
import { supabase } from '../lib/supabase'

const SESSION_KEY = 'pd:expiration-reminders:last-run'

export async function runExpirationRemindersCheck() {
  const today = new Date().toISOString().slice(0, 10)
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === today) {
    return { sent: 0, skipped: true, error: null }
  }

  try {
    const { data, error } = await supabase.rpc('run_expiration_reminders')
    if (error) throw error
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, today)
    }
    const sent = data?.sent ?? 0
    if (sent > 0) {
      trackAutomaticNotificationSent({ sent, source: 'expiration_reminders' })
    }
    return { sent, skipped: false, error: null }
  } catch (error) {
    return { sent: 0, skipped: false, error }
  }
}
