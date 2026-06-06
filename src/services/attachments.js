import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'

const BUCKET = 'message-attachments'

// Téléverse un fichier et l'enregistre dans message_attachments (lié au message).
export async function uploadAttachment({ conversationId, messageId, file }) {
  const safeName = file.name.replace(/[^\w.-]+/g, '_')
  const path = `${conversationId}/${messageId}/${Date.now()}-${safeName}`
  const { error: upError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined })
  if (upError) throw upError

  const attachmentId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  const { error } = await supabase.from('message_attachments').insert({
    id: attachmentId,
    message_id: messageId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size || null,
  })
  if (error) throw error
  return {
    id: attachmentId,
    message_id: messageId,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size || null,
  }
}

// Récupère les pièces jointes des messages + URL signées (bucket privé).
// Retourne un objet { [messageId]: [{ id, file_name, mime_type, size_bytes, url }] }.
export async function listAttachmentsForMessages(messageIds) {
  if (!messageIds || !messageIds.length) return {}
  try {
    const { data, error } = await supabase
      .from('message_attachments')
      .select('id, message_id, storage_path, file_name, mime_type, size_bytes')
      .in('message_id', messageIds)
    if (error) throw error
    const rows = data || []
    if (!rows.length) return {}

    const paths = rows.map((r) => r.storage_path)
    const urlByPath = {}
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
    ;(signed || []).forEach((s) => {
      if (s?.path && s?.signedUrl) urlByPath[s.path] = s.signedUrl
    })

    const byMessage = {}
    rows.forEach((r) => {
      const item = { ...r, url: urlByPath[r.storage_path] || null }
      if (!byMessage[r.message_id]) byMessage[r.message_id] = []
      byMessage[r.message_id].push(item)
    })
    return byMessage
  } catch {
    return {}
  }
}

// Réutilisation administrative : copie la pièce jointe vers le bucket
// student-documents puis enregistre le document (accès dossier pour tout le staff).
export async function linkAttachmentToDocument({ organizationId, studentId, attachment, type, sentAt, senderName }) {
  if (!attachment?.storage_path) return { error: new Error('Pièce jointe invalide.') }

  try {
    const { data: existing } = await supabase
      .from('documents')
      .select('id')
      .eq('student_id', studentId)
      .eq('source', 'messagerie')
      .eq('file_name', attachment.file_name)
      .eq('sent_at', sentAt || null)
      .maybeSingle()
    if (existing?.id) return { error: new Error('Ce document est déjà classé dans le dossier.') }
  } catch {
    // on continue si la table n'est pas encore prête
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(attachment.storage_path)
  if (downloadError) return { error: downloadError }

  const safeName = (attachment.file_name || 'document').replace(/[^\w.-]+/g, '_')
  const storagePath = `${studentId}/${Date.now()}-${safeName}`
  const { error: uploadError } = await supabase.storage
    .from('student-documents')
    .upload(storagePath, blob, { contentType: attachment.mime_type || undefined })
  if (uploadError) return { error: uploadError }

  const { error } = await supabase.from('documents').insert({
    organization_id: organizationId,
    student_id: studentId,
    type: type || 'Autres documents',
    file_name: attachment.file_name,
    storage_path: storagePath,
    storage_bucket: 'student-documents',
    status: 'À vérifier',
    folder: 'Dossier administratif',
    source: 'messagerie',
    sent_at: sentAt || null,
    sender_name: senderName || null,
    classified_at: new Date().toISOString(),
  })
  if (error) return { error: toUserError(error, 'document') }
  return { error: null }
}
