export const PHONE_DIGITS_LENGTH = 10

export function normalizePhoneDigits(value, maxLength = PHONE_DIGITS_LENGTH) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLength)
}

export function isCompletePhoneDigits(value, length = PHONE_DIGITS_LENGTH) {
  const digits = normalizePhoneDigits(value)
  return digits.length === length
}

export function validatePhoneDigits(value, { required = false, length = PHONE_DIGITS_LENGTH } = {}) {
  const digits = normalizePhoneDigits(value)
  if (!digits) return required ? 'Le téléphone est obligatoire.' : null
  if (digits.length !== length) return `Le téléphone doit contenir ${length} chiffres.`
  return null
}
