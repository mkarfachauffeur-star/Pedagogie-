import { supabase } from '../lib/supabase'

const SESSION_KEY = 'pd:automated-reminders:last-run'

export async function runAutomatedRemindersCheck() {
  const today = new Date().toISOString().slice(0, 10)
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === today) {
    return { sent: 0, skipped: true, error: null }
  }

  try {
    const { data, error } = await supabase.rpc('run_automated_reminders')
    if (error) throw error
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, today)
    }
    return { sent: data?.sent ?? 0, weekKey: data?.week_key ?? null, skipped: false, error: null }
  } catch (error) {
    return { sent: 0, skipped: false, error }
  }
}
