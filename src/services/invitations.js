import { supabase } from '../lib/supabase'

// Invite un nouvel utilisateur (Gérant/Secrétaire/Enseignant/Élève) via la
// Edge Function `invite-user` (création de compte côté serveur, service role).
// Le demandeur doit être un gérant ou une secrétaire authentifié(e).
export async function inviteUser({ email, role, fullName }) {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: { email, role, full_name: fullName },
  })
  if (error) return { error }
  if (data?.error) return { error: new Error(data.error) }
  return { error: null, userId: data?.user_id }
}
