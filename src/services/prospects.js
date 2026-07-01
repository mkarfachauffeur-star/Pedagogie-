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

async function readInvokePayload(error, data) {
  if (data && typeof data === 'object') return data
  try {
    if (error?.context && typeof error.context.json === 'function') {
      return await error.context.json()
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

function formatStepsMessage(payload) {
  if (!payload?.steps?.length) return null
  return payload.steps
    .map((step) => {
      const icon = step.status === 'ok' ? '✓' : step.status === 'error' ? '✗' : '·'
      const detail = step.message ? ` — ${step.message}` : ''
      return `${icon} ${step.step}${detail}`
    })
    .join('\n')
}

async function invokePlatformProspect(body) {
  const { data, error } = await supabase.functions.invoke('platform-prospect', { body })
  const payload = (await readInvokePayload(error, data)) || data || {}

  if (error || payload.error) {
    const stepsText = formatStepsMessage(payload)
    const failedStep = payload.failed_step ? `[${payload.failed_step}] ` : ''
    const message = payload.error || error?.message || 'Opération impossible.'
    const fullMessage = stepsText
      ? `${failedStep}${message}\n\n${stepsText}`
      : `${failedStep}${message}`
    throw new Error(fullMessage)
  }

  return payload
}

export async function listProspects() {
  const rpc = await supabase.rpc('platform_list_demo_requests')
  if (!rpc.error) {
    return { prospects: rpc.data || [], error: null }
  }

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

export async function acceptProspect(prospectId) {
  try {
    const data = await invokePlatformProspect({
      action: 'accept_prospect',
      prospect_id: prospectId,
    })
    return { data, error: null }
  } catch (error) {
    return { data: null, error: normalizeError(error) }
  }
}

export async function resendManagerInvite(prospectId) {
  try {
    const data = await invokePlatformProspect({
      action: 'resend_invite',
      prospect_id: prospectId,
    })
    return { data, error: null }
  } catch (error) {
    return { data: null, error: normalizeError(error) }
  }
}

export function formatAcceptSteps(data) {
  return formatStepsMessage(data)
}
