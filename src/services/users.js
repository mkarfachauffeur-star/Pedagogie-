import { supabase } from '../lib/supabase'
import { inviteUser } from './invitations'
import { subscribePostgresChanges } from './realtime'
import { toUserError } from '../lib/userFacingError'

export async function listOrganizationUsers() {
  try {
    const { data, error } = await supabase.rpc('list_organization_users')
    if (error) throw error
    return { users: data || [], error: null }
  } catch (error) {
    return { users: [], error }
  }
}

export async function createOrganizationUser({ firstName, lastName, email, phone, role }) {
  const fullName = `${firstName} ${lastName}`.trim()
  const { error: inviteError, userId } = await inviteUser({ email, role, fullName })
  if (inviteError) return { user: null, error: inviteError }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ phone: phone?.trim() || null, full_name: fullName })
    .eq('id', userId)
    .select('id, full_name, email, phone, role, is_active')
    .single()

  if (profileError) return { user: null, error: toUserError(profileError, 'save') }

  if (role === 'teacher') {
    await supabase.rpc('ensure_teacher_record', { p_profile_id: userId })
  }

  return { user: profile, error: null }
}

export async function manageUser(action, userId) {
  const { data, error } = await supabase.functions.invoke('manage-user', {
    body: { action, user_id: userId },
  })
  if (error) return { error: toUserError(error, 'permission') }
  if (data?.error) return { error: toUserError(data.error, 'permission') }
  return { error: null, message: data?.message || 'Action effectuée.' }
}

export function subscribeOrganizationUsers(onChange) {
  return subscribePostgresChanges({
    topicBase: 'org-users-list',
    listeners: [
      { config: { event: '*', schema: 'public', table: 'profiles' }, callback: onChange },
    ],
  })
}
