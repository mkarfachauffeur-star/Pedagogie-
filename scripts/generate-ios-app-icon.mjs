/**
 * Icône et écran de lancement iOS à partir du visuel Pedagogia Drive.
 * Remplace la génération Capacitor Assets, qui posait un logo générique.
 */
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const iosDir = path.join(rootDir, 'ios')
const source = path.join(rootDir, 'public/brand/pedagogia-drive-app-icon.png')

if (!existsSync(iosDir)) {
  console.warn('[ios-icons] Dossier ios/ introuvable — icônes non générées.')
  process.exit(0)
}

if (!existsSync(source)) {
  console.error('[ios-icons] Visuel introuvable :', source)
  process.exit(1)
}

const trimmed = await sharp(source).trim({ threshold: 18 }).png().toBuffer()

async function squareIcon(size, scale) {
  const inner = Math.round(size * scale)
  const fitted = await sharp(trimmed)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .flatten({ background: '#000000' })
    .removeAlpha()
    .png()
    .toBuffer()
  const { width, height } = await sharp(fitted).metadata()
  const left = Math.floor((size - width) / 2)
  const top = Math.floor((size - height) / 2)
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: '#000000',
    },
  })
    .composite([{ input: fitted, left, top }])
    .flatten({ background: '#000000' })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer()
}

const iconDir = path.join(iosDir, 'App/App/Assets.xcassets/AppIcon.appiconset')
const iconPath = path.join(iconDir, 'AppIcon.png')
const legacyIcon = path.join(iconDir, 'AppIcon-512@2x.png')
// 0.64 : le mot PEDAGOGIA DRIVE reste dans la zone sûre du masque arrondi iOS.
const iconBuffer = await squareIcon(1024, 0.64)
await sharp(iconBuffer).toFile(iconPath)
if (legacyIcon !== iconPath && existsSync(legacyIcon)) rmSync(legacyIcon)

const { data, info } = await sharp(iconPath).raw().toBuffer({ resolveWithObject: true })
let minX = info.width
let minY = info.height
let maxX = 0
let maxY = 0
for (let y = 0; y < info.height; y += 2) {
  for (let x = 0; x < info.width; x += 2) {
    const index = (y * info.width + x) * info.channels
    if (data[index] + data[index + 1] + data[index + 2] <= 30) continue
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
}
const margin = Math.min(minX, minY, info.width - 1 - maxX, info.height - 1 - maxY)
if (info.width !== 1024 || info.height !== 1024 || info.channels !== 3 || margin < 140) {
  console.error('[ios-icons] AppIcon hors zone sûre', { width: info.width, height: info.height, channels: info.channels, margin })
  process.exit(1)
}
console.log('[ios-icons] Fichier utilisé par Xcode :', iconPath, `(marge ${margin}px)`)

const splash = await squareIcon(2732, 0.56)
const splashDir = path.join(iosDir, 'App/App/Assets.xcassets/Splash.imageset')
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await sharp(splash).toFile(path.join(splashDir, name))
}

console.log('[ios-icons] Icône et écran de lancement Pedagogia Drive écrits.')
