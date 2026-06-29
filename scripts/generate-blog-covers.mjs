import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BLOG_POSTS } from '../src/data/blog/posts/index.js'
import { getCategoryLabel } from '../src/data/blog/categories.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COVERS_DIR = join(__dirname, '../public/blog/covers')

const W = 1600
const H = 1000

const CATEGORY_COLORS = {
  'livret-numerique': ['#3B82F6', '#1D4ED8'],
  remc: ['#10B981', '#047857'],
  'auto-ecole': ['#8B5CF6', '#6D28D9'],
  enseignants: ['#06B6D4', '#0891B2'],
  eleves: ['#F59E0B', '#D97706'],
  pedagogie: ['#F43F5E', '#E11D48'],
  'securite-routiere': ['#EF4444', '#DC2626'],
  digitalisation: ['#6366F1', '#4338CA'],
}

function escapeSvg(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrapTitle(title, maxLen = 26) {
  const words = title.replace(/\.$/, '').split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxLen && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 4)
}

function categoryIcon(category) {
  const icons = {
    'livret-numerique': `
      <rect x="70" y="40" width="160" height="220" rx="18" fill="white" fill-opacity="0.95"/>
      <rect x="92" y="72" width="116" height="10" rx="5" fill="#3B82F6" fill-opacity="0.35"/>
      <rect x="92" y="96" width="96" height="8" rx="4" fill="#3B82F6" fill-opacity="0.25"/>
      <rect x="92" y="118" width="108" height="8" rx="4" fill="#3B82F6" fill-opacity="0.25"/>
      <rect x="92" y="140" width="84" height="8" rx="4" fill="#3B82F6" fill-opacity="0.25"/>
      <circle cx="150" cy="210" r="22" fill="#3B82F6" fill-opacity="0.2"/>
      <path d="M142 210h16M150 202v16" stroke="#1D4ED8" stroke-width="4" stroke-linecap="round"/>
    `,
    remc: `
      <circle cx="150" cy="150" r="110" fill="white" fill-opacity="0.12"/>
      <circle cx="150" cy="150" r="78" fill="white" fill-opacity="0.95"/>
      <circle cx="150" cy="150" r="52" fill="none" stroke="#10B981" stroke-width="10"/>
      <circle cx="150" cy="150" r="18" fill="#047857"/>
      <path d="M150 98v34l24 24" stroke="#047857" stroke-width="8" stroke-linecap="round"/>
    `,
    'auto-ecole': `
      <rect x="55" y="120" width="190" height="120" rx="14" fill="white" fill-opacity="0.95"/>
      <rect x="75" y="70" width="150" height="70" rx="10" fill="white" fill-opacity="0.85"/>
      <rect x="95" y="88" width="36" height="36" rx="6" fill="#8B5CF6" fill-opacity="0.35"/>
      <rect x="143" y="88" width="36" height="36" rx="6" fill="#8B5CF6" fill-opacity="0.35"/>
      <rect x="191" y="88" width="24" height="36" rx="6" fill="#8B5CF6" fill-opacity="0.35"/>
      <rect x="115" y="160" width="70" height="80" rx="8" fill="#6D28D9" fill-opacity="0.25"/>
      <circle cx="215" cy="210" r="28" fill="#6D28D9" fill-opacity="0.2"/>
      <circle cx="215" cy="210" r="16" fill="#6D28D9" fill-opacity="0.35"/>
    `,
    enseignants: `
      <circle cx="150" cy="95" r="42" fill="white" fill-opacity="0.95"/>
      <path d="M75 250c8-52 48-82 75-82s67 30 75 82" fill="white" fill-opacity="0.95"/>
      <rect x="195" y="130" width="70" height="100" rx="12" fill="white" fill-opacity="0.85"/>
      <path d="M210 155h40M210 175h32M210 195h36" stroke="#0891B2" stroke-width="6" stroke-linecap="round"/>
    `,
    eleves: `
      <path d="M60 250 L150 60 L240 250 Z" fill="white" fill-opacity="0.15"/>
      <rect x="95" y="175" width="110" height="14" rx="4" fill="white" fill-opacity="0.95"/>
      <circle cx="150" cy="130" r="50" fill="none" stroke="white" stroke-width="14" stroke-opacity="0.95"/>
      <path d="M115 250 L150 175 L185 250" fill="white" fill-opacity="0.95"/>
    `,
    pedagogie: `
      <rect x="60" y="200" width="180" height="16" rx="8" fill="white" fill-opacity="0.25"/>
      <rect x="80" y="160" width="40" height="56" rx="8" fill="white" fill-opacity="0.95"/>
      <rect x="130" y="120" width="40" height="96" rx="8" fill="white" fill-opacity="0.95"/>
      <rect x="180" y="90" width="40" height="126" rx="8" fill="white" fill-opacity="0.95"/>
      <path d="M80 216h140" stroke="white" stroke-opacity="0.5" stroke-width="4" stroke-dasharray="8 8"/>
    `,
    'securite-routiere': `
      <path d="M150 50 L230 230 H70 Z" fill="white" fill-opacity="0.95"/>
      <rect x="132" y="95" width="36" height="36" rx="6" fill="#DC2626"/>
      <rect x="132" y="145" width="36" height="36" rx="6" fill="#FBBF24"/>
      <circle cx="150" cy="210" r="14" fill="#DC2626"/>
    `,
    digitalisation: `
      <rect x="55" y="85" width="120" height="150" rx="12" fill="white" fill-opacity="0.95"/>
      <rect x="75" y="110" width="80" height="8" rx="4" fill="#6366F1" fill-opacity="0.35"/>
      <rect x="75" y="130" width="64" height="8" rx="4" fill="#6366F1" fill-opacity="0.25"/>
      <rect x="75" y="150" width="72" height="8" rx="4" fill="#6366F1" fill-opacity="0.25"/>
      <path d="M195 110c30-10 55 10 55 40s-25 50-55 40" fill="none" stroke="white" stroke-width="10" stroke-opacity="0.9"/>
      <ellipse cx="250" cy="150" rx="42" ry="34" fill="white" fill-opacity="0.85"/>
      <path d="M230 150h40M250 130v40" stroke="#4338CA" stroke-width="5" stroke-linecap="round"/>
    `,
  }
  return icons[category] ?? icons['livret-numerique']
}

function makeCoverSvg(title, category) {
  const [c1, c2] = CATEGORY_COLORS[category] || CATEGORY_COLORS['livret-numerique']
  const lines = wrapTitle(title)
  const categoryLabel = getCategoryLabel(category)
  const titleStartY = lines.length <= 2 ? 380 : lines.length === 3 ? 340 : 300
  const tspans = lines
    .map((line, index) => `<tspan x="100" dy="${index === 0 ? 0 : 52}">${escapeSvg(line)}</tspan>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeSvg(title)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="panel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="white" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="white" stop-opacity="0.06"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1350" cy="180" r="220" fill="white" fill-opacity="0.07"/>
  <circle cx="200" cy="860" r="160" fill="white" fill-opacity="0.05"/>
  <rect x="980" y="120" width="520" height="760" rx="36" fill="url(#panel)" stroke="white" stroke-opacity="0.15"/>
  <g transform="translate(1080, 250)" filter="url(#soft)">
    ${categoryIcon(category)}
  </g>
  <rect x="100" y="130" rx="20" width="${Math.min(categoryLabel.length * 14 + 48, 420)}" height="44" fill="white" fill-opacity="0.15"/>
  <text x="124" y="160" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" letter-spacing="0.08em">${escapeSvg(categoryLabel.toUpperCase())}</text>
  <text x="100" y="${titleStartY}" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" letter-spacing="-0.02em">${tspans}</text>
  <text x="100" y="920" fill="white" fill-opacity="0.88" font-family="system-ui, sans-serif" font-size="26" font-weight="600">Pedagogia Drive</text>
  <text x="100" y="958" fill="white" fill-opacity="0.65" font-family="system-ui, sans-serif" font-size="20" font-weight="500">Blog auto-école · Livret numérique &amp; REMC</text>
</svg>`
}

mkdirSync(COVERS_DIR, { recursive: true })

for (const post of BLOG_POSTS) {
  writeFileSync(join(COVERS_DIR, `${post.slug}.svg`), makeCoverSvg(post.title, post.category), 'utf8')
}

console.log(`[blog-covers] ${BLOG_POSTS.length} couvertures régénérées (${W}x${H})`)
