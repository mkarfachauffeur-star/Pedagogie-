import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(rootDir, 'ios-resources', 'PrivacyInfo.xcprivacy')
const destDir = path.join(rootDir, 'ios', 'App', 'App')
const dest = path.join(destDir, 'PrivacyInfo.xcprivacy')

if (!existsSync(source)) {
  console.warn('[ios-privacy] Manifest source introuvable :', source)
  process.exit(0)
}

if (!existsSync(path.join(rootDir, 'ios'))) {
  console.warn('[ios-privacy] Dossier ios/ introuvable — lancez d’abord `npx cap add ios` sur le Mac, ou poussez le projet iOS existant.')
  process.exit(0)
}

mkdirSync(destDir, { recursive: true })
copyFileSync(source, dest)
console.log('[ios-privacy] PrivacyInfo.xcprivacy copié dans ios/App/App/')
