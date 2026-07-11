import { supabase } from '../lib/supabase'
import { trackAePendingValidation, trackSignUp } from '../lib/analytics'
import { toUserError } from '../lib/userFacingError'

export async function submitDemoRequest(payload) {
  try {
    const row = {
      school_name: payload.schoolName.trim(),
      contact_name: payload.contactName.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase(),
      approximate_students: payload.activeStudents?.trim() || null,
      message: payload.message?.trim() || null,
    }

    const { data, error } = await supabase.from('demo_requests').insert(row).select('id').single()
    if (error) throw error

    trackSignUp({
      organizationName: row.school_name,
      email: row.email,
      requestId: data?.id,
      planSelected: 'starter',
    })
    trackAePendingValidation({
      organizationName: row.school_name,
      email: row.email,
      requestId: data?.id,
      planSelected: 'starter',
    })

    const { error: notifyError } = await supabase.functions.invoke('notify-demo-request', {
      body: {
        school_name: row.school_name,
        contact_name: row.contact_name,
        phone: row.phone,
        email: row.email,
        approximate_students: row.approximate_students,
        message: row.message,
      },
    })

    if (notifyError) {
      console.warn('[demoRequests] Notification e-mail non envoyée:', notifyError.message)
    }

    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'save') }
  }
}
