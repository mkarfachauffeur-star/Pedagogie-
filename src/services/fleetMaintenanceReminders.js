import { supabase } from '../lib/supabase'

const SESSION_KEY = 'pd:fleet-maintenance-reminders:last-run'

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7)
}

export async function runFleetMaintenanceRemindersCheck() {
  const monthKey = currentMonthKey()
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === monthKey) {
    return { sent: 0, skipped: true, error: null }
  }

  try {
    const { data, error } = await supabase.rpc('run_fleet_maintenance_reminders')
    if (error) throw error
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, monthKey)
    }
    return { sent: data?.sent ?? 0, skipped: false, error: null }
  } catch (error) {
    return { sent: 0, skipped: false, error }
  }
}
