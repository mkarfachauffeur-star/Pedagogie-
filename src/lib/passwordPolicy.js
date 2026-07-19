/** Politique de mot de passe Pedagogia Drive. */

export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_POLICY_HINT =
  '8 caractères minimum, dont 1 majuscule, 1 minuscule et 1 chiffre. Caractères spéciaux acceptés.'

/**
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validatePassword(password) {
  const value = String(password ?? '')

  if (value.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    }
  }
  if (!/[A-Z]/.test(value)) {
    return {
      ok: false,
      error: 'Le mot de passe doit contenir au moins une lettre majuscule.',
    }
  }
  if (!/[a-z]/.test(value)) {
    return {
      ok: false,
      error: 'Le mot de passe doit contenir au moins une lettre minuscule.',
    }
  }
  if (!/[0-9]/.test(value)) {
    return {
      ok: false,
      error: 'Le mot de passe doit contenir au moins un chiffre.',
    }
  }

  return { ok: true }
}

export function isPasswordPolicyMet(password) {
  return validatePassword(password).ok
}
