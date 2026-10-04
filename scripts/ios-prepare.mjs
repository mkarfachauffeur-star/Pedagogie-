import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const iosDir = path.join(rootDir, 'ios')

function run(command, args) {
  const result = spawnSync(command, args, { cwd: rootDir, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!existsSync(iosDir)) {
  console.error(`
[ios-prepare] Le dossier ios/ n’existe pas. C’est pour ça que la commande échoue
et que Xcode ne s’ouvre pas. npm run ios:prepare ne lance pas Xcode.

Dans le terminal, dans le dossier du projet, lance dans cet ordre :

  npx cap add ios
  npm run ios:prepare
  npm run cap:open:ios
`)
  process.exit(1)
}

run('npm', ['run', 'build:capacitor'])
run('npx', ['cap', 'sync', 'ios'])
run('node', ['scripts/patch-ios-info-plist.mjs'])
run('node', ['scripts/copy-ios-privacy-manifest.mjs'])
run('npm', ['run', 'ios:icons'])

console.log(`
[ios-prepare] Préparation terminée.
Xcode ne s’ouvre pas tout seul. Lance maintenant :

  npm run cap:open:ios
`)
