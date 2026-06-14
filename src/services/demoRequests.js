import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'

export async function submitDemoRequest(payload) {
  try {
    const { error } = await supabase.from('demo_requests').insert({
      school_name: payload.schoolName.trim(),
      contact_name: payload.contactName.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase(),
      approximate_students: payload.activeStudents?.trim() || null,
      message: payload.message?.trim() || null,
    })
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'save') }
  }
}
