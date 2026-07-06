/** Bêta privée — inscriptions limitées aux pilotes. */
export const BETA_PILOT_ORG_LIMIT = 5

/** Inscriptions publiques désactivées (demande démo uniquement). */
export const isPublicSignupEnabled = import.meta.env.VITE_PUBLIC_SIGNUP_ENABLED === 'true'

export const isPrivateBeta = !isPublicSignupEnabled
