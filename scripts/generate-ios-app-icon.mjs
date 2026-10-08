/**
 * Icône et écran de lancement iOS à partir du visuel Pedagogia Drive.
 * Remplace la génération Capacitor Assets, qui posait un logo générique.
 */
import { existsSync } from 'node:fs'
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
  console.warn('[ios-icons] Visuel introuvable :', source)
  process.exit(0)
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

const iconPath = path.join(iosDir, 'App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
await sharp(await squareIcon(1024, 0.88)).toFile(iconPath)

const splash = await squareIcon(2732, 0.56)
const splashDir = path.join(iosDir, 'App/App/Assets.xcassets/Splash.imageset')
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await sharp(splash).toFile(path.join(splashDir, name))
}

console.log('[ios-icons] Icône et écran de lancement Pedagogia Drive écrits.')
