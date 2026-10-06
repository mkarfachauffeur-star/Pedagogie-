import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const project = path.join(rootDir, 'ios', 'App', 'App.xcodeproj')
const xcodeApp = '/Applications/Xcode.app'

if (!existsSync(project)) {
  console.error(`
[ios-open] Projet Xcode introuvable.

Dans le dossier du projet, lance d’abord :

  npx cap add ios
  npm run ios:prepare
`)
  process.exit(1)
}

if (process.platform !== 'darwin') {
  console.log(`[ios-open] Sur ton Mac, lance :

  open -a Xcode "${project}"
`)
  process.exit(0)
}

if (!existsSync(xcodeApp)) {
  console.error(`
[ios-open] Xcode n’est pas installé.
Ouvre l’App Store sur le Mac, installe « Xcode », ouvre-le une fois, puis relance :

  npm run cap:open:ios
`)
  process.exit(1)
}

const result = spawnSync('open', ['-a', 'Xcode', project], { stdio: 'inherit' })
if (result.status !== 0) {
  console.error('[ios-open] Impossible d’ouvrir Xcode. Essaie manuellement :')
  console.error(`  open -a Xcode "${project}"`)
  process.exit(result.status ?? 1)
}

console.log('[ios-open] Xcode s’ouvre avec Pedagogia Drive. Regarde le Dock.')
