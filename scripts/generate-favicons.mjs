import { execSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public')
const sourceLogo = path.join(publicDir, 'brand/pedagogia-drive-logo.png')

const rasterIcons = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512],
]

if (!existsSync(sourceLogo)) {
  console.warn('[favicons] Logo source introuvable, génération ignorée.')
  process.exit(0)
}

for (const [filename, size] of rasterIcons) {
  const target = path.join(publicDir, filename)
  execSync(`sips -z ${size} ${size} "${sourceLogo}" --out "${target}"`, { stdio: 'inherit' })
}

copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'))

console.log('[favicons] Icônes générées dans public/')
