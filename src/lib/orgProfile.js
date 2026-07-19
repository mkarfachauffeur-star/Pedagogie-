/**
 * Profil auto-école — validation + forme normalisée pour PDF / documents.
 * Colonnes DB : organizations.name, manager_name, address, postal_code, city,
 * phone, email, siret, prefecture_approval, website, logo_storage_path.
 */

/** Digits only, max 14. */
export function sanitizeSiret(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 14)
}

export function sanitizePostalCode(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 5)
}

/** Keep digits, spaces, +, (, ), -, . for display; validate separately. */
export function sanitizePhoneInput(value) {
  return String(value || '').replace(/[^\d+\s().-]/g, '').slice(0, 20)
}

export function isValidEmail(value) {
  const email = String(value || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** FR fixe / mobile : 0X… (10 chiffres) ou +33… */
export function isValidFrenchPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (/^0[1-9]\d{8}$/.test(digits)) return true
  if (/^33[1-9]\d{8}$/.test(digits)) return true
  return false
}

export function isValidPostalCode(value) {
  return /^\d{5}$/.test(String(value || '').trim())
}

export function isValidSiret(value) {
  return /^\d{14}$/.test(sanitizeSiret(value))
}

export function isValidOptionalUrl(value) {
  const v = String(value || '').trim()
  if (!v) return true
  try {
    const url = new URL(v.startsWith('http') ? v : `https://${v}`)
    return Boolean(url.hostname.includes('.'))
  } catch {
    return false
  }
}

/**
 * Validation formulaire profil / pré-inscription.
 * @returns {{ ok: boolean, errors: Record<string, string>, message: string|null }}
 */
export function validateOrgProfileForm(form, { requireApproval = false } = {}) {
  const errors = {}

  if (!String(form.orgName || form.name || '').trim()) {
    errors.orgName = "Le nom de l'auto-école est obligatoire."
  }

  const managerName = String(form.managerName || '').trim()
  const hasSplitManager =
    String(form.managerFirstName || '').trim() && String(form.managerLastName || '').trim()
  if (!managerName && !hasSplitManager) {
    errors.managerName = 'Le nom du gérant est obligatoire.'
  }

  if (!String(form.address || '').trim()) {
    errors.address = "L'adresse est obligatoire."
  }

  const postal = sanitizePostalCode(form.postalCode || form.postal_code)
  if (!isValidPostalCode(postal)) {
    errors.postalCode = 'Le code postal doit contenir exactement 5 chiffres.'
  }

  if (!String(form.city || '').trim()) {
    errors.city = 'La ville est obligatoire.'
  }

  if (!isValidEmail(form.email)) {
    errors.email = "L'e-mail doit être valide."
  }

  if (!isValidFrenchPhone(form.phone)) {
    errors.phone = 'Téléphone invalide (ex. 06 12 34 56 78 ou 01 23 45 67 89).'
  }

  const siret = sanitizeSiret(form.siret)
  if (!isValidSiret(siret)) {
    errors.siret = 'Le SIRET doit contenir exactement 14 chiffres (chiffres uniquement).'
  }

  const approval = String(form.prefectureApproval || form.prefecture_approval || '').trim()
  if (requireApproval && !approval) {
    errors.prefectureApproval = "Le numéro d'agrément préfectoral est obligatoire."
  }

  const website = form.website
  if (!isValidOptionalUrl(website)) {
    errors.website = 'Site internet invalide (ex. https://www.exemple.fr).'
  }

  const firstError = Object.values(errors)[0] || null
  return { ok: !firstError, errors, message: firstError }
}

/** Payload DB organizations (update / insert). */
export function toOrganizationPatch(form) {
  const managerName =
    String(form.managerName || '').trim()
    || [form.managerLastName, form.managerFirstName].filter(Boolean).map((s) => String(s).trim()).join(' ')

  const websiteRaw = String(form.website || '').trim()
  let website = websiteRaw || null
  if (website && !/^https?:\/\//i.test(website)) {
    website = `https://${website}`
  }

  return {
    name: String(form.orgName || form.name || '').trim(),
    manager_name: managerName || null,
    address: String(form.address || '').trim() || null,
    postal_code: sanitizePostalCode(form.postalCode || form.postal_code) || null,
    city: String(form.city || '').trim() || null,
    phone: String(form.phone || '').trim() || null,
    email: String(form.email || '').trim().toLowerCase() || null,
    siret: sanitizeSiret(form.siret) || null,
    prefecture_approval: String(form.prefectureApproval || form.prefecture_approval || '').trim() || null,
    website,
  }
}

/**
 * Forme stable pour PDF / attestations / factures.
 * Passer `logoUrl` (ex. via orgLogoUrl) pour résoudre l’URL publique du logo.
 * @param {object|null} organization
 * @param {{ managerNameFallback?: string, logoUrl?: string|null }} [opts]
 */
export function buildOrgDocumentProfile(organization, opts = {}) {
  if (!organization) return null
  return {
    organizationId: organization.id || null,
    companyName: organization.name || '',
    managerName: organization.manager_name || opts.managerNameFallback || '',
    streetAddress: organization.address || '',
    postalCode: organization.postal_code || '',
    city: organization.city || '',
    phone: organization.phone || '',
    email: organization.email || '',
    siret: organization.siret || '',
    approvalNumber: organization.prefecture_approval || '',
    website: organization.website || '',
    logoUrl: opts.logoUrl ?? null,
    logoStoragePath: organization.logo_storage_path || null,
    createdAt: organization.created_at || null,
    updatedAt: organization.updated_at || null,
  }
}
