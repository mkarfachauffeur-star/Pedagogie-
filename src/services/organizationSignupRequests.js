import { supabase } from '../lib/supabase'
import { trackAePendingValidation, trackSignUp } from '../lib/analytics'
import { normalizeGender } from '../lib/genderedRoles'
import { toUserError } from '../lib/userFacingError'

export async function submitOrganizationSignupRequest(payload) {
  try {
    const email = payload.email.trim().toLowerCase()
    const { error } = await supabase.from('organization_signup_requests').insert({
      org_name: payload.orgName.trim(),
      manager_first_name: payload.managerFirstName.trim(),
      manager_last_name: payload.managerLastName.trim(),
      manager_gender: normalizeGender(payload.managerGender),
      email,
      phone: payload.phone.trim(),
      address: payload.address?.trim() || null,
      postal_code: payload.postalCode?.trim() || null,
      city: payload.city?.trim() || null,
      siret: payload.siret?.trim() || null,
      prefecture_approval: payload.prefectureApproval?.trim() || null,
    })
    if (error) throw error

    trackSignUp({
      organizationName: payload.orgName.trim(),
      email,
      planSelected: 'starter',
    })
    trackAePendingValidation({
      organizationName: payload.orgName.trim(),
      email,
      planSelected: 'starter',
    })

    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'save') }
  }
}
