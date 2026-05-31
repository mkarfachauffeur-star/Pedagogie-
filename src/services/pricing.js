import { supabase } from '../lib/supabase'

export const PACKAGE_CATEGORIES = [
  { value: 'b_manuelle', label: 'Permis B — Boîte manuelle' },
  { value: 'b_automatique', label: 'Permis B — Boîte automatique' },
  { value: 'aac', label: 'Conduite accompagnée (AAC)' },
  { value: 'cs', label: 'Conduite supervisée (CS)' },
  { value: 'moto', label: 'Permis moto' },
  { value: 'code', label: 'Code seul' },
]

export function categoryLabel(value) {
  return PACKAGE_CATEGORIES.find((c) => c.value === value)?.label || value
}

export async function listPricingPackages(activeOnly = false) {
  try {
    let query = supabase
      .from('pricing_packages')
      .select('*')
      .order('sort_order', { ascending: true })
    if (activeOnly) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    return { packages: data || [], error: null }
  } catch (error) {
    return { packages: [], error }
  }
}

export async function upsertPricingPackage(payload) {
  try {
    const row = {
      organization_id: payload.organizationId,
      name: payload.name,
      category: payload.category,
      price_ttc: Number(payload.priceTtc) || 0,
      included_hours: Number(payload.includedHours) || 0,
      admin_fee_ttc: Number(payload.adminFeeTtc) || 0,
      exam_presentation_included: Boolean(payload.examPresentationIncluded),
      exam_presentation_ttc: Number(payload.examPresentationTtc) || 0,
      extra_hour_price_ttc: Number(payload.extraHourPriceTtc) || 0,
      is_active: payload.isActive !== false,
      sort_order: Number(payload.sortOrder) || 0,
      updated_at: new Date().toISOString(),
    }
    if (payload.id) {
      const { data, error } = await supabase.from('pricing_packages').update(row).eq('id', payload.id).select('*').single()
      if (error) throw error
      return { pkg: data, error: null }
    }
    const { data, error } = await supabase.from('pricing_packages').insert(row).select('*').single()
    if (error) throw error
    return { pkg: data, error: null }
  } catch (error) {
    return { pkg: null, error }
  }
}

export async function deletePricingPackage(id) {
  try {
    const { error } = await supabase.from('pricing_packages').delete().eq('id', id)
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export function computeContractFromPackage(pkg, extraHours = 0) {
  if (!pkg) return { total: 0, breakdown: {} }
  const examTtc = pkg.exam_presentation_included ? Number(pkg.exam_presentation_ttc || 0) : 0
  const extraAmount = extraHours * Number(pkg.extra_hour_price_ttc || 0)
  const total =
    Number(pkg.price_ttc || 0) +
    Number(pkg.admin_fee_ttc || 0) +
    examTtc +
    extraAmount
  return {
    total,
    breakdown: {
      package_price_ttc: Number(pkg.price_ttc || 0),
      admin_fee_ttc: Number(pkg.admin_fee_ttc || 0),
      exam_presentation_ttc: examTtc,
      extra_hours: extraHours,
      extra_hours_amount_ttc: extraAmount,
    },
  }
}
