import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'
import { subscribePostgresChanges } from './realtime'

const BUCKET = 'staff-contracts'

export const STAFF_CONTRACT_STATUSES = {
  secretary: ['Secrétaire'],
  teacher: ['Enseignant CDI', 'Enseignant CDD', 'Indépendant'],
}

export const STAFF_CONTRACT_ROLES = ['teacher', 'secretary']

export function contractStatusesForRole(role) {
  if (role === 'secretary') return STAFF_CONTRACT_STATUSES.secretary
  if (role === 'teacher') return STAFF_CONTRACT_STATUSES.teacher
  return []
}

export function defaultContractStatusForRole(role) {
  return contractStatusesForRole(role)[0] || 'Enseignant CDI'
}

function storagePath(organizationId, profileId, fileName) {
  const safeName = String(fileName || 'document').replace(/[^\w.-]+/g, '_')
  return `${organizationId}/staff/${profileId}/${Date.now()}-${safeName}`
}

export async function listStaffContracts({ profileId, employmentStatus } = {}) {
  try {
    let query = supabase
      .from('staff_employment_contracts')
      .select(`
        id, title, employment_status, file_name, storage_path, storage_bucket, notes, created_at,
        profile:profile_id(id, full_name, role, email, phone),
        uploader:uploaded_by(full_name)
      `)
      .order('created_at', { ascending: false })
    if (profileId) query = query.eq('profile_id', profileId)
    if (employmentStatus) query = query.eq('employment_status', employmentStatus)

    const { data, error } = await query
    if (error) throw error
    const rows = data || []

    const paths = rows.map((row) => row.storage_path).filter(Boolean)
    const urlByPath = {}
    if (paths.length) {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
      ;(signed || []).forEach((entry) => {
        if (entry?.path && entry?.signedUrl) urlByPath[entry.path] = entry.signedUrl
      })
    }

    return {
      contracts: rows.map((row) => ({
        ...row,
        url: row.storage_path ? urlByPath[row.storage_path] || null : null,
      })),
      error: null,
    }
  } catch (error) {
    return { contracts: [], error }
  }
}

export async function uploadStaffContract({
  organizationId,
  profileId,
  employmentStatus,
  notes,
  file,
  uploadedBy,
}) {
  if (!file) return { contract: null, error: new Error('Un fichier est requis.') }
  if (!organizationId || !profileId) {
    return { contract: null, error: new Error('Identifiants manquants.') }
  }
  if (!employmentStatus) {
    return { contract: null, error: new Error('Le statut du contrat est requis.') }
  }

  const path = storagePath(organizationId, profileId, file.name)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (uploadError) return { contract: null, error: toUserError(uploadError, 'document') }

  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('staff_employment_contracts')
    .insert({
      organization_id: organizationId,
      profile_id: profileId,
      title: employmentStatus,
      employment_status: employmentStatus,
      file_name: file.name,
      storage_path: path,
      storage_bucket: BUCKET,
      notes: notes?.trim() || null,
      uploaded_by: uploadedBy || null,
      updated_at: nowIso,
    })
    .select(`
      id, title, employment_status, file_name, storage_path, storage_bucket, notes, created_at,
      profile:profile_id(id, full_name, role, email, phone)
    `)
    .single()

  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    return { contract: null, error: toUserError(error, 'document') }
  }

  return { contract: data, error: null }
}

export async function deleteStaffContract(contract) {
  if (!contract?.id) return { error: new Error('Contrat introuvable.') }

  const { error: dbError } = await supabase
    .from('staff_employment_contracts')
    .delete()
    .eq('id', contract.id)
  if (dbError) return { error: toUserError(dbError, 'document') }

  if (contract.storage_path) {
    await supabase.storage.from(contract.storage_bucket || BUCKET).remove([contract.storage_path])
  }

  return { error: null }
}

export function subscribeStaffContracts(onChange) {
  return subscribePostgresChanges({
    topicBase: 'staff-contracts-list',
    listeners: [
      {
        config: { event: '*', schema: 'public', table: 'staff_employment_contracts' },
        callback: onChange,
      },
    ],
  })
}
