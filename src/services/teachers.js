import { supabase } from '../lib/supabase'
import { assertOrgCanWrite } from '../lib/orgAccess'
import { inviteUser } from './invitations'
import { subscribePostgresChanges } from './realtime'
import { toUserError } from '../lib/userFacingError'
import { joinFullName } from '../lib/staffAccounts'
import { normalizeGender } from '../lib/genderedRoles'
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

function buildSaveTeachingResourceParams(profileId, payload, { isActive = true } = {}) {
  const resourceType = normalizeTeachingResourceType(payload.resourceType)
  const addressFields = teacherAddressPayload(payload)

  return {
    p_profile_id: profileId,
    p_resource_type: resourceType,
    p_authorization_number: normalizeAuthorizationNumber(payload.authorizationNumber),
    p_authorization_expires_at: payload.authorizationExpiresAt || null,
    p_authorized_categories: resourceType === TEACHING_RESOURCE_TYPES.TEACHER
      ? (payload.categories || [])
      : [],
    p_birth_date: payload.birthDate || null,
    p_employment_status: resourceType === TEACHING_RESOURCE_TYPES.TEACHER
      ? (payload.employmentStatus || null)
      : null,
    p_address: addressFields.address,
    p_street_number: addressFields.street_number,
    p_street: addressFields.street,
    p_postal_code: addressFields.postal_code,
    p_city: addressFields.city,
    p_is_active: isActive,
  }
}

async function saveTeachingResourceDirect(profileId, teacherPayload, options = {}) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', profileId)
    .maybeSingle()
  if (profileError) return { error: toUserError(profileError, 'save') }
  if (!profile?.organization_id) return { error: new Error('Profil simulateur introuvable.') }

  const { data: existing, error: existingError } = await supabase
    .from('teachers')
    .select('profile_id')
    .eq('profile_id', profileId)
    .maybeSingle()
  if (existingError) return { error: toUserError(existingError, 'save') }

  const row = {
    ...teacherPayload,
    is_active: options.isActive ?? true,
  }

  if (existing?.profile_id) {
    const { error: updateError } = await supabase
      .from('teachers')
      .update(row)
      .eq('profile_id', profileId)
    if (updateError) return { error: toUserError(updateError, 'save') }
    return { error: null }
  }

  const { error: insertError } = await supabase
    .from('teachers')
    .insert({
      profile_id: profileId,
      organization_id: profile.organization_id,
      ...row,
    })
  if (insertError) return { error: toUserError(insertError, 'save') }
  return { error: null }
}

async function saveTeachingResource(profileId, payload, options = {}) {
  const { payload: teacherPayload, error: validationError } = teacherRecordPayload(payload)
  if (validationError) return { error: validationError }

  const rpcParams = buildSaveTeachingResourceParams(profileId, payload, options)
  const { error: rpcError } = await supabase.rpc('save_teaching_resource', rpcParams)

  if (!rpcError) return { error: null }

  const direct = await saveTeachingResourceDirect(profileId, teacherPayload, options)
  if (!direct.error) return { error: null }

  if (rpcError) return { error: toUserError(rpcError, 'save') }
  return direct
}

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
  const teacher = teachers.find((row) => row.profile_id === profileId) || null
  if (!teacher) return { teacher: null, error: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('gender')
    .eq('id', profileId)
    .maybeSingle()

  return {
    teacher: { ...teacher, gender: profile?.gender || null },
    error: null,
  }
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

function extractInvokeErrorMessage(error) {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (typeof error.message === 'string') return error.message
  return String(error)
}

function parseFunctionResponseBody(error, data) {
  if (data && typeof data === 'object') return data
  try {
    if (error?.context && typeof error.context.json === 'function') {
      return error.context.json()
    }
  } catch {
    // ignore
  }
  try {
    const body = error?.context?.body
    if (typeof body === 'string' && body.trim()) return JSON.parse(body)
  } catch {
    // ignore
  }
  return null
}

function isEdgeFunctionMissing(error) {
  const status = error?.context?.status ?? error?.status
  if (status === 404) return true
  const message = extractInvokeErrorMessage(error)
  return /404|not found/i.test(message) && /function|edge/i.test(message)
}

async function invokeEdgeFunction(functionName, body) {
  const { data, error } = await supabase.functions.invoke(functionName, { body })
  const payload = parseFunctionResponseBody(error, data) || data

  if (payload?.user_id) {
    return { userId: payload.user_id, error: null }
  }
  if (payload?.error) {
    return { userId: null, error: new Error(String(payload.error)), unavailable: false }
  }
  if (error) {
    return {
      userId: null,
      error,
      unavailable: isEdgeFunctionMissing(error),
    }
  }
  return { userId: null, error: new Error('Réponse serveur invalide.'), unavailable: false }
}

export async function createSimulatorResource(fullName) {
  const attempts = [
    ['invite-user', {
      email: '',
      role: 'teacher',
      full_name: fullName,
      resource_type: TEACHING_RESOURCE_TYPES.SIMULATOR,
    }],
    ['create-simulator-resource', { full_name: fullName }],
  ]

  let lastError = null
  for (const [functionName, body] of attempts) {
    const result = await invokeEdgeFunction(functionName, body)
    if (result.userId) return { error: null, userId: result.userId }
    lastError = result.error
    if (result.error && !result.unavailable) break
  }

  return {
    error: toUserError(lastError || new Error('Création simulateur impossible.'), 'saveSimulator'),
    userId: null,
  }
}

export async function createTeacher(payload) {
  try {
    await assertOrgCanWrite()
  } catch (error) {
    return { teacher: null, error: toUserError(error, 'save') }
  }

  const resourceType = normalizeTeachingResourceType(payload.resourceType)
  const firstName = String(payload.firstName || '').trim()
  const lastName = String(payload.lastName || '').trim()
  const fullName = resourceType === TEACHING_RESOURCE_TYPES.SIMULATOR
    ? lastName
    : joinFullName(firstName, lastName)
  const email = String(payload.email || '').trim().toLowerCase()

  const { error: validationError } = teacherRecordPayload(payload)
  if (validationError) return { teacher: null, error: validationError }

  let profileId = payload.linkProfileId || null

  if (resourceType === TEACHING_RESOURCE_TYPES.SIMULATOR) {
    const { error: createError, userId } = await createSimulatorResource(fullName)
    if (createError) return { teacher: null, error: createError }
    if (!userId) return { teacher: null, error: new Error('Création simulateur incomplète.') }
    profileId = userId
  } else if (profileId) {
    const { error: ensureError } = await supabase.rpc('ensure_teacher_record', { p_profile_id: profileId })
    if (ensureError) return { teacher: null, error: toUserError(ensureError, 'save') }

    const gender = normalizeGender(payload.gender)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone: normalizePhoneDigits(payload.phone) || null,
        full_name: fullName,
        ...(gender ? { gender } : {}),
      })
      .eq('id', profileId)
    if (profileError) return { teacher: null, error: toUserError(profileError, 'save') }
  } else {
    const gender = normalizeGender(payload.gender)
    const { error: inviteError, userId } = await inviteUser({
      email,
      role: 'teacher',
      fullName,
      resourceType,
      gender,
    })
    if (inviteError) return { teacher: null, error: inviteError }
    profileId = userId

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone: normalizePhoneDigits(payload.phone) || null,
        full_name: fullName,
        ...(gender ? { gender } : {}),
      })
      .eq('id', profileId)
    if (profileError) return { teacher: null, error: toUserError(profileError, 'save') }

    const { error: ensureError } = await supabase.rpc('ensure_teacher_record', { p_profile_id: profileId })
    if (ensureError) return { teacher: null, error: toUserError(ensureError, 'save') }
  }

  const { error: saveError } = await saveTeachingResource(profileId, payload, { isActive: true })
  if (saveError) return { teacher: null, error: saveError }

  const { teacher: row } = await getTeacher(profileId)
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', profileId)
    .maybeSingle()
  if (profileRow?.organization_id) {
    const { trackFirstTeacherMilestone } = await import('../lib/analytics')
    void trackFirstTeacherMilestone(profileRow.organization_id)
  }
  return { teacher: row, error: null }
}

export async function updateTeacher(profileId, payload) {
  const resourceType = normalizeTeachingResourceType(payload.resourceType)
  const firstName = String(payload.firstName || '').trim()
  const lastName = String(payload.lastName || '').trim()
  const fullName = resourceType === TEACHING_RESOURCE_TYPES.SIMULATOR
    ? lastName
    : joinFullName(firstName, lastName)

  const gender = normalizeGender(payload.gender)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      email: payload.email?.trim().toLowerCase() || null,
      phone: normalizePhoneDigits(payload.phone) || null,
      ...(gender ? { gender } : {}),
    })
    .eq('id', profileId)
  if (profileError) return { teacher: null, error: toUserError(profileError, 'save') }

  const { payload: teacherPayload, error: validationError } = teacherRecordPayload(payload)
  if (validationError) return { teacher: null, error: validationError }

  const { error: saveError } = await saveTeachingResource(profileId, payload)
  if (saveError) return { teacher: null, error: saveError }

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
