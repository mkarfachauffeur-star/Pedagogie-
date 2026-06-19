import { supabase } from '../lib/supabase'
import { inviteUser } from './invitations'
import { subscribePostgresChanges } from './realtime'
import { toUserError } from '../lib/userFacingError'
import { joinFullName } from '../lib/staffAccounts'
import { teacherAddressPayload } from '../lib/address'
import { normalizePhoneDigits } from '../lib/phone'
import {
  normalizeAuthorizationNumber,
  normalizeTeachingResourceType,
  TEACHING_RESOURCE_TYPES,
  validateTeachingResourceAuthorization,
} from '../lib/teachingResources'

export const TEACHER_CATEGORY_OPTIONS = ['A', 'B', 'C', 'D']

export const EMPLOYMENT_STATUS_OPTIONS = ['Salarié', 'Indépendant']

export { TEACHING_RESOURCE_TYPES } from '../lib/teachingResources'

function teacherRecordPayload(payload) {
  const resourceType = normalizeTeachingResourceType(payload.resourceType)
  const authorizationNumber = normalizeAuthorizationNumber(payload.authorizationNumber) || null
  const authorizationError = validateTeachingResourceAuthorization(resourceType, authorizationNumber)
  if (authorizationError) {
    return { payload: null, error: new Error(authorizationError) }
  }

  return {
    payload: {
      resource_type: resourceType,
      authorization_number: authorizationNumber,
      authorization_expires_at: payload.authorizationExpiresAt || null,
      authorized_categories: resourceType === TEACHING_RESOURCE_TYPES.TEACHER
        ? (payload.categories || [])
        : [],
      ...teacherAddressPayload(payload),
      birth_date: payload.birthDate || null,
      employment_status: resourceType === TEACHING_RESOURCE_TYPES.TEACHER
        ? (payload.employmentStatus || null)
        : null,
    },
    error: null,
  }
}

const TEACHER_DOCS_BUCKET = 'teacher-documents'

function authorizationStoragePath(organizationId, profileId, side, fileName) {
  const ext = (fileName.split('.').pop() || 'jpg').replace(/[^\w]+/g, '')
  return `${organizationId}/teachers/${profileId}/authorization-${side}-${Date.now()}.${ext}`
}

async function uploadAuthorizationSide({ organizationId, profileId, side, file }) {
  if (!file) return { path: null, error: null }
  const path = authorizationStoragePath(organizationId, profileId, side, file.name)
  const { error } = await supabase.storage
    .from(TEACHER_DOCS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined })
  if (error) return { path: null, error }
  return { path, error: null }
}

export async function saveTeacherAuthorizationImages(profileId, organizationId, { rectoFile, versoFile }) {
  if (!profileId || !organizationId) return { error: new Error('Identifiants manquants.') }

  const updates = {}

  if (rectoFile) {
    const { path, error } = await uploadAuthorizationSide({
      organizationId,
      profileId,
      side: 'recto',
      file: rectoFile,
    })
    if (error) return { error: toUserError(error, 'document') }
    updates.authorization_recto_path = path
  }

  if (versoFile) {
    const { path, error } = await uploadAuthorizationSide({
      organizationId,
      profileId,
      side: 'verso',
      file: versoFile,
    })
    if (error) return { error: toUserError(error, 'document') }
    updates.authorization_verso_path = path
  }

  if (!Object.keys(updates).length) return { error: null }

  const { error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('profile_id', profileId)
  if (error) return { error: toUserError(error, 'document') }
  return { error: null }
}

export async function getTeacherAuthorizationSignedUrls(teacher) {
  if (!teacher) return { rectoUrl: null, versoUrl: null }

  const entries = [
    ['recto', teacher.authorization_recto_path],
    ['verso', teacher.authorization_verso_path],
  ].filter(([, path]) => Boolean(path))

  if (!entries.length) return { rectoUrl: null, versoUrl: null }

  const paths = entries.map(([, path]) => path)
  const { data } = await supabase.storage.from(TEACHER_DOCS_BUCKET).createSignedUrls(paths, 3600)
  const urlByPath = {}
  ;(data || []).forEach((row) => {
    if (row?.path && row?.signedUrl) urlByPath[row.path] = row.signedUrl
  })

  return {
    rectoUrl: teacher.authorization_recto_path
      ? urlByPath[teacher.authorization_recto_path] || null
      : null,
    versoUrl: teacher.authorization_verso_path
      ? urlByPath[teacher.authorization_verso_path] || null
      : null,
  }
}

export async function listTeachers() {
  try {
    const { data, error } = await supabase.rpc('list_organization_teachers')
    if (error) throw error
    return { teachers: data || [], error: null }
  } catch (error) {
    return { teachers: [], error }
  }
}

export async function getTeacher(profileId) {
  const { teachers, error } = await listTeachers()
  if (error) return { teacher: null, error }
  return { teacher: teachers.find((row) => row.profile_id === profileId) || null, error: null }
}

export async function listTeacherRoleProfilesWithoutRecord() {
  try {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, is_active')
      .eq('role', 'teacher')
      .order('full_name')
    if (profileError) throw profileError

    const { data: teachers, error: teacherError } = await supabase
      .from('teachers')
      .select('profile_id')
    if (teacherError) throw teacherError

    const linked = new Set((teachers || []).map((row) => row.profile_id))
    return { profiles: (profiles || []).filter((p) => !linked.has(p.id)), error: null }
  } catch (error) {
    return { profiles: [], error }
  }
}

export async function createTeacher(payload) {
  const resourceType = normalizeTeachingResourceType(payload.resourceType)
  const firstName = String(payload.firstName || '').trim()
  const lastName = String(payload.lastName || '').trim()
  const fullName = resourceType === TEACHING_RESOURCE_TYPES.SIMULATOR
    ? lastName
    : joinFullName(firstName, lastName)
  const email = String(payload.email || '').trim().toLowerCase()

  let profileId = payload.linkProfileId || null

  if (profileId) {
    await supabase.rpc('ensure_teacher_record', { p_profile_id: profileId })
    await supabase
      .from('profiles')
      .update({ phone: normalizePhoneDigits(payload.phone) || null, full_name: fullName })
      .eq('id', profileId)
  } else {
    const { error: inviteError, userId } = await inviteUser({ email, role: 'teacher', fullName })
    if (inviteError) return { teacher: null, error: inviteError }
    profileId = userId
    await supabase
      .from('profiles')
      .update({ phone: normalizePhoneDigits(payload.phone) || null, full_name: fullName })
      .eq('id', profileId)
    await supabase.rpc('ensure_teacher_record', { p_profile_id: profileId })
  }

  const { payload: teacherPayload, error: validationError } = teacherRecordPayload(payload)
  if (validationError) return { teacher: null, error: validationError }

  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .update({
      ...teacherPayload,
      is_active: true,
    })
    .eq('profile_id', profileId)
    .select('profile_id')
    .single()

  if (teacherError) return { teacher: null, error: toUserError(teacherError, 'save') }

  const { teacher: row } = await getTeacher(profileId)
  return { teacher: row, error: null }
}

export async function updateTeacher(profileId, payload) {
  const resourceType = normalizeTeachingResourceType(payload.resourceType)
  const firstName = String(payload.firstName || '').trim()
  const lastName = String(payload.lastName || '').trim()
  const fullName = resourceType === TEACHING_RESOURCE_TYPES.SIMULATOR
    ? lastName
    : joinFullName(firstName, lastName)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      email: payload.email?.trim().toLowerCase() || null,
      phone: normalizePhoneDigits(payload.phone) || null,
    })
    .eq('id', profileId)
  if (profileError) return { teacher: null, error: toUserError(profileError, 'save') }

  const { payload: teacherPayload, error: validationError } = teacherRecordPayload(payload)
  if (validationError) return { teacher: null, error: validationError }

  const { error: teacherError } = await supabase
    .from('teachers')
    .update(teacherPayload)
    .eq('profile_id', profileId)
  if (teacherError) return { teacher: null, error: toUserError(teacherError, 'save') }

  const { teacher } = await getTeacher(profileId)
  return { teacher, error: null }
}

export async function setTeacherActive(profileId, isActive) {
  const { error: teacherError } = await supabase
    .from('teachers')
    .update({ is_active: isActive })
    .eq('profile_id', profileId)
  if (teacherError) return { error: toUserError(teacherError, 'save') }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', profileId)
  if (profileError) return { error: toUserError(profileError, 'save') }

  return { error: null }
}

export async function deleteTeacher(profileId) {
  const { data, error } = await supabase.functions.invoke('manage-user', {
    body: { action: 'delete', user_id: profileId },
  })
  if (error) return { error: toUserError(error, 'permission') }
  if (data?.error) return { error: toUserError(data.error, 'permission') }
  return { error: null }
}

export function subscribeTeachers(onChange) {
  return subscribePostgresChanges({
    topicBase: 'teachers-list',
    listeners: [
      { config: { event: '*', schema: 'public', table: 'teachers' }, callback: onChange },
      { config: { event: '*', schema: 'public', table: 'profiles' }, callback: onChange },
    ],
  })
}
