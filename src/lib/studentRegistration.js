import { PACKAGE_OPTIONS } from '../services/students'

export { PACKAGE_OPTIONS }

export const DOCUMENT_OPTIONS = [
  'Pièce d’identité recto/verso',
  'Justificatif domicile (-3 mois)',
  'ASSR/JDC',
  'E-photo',
  'Contrat auto-école retourné signé',
  'Résultat ETG (code de la route)',
]

export const STATUS_OPTIONS = ['En attente', 'En cours', 'Validé', 'Pièces manquantes', 'Archivé']

export const CODE_STATUS_OPTIONS = ['Non obtenu', 'Obtenu']

export const LICENSE_CATEGORY_OPTIONS = ['Permis B', 'Permis A', 'Permis AM', 'Permis A1', 'Permis A2']

export function createEmptyStudentForm() {
  return {
    lastName: '',
    firstName: '',
    birthDate: '',
    birthPlace: '',
    streetNumber: '',
    street: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    neph: '',
    licenseCategory: 'Permis B',
    packageId: '',
    packageName: PACKAGE_OPTIONS[0],
    extraHours: '',
    registrationDate: new Date().toISOString().slice(0, 10),
    codeStatus: 'Non obtenu',
    payment: '',
    remainingPayment: '',
    documents: [],
    status: 'En attente',
    teacherId: '',
    sendAccessEmail: true,
  }
}

export function formatNamePart(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function previewFileNumber({ studentCount = 0, lastName = '', firstName = '' } = {}) {
  const sequence = String(studentCount + 1).padStart(3, '0')
  const base = `PD-${new Date().getFullYear()}-${sequence}`
  return [base, formatNamePart(lastName), formatNamePart(firstName)].filter(Boolean).join('-')
}

export function computeRegistrationCompletion(form) {
  const required = [
    'lastName',
    'firstName',
    'birthDate',
    'birthPlace',
    'phone',
    'email',
    'streetNumber',
    'street',
    'postalCode',
    'city',
    'neph',
    'payment',
  ]
  const completed =
    required.filter((field) => String(form[field] ?? '').trim()).length +
    (form.documents?.length ? 1 : 0)
  return Math.round((completed / 13) * 100)
}

export function validateStudentRegistrationForm(form) {
  const errors = {}
  if (!form.lastName?.trim()) errors.lastName = 'Le nom est obligatoire.'
  if (!form.firstName?.trim()) errors.firstName = 'Le prénom est obligatoire.'
  if (!form.email?.trim()) errors.email = 'L’e-mail est obligatoire.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Adresse e-mail invalide.'
  }
  if (!form.packageName?.trim() && !form.packageId) {
    errors.packageName = 'Sélectionnez une formule.'
  }
  if (form.extraHours !== '' && (Number.isNaN(Number(form.extraHours)) || Number(form.extraHours) < 0)) {
    errors.extraHours = 'Saisissez un nombre d’heures valide (0 ou plus).'
  }
  if (form.payment !== '' && Number.isNaN(Number(form.payment))) {
    errors.payment = 'Montant invalide.'
  }
  if (form.remainingPayment !== '' && Number.isNaN(Number(form.remainingPayment))) {
    errors.remainingPayment = 'Montant invalide.'
  }
  return errors
}

export function buildCreateStudentPayload(form) {
  return {
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim() || null,
    birth_date: form.birthDate || null,
    birth_place: form.birthPlace.trim() || null,
    street_number: form.streetNumber.trim() || null,
    street: form.street.trim() || null,
    postal_code: form.postalCode.trim() || null,
    city: form.city.trim() || null,
    neph: form.neph.trim() || null,
    license_category: form.licenseCategory || 'Permis B',
    package_id: form.packageId || null,
    package_name: form.packageName?.trim() || null,
    extra_hours: form.extraHours === '' ? 0 : Math.max(0, Math.floor(Number(form.extraHours) || 0)),
    code_status: form.codeStatus || 'Non obtenu',
    status: form.status || 'En attente',
    registration_date: form.registrationDate || new Date().toISOString().slice(0, 10),
    documents: form.documents || [],
    payment_collected: form.payment === '' ? 0 : Number(form.payment) || 0,
    remaining_payment: form.remainingPayment === '' ? null : Number(form.remainingPayment) || 0,
    teacher_id: form.teacherId || null,
    send_access_email: form.sendAccessEmail !== false,
  }
}
