import { supabase } from '../lib/supabase'

export async function fetchPlatformStats() {
  try {
    const [orgsRes, studentsRes, subsRes] = await Promise.all([
      supabase.from('organizations').select('id, status', { count: 'exact' }),
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id, status, trial_ends_at, organization_id, plan:plan_id(code, name)'),
    ])
    const orgs = orgsRes.data || []
    const byStatus = orgs.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {})
    return {
      totalOrganizations: orgsRes.count ?? orgs.length,
      totalStudents: studentsRes.count ?? 0,
      orgsByStatus: byStatus,
      subscriptions: subsRes.data || [],
      error: null,
    }
  } catch (error) {
    return { totalOrganizations: 0, totalStudents: 0, orgsByStatus: {}, subscriptions: [], error }
  }
}

export async function listAllOrganizations() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id, name, email, phone, status, siret, prefecture_approval, created_at,
        subscriptions(status, trial_ends_at, plan:plan_id(name, code))
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return { organizations: data || [], error: null }
  } catch (error) {
    return { organizations: [], error }
  }
}

export async function updateOrganizationStatus(orgId, status) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orgId)
      .select('id, name, status')
      .single()
    if (error) throw error
    await supabase.from('billing_history').insert({
      organization_id: orgId,
      event_type: status === 'suspended' ? 'suspended' : 'reactivated',
      new_value: { status },
    })
    return { organization: data, error: null }
  } catch (error) {
    return { organization: null, error }
  }
}

export async function listAllSubscriptions() {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id, status, trial_ends_at, current_period_end,
        organization:organization_id(id, name, status),
        plan:plan_id(name, code, max_students)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return { subscriptions: data || [], error: null }
  } catch (error) {
    return { subscriptions: [], error }
  }
}

export async function listAuditLogs({ organizationId, limit = 100 } = {}) {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (organizationId) query = query.eq('organization_id', organizationId)
    const { data, error } = await query
    if (error) throw error
    return { logs: data || [], error: null }
  } catch (error) {
    return { logs: [], error }
  }
}

export async function checkIsSuperAdmin(userId) {
  try {
    const { data, error } = await supabase
      .from('super_admins')
      .select('profile_id')
      .eq('profile_id', userId)
      .eq('is_active', true)
      .maybeSingle()
    if (error) throw error
    return Boolean(data)
  } catch {
    return false
  }
}
