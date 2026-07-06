/** Informations légales — variables Vite (voir .env.example). */

function env(key) {
  const value = import.meta.env[key]
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

/** Première variable définie parmi une liste (nouveau nom + alias legacy). */
function envFirst(keys, fallback = '') {
  for (const key of keys) {
    const value = env(key)
    if (value) return value
  }
  return fallback
}

function domainHostname(raw) {
  if (!raw) return 'pedagogia-drive.fr'
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      return new URL(raw).hostname.replace(/^www\./, '')
    } catch {
      return 'pedagogia-drive.fr'
    }
  }
  return raw.replace(/^www\./, '')
}

export const LEGAL_LAST_UPDATED = envFirst(['VITE_LEGAL_LAST_UPDATED'], '2026-07-03')

export const LEGAL_ENTITY = {
  companyName: envFirst(['VITE_LEGAL_COMPANY_NAME'], 'Pedagogia Drive'),
  tradeName: envFirst(['VITE_LEGAL_TRADE_NAME', 'VITE_LEGAL_COMPANY_NAME'], 'Pedagogia Drive'),
  ownerName: envFirst(['VITE_LEGAL_OWNER_NAME'], 'Mohamed Karfa'),
  legalForm: envFirst(['VITE_LEGAL_LEGAL_FORM'], ''),
  siren: envFirst(['VITE_LEGAL_SIREN'], '878488981'),
  siret: envFirst(['VITE_LEGAL_SIRET'], ''),
  vatNumber: envFirst(['VITE_LEGAL_VAT'], ''),
  addressLine1: envFirst(['VITE_LEGAL_ADDRESS_LINE1'], '44 RUE DU COMMERCE'),
  addressLine2: envFirst(['VITE_LEGAL_ADDRESS_LINE2'], ''),
  postalCode: envFirst(['VITE_LEGAL_POSTAL_CODE'], '3450'),
  city: envFirst(['VITE_LEGAL_CITY'], 'DUDELANGE'),
  country: envFirst(['VITE_LEGAL_COUNTRY'], 'Luxembourg'),
  email: envFirst(['VITE_LEGAL_EMAIL'], 'contact@pedagogia-drive.fr'),
  phone: envFirst(['VITE_LEGAL_PHONE'], ''),
  publicationDirector: envFirst(
    ['VITE_LEGAL_PUBLICATION_DIRECTOR', 'VITE_LEGAL_OWNER_NAME'],
    'Mohamed Karfa',
  ),
  dpoEmail:
    envFirst(['VITE_LEGAL_DPO_EMAIL']) ||
    envFirst(['VITE_LEGAL_EMAIL'], 'contact@pedagogia-drive.fr'),
}

export const LEGAL_SITE = {
  url: envFirst(['VITE_LEGAL_DOMAIN'], 'https://www.pedagogia-drive.fr'),
  hostname: domainHostname(envFirst(['VITE_LEGAL_DOMAIN'], 'https://www.pedagogia-drive.fr')),
}

export const LEGAL_HOSTING = {
  name: envFirst(['VITE_LEGAL_HOST', 'VITE_LEGAL_HOST_NAME'], 'Vercel Inc.'),
  addressLine1: envFirst(
    ['VITE_LEGAL_HOST_ADDRESS_LINE1', 'VITE_LEGAL_HOST_ADDRESS'],
    '440 N Barranca Ave #4133',
  ),
  addressLine2: envFirst(['VITE_LEGAL_HOST_ADDRESS_LINE2'], 'Covina, CA 91723'),
  country: envFirst(['VITE_LEGAL_HOST_COUNTRY'], 'États-Unis'),
  website: envFirst(['VITE_LEGAL_HOST_WEBSITE'], 'https://vercel.com'),
}

export function formatLegalHostingAddress(hosting = LEGAL_HOSTING) {
  return [hosting.addressLine1, hosting.addressLine2, hosting.country].filter(Boolean)
}

export const LEGAL_DOMAIN = {
  registrar: envFirst(['VITE_LEGAL_DOMAIN_PROVIDER', 'VITE_LEGAL_DOMAIN_REGISTRAR'], 'OVHcloud'),
  name: domainHostname(
    envFirst(['VITE_LEGAL_DOMAIN', 'VITE_LEGAL_DOMAIN_NAME'], 'https://www.pedagogia-drive.fr'),
  ),
  website: envFirst(
    ['VITE_LEGAL_DOMAIN_PROVIDER_WEBSITE', 'VITE_LEGAL_DOMAIN_WEBSITE'],
    'https://www.ovhcloud.com/fr/',
  ),
}

export const LEGAL_DATABASE = {
  provider: envFirst(['VITE_LEGAL_DATABASE', 'VITE_LEGAL_DB_PROVIDER'], 'Supabase Inc.'),
  region: envFirst(['VITE_LEGAL_DB_REGION'], 'Union européenne'),
  website: envFirst(['VITE_LEGAL_DATABASE_WEBSITE', 'VITE_LEGAL_DB_WEBSITE'], 'https://supabase.com'),
}

export const LEGAL_EMAIL_PROVIDER = {
  name: envFirst(['VITE_LEGAL_EMAIL_PROVIDER'], 'Resend'),
  website: envFirst(
    ['VITE_LEGAL_EMAIL_PROVIDER_WEBSITE', 'VITE_LEGAL_EMAIL_WEBSITE'],
    'https://resend.com',
  ),
}

export const LEGAL_ANALYTICS = {
  provider: envFirst(['VITE_LEGAL_ANALYTICS_PROVIDER'], 'Google Analytics 4'),
  website: envFirst(['VITE_LEGAL_ANALYTICS_WEBSITE'], 'https://analytics.google.com'),
}

export function formatLegalAddress(entity = LEGAL_ENTITY) {
  const postal =
    entity.country === 'Luxembourg' && entity.postalCode && !entity.postalCode.startsWith('L-')
      ? `L-${entity.postalCode}`
      : entity.postalCode

  return [
    entity.addressLine1,
    entity.addressLine2,
    [postal, entity.city].filter(Boolean).join(' '),
    entity.country,
  ].filter(Boolean)
}

export function legalMailto(email = LEGAL_ENTITY.email) {
  return `mailto:${email}`
}

export function hasLegalValue(value) {
  return Boolean(value && !String(value).startsWith('['))
}
