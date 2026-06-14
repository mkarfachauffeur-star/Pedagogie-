import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'
import { subscribePostgresChanges } from './realtime'

const PRE_REGISTRATION_SELECT = `
  id,
  organization_id,
  teacher_id,
  first_name,
  last_name,
  phone,
  email,
  desired_training,
  notes,
  status,
  student_id,
  created_at,
  reviewed_at,
  reviewed_by,
  teacher:teacher_id ( id, full_name )
`

function mapPreRegistration(row) {
  if (!row) return null
  return {
    ...row,
    teacherName: row.teacher?.full_name?.trim() || 'Enseignant',
  }
}

export async function listPreRegistrations({ teacherId = null, status = null } = {}) {
  try {
    let query = supabase
      .from('pre_registrations')
      .select(PRE_REGISTRATION_SELECT)
      .order('created_at', { ascending: false })

    if (teacherId) query = query.eq('teacher_id', teacherId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return { preRegistrations: (data || []).map(mapPreRegistration), error: null }
  } catch (error) {
    return { preRegistrations: [], error: toUserError(error, 'listPreRegistrations') }
  }
}

export async function createPreRegistration({
  organizationId,
  teacherId,
  firstName,
  lastName,
  phone,
  email,
  desiredTraining,
  notes,
}) {
  try {
    const { data, error } = await supabase
      .from('pre_registrations')
      .insert({
        organization_id: organizationId,
        teacher_id: teacherId,
        first_name: String(firstName || '').trim(),
        last_name: String(lastName || '').trim(),
        phone: String(phone || '').trim() || null,
        email: String(email || '').trim().toLowerCase() || null,
        desired_training: desiredTraining,
        notes: String(notes || '').trim() || null,
        status: 'pending',
      })
      .select(PRE_REGISTRATION_SELECT)
      .single()

    if (error) throw error
    return { preRegistration: mapPreRegistration(data), error: null }
  } catch (error) {
    return { preRegistration: null, error: toUserError(error, 'createPreRegistration') }
  }
}

export async function reviewPreRegistration(preRegistrationId, action) {
  const { data, error } = await supabase.functions.invoke('review-pre-registration', {
    body: {
      pre_registration_id: preRegistrationId,
      action,
    },
  })

  if (error) return { error: toUserError(error, 'reviewPreRegistration') }
  if (data?.error) return { error: toUserError(data.error, 'reviewPreRegistration') }

  return {
    error: null,
    preRegistration: mapPreRegistration(data.pre_registration),
    student: data.student || null,
    message: data.message || '',
    tempPassword: data.temp_password || null,
  }
}

export function subscribePreRegistrations(onChange) {
  return subscribePostgresChanges({
    topicBase: 'pre-registrations-list',
    listeners: [
      {
        config: { event: '*', schema: 'public', table: 'pre_registrations' },
        callback: onChange,
      },
    ],
  })
}
