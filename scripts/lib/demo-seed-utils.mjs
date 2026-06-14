import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DEMO_EMAIL_DOMAIN = 'demo.pedagogia.local'

export const STUDENT_FIRST_NAMES = [
  'Lucas', 'Emma', 'Hugo', 'Léa', 'Nathan',
  'Chloé', 'Louis', 'Manon', 'Gabriel', 'Camille',
]

export const STUDENT_LAST_NAMES = [
  'Martin', 'Bernard', 'Petit', 'Robert', 'Richard',
  'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon',
]

export function loadEnvFiles() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
  for (const name of ['.env', '.env.local']) {
    try {
      const text = readFileSync(join(root, name), 'utf8')
      for (const line of text.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq <= 0) continue
        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = value
      }
    } catch {
      // fichier absent
    }
  }
}

export function requireSupabaseAdmin() {
  loadEnvFiles()
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Variables manquantes : SUPABASE_URL (ou VITE_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY.\n'
      + 'Ajoutez-les dans .env puis relancez le script.',
    )
  }
  return { url, serviceKey }
}

export function generateTempPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatNamePart(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateFileNumber(admin, orgId, lastName, firstName, offset = 0) {
  const year = new Date().getFullYear()
  const { count } = await admin
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const seq = String((count || 0) + 1 + offset).padStart(3, '0')
  const base = `PD-${year}-${seq}`
  return [base, formatNamePart(lastName), formatNamePart(firstName)].filter(Boolean).join('-')
}

export function buildDemoOrgsConfig() {
  return [
    {
      key: 'alpha',
      name: 'Auto-École Alpha (Demo)',
      siret: '11111111100011',
      prefectureApproval: 'AGR-PREF-ALPHA-2024',
      city: 'Lyon',
      manager: { firstName: 'Marc', lastName: 'Gérard' },
      secretary: { firstName: 'Sophie', lastName: 'Blanc' },
      teachers: [
        { firstName: 'Julien', lastName: 'Moreau' },
        { firstName: 'Claire', lastName: 'Fontaine' },
      ],
    },
    {
      key: 'beta',
      name: 'Auto-École Beta (Demo)',
      siret: '22222222200022',
      prefectureApproval: 'AGR-PREF-BETA-2024',
      city: 'Marseille',
      manager: { firstName: 'Paul', lastName: 'Renard' },
      secretary: { firstName: 'Julie', lastName: 'Mercier' },
      teachers: [
        { firstName: 'Thomas', lastName: 'Garnier' },
        { firstName: 'Élise', lastName: 'Chevalier' },
      ],
    },
  ]
}

export function demoEmail(orgKey, role, index = null) {
  if (role === 'manager') return `${orgKey}.gerant@${DEMO_EMAIL_DOMAIN}`
  if (role === 'secretary') return `${orgKey}.secretaire@${DEMO_EMAIL_DOMAIN}`
  if (role === 'teacher') return `${orgKey}.enseignant${index}@${DEMO_EMAIL_DOMAIN}`
  if (role === 'student') return `${orgKey}.eleve${String(index).padStart(2, '0')}@${DEMO_EMAIL_DOMAIN}`
  return `${orgKey}.${role}@${DEMO_EMAIL_DOMAIN}`
}

export function roleLabel(role) {
  const labels = {
    manager: 'Gérant',
    secretary: 'Secrétaire',
    teacher: 'Enseignant',
    student: 'Élève',
  }
  return labels[role] || role
}

export function writeCredentialsReport(accounts, extra = {}) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const outDir = join(root, 'scripts/output')
  mkdirSync(outDir, { recursive: true })

  const jsonPath = join(outDir, 'demo-credentials.json')
  writeFileSync(jsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), accounts, ...extra }, null, 2)}\n`)

  const mdLines = [
    '# Comptes de démonstration PEDAGOGIA DRIVE',
    '',
    `Généré le ${new Date().toLocaleString('fr-FR')}`,
    '',
    '| Prénom | Nom | Email | Rôle | Auto-école | Mot de passe temporaire |',
    '| --- | --- | --- | --- | --- | --- |',
  ]

  accounts.forEach((account) => {
    mdLines.push(
      `| ${account.firstName} | ${account.lastName} | ${account.email} | ${account.roleLabel} | ${account.organization} | \`${account.password}\` |`,
    )
  })

  mdLines.push('')
  mdLines.push('> Conservez ce fichier en local. Ne le commitez pas.')
  const mdPath = join(outDir, 'demo-credentials.md')
  writeFileSync(mdPath, `${mdLines.join('\n')}\n`)

  return { jsonPath, mdPath }
}

export function printCredentialsTable(accounts) {
  console.log('\n=== COMPTES DE DÉMONSTRATION ===\n')
  console.table(accounts.map((account) => ({
    Prénom: account.firstName,
    Nom: account.lastName,
    Email: account.email,
    Rôle: account.roleLabel,
    'Auto-école': account.organization,
    'Mot de passe': account.password,
  })))
}
