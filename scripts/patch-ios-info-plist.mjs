/**
 * Applique les clés Info.plist requises pour Pedagogia Drive iOS.
 * Exécuté après `npx cap sync ios`.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const plistPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../ios/App/App/Info.plist',
)

if (!existsSync(plistPath)) {
  console.warn('[ios-plist] Info.plist introuvable — lancez d’abord `npm run cap:add:ios`.')
  process.exit(0)
}

let xml = readFileSync(plistPath, 'utf8')

const entries = [
  ['CFBundleDisplayName', 'Pedagogia Drive'],
  ['CFBundleName', 'Pedagogia Drive'],
  ['ITSAppUsesNonExemptEncryption', '<false/>'],
  ['UIViewControllerBasedStatusBarAppearance', '<true/>'],
  ['UIRequiresFullScreen', '<false/>'],
  ['NSCameraUsageDescription', 'Pedagogia Drive utilise l’appareil photo pour joindre des documents et pièces aux dossiers élèves.'],
  ['NSPhotoLibraryUsageDescription', 'Pedagogia Drive accède à vos photos pour importer des documents (pièces d’identité, justificatifs, autorisations).'],
  ['NSPhotoLibraryAddUsageDescription', 'Pedagogia Drive peut enregistrer des documents exportés dans votre photothèque si vous le demandez.'],
  ['NSMicrophoneUsageDescription', 'Pedagogia Drive n’utilise pas le micro. Cette autorisation n’est requise que si vous enregistrez une note vocale depuis l’appareil.'],
  ['NSLocationWhenInUseUsageDescription', 'Pedagogia Drive utilise votre position pendant vos trajets de conduite accompagnée (AAC) pour calculer automatiquement les kilomètres parcourus.'],
]

for (const [key, value] of entries) {
  const stringValue = value.startsWith('<') ? value : `<string>${value}</string>`
  const block = `    <key>${key}</key>\n    ${stringValue}\n`

  if (xml.includes(`<key>${key}</key>`)) {
    xml = xml.replace(
      new RegExp(`<key>${key}</key>\\s*(<string>[\\s\\S]*?</string>|<true/>|<false/>)`),
      block.trimEnd(),
    )
  } else {
    xml = xml.replace('</dict>\n</plist>', `${block}</dict>\n</plist>`)
  }
}

// iPhone : portrait uniquement (meilleure UX dashboard mobile)
xml = xml.replace(
  /<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/,
  `<key>UISupportedInterfaceOrientations</key>
\t<array>
\t\t<string>UIInterfaceOrientationPortrait</string>
\t</array>`,
)

writeFileSync(plistPath, xml)
console.log('[ios-plist] Info.plist mis à jour (permissions + App Store).')
