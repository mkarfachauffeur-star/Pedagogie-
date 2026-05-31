import { supabase } from '../lib/supabase'

export async function registerOrganization(payload) {
  const { data, error } = await supabase.functions.invoke('register-organization', { body: payload })
  if (error) return { error }
  if (data?.error) return { error: new Error(data.error) }
  return { data, error: null }
}

export async function fetchOrganization() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .single()
    if (error) throw error
    return { organization: data, error: null }
  } catch (error) {
    return { organization: null, error }
  }
}

export async function updateOrganization(id, patch) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return { organization: data, error: null }
  } catch (error) {
    return { organization: null, error }
  }
}

export async function fetchSubscription() {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id, status, trial_ends_at, current_period_start, current_period_end,
        plan:plan_id(id, code, name, max_students, trial_days)
      `)
      .maybeSingle()
    if (error) throw error
    return { subscription: data, error: null }
  } catch (error) {
    return { subscription: null, error }
  }
}

export async function fetchStudentCount() {
  try {
    const { count, error } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    return { count: count || 0, error: null }
  } catch (error) {
    return { count: 0, error }
  }
}

export function orgLogoUrl(storagePath) {
  if (!storagePath) return null
  const { data } = supabase.storage.from('org-assets').getPublicUrl(storagePath)
  return data?.publicUrl || null
}

export async function uploadOrgLogo(organizationId, file) {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${organizationId}/logo.${ext}`
  const { error } = await supabase.storage.from('org-assets').upload(path, file, { upsert: true })
  if (error) return { path: null, error }
  return { path, error: null }
}

export async function logLoginAudit() {
  try {
    await supabase.rpc('log_audit_event', {
      p_action: 'login',
      p_entity_type: 'session',
      p_entity_label: 'Connexion',
    })
  } catch {
    // non bloquant
  }
}
