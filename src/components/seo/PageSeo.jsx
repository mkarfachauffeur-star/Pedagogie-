import { useEffect } from 'react'
import {
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
  canonicalUrl,
} from '../../lib/seo'

const JSON_LD_ID = 'pd-json-ld'

function upsertMeta(attribute, key, content) {
  if (content == null || content === '') return
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) return
  let element = document.head.querySelector(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function removeJsonLd() {
  document.getElementById(JSON_LD_ID)?.remove()
}

function setJsonLd(data) {
  removeJsonLd()
  if (!data) return
  const script = document.createElement('script')
  script.id = JSON_LD_ID
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

export default function PageSeo({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd = null,
}) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const canonical = canonicalUrl(path)
    const robots = noindex ? 'noindex, nofollow' : 'index, follow'

    document.title = title

    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', robots)
    upsertMeta('name', 'author', SITE_NAME)

    upsertLink('canonical', canonical)

    upsertMeta('property', 'og:locale', SITE_LOCALE)
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:type', ogType)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', image)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', image)

    setJsonLd(jsonLdKey ? JSON.parse(jsonLdKey) : null)

    return () => {
      removeJsonLd()
    }
  }, [title, description, path, image, ogType, noindex, jsonLdKey])

  return null
}
