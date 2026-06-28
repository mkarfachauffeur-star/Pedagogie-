import { MARKETING_FAQ } from './marketingContent'

export const SITE_URL = 'https://pedagogia-drive.fr'
export const SITE_NAME = 'Pedagogia Drive'
export const SITE_LOCALE = 'fr_FR'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/pedagogia-drive-logo.png`
export const DEFAULT_OG_IMAGE_ALT = 'Logo Pedagogia Drive — livret numérique auto-école'
export const CONTACT_EMAIL = 'contact@pedagogia-drive.fr'

export const SEO_PAGES = {
  home: {
    path: '/',
    title: 'Pedagogia Drive | Livret numérique, logiciel & application auto-école REMC',
    description:
      'Plateforme pédagogique pour auto-écoles : livret numérique, suivi REMC, gestion des élèves et enseignants, QCM conduite. Outil conçu par un moniteur, 100 % en ligne.',
    ogType: 'website',
  },
  login: {
    path: '/login',
    title: 'Connexion | Pedagogia Drive — Application auto-école sécurisée',
    description:
      'Connectez-vous à Pedagogia Drive : livret numérique, suivi pédagogique conduite, REMC et gestion auto-école. Espace sécurisé pour élèves, enseignants et secrétariat.',
    ogType: 'website',
  },
  contact: {
    path: '/contact',
    title: 'Contact & démonstration | Pedagogia Drive — Logiciel auto-école',
    description:
      'Demandez une démonstration de Pedagogia Drive : logiciel auto-école, livret numérique REMC, gestion des élèves et application moniteur auto-école.',
    ogType: 'website',
  },
  mentionsLegales: {
    path: '/mentions-legales',
    title: 'Mentions légales | Pedagogia Drive — Plateforme auto-école',
    description:
      'Mentions légales de Pedagogia Drive, éditeur du livret numérique et logiciel de gestion pédagogique pour auto-écoles.',
    ogType: 'website',
  },
  confidentialite: {
    path: '/confidentialite',
    title: 'Confidentialité & RGPD | Pedagogia Drive — Application auto-école',
    description:
      'Politique de confidentialité Pedagogia Drive : protection des données élèves, enseignants et auto-écoles. Application conforme au RGPD.',
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
      description:
        'Pedagogia Drive édite un livret numérique auto-école et un logiciel de gestion pédagogique conforme au REMC.',
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'fr-FR',
      publisher: { '@id': organizationId },
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
      name: SITE_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      url: SITE_URL,
      description:
        'Application auto-école : livret numérique, suivi pédagogique REMC, QCM conduite, gestion des élèves et des enseignants.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/PreOrder',
      },
      author: { '@id': organizationId },
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
