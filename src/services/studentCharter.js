import { supabase } from '../lib/supabase'

function mapCharterStatus(data) {
  if (!data?.charter) return null
  return {
    needsAcceptance: Boolean(data.needs_acceptance),
    charter: {
      id: data.charter.id,
      versionNumber: data.charter.version_number,
      title: data.charter.title,
      content: data.charter.content,
      publishedAt: data.charter.published_at,
    },
    acceptance: data.acceptance
      ? {
        acceptedAt: data.acceptance.accepted_at,
        charterVersionId: data.acceptance.charter_version_id,
      }
      : null,
  }
}

function mapStaffAcceptance(data) {
  if (!data) return null
  return {
    accepted: Boolean(data.accepted),
    needsAcceptance: Boolean(data.needs_acceptance),
    charterVersionNumber: data.charter_version_number ?? null,
    acceptedAt: data.accepted_at ?? null,
    charterTitle: data.charter_title ?? null,
  }
}

export function formatCharterAcceptedAt(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export async function fetchStudentCharterStatus() {
  try {
    const { data, error } = await supabase.rpc('get_student_charter_status')
    if (error) throw error
    return { status: mapCharterStatus(data), error: null }
  } catch (error) {
    return { status: null, error }
  }
}

export async function acceptStudentCharter(charterVersionId) {
  try {
    const { data, error } = await supabase.rpc('accept_student_charter', {
      p_charter_version_id: charterVersionId,
    })
    if (error) throw error
    return { result: data, error: null }
  } catch (error) {
    return { result: null, error }
  }
}

export async function publishStudentCharter({ content, title }) {
  try {
    const { data, error } = await supabase.rpc('publish_student_charter', {
      p_content: content,
      p_title: title || null,
    })
    if (error) throw error
    return {
      version: data
        ? {
          id: data.id,
          versionNumber: data.version_number,
          title: data.title,
          publishedAt: data.published_at,
        }
        : null,
      error: null,
    }
  } catch (error) {
    return { version: null, error }
  }
}

export async function fetchStudentCharterAcceptance(studentId) {
  if (!studentId) return { acceptance: null, error: null }
  try {
    const { data, error } = await supabase.rpc('get_student_charter_acceptance', {
      p_student_id: studentId,
    })
    if (error) throw error
    return { acceptance: mapStaffAcceptance(data), error: null }
  } catch (error) {
    return { acceptance: null, error }
  }
}

export async function fetchActiveCharterForOrg() {
  try {
    const { data, error } = await supabase
      .from('student_engagement_charter_versions')
      .select('id, version_number, title, content, published_at, is_active')
      .eq('is_active', true)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    if (!data) return { charter: null, error: null }
    return {
      charter: {
        id: data.id,
        versionNumber: data.version_number,
        title: data.title,
        content: data.content,
        publishedAt: data.published_at,
      },
      error: null,
    }
  } catch (error) {
    return { charter: null, error }
  }
}
