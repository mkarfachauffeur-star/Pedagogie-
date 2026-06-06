/** Parse le fragment URL renvoyé par Supabase Auth après invitation / magic link. */
export function parseAuthHash(hash = typeof window !== 'undefined' ? window.location.hash : '') {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return null

  const params = new URLSearchParams(raw)
  return {
    rawHash: hash,
    error: params.get('error'),
    error_code: params.get('error_code'),
    error_description: params.get('error_description'),
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    type: params.get('type'),
    expires_in: params.get('expires_in'),
    token_type: params.get('token_type'),
  }
}

export function hasAuthHash(hash = typeof window !== 'undefined' ? window.location.hash : '') {
  if (!hash || hash === '#') return false
  return (
    hash.includes('access_token=')
    || hash.includes('error=')
    || hash.includes('error_code=')
    || hash.includes('type=invite')
    || hash.includes('type=recovery')
  )
}

/** Journalise le hash auth dans la console (demande debug). */
export function logAuthHash(context = 'auth') {
  if (typeof window === 'undefined') return null

  const parsed = parseAuthHash()
  console.group(`[${context}] Supabase auth callback`)
  console.log('window.location.hash (brut):', window.location.hash || '(vide)')

  if (!parsed) {
    console.log('Aucun paramètre auth dans le fragment.')
    console.groupEnd()
    return null
  }

  console.log('error:', parsed.error ?? '(absent)')
  console.log('error_code:', parsed.error_code ?? '(absent)')
  console.log('error_description:', parsed.error_description ?? '(absent)')
  console.log(
    'access_token:',
    parsed.access_token
      ? `${parsed.access_token.slice(0, 16)}… (${parsed.access_token.length} caractères)`
      : '(absent)',
  )
  console.log('refresh_token:', parsed.refresh_token ? '(présent)' : '(absent)')
  console.log('type:', parsed.type ?? '(absent)')
  console.groupEnd()

  return parsed
}

export function clearAuthHash() {
  if (typeof window === 'undefined') return
  if (!window.location.hash) return
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

function decodeDescription(value) {
  if (!value) return null
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value.replace(/\+/g, ' ')
  }
}

/** Message utilisateur à partir du fragment d'erreur Supabase. */
export function authHashErrorMessage(parsed) {
  if (!parsed?.error) return null

  const description = decodeDescription(parsed.error_description)
  if (description?.toLowerCase().includes('invalid or has expired')) {
    return 'Ce lien d\'invitation est invalide ou a expiré. Demandez une nouvelle invitation à votre auto-école.'
  }
  if (description?.toLowerCase().includes('redirect')) {
    return 'Configuration de redirection incorrecte. Contactez le support de votre auto-école.'
  }
  if (description) return description

  if (parsed.error === 'access_denied') {
    return 'Accès refusé. Le lien d\'invitation n\'a pas pu être validé.'
  }

  return 'Impossible d\'activer votre compte avec ce lien.'
}
