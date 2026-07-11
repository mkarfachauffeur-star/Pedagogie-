import { supabase } from '../lib/supabase'
import { assertOrgCanWrite } from '../lib/orgAccess'
import { formatPersonName } from '../lib/staffAccounts'
import { toUserError } from '../lib/userFacingError'
import { subscribePostgresChanges } from './realtime'

export const DOCUMENT_CATEGORIES = [
  'Pièce d’identité',
  'Justificatif de domicile',
  'ASSR/JDC',
  'Photo signature',
  'Contrat signé',
  'Mandat de paiement',
  'Dossier ANTS',
  'Autres documents',
]

export const DOCUMENT_STATUSES = ['À vérifier', 'Validé', 'Refusé', 'À compléter', 'Archivé']

// Liste des dossiers élèves (pour le sélecteur). RLS = accès de l'utilisateur.
export async function listStudentsForDocuments({ search = '' } = {}) {
  try {
    let query = supabase
      .from('students')
      .select('id, first_name, last_name, file_number, status')
      .order('last_name', { ascending: true })
    const term = search.trim()
    if (term) {
      query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,file_number.ilike.%${term}%`)
    }
    const { data, error } = await query
    if (error) throw error
    return (data || []).map((s) => ({
      id: s.id,
      name: formatPersonName(s),
      fileNumber: s.file_number,
      status: s.status,
    }))
  } catch {
    return []
  }
}

// Liste des documents (d'un élève ou de toute l'auto-école), avec URL signées.
export async function listDocuments({ studentId } = {}) {
  try {
    let query = supabase
      .from('documents')
      .select('id, student_id, type, reference, status, folder, file_name, storage_path, storage_bucket, source, sent_at, sender_name, classified_at, received_date, comment')
      .order('classified_at', { ascending: false })
    if (studentId) query = query.eq('student_id', studentId)
    const { data, error } = await query
    if (error) throw error
    const rows = data || []

    // URL signées, groupées par bucket.
    const pathsByBucket = {}
    rows.forEach((r) => {
      if (!r.storage_path) return
      const bucket = r.storage_bucket || 'student-documents'
      if (!pathsByBucket[bucket]) pathsByBucket[bucket] = []
      pathsByBucket[bucket].push(r.storage_path)
    })
    const urlByKey = {}
    for (const bucket of Object.keys(pathsByBucket)) {
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrls(pathsByBucket[bucket], 3600)
      ;(signed || []).forEach((s) => {
        if (s?.path && s?.signedUrl) urlByKey[`${bucket}:${s.path}`] = s.signedUrl
      })
    }
    return rows.map((r) => ({
      ...r,
      url: r.storage_path ? urlByKey[`${r.storage_bucket || 'student-documents'}:${r.storage_path}`] || null : null,
    }))
  } catch {
    return []
  }
}

// Dépôt direct d'un document (téléversement + ligne documents).
export async function uploadStudentDocument({
  organizationId,
  studentId,
  type,
  status,
  folder,
  reference,
  comment,
  file,
  createdBy,
  source = 'direct',
  senderName = null,
}) {
  if (!file) return { error: new Error('Un fichier est requis.') }
  try {
    await assertOrgCanWrite()
  } catch (error) {
    return { error: toUserError(error, 'document') }
  }
  const safeName = file.name.replace(/[^\w.-]+/g, '_')
  const storagePath = `${studentId}/${Date.now()}-${safeName}`
  const { error: upError } = await supabase.storage
    .from('student-documents')
    .upload(storagePath, file, { contentType: file.type || undefined })
  if (upError) return { error: upError }
  const nowIso = new Date().toISOString()
  const { error } = await supabase.from('documents').insert({
    organization_id: organizationId,
    student_id: studentId,
    type,
    status,
    folder,
    reference,
    comment,
    file_name: file?.name || null,
    storage_path: storagePath,
    storage_bucket: 'student-documents',
    source,
    sent_at: nowIso,
    sender_name: senderName,
    classified_at: nowIso,
    created_by: createdBy,
  })
  if (error) {
    await supabase.storage.from('student-documents').remove([storagePath])
    return { error: toUserError(error, 'document') }
  }
  if (organizationId) {
    const { trackFirstDocumentMilestone } = await import('../lib/analytics')
    void trackFirstDocumentMilestone(organizationId)
  }
  return { error: null }
}

export async function uploadDocumentFromStudent({
  organizationId,
  studentId,
  documentType,
  documentName,
  file,
  createdBy,
  senderName,
}) {
  const type = documentType?.trim()
  if (!type) return { error: new Error('Le type de document est requis.') }
  const reference = documentName?.trim() || type
  return uploadStudentDocument({
    organizationId,
    studentId,
    type,
    status: 'À vérifier',
    folder: 'Dépôt élève',
    reference,
    comment: null,
    file,
    createdBy,
    source: 'eleve',
    senderName,
  })
}

// Temps réel sur les documents : déclenche onChange à chaque évènement.
export function subscribeToDocuments(onChange, scope = 'page') {
  return subscribePostgresChanges({
    topicBase: `documents-stream:${scope}`,
    listeners: [
      {
        config: { event: '*', schema: 'public', table: 'documents' },
        callback: onChange,
      },
    ],
  })
}
