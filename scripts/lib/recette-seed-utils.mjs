import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RECETTE_EMAIL_DOMAIN = 'recette.pedagogia.local'
export const RECETTE_PASSWORD = 'Recette2026!'
export const RECETTE_ORG_PREFIX = 'Auto-École Recette'

export const FRENCH_CITIES = [
  { city: 'Lyon', postal: '69003', dept: '69' },
  { city: 'Marseille', postal: '13008', dept: '13' },
  { city: 'Toulouse', postal: '31000', dept: '31' },
  { city: 'Bordeaux', postal: '33000', dept: '33' },
  { city: 'Nantes', postal: '44000', dept: '44' },
  { city: 'Lille', postal: '59000', dept: '59' },
  { city: 'Strasbourg', postal: '67000', dept: '67' },
  { city: 'Montpellier', postal: '34000', dept: '34' },
  { city: 'Rennes', postal: '35000', dept: '35' },
  { city: 'Reims', postal: '51100', dept: '51' },
  { city: 'Grenoble', postal: '38000', dept: '38' },
  { city: 'Dijon', postal: '21000', dept: '21' },
  { city: 'Angers', postal: '49000', dept: '49' },
  { city: 'Tours', postal: '37000', dept: '37' },
  { city: 'Clermont-Ferrand', postal: '63000', dept: '63' },
  { city: 'Le Havre', postal: '76600', dept: '76' },
  { city: 'Amiens', postal: '80000', dept: '80' },
  { city: 'Besançon', postal: '25000', dept: '25' },
  { city: 'Perpignan', postal: '66000', dept: '66' },
  { city: 'Metz', postal: '57000', dept: '57' },
]

export const MANAGER_FIRST = ['Régis', 'Philippe', 'Sandrine', 'Laurent', 'Isabelle', 'Christophe', 'Valérie', 'Stéphane', 'Nathalie', 'Frédéric', 'Céline', 'Olivier', 'Marie', 'Antoine', 'Caroline', 'David', 'Émilie', 'Julien', 'Audrey', 'Nicolas']
export const MANAGER_LAST = ['Dupont', 'Moreau', 'Lefèvre', 'Girard', 'Bonnet', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Faure', 'Andre', 'Mercier', 'Blanc', 'Guerin', 'Boyer', 'Garnier', 'Chevalier', 'Francois']

export const SECRETARY_FIRST = ['Sophie', 'Julie', 'Camille', 'Laura', 'Marine', 'Claire', 'Élodie', 'Pauline', 'Amélie', 'Charlotte', 'Manon', 'Lucie', 'Anaïs', 'Océane', 'Margaux', 'Justine', 'Léa', 'Chloé', 'Emma', 'Sarah']
export const SECRETARY_LAST = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel']

export const TEACHER_FIRST = ['Thomas', 'Nicolas', 'Pierre', 'Marc', 'Jean', 'Alain', 'Michel', 'Patrick', 'Bruno', 'Sébastien', 'François', 'Guillaume', 'Alexandre', 'Maxime', 'Benjamin', 'Florian', 'Damien', 'Vincent', 'Jérôme', 'Fabien', 'Karim', 'Youssef', 'Mehdi', 'Samir', 'Lucas', 'Hugo', 'Arthur', 'Enzo', 'Raphaël', 'Louis']
export const TEACHER_LAST = ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Nguyen', 'Tran', 'Pham', 'Le', 'Hoang', 'Diallo', 'Traore', 'Koné', 'Camara', 'Sy', 'Benali', 'Haddad', 'Amrani', 'Bouchet', 'Caron', 'Colin', 'Denis', 'Dupuis', 'Fabre', 'Gauthier']

export const STUDENT_FIRST = [
  'Lucas', 'Emma', 'Hugo', 'Léa', 'Nathan', 'Chloé', 'Louis', 'Manon', 'Gabriel', 'Camille',
  'Jules', 'Inès', 'Arthur', 'Jade', 'Adam', 'Louise', 'Raphaël', 'Alice', 'Paul', 'Lina',
  'Maël', 'Rose', 'Noah', 'Zoé', 'Ethan', 'Anna', 'Tom', 'Julia', 'Liam', 'Mila',
]

export const STUDENT_LAST = [
  'Martin', 'Bernard', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon',
  'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet',
  'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Faure', 'Andre', 'Mercier',
]

export const ORG_SUFFIXES = [
  'Les Alpes', 'Le Volant', 'Conduite Plus', 'Route Sécurité', 'Permis Express',
  'Auto Formation', 'Cap Conduite', 'Liberté Route', 'Espace Permis', 'Horizon Conduite',
  'Pro Conduite', 'Elite Permis', 'Start Drive', 'Conduite Active', 'Permis Pro',
  'Auto École du Centre', 'Conduite Facile', 'Route Libre', 'Permis & Co', 'Drive Academy',
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

export function recetteEmail(orgKey, role, index = null) {
  if (role === 'manager') return `${orgKey}.gerant@${RECETTE_EMAIL_DOMAIN}`
  if (role === 'secretary') return `${orgKey}.secretaire${index}@${RECETTE_EMAIL_DOMAIN}`
  if (role === 'teacher') return `${orgKey}.enseignant${index}@${RECETTE_EMAIL_DOMAIN}`
  if (role === 'student') return `${orgKey}.eleve${String(index).padStart(2, '0')}@${RECETTE_EMAIL_DOMAIN}`
  return `${orgKey}.${role}@${RECETTE_EMAIL_DOMAIN}`
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

/** @param {{ orgCount?: number }} opts */
export function buildRecetteOrgsConfig(opts = {}) {
  const orgCount = opts.orgCount ?? 20
  const configs = []

  for (let i = 0; i < orgCount; i += 1) {
    const num = String(i + 1).padStart(2, '0')
    const key = `recette${num}`
    const loc = FRENCH_CITIES[i % FRENCH_CITIES.length]
    const suffix = ORG_SUFFIXES[i % ORG_SUFFIXES.length]
    let planCode = 'trial'
    if (i >= 7 && i < 13) planCode = 'starter'
    if (i >= 13) planCode = 'premium'

    configs.push({
      key,
      name: `${RECETTE_ORG_PREFIX} ${suffix} — ${loc.city}`,
      siret: `${String(10000000000000 + i * 1111111).slice(0, 14)}`,
      prefectureApproval: `AGR-PREF-${loc.dept}-REC-${num}`,
      city: loc.city,
      postalCode: loc.postal,
      planCode,
      manager: {
        firstName: MANAGER_FIRST[i % MANAGER_FIRST.length],
        lastName: MANAGER_LAST[i % MANAGER_LAST.length],
      },
      secretaries: [
        { firstName: SECRETARY_FIRST[i % SECRETARY_FIRST.length], lastName: SECRETARY_LAST[i % SECRETARY_LAST.length] },
        { firstName: SECRETARY_FIRST[(i + 5) % SECRETARY_FIRST.length], lastName: SECRETARY_LAST[(i + 7) % SECRETARY_LAST.length] },
      ],
      teachers: [1, 2, 3, 4].map((t) => ({
        firstName: TEACHER_FIRST[(i * 4 + t - 1) % TEACHER_FIRST.length],
        lastName: TEACHER_LAST[(i * 4 + t - 1) % TEACHER_LAST.length],
        index: t,
      })),
      studentsPerOrg: 30,
    })
  }

  return configs
}

export function writeRecetteCredentialsReport(accounts, extra = {}) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const outDir = join(root, 'scripts/output')
  mkdirSync(outDir, { recursive: true })

  const jsonPath = join(outDir, 'recette-credentials.json')
  writeFileSync(jsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), sharedPassword: RECETTE_PASSWORD, accounts, ...extra }, null, 2)}\n`)

  const sampleAccounts = accounts.filter((a) => a.role !== 'student' || Number(a.studentIndex) <= 3)
  const mdLines = [
    '# Comptes recette PEDAGOGIA DRIVE',
    '',
    `Généré le ${new Date().toLocaleString('fr-FR')}`,
    '',
    `Mot de passe commun recette : \`${RECETTE_PASSWORD}\``,
    '',
    '## Échantillon comptes staff (tous les mots de passe identiques)',
    '',
    '| Prénom | Nom | Email | Rôle | Auto-école |',
    '| --- | --- | --- | --- | --- |',
  ]

  sampleAccounts.forEach((account) => {
    mdLines.push(
      `| ${account.firstName} | ${account.lastName} | ${account.email} | ${account.roleLabel} | ${account.organization} |`,
    )
  })

  mdLines.push('', `> Total : ${accounts.length} comptes. Fichier JSON complet : recette-credentials.json`)
  const mdPath = join(outDir, 'recette-credentials.md')
  writeFileSync(mdPath, `${mdLines.join('\n')}\n`)

  return { jsonPath, mdPath }
}

export async function runPool(items, concurrency, worker) {
  const results = []
  let index = 0

  async function next() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await worker(items[current], current)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => next())
  await Promise.all(workers)
  return results
}
