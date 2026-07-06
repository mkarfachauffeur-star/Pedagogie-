import { supabase } from '../lib/supabase'

const PUBLIC_PLAN_CODES = ['trial', 'starter', 'premium']

export async function fetchPublicPlans() {
  const { data, error } = await supabase.rpc('get_public_plan_catalog')

  if (error) {
    return { plans: [], error }
  }

  const plans = (data || [])
    .filter((plan) => PUBLIC_PLAN_CODES.includes(plan.code))
    .sort((a, b) => Number(a.price_cents || 0) - Number(b.price_cents || 0))

  return { plans, error: null }
}
