import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'

export const PACKAGE_FAMILY_OPTIONS = [
  { value: 'permis_b', label: 'Permis B' },
  { value: 'moto', label: 'Permis moto' },
  { value: 'code', label: 'Code seul' },
]

export const PACKAGE_GEARBOX_OPTIONS = [
  { value: 'manuelle', label: 'Boîte manuelle' },
  { value: 'automatique', label: 'Boîte automatique' },
]

export const PACKAGE_FORMATION_OPTIONS = [
  { value: 'classique', label: 'Permis classique' },
  { value: 'aac', label: 'Conduite accompagnée (AAC)' },
  { value: 'cs', label: 'Conduite supervisée (CS)' },
]

const GEARBOX_SHARED_FORMATIONS = ['aac', 'cs']

export function formationAppliesToBothGearboxes(formation) {
  return GEARBOX_SHARED_FORMATIONS.includes(formation)
}

export function normalizePackageCategory(category) {
  if (['aac', 'b_manuelle_aac', 'b_automatique_aac'].includes(category)) return 'aac'
  if (['cs', 'b_manuelle_cs', 'b_automatique_cs'].includes(category)) return 'cs'
  return category
}

export function parsePackageCategory(category) {
  const normalized = normalizePackageCategory(category)
  if (normalized === 'moto') return { family: 'moto', gearbox: null, formation: null }
  if (normalized === 'code') return { family: 'code', gearbox: null, formation: null }
  if (normalized === 'aac') return { family: 'permis_b', gearbox: null, formation: 'aac' }
  if (normalized === 'cs') return { family: 'permis_b', gearbox: null, formation: 'cs' }
  if (normalized === 'b_manuelle') return { family: 'permis_b', gearbox: 'manuelle', formation: 'classique' }
  if (normalized === 'b_automatique') return { family: 'permis_b', gearbox: 'automatique', formation: 'classique' }
  return { family: 'permis_b', gearbox: 'manuelle', formation: 'classique' }
}

export function buildPackageCategory({ family, gearbox, formation }) {
  if (family === 'moto') return 'moto'
  if (family === 'code') return 'code'
  if (formation === 'aac') return 'aac'
  if (formation === 'cs') return 'cs'
  return gearbox === 'automatique' ? 'b_automatique' : 'b_manuelle'
}

export function categoryLabel(value) {
  const { family, gearbox, formation } = parsePackageCategory(value)
  if (family === 'moto') return 'Permis moto'
  if (family === 'code') return 'Code seul'
  if (formation === 'aac') return 'Permis B — Conduite accompagnée (AAC)'
  if (formation === 'cs') return 'Permis B — Conduite supervisée (CS)'
  const gb = gearbox === 'automatique' ? 'Boîte automatique' : 'Boîte manuelle'
  return `Permis B — ${gb} — Permis classique`
}

export function categoryEyebrow(value) {
  const { family, gearbox, formation } = parsePackageCategory(value)
  if (family === 'moto') return 'Permis moto'
  if (family === 'code') return 'Code seul'
  if (formation === 'aac') return 'Permis B · Boîte manuelle & automatique · AAC'
  if (formation === 'cs') return 'Permis B · Boîte manuelle & automatique · CS'
  const gb = gearbox === 'automatique' ? 'Boîte automatique' : 'Boîte manuelle'
  return `Permis B · ${gb} · Classique`
}

export function defaultPackageName({ category, includedHours }) {
  const label = categoryLabel(category)
  const hours = Number(includedHours)
  if (hours > 0) return `Forfait ${hours}h — ${label}`
  return label
}

export function packageHasRvp(category) {
  return parsePackageCategory(category).formation === 'aac'
}

export const PACKAGE_RVP_OPTIONS = [
  { key: 'rvp', label: 'Rendez-vous préalable (RVP)' },
  { key: 'rvp1', label: 'RVP1 — 1 000 km' },
  { key: 'rvp2', label: 'RVP2 — 2 000 km' },
  { key: 'rvp3', label: 'RVP3 — 3 000 km' },
]

export function formatRvpSummary(pkg) {
  if (!packageHasRvp(pkg?.category)) return null
  const parts = PACKAGE_RVP_OPTIONS.map(({ key, label }) => {
    const included = pkg[`${key}_included`]
    const price = Number(pkg[`${key}_ttc`] || 0)
    if (included) return `${label.split(' — ')[0]} inclus`
    if (price > 0) return `${label.split(' — ')[0]} ${price.toLocaleString('fr-FR')} €`
    return null
  }).filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Non renseigné'
}

export function packageHasConfiguredPrice(pkg) {
  const price = Number(pkg?.price_ttc)
  return Number.isFinite(price) && price > 0
}

const PACKAGE_SELECT_GROUP_ORDER = [
  'permis_b_manuelle',
  'permis_b_automatique',
  'permis_b_aac',
  'permis_b_cs',
  'permis_moto',
  'code_seul',
]

export function packageSelectGroupKey(category) {
  const { family, gearbox, formation } = parsePackageCategory(category)
  if (family === 'moto') return 'permis_moto'
  if (family === 'code') return 'code_seul'
  if (formation === 'aac') return 'permis_b_aac'
  if (formation === 'cs') return 'permis_b_cs'
  if (gearbox === 'automatique') return 'permis_b_automatique'
  return 'permis_b_manuelle'
}

export function packageSelectGroupLabel(groupKey) {
  const labels = {
    permis_b_manuelle: 'Permis B — Boîte manuelle',
    permis_b_automatique: 'Permis B — Boîte automatique',
    permis_b_aac: 'Permis B — Conduite accompagnée (AAC)',
    permis_b_cs: 'Permis B — Conduite supervisée (CS)',
    permis_moto: 'Permis moto',
    code_seul: 'Code seul',
  }
  return labels[groupKey] || groupKey
}

export function formatPackageSelectLabel(pkg) {
  const hours = Number(pkg?.included_hours)
  const price = Number(pkg?.price_ttc)
  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (Number.isFinite(price) && price > 0) parts.push(`${price.toLocaleString('fr-FR')} €`)
  return parts.length ? parts.join(' · ') : 'Formule'
}

export function licenseCategoryToPackageFamily(licenseCategory) {
  if (licenseCategory === 'Permis B') return 'permis_b'
  if (['Permis A', 'Permis A1', 'Permis A2', 'Permis AM'].includes(licenseCategory)) return 'moto'
  return null
}

export function packageMatchesLicenseCategory(pkg, licenseCategory) {
  const expectedFamily = licenseCategoryToPackageFamily(licenseCategory)
  if (!expectedFamily) return true
  return parsePackageCategory(pkg?.category).family === expectedFamily
}

export function groupPackagesForSelect(packages = []) {
  const grouped = new Map()
  packages.forEach((pkg) => {
    const key = packageSelectGroupKey(pkg.category)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(pkg)
  })

  return PACKAGE_SELECT_GROUP_ORDER
    .filter((key) => grouped.has(key))
    .map((key) => ({
      key,
      label: packageSelectGroupLabel(key),
      items: grouped.get(key),
    }))
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

function isMissingColumnError(error) {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase()
  return error?.code === 'PGRST204' || (message.includes('column') && message.includes('pricing_packages'))
}

function buildBasePricingRow(payload) {
  const category = normalizePackageCategory(payload.category)
  return {
    organization_id: payload.organizationId,
    name: payload.name?.trim() || defaultPackageName({
      category,
      includedHours: payload.includedHours,
    }),
    category,
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
}

function buildRvpPricingRow(payload) {
  if (!packageHasRvp(payload.category)) {
    return {
      rvp_included: false,
      rvp_ttc: 0,
      rvp1_included: false,
      rvp1_ttc: 0,
      rvp2_included: false,
      rvp2_ttc: 0,
      rvp3_included: false,
      rvp3_ttc: 0,
    }
  }
  return {
    rvp_included: Boolean(payload.rvpIncluded),
    rvp_ttc: payload.rvpIncluded ? 0 : Number(payload.rvpTtc) || 0,
    rvp1_included: Boolean(payload.rvp1Included),
    rvp1_ttc: payload.rvp1Included ? 0 : Number(payload.rvp1Ttc) || 0,
    rvp2_included: Boolean(payload.rvp2Included),
    rvp2_ttc: payload.rvp2Included ? 0 : Number(payload.rvp2Ttc) || 0,
    rvp3_included: Boolean(payload.rvp3Included),
    rvp3_ttc: payload.rvp3Included ? 0 : Number(payload.rvp3Ttc) || 0,
  }
}

export function formHasRvpData(form) {
  if (!packageHasRvp(form?.category)) return false
  return PACKAGE_RVP_OPTIONS.some(({ key }) => {
    const included = form[`${key}Included`]
    const price = Number(form[`${key}Ttc`])
    return included || price > 0
  })
}

async function persistPricingPackage(payload, row) {
  if (payload.id) {
    return supabase.from('pricing_packages').update(row).eq('id', payload.id).select('*').single()
  }
  return supabase.from('pricing_packages').insert(row).select('*').single()
}

export async function upsertPricingPackage(payload) {
  try {
    const baseRow = buildBasePricingRow(payload)
    const { data, error } = await persistPricingPackage(payload, baseRow)
    if (error) throw error

    const packageId = data?.id
    if (!packageId) throw new Error('Formule introuvable après enregistrement.')

    let pkg = data
    let rvpWarning = null

    const rvpRow = buildRvpPricingRow(payload)
    const { data: rvpData, error: rvpError } = await supabase
      .from('pricing_packages')
      .update({ ...rvpRow, updated_at: new Date().toISOString() })
      .eq('id', packageId)
      .select('*')
      .single()

    if (rvpError) {
      if (isMissingColumnError(rvpError) && formHasRvpData(payload)) {
        rvpWarning =
          'Les tarifs des rendez-vous préalable (RVP) n\'ont pas pu être enregistrés. Le reste de la formule est bien sauvegardé. Un administrateur doit mettre à jour la base de données de l\'auto-école, puis réessayez.'
      } else if (!isMissingColumnError(rvpError)) {
        throw rvpError
      }
    } else if (rvpData) {
      pkg = rvpData
    }

    return { pkg, error: null, rvpWarning }
  } catch (error) {
    return { pkg: null, error: toUserError(error, 'save'), rvpWarning: null }
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
