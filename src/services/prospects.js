import { supabase } from '../lib/supabase'

export const PROSPECT_STATUS = {
  NEW: 'Nouvelle demande',
  REFUSED: 'Refusée',
  ACCEPTED: 'Acceptée',
  /** @deprecated alias historique */
  TRIAL: 'Essai gratuit',
}

function normalizeError(error) {
  if (!error) return null
  return error instanceof Error ? error : new Error(error.message || String(error))
}

export async function listProspects() {
  const rpc = await supabase.rpc('platform_list_demo_requests')
  if (!rpc.error) {
    return { prospects: rpc.data || [], error: null }
  }

  // Secours : lecture directe (si migration RPC pas encore appliquée)
  const direct = await supabase
    .from('demo_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (direct.error) {
    console.error('[prospects] listProspects failed', {
      rpc: rpc.error?.message,
      direct: direct.error?.message,
    })
    return {
      prospects: [],
      error: normalizeError(direct.error || rpc.error),
    }
  }

  return { prospects: direct.data || [], error: null }
}

export async function countNewProspects() {
  const rpc = await supabase.rpc('platform_count_new_demo_requests')
  if (!rpc.error && rpc.data != null) {
    return Number(rpc.data) || 0
  }

  const { count, error } = await supabase
    .from('demo_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', PROSPECT_STATUS.NEW)

  if (error) {
    const { count: totalCount } = await supabase
      .from('demo_requests')
      .select('id', { count: 'exact', head: true })
    return totalCount ?? 0
  }

  return count ?? 0
}

export async function updateProspect(prospectId, patch) {
  const rpc = await supabase.rpc('platform_update_demo_request', {
    p_id: prospectId,
    p_status: patch.status ?? null,
    p_internal_notes: patch.internal_notes ?? null,
  })

  if (!rpc.error && rpc.data) {
    return { prospect: rpc.data, error: null }
  }

  const { data, error } = await supabase
    .from('demo_requests')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', prospectId)
    .select('*')
    .single()

  if (error) return { prospect: null, error: normalizeError(error) }
  return { prospect: data, error: null }
}

export async function refuseProspect(prospectId) {
  return updateProspect(prospectId, { status: PROSPECT_STATUS.REFUSED })
}

function parseFunctionErrorBody(error, data) {
  if (data?.error) return String(data.error)
  try {
    const body = error?.context?.body
    if (typeof body === 'string' && body.trim()) {
      const parsed = JSON.parse(body)
      if (parsed?.error) return String(parsed.error)
    }
  } catch {
    // ignore
  }
  return null
}

export async function acceptProspect(prospectId) {
  try {
    const { data, error } = await supabase.functions.invoke('platform-prospect', {
      body: { action: 'accept_prospect', prospect_id: prospectId },
    })
    const serverMessage = parseFunctionErrorBody(error, data)
    if (error) {
      throw new Error(serverMessage || error.message || 'Acceptation impossible.')
    }
    if (data?.error) throw new Error(data.error)
    return { data, error: null }
  } catch (error) {
    return { data: null, error: normalizeError(error) }
  }
}
