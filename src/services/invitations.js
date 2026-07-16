import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'

// Invite un nouvel utilisateur (Gérant/Secrétaire/Enseignant/Élève) via la
// Edge Function `invite-user` (création de compte côté serveur, service role).
// Le demandeur doit être un gérant ou une secrétaire authentifié(e).
export async function inviteUser({ email, role, fullName, resourceType, gender, errorContext = 'invite' }) {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: {
      email: email?.trim().toLowerCase() || '',
      role,
      full_name: fullName,
      resource_type: resourceType || 'teacher',
      gender: gender || null,
    },
  })
  if (error) return { error: toUserError(error, errorContext), userId: null, email: null }
  if (data?.error) return { error: toUserError(data.error, errorContext), userId: null, email: null }
  return { error: null, userId: data?.user_id, email: data?.email || email }
}
