import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const SITE_URL = 'https://www.pedagogia-drive.fr'
const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public')

const pages = [
  { path: '/', changeFrequency: 'weekly', priority: '1.0' },
  { path: '/login', changeFrequency: 'monthly', priority: '0.8' },
  { path: '/contact', changeFrequency: 'monthly', priority: '0.8' },
  { path: '/mentions-legales', changeFrequency: 'yearly', priority: '0.5' },
  { path: '/confidentialite', changeFrequency: 'yearly', priority: '0.5' },
]

const lastModified = new Date().toISOString()

function toLoc(routePath) {
  return routePath === '/' ? `${SITE_URL}/` : `${SITE_URL}${routePath}`
}

const urlEntries = pages
  .map(
    ({ path: routePath, changeFrequency, priority }) => `  <url>
    <loc>${toLoc(routePath)}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`

writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8')
