import { supabase } from '../lib/supabase'
import { BETA_PILOT_ORG_LIMIT } from '../config/beta'

export async function fetchBetaPilotStatus() {
  const { data, error } = await supabase.rpc('get_beta_pilot_status', {
    p_limit: BETA_PILOT_ORG_LIMIT,
  })

  if (error) {
    return {
      limit: BETA_PILOT_ORG_LIMIT,
      used: null,
      remaining: null,
      acceptsNew: true,
      error,
    }
  }

  return {
    limit: data?.limit ?? BETA_PILOT_ORG_LIMIT,
    used: data?.used ?? 0,
    remaining: data?.remaining ?? BETA_PILOT_ORG_LIMIT,
    acceptsNew: data?.accepts_new !== false,
    error: null,
  }
}
