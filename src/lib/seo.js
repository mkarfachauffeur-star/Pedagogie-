export const SITE_URL = 'https://pedagogia-drive.fr'
export const SITE_NAME = 'Pedagogia Drive'
export const SITE_LOCALE = 'fr_FR'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/pedagogia-drive-logo.png`
export const CONTACT_EMAIL = 'contact@pedagogia-drive.fr'

export const SEO_PAGES = {
  home: {
    path: '/',
    title: 'Pedagogia Drive — Livret numérique, REMC et logiciel auto-école',
    description:
      'Pedagogia Drive : livret numérique auto-école, suivi pédagogique REMC, QCU, messagerie et gestion auto-école. Application conçue pour moderniser l\'apprentissage de la conduite.',
    ogType: 'website',
  },
  login: {
    path: '/login',
    title: 'Connexion — Pedagogia Drive | Application auto-école',
    description:
      'Connectez-vous à Pedagogia Drive, votre espace livret numérique, suivi pédagogique conduite et gestion auto-école sécurisé.',
    ogType: 'website',
  },
  contact: {
    path: '/contact',
    title: 'Contact — Pedagogia Drive | Demande de démonstration',
    description:
      'Contactez Pedagogia Drive pour une démonstration de notre logiciel auto-école : livret numérique, REMC, suivi pédagogique et gestion des élèves.',
    ogType: 'website',
  },
  mentionsLegales: {
    path: '/mentions-legales',
    title: 'Mentions légales — Pedagogia Drive',
    description:
      'Mentions légales du site Pedagogia Drive, plateforme pédagogique numérique dédiée aux auto-écoles.',
    ogType: 'website',
  },
  confidentialite: {
    path: '/confidentialite',
    title: 'Politique de confidentialité — Pedagogia Drive',
    description:
      'Politique de confidentialité et protection des données personnelles sur Pedagogia Drive, application auto-école conforme au RGPD.',
    ogType: 'website',
  },
}

export function canonicalUrl(path = '/') {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}

export function buildBreadcrumbJsonLd(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  }
}

export function buildHomeJsonLd() {
  const organizationId = `${SITE_URL}/#organization`
  const websiteId = `${SITE_URL}/#website`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: SITE_NAME,
        url: SITE_URL,
        logo: DEFAULT_OG_IMAGE,
        email: CONTACT_EMAIL,
        description:
          'Pedagogia Drive développe un livret numérique et un logiciel de gestion auto-école pour le suivi pédagogique REMC.',
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
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, iOS, Android',
        url: SITE_URL,
        description:
          'Application auto-école : livret numérique, suivi pédagogique conduite, REMC, QCU et gestion des élèves.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
          availability: 'https://schema.org/PreOrder',
        },
        author: { '@id': organizationId },
      },
    ],
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
