import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'
import { addOneYear, countMandatoryRvpCompleted, evaluateAacConditions, kmProgress, statusLabel } from '../lib/aacRules'
import { downsamplePath } from '../lib/geolocation'

export const AAC_FFI_DOCUMENT_TYPE = 'Attestation FFI'

function mapProfile(row, { birthDate = null, rvp = [] } = {}) {
  if (!row) return null
  const rvpCompleted = countMandatoryRvpCompleted(rvp)
  const conditions = evaluateAacConditions({
    startedAt: row.started_at,
    kmTotal: row.km_total,
    birthDate,
    rvpCompletedCount: rvpCompleted,
  })
  const progress = kmProgress(row.km_total)
  return {
    id: row.id,
    studentId: row.student_id,
    organizationId: row.organization_id,
    startedAt: row.started_at,
    plannedEndAt: row.planned_end_at || addOneYear(row.started_at),
    examEligibleAt: row.exam_eligible_at || addOneYear(row.started_at),
    kmTotal: Number(row.km_total) || 0,
    tripCount: Number(row.trip_count) || 0,
    status: row.status,
    statusLabel: statusLabel(row.status),
    ffiDocumentId: row.ffi_document_id,
    ffiStoragePath: row.ffi_storage_path,
    conditions,
    progress,
    rvp,
  }
}

function mapTrip(row) {
  if (!row) return null
  return {
    id: row.id,
    studentId: row.student_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    distanceKm: Number(row.distance_km) || 0,
    durationSeconds: Number(row.duration_seconds) || 0,
    pathSummary: Array.isArray(row.path_summary) ? row.path_summary : [],
    status: row.status,
  }
}

// Un créneau au-delà de 2, vide, est un reste automatique. Le marqueur invisible
// distingue un rendez-vous ajouté tant que la colonne is_additional n’est pas là.
function stripExtraMarker(value) {
  return String(value || '').replace(/\u200b/g, '')
}

function mapRvp(row) {
  if (!row) return null
  const rawObservations = row.observations || ''
  const marked = rawObservations.includes('\u200b')
  return {
    id: row.id,
    studentId: row.student_id,
    sequence: row.sequence,
    heldOn: row.held_on,
    teacherId: row.teacher_id,
    companionName: row.companion_name || '',
    observations: stripExtraMarker(rawObservations),
    completed: Boolean(row.completed),
    isAdditional: Boolean(row.is_additional) || marked,
    preserveExtraMarker: marked && !row.is_additional,
    label: `RVP ${row.sequence}`,
  }
}

function isMissingRpc(error) {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.code || ''}`
  return /PGRST202|could not find the function|schema cache/i.test(message)
}

export async function ensureAacProfile(studentId, startedAt = null) {
  try {
    const { data, error } = await supabase.rpc('ensure_aac_profile', {
      p_student_id: studentId,
      p_started_at: startedAt || null,
    })
    if (error) throw error
    return { profile: data, error: null }
  } catch (error) {
    return { profile: null, error: toUserError(error, 'generic') }
  }
}

export async function getAacBundle(studentId) {
  try {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, organization_id, birth_date, first_name, last_name, package_name, formation_type')
      .eq('id', studentId)
      .maybeSingle()
    if (studentError) throw studentError
    if (!student) return { bundle: null, error: null }

    let { data: profile } = await supabase
      .from('aac_profiles')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle()

    if (!profile) {
      const ensured = await ensureAacProfile(studentId)
      if (ensured.error) return { bundle: null, error: ensured.error }
      profile = ensured.profile
    }

    const [{ data: rvpRows }, { data: tripRows }, ffiDoc] = await Promise.all([
      supabase.from('aac_rvp').select('*').eq('student_id', studentId).order('sequence'),
      supabase
        .from('aac_trips')
        .select('*')
        .eq('student_id', studentId)
        .order('started_at', { ascending: false })
        .limit(50),
      profile?.ffi_document_id
        ? supabase
            .from('documents')
            .select('id, file_name, storage_path, storage_bucket, type, status')
            .eq('id', profile.ffi_document_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const rvp = (rvpRows || []).map(mapRvp)
    const trips = (tripRows || []).map(mapTrip)
    const activeTrip = trips.find((t) => t.status === 'in_progress') || null

    let ffiUrl = null
    const ffi = ffiDoc?.data || null
    if (ffi?.storage_path) {
      const bucket = ffi.storage_bucket || 'student-documents'
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(ffi.storage_path, 3600)
      ffiUrl = signed?.signedUrl || null
    }

    return {
      bundle: {
        student,
        profile: mapProfile(profile, { birthDate: student.birth_date, rvp }),
        rvp,
        trips,
        activeTrip,
        ffi: ffi
          ? { ...ffi, url: ffiUrl }
          : null,
      },
      error: null,
    }
  } catch (error) {
    return { bundle: null, error: toUserError(error, 'generic') }
  }
}

export async function updateAacStartDate(studentId, startedAt) {
  const { profile, error } = await ensureAacProfile(studentId, startedAt)
  if (error) return { profile: null, error }
  return { profile: mapProfile(profile), error: null }
}

export async function markAacCompleted(studentId) {
  try {
    const { error } = await supabase
      .from('aac_profiles')
      .update({
        status: 'terminee',
        marked_complete_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
    if (error) throw error
    await supabase.rpc('refresh_aac_profile_stats', { p_student_id: studentId })
    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'generic') }
  }
}

export async function upsertAacRvp(studentId, payload) {
  try {
    await ensureAacProfile(studentId)
    const { data: student } = await supabase
      .from('students')
      .select('organization_id')
      .eq('id', studentId)
      .maybeSingle()

    const cleanObservations = stripExtraMarker(payload.observations).trim()
    const observations = payload.markAsAdditional || payload.preserveExtraMarker
      ? `\u200b${cleanObservations}`
      : cleanObservations || null

    const row = {
      organization_id: student.organization_id,
      student_id: studentId,
      sequence: payload.sequence,
      held_on: payload.heldOn || null,
      teacher_id: payload.teacherId || null,
      companion_name: payload.companionName?.trim() || null,
      observations,
      completed: Boolean(payload.completed),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('aac_rvp')
      .upsert(row, { onConflict: 'student_id,sequence' })
      .select('*')
      .maybeSingle()
    if (error) throw error

    await supabase.rpc('refresh_aac_profile_stats', { p_student_id: studentId })
    return { rvp: mapRvp(data), error: null }
  } catch (error) {
    return { rvp: null, error: toUserError(error, 'generic') }
  }
}

function isBlankExtraSlot(row) {
  if (!row || Number(row.sequence) <= 2) return false
  if (row.completed || row.held_on || row.teacher_id) return false
  if (String(row.companion_name || '').trim()) return false
  const observations = row.observations || ''
  if (observations.includes('\u200b')) return false
  if (stripExtraMarker(observations).trim()) return false
  return true
}

export async function addAacPedagogicalAppointment(studentId) {
  try {
    const { data, error } = await supabase.rpc('add_aac_pedagogical_appointment', {
      p_student_id: studentId,
    })
    if (!error) return { rvp: mapRvp(data), error: null }
    if (!isMissingRpc(error)) throw error

    const { data: rows, error: listError } = await supabase
      .from('aac_rvp')
      .select('sequence, held_on, teacher_id, companion_name, observations, completed')
      .eq('student_id', studentId)
    if (listError) throw listError

    const list = rows || []
    const blank = list.filter(isBlankExtraSlot).sort((a, b) => a.sequence - b.sequence)[0]
    const next = blank?.sequence || Math.max(2, ...list.map((row) => Number(row.sequence) || 0)) + 1
    if (!blank && next > 3) {
      throw new Error('Impossible d’ajouter un rendez-vous pédagogique supplémentaire pour le moment.')
    }

    return upsertAacRvp(studentId, {
      sequence: next,
      completed: false,
      observations: '',
      markAsAdditional: true,
    })
  } catch (error) {
    return { rvp: null, error: toUserError(error, 'generic') }
  }
}

export async function startAacTrip(studentId) {
  try {
    const ensured = await ensureAacProfile(studentId)
    if (ensured.error) return { trip: null, error: ensured.error }

    const { data: existing } = await supabase
      .from('aac_trips')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .maybeSingle()
    if (existing) {
      return { trip: null, error: new Error('Un trajet est déjà en cours.') }
    }

    const { data: student } = await supabase
      .from('students')
      .select('organization_id')
      .eq('id', studentId)
      .maybeSingle()

    const { data, error } = await supabase
      .from('aac_trips')
      .insert({
        organization_id: student.organization_id,
        student_id: studentId,
        started_at: new Date().toISOString(),
        status: 'in_progress',
      })
      .select('*')
      .maybeSingle()
    if (error) throw error
    return { trip: mapTrip(data), error: null }
  } catch (error) {
    return { trip: null, error: toUserError(error, 'generic') }
  }
}

export async function appendAacTripPoints(tripId, organizationId, points) {
  if (!points?.length) return { error: null }
  try {
    const rows = points.map((p, index) => ({
      trip_id: tripId,
      organization_id: organizationId,
      recorded_at: new Date(p.timestamp || Date.now()).toISOString(),
      lat: p.lat,
      lng: p.lng,
      accuracy_m: p.accuracy ?? null,
      sequence_no: p.sequenceNo ?? index,
    }))
    const { error } = await supabase.from('aac_trip_points').insert(rows)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'generic') }
  }
}

export async function getActiveAacTrip(studentId) {
  try {
    const { data, error } = await supabase
      .from('aac_trips')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return { trip: mapTrip(data), error: null }
  } catch (error) {
    return { trip: null, error: toUserError(error, 'generic') }
  }
}

export async function completeAacTrip(tripId, studentId, { points, distanceKm, startedAt }) {
  try {
    const endedAt = new Date()
    const start = startedAt ? new Date(startedAt) : endedAt
    const elapsedMs = endedAt.getTime() - start.getTime()
    const durationSeconds = Number.isFinite(elapsedMs) ? Math.max(0, Math.round(elapsedMs / 1000)) : 0
    const safeKm = Number.isFinite(Number(distanceKm)) ? Number(distanceKm) : 0
    const pathSummary = downsamplePath(points || [])

    const { data, error } = await supabase
      .from('aac_trips')
      .update({
        ended_at: endedAt.toISOString(),
        distance_km: safeKm,
        duration_seconds: durationSeconds,
        path_summary: pathSummary,
        status: 'completed',
        updated_at: endedAt.toISOString(),
      })
      .eq('id', tripId)
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Impossible de terminer le trajet.')

    await supabase.rpc('refresh_aac_profile_stats', { p_student_id: studentId })
    return { trip: mapTrip(data), error: null }
  } catch (error) {
    return { trip: null, error: toUserError(error, 'generic') }
  }
}

export async function cancelAacTrip(tripId) {
  try {
    const { error } = await supabase
      .from('aac_trips')
      .update({
        status: 'cancelled',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId)
      .eq('status', 'in_progress')
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'generic') }
  }
}

export async function uploadAacFfi({ organizationId, studentId, file, createdBy, senderName }) {
  if (!file) return { error: new Error('Un fichier PDF est requis.') }
  if (file.type && file.type !== 'application/pdf' && !file.name?.toLowerCase().endsWith('.pdf')) {
    return { error: new Error('L’attestation FFI doit être un fichier PDF.') }
  }
  try {
    await ensureAacProfile(studentId)
    const safeName = file.name.replace(/[^\w.-]+/g, '_')
    const storagePath = `${studentId}/ffi-${Date.now()}-${safeName}`
    const { error: upError } = await supabase.storage
      .from('student-documents')
      .upload(storagePath, file, { contentType: 'application/pdf' })
    if (upError) throw upError

    const nowIso = new Date().toISOString()
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId,
        student_id: studentId,
        type: AAC_FFI_DOCUMENT_TYPE,
        status: 'Validé',
        folder: 'AAC',
        reference: 'Attestation de Fin de Formation Initiale',
        file_name: file.name,
        storage_path: storagePath,
        storage_bucket: 'student-documents',
        source: createdBy ? 'direct' : 'eleve',
        sent_at: nowIso,
        sender_name: senderName || null,
        classified_at: nowIso,
        created_by: createdBy || null,
      })
      .select('id, file_name, storage_path, storage_bucket')
      .maybeSingle()
    if (docError) {
      await supabase.storage.from('student-documents').remove([storagePath])
      throw docError
    }

    const { error: profileError } = await supabase.rpc('link_aac_ffi', {
      p_student_id: studentId,
      p_document_id: doc.id,
      p_storage_path: storagePath,
    })
    if (profileError) throw profileError

    const { data: signed } = await supabase.storage
      .from('student-documents')
      .createSignedUrl(storagePath, 3600)

    return {
      ffi: { ...doc, url: signed?.signedUrl || null },
      error: null,
    }
  } catch (error) {
    return { ffi: null, error: toUserError(error, 'document') }
  }
}

export async function getAacTripPoints(tripId) {
  try {
    const { data, error } = await supabase
      .from('aac_trip_points')
      .select('lat, lng, recorded_at, sequence_no')
      .eq('trip_id', tripId)
      .order('sequence_no')
    if (error) throw error
    return {
      points: (data || []).map((p) => ({ lat: Number(p.lat), lng: Number(p.lng), timestamp: p.recorded_at })),
      error: null,
    }
  } catch (error) {
    return { points: [], error: toUserError(error, 'generic') }
  }
}
