import { MARKETING_FAQ } from './marketingContent'

export const SITE_URL = 'https://www.pedagogia-drive.fr'
export const SITE_NAME = 'Pedagogia Drive'
export const SITE_LOCALE = 'fr_FR'
export const SITE_LANGUAGE = 'fr'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/android-chrome-512x512.png`
export const DEFAULT_OG_IMAGE_ALT = 'Pedagogia Drive — livret numérique pour auto-écoles'
export const CONTACT_EMAIL = 'contact@pedagogia-drive.fr'

export const SEO_KEYWORDS =
  'auto école, logiciel auto école, livret numérique, REMC, suivi pédagogique, enseignant conduite, application auto école, SaaS auto école'

export const SEO_DEFAULT_TITLE = 'Pedagogia Drive | Livret numérique pour auto-écoles'
export const SEO_DEFAULT_DESCRIPTION =
  'Pedagogia Drive est le livret numérique nouvelle génération destiné aux auto-écoles. QCM REMC, suivi pédagogique, messagerie, documents, gestion des élèves, enseignants et secrétariat.'

export const SEO_PAGES = {
  home: {
    path: '/',
    title: SEO_DEFAULT_TITLE,
    description: SEO_DEFAULT_DESCRIPTION,
    ogType: 'website',
  },
  login: {
    path: '/login',
    title: 'Connexion | Pedagogia Drive — Livret numérique auto-école',
    description:
      'Connectez-vous à Pedagogia Drive, le livret numérique pour auto-écoles : QCM REMC, suivi pédagogique, messagerie et gestion des élèves, enseignants et secrétariat.',
    ogType: 'website',
  },
  contact: {
    path: '/contact',
    title: 'Contact | Pedagogia Drive — Logiciel auto-école & démonstration',
    description:
      'Contactez Pedagogia Drive pour une démonstration du livret numérique auto-école : QCM REMC, suivi pédagogique, messagerie et gestion des équipes pédagogiques.',
    ogType: 'website',
  },
  mentionsLegales: {
    path: '/mentions-legales',
    title: 'Mentions légales | Pedagogia Drive',
    description:
      'Mentions légales de Pedagogia Drive, éditeur du livret numérique et logiciel SaaS auto-école pour le suivi pédagogique REMC.',
    ogType: 'website',
  },
  confidentialite: {
    path: '/confidentialite',
    title: 'Confidentialité | Pedagogia Drive — Protection des données',
    description:
      'Politique de confidentialité Pedagogia Drive : protection des données des auto-écoles, élèves, enseignants et secrétariat. Conforme au RGPD.',
    ogType: 'website',
  },
}

export function canonicalUrl(path = '/') {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}

function breadcrumbListNode(trail) {
  if (!trail?.length) return null
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  }
}

export function buildBreadcrumbJsonLd(trail) {
  const node = breadcrumbListNode(trail)
  if (!node) return null
  return {
    '@context': 'https://schema.org',
    ...node,
  }
}

export function buildFaqJsonLd(faqItems = MARKETING_FAQ) {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity: faqItems.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  }
}

export function buildHomeJsonLd(faqItems = MARKETING_FAQ) {
  const organizationId = `${SITE_URL}/#organization`
  const websiteId = `${SITE_URL}/#website`
  const softwareId = `${SITE_URL}/#software`
  const { title, description } = SEO_PAGES.home

  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: DEFAULT_OG_IMAGE,
      },
      email: CONTACT_EMAIL,
      areaServed: {
        '@type': 'Country',
        name: 'France',
      },
      description:
        'Pedagogia Drive édite un livret numérique et un logiciel SaaS auto-école pour le suivi pédagogique REMC.',
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'fr-FR',
      publisher: { '@id': organizationId },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: canonicalUrl('/'),
      name: title,
      description,
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId },
      inLanguage: 'fr-FR',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': softwareId,
      name: SITE_NAME,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      inLanguage: 'fr-FR',
      description,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        description: 'Sur devis',
      },
      provider: { '@id': organizationId },
      areaServed: {
        '@type': 'Country',
        name: 'France',
      },
    },
    buildFaqJsonLd(faqItems),
  ]

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

export function buildPageJsonLd({ path, title, description, breadcrumbTrail }) {
  const websiteId = `${SITE_URL}/#website`
  const graph = [
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl(path)}#webpage`,
      url: canonicalUrl(path),
      name: title,
      description,
      isPartOf: { '@id': websiteId },
      inLanguage: 'fr-FR',
    },
  ]

  const breadcrumbs = breadcrumbListNode(breadcrumbTrail)
  if (breadcrumbs) graph.push(breadcrumbs)

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

export function breadcrumbsForPage(pageKey) {
  const home = { name: 'Accueil', path: '/' }
  const labels = {
    login: { name: 'Connexion', path: '/login' },
    contact: { name: 'Contact', path: '/contact' },
    mentionsLegales: { name: 'Mentions légales', path: '/mentions-legales' },
    confidentialite: { name: 'Confidentialité', path: '/confidentialite' },
  }

  const current = labels[pageKey]
  if (!current) return [home]
  return [home, current]
}
