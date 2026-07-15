import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { BLOG_POSTS } from '../src/data/blog/posts/index.js'

const SITE_URL = 'https://www.pedagogia-drive.fr'
const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public')

const staticPages = [
  { path: '/', changeFrequency: 'weekly', priority: '1.0' },
  { path: '/livret-numerique-auto-ecole', changeFrequency: 'weekly', priority: '0.95' },
  { path: '/login', changeFrequency: 'monthly', priority: '0.8' },
  { path: '/contact', changeFrequency: 'monthly', priority: '0.8' },
  { path: '/mentions-legales', changeFrequency: 'yearly', priority: '0.5' },
  { path: '/politique-confidentialite', changeFrequency: 'yearly', priority: '0.5' },
  { path: '/cgu', changeFrequency: 'yearly', priority: '0.5' },
  { path: '/cgv', changeFrequency: 'yearly', priority: '0.5' },
  { path: '/cookies', changeFrequency: 'yearly', priority: '0.5' },
]

const blogPages = BLOG_POSTS.map((post) => ({
  path: `/blog/${post.slug}`,
  changeFrequency: 'monthly',
  priority: '0.7',
  lastModified: post.publishedAt,
}))

const lastModified = new Date().toISOString()

function toLoc(routePath) {
  return routePath === '/' ? `${SITE_URL}/` : `${SITE_URL}${routePath}`
}

function buildUrlEntry({ path: routePath, changeFrequency, priority, lastModified: customLastMod }) {
  const mod = customLastMod ? new Date(customLastMod).toISOString() : lastModified
  return `  <url>
    <loc>${toLoc(routePath)}</loc>
    <lastmod>${mod}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

const urlEntries = [...staticPages, ...blogPages].map(buildUrlEntry).join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`

writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8')

console.log(`[sitemap] ${staticPages.length + blogPages.length} URLs générées`)
