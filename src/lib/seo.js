import { MARKETING_FAQ } from './marketingContent'

export const SITE_URL = 'https://www.pedagogia-drive.fr'
export const SITE_NAME = 'Pedagogia Drive'
export const SITE_LOCALE = 'fr_FR'
export const SITE_LANGUAGE = 'fr'
/** Logo carré utilisé par Google (JSON-LD Organization, favicons PWA). */
export const SITE_LOGO_SQUARE = `${SITE_URL}/android-chrome-512x512.png`
/** Image Open Graph / Twitter (1200×630). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630
export const DEFAULT_OG_IMAGE_ALT =
  'Pedagogia Drive — logiciel tout-en-un pour auto-écoles'
export const CONTACT_EMAIL = 'contact@pedagogia-drive.fr'

export const SEO_KEYWORDS =
  'logiciel auto école, SaaS auto école, livret numérique, REMC, suivi pédagogique, gestion élèves, messagerie auto école, planning auto école'

export const SEO_DEFAULT_TITLE =
  'Pedagogia Drive | Logiciel tout-en-un pour auto-écoles — Bêta privée'
export const SEO_DEFAULT_DESCRIPTION =
  'Gérez vos élèves, enseignants, livrets pédagogiques, documents, messagerie et suivi REMC depuis une seule plateforme. Demandez une démonstration gratuite — essai 30 jours.'

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
      'Mentions légales de Pedagogia Drive : éditeur, hébergeur, propriété intellectuelle, responsabilité et contact.',
    ogType: 'website',
  },
  politiqueConfidentialite: {
    path: '/politique-confidentialite',
    title: 'Politique de confidentialité | Pedagogia Drive — RGPD',
    description:
      'Politique de confidentialité Pedagogia Drive : données collectées, finalités, durée de conservation, droits RGPD et contact DPO.',
    ogType: 'website',
  },
  confidentialite: {
    path: '/politique-confidentialite',
    title: 'Politique de confidentialité | Pedagogia Drive — RGPD',
    description:
      'Politique de confidentialité Pedagogia Drive : protection des données des auto-écoles, élèves, enseignants et secrétariat. Conforme au RGPD.',
    ogType: 'website',
  },
  cgu: {
    path: '/cgu',
    title: 'CGU | Pedagogia Drive — Conditions générales d\'utilisation',
    description:
      'Conditions générales d\'utilisation de Pedagogia Drive : accès, comptes, responsabilités, propriété intellectuelle et résiliation.',
    ogType: 'website',
  },
  cgv: {
    path: '/cgv',
    title: 'CGV | Pedagogia Drive — Conditions générales de vente',
    description:
      'Conditions générales de vente Pedagogia Drive : abonnements, essai gratuit, Starter, Premium, paiement et résiliation.',
    ogType: 'website',
  },
  cookies: {
    path: '/cookies',
    title: 'Politique de cookies | Pedagogia Drive',
    description:
      'Politique de cookies Pedagogia Drive : cookies techniques, mesure d\'audience, durée de conservation et gestion des préférences.',
    ogType: 'website',
  },
  blog: {
    path: '/blog',
    title: 'Blog | Pedagogia Drive — Livret numérique & auto-école',
    description:
      'Blog Pedagogia Drive : guides SEO pour gérants d\'auto-école sur le livret numérique, le REMC, le suivi pédagogique, les QCM et la digitalisation.',
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
        url: SITE_LOGO_SQUARE,
        width: 512,
        height: 512,
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
    politiqueConfidentialite: { name: 'Politique de confidentialité', path: '/politique-confidentialite' },
    confidentialite: { name: 'Politique de confidentialité', path: '/politique-confidentialite' },
    cgu: { name: 'CGU', path: '/cgu' },
    cgv: { name: 'CGV', path: '/cgv' },
    cookies: { name: 'Politique de cookies', path: '/cookies' },
    blog: { name: 'Blog', path: '/blog' },
  }

  const current = labels[pageKey]
  if (!current) return [home]
  return [home, current]
}

export function breadcrumbsForBlogArticle(article) {
  return [
    { name: 'Accueil', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: article.title, path: `/blog/${article.slug}` },
  ]
}

export function buildBlogListJsonLd() {
  const page = SEO_PAGES.blog
  return buildPageJsonLd({
    path: page.path,
    title: page.title,
    description: page.description,
    breadcrumbTrail: breadcrumbsForPage('blog'),
  })
}

export function buildBlogArticleJsonLd(article) {
  const path = `/blog/${article.slug}`
  const url = canonicalUrl(path)
  const imageUrl = article.coverImage.startsWith('http')
    ? article.coverImage
    : `${SITE_URL}${article.coverImage}`

  const graph = [
    {
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      headline: article.title,
      description: article.metaDescription,
      image: imageUrl,
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      author: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: {
          '@type': 'ImageObject',
          url: SITE_LOGO_SQUARE,
          width: 512,
          height: 512,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
      },
      inLanguage: 'fr-FR',
      articleSection: article.category,
      url,
    },
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: article.title,
      description: article.metaDescription,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      inLanguage: 'fr-FR',
    },
  ]

  const breadcrumbs = breadcrumbListNode(breadcrumbsForBlogArticle(article))
  if (breadcrumbs) graph.push(breadcrumbs)

  if (article.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: article.faq.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
