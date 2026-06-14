/** Inscriptions publiques désactivées par défaut (bêta privée). Mettre VITE_PUBLIC_SIGNUP_ENABLED=true pour rouvrir. */
export const isPublicSignupEnabled = import.meta.env.VITE_PUBLIC_SIGNUP_ENABLED === 'true'

export const isPrivateBeta = !isPublicSignupEnabled
