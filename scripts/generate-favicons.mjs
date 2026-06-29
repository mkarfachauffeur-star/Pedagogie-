import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(rootDir, 'public')

const sourceCandidates = [
  path.join(publicDir, 'brand/pedagogia-drive-logo.png'),
  path.join(rootDir, 'src/assets/brand/pedagogia-drive-logo.png'),
  path.join(publicDir, 'android-chrome-512x512.png'),
  path.join(publicDir, 'favicon-512x512.png'),
]

const rasterIcons = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512],
]

const requiredOutputs = rasterIcons.map(([filename]) => path.join(publicDir, filename))

function allFaviconsPresent() {
  return requiredOutputs.every((filePath) => existsSync(filePath)) && existsSync(path.join(publicDir, 'favicon.ico'))
}

const sourceLogo = sourceCandidates.find((candidate) => existsSync(candidate))

if (!sourceLogo) {
  if (allFaviconsPresent()) {
    console.warn('[favicons] Logo source introuvable — favicons existants conservés.')
    process.exit(0)
  }
  console.warn('[favicons] Logo source introuvable et favicons manquants, génération ignorée.')
  process.exit(0)
}

for (const [filename, size] of rasterIcons) {
  const target = path.join(publicDir, filename)
  await sharp(sourceLogo)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(target)
}

copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'))

console.log(`[favicons] Icônes générées dans public/ (source: ${path.relative(rootDir, sourceLogo)})`)
