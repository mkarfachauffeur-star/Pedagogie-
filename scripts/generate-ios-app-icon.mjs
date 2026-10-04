import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const iosDir = path.join(rootDir, 'ios')
const iconSource = path.join(rootDir, 'public', 'brand', 'pedagogia-drive-mark.svg')

if (!existsSync(iosDir)) {
  console.warn('[ios-icons] Dossier ios/ introuvable — icônes non générées.')
  process.exit(0)
}

if (!existsSync(iconSource)) {
  console.warn('[ios-icons] Logo introuvable :', iconSource)
  process.exit(0)
}

const result = spawnSync(
  'npx',
  [
    '@capacitor/assets',
    'generate',
    '--ios',
    '--iconBackgroundColor',
    '#2563eb',
    '--iconBackgroundColorDark',
    '#1e3a8a',
    '--splashBackgroundColor',
    '#2563eb',
    '--splashBackgroundColorDark',
    '#1e3a8a',
    '--assetPath',
    'public/brand',
  ],
  { cwd: rootDir, stdio: 'inherit' },
)

if (result.status !== 0) {
  console.warn('[ios-icons] Génération Capacitor Assets incomplète — vous pouvez poser l’icône manuellement dans Xcode.')
  process.exit(0)
}

console.log('[ios-icons] Icônes iOS générées.')
