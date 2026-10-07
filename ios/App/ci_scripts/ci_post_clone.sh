#!/bin/sh
# Xcode Cloud : embarque le site à jour dans l’app iPhone avant l’archive.
set -eu

cd "$CI_PRIMARY_REPOSITORY_PATH"

if ! command -v node >/dev/null 2>&1; then
  brew install node
fi

# Évite un npm ci sans les outils de build quand NODE_ENV=production.
export NODE_ENV=development

npm ci

export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://watdeahravfccjdoseaf.supabase.co}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-sb_publishable_WrrXoHZQlwsb4L93a6Xykw_Qy-_8jX4}"
export VITE_CAPACITOR=1

npm run ios:prepare

if [ -n "${CI_BUILD_NUMBER:-}" ]; then
  cd ios/App
  xcrun agvtool new-version -all "$CI_BUILD_NUMBER"
fi
