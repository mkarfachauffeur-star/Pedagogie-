/**
 * « Se souvenir de moi » : persistance de la session Supabase.
 *
 * persistSession est global côté client Supabase : la session est toujours
 * écrite dans le stockage local. La préférence se joue donc à la réouverture :
 * une connexion SANS « Se souvenir de moi » pose un drapeau éphémère, et le
 * démarrage suivant révoque la session avant toute restauration. Une connexion
 * AVEC la case cochée retire ce drapeau : la session valide est restaurée.
 */

export const SAVED_EMAIL_KEY = 'pedagogia-drive-login-email'
export const EPHEMERAL_SESSION_KEY = 'pedagogia-drive-session-ephemeral'

function defaultStorage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

/** À appeler uniquement après une connexion réussie. */
export function applyRememberMePreference(remember, email, storage = defaultStorage()) {
  if (!storage) return
  try {
    if (remember) {
      if (email) storage.setItem(SAVED_EMAIL_KEY, email)
      storage.removeItem(EPHEMERAL_SESSION_KEY)
    } else {
      storage.removeItem(SAVED_EMAIL_KEY)
      storage.setItem(EPHEMERAL_SESSION_KEY, '1')
    }
  } catch {
    // Stockage indisponible (navigation privée stricte) : la session du run courant reste utilisable.
  }
}

/** Lit l'e-mail mémorisé pour préremplir le formulaire. */
export function readRememberedEmail(storage = defaultStorage()) {
  try {
    return storage?.getItem(SAVED_EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

/**
 * Au démarrage : renvoie true si la session persistée doit être révoquée
 * (connexion précédente sans « Se souvenir de moi »). Le drapeau est consommé
 * une seule fois.
 */
export function consumeEphemeralSessionFlag(storage = defaultStorage()) {
  if (!storage) return false
  try {
    const flag = storage.getItem(EPHEMERAL_SESSION_KEY)
    storage.removeItem(EPHEMERAL_SESSION_KEY)
    return flag === '1'
  } catch {
    return false
  }
}
