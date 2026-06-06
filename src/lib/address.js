export function formatPostalAddress({
  streetNumber,
  street,
  postalCode,
  city,
  fallback = '',
} = {}) {
  const line1 = [streetNumber, street].filter(Boolean).join(' ')
  const line2 = [postalCode, city].filter(Boolean).join(' ')
  const formatted = [line1, line2].filter(Boolean).join(', ')
  return formatted || fallback || '—'
}

export function teacherAddressFromRecord(teacher) {
  const hasStructured = Boolean(
    teacher?.street
    || teacher?.street_number
    || teacher?.postal_code
    || teacher?.city,
  )

  return {
    streetNumber: teacher?.street_number || '',
    street: teacher?.street || (!hasStructured ? teacher?.address || '' : ''),
    postalCode: teacher?.postal_code || '',
    city: teacher?.city || '',
  }
}

export function teacherAddressPayload(form) {
  const streetNumber = String(form.streetNumber || '').trim() || null
  const street = String(form.street || '').trim() || null
  const postalCode = String(form.postalCode || '').trim() || null
  const city = String(form.city || '').trim() || null

  return {
    street_number: streetNumber,
    street,
    postal_code: postalCode,
    city,
    address: formatPostalAddress({ streetNumber, street, postalCode, city, fallback: '' }) || null,
  }
}
