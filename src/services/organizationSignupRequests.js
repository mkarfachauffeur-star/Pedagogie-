import { supabase } from '../lib/supabase'
import { trackAePendingValidation, trackSignUp } from '../lib/analytics'
import { normalizeGender } from '../lib/genderedRoles'
import { sanitizeSiret, toOrganizationPatch } from '../lib/orgProfile'
import { toUserError } from '../lib/userFacingError'

export async function submitOrganizationSignupRequest(payload) {
  try {
    const email = payload.email.trim().toLowerCase()
    const patch = toOrganizationPatch({
      orgName: payload.orgName,
      managerFirstName: payload.managerFirstName,
      managerLastName: payload.managerLastName,
      address: payload.address,
      postalCode: payload.postalCode,
      city: payload.city,
      phone: payload.phone,
      email,
      siret: payload.siret,
      prefectureApproval: payload.prefectureApproval,
      website: payload.website,
    })

    const { error } = await supabase.from('organization_signup_requests').insert({
      org_name: patch.name,
      manager_first_name: payload.managerFirstName.trim(),
      manager_last_name: payload.managerLastName.trim(),
      manager_gender: normalizeGender(payload.managerGender),
      email: patch.email,
      phone: patch.phone,
      address: patch.address,
      postal_code: patch.postal_code,
      city: patch.city,
      siret: sanitizeSiret(patch.siret) || null,
      prefecture_approval: patch.prefecture_approval,
      website: patch.website,
    })
    if (error) throw error

    trackSignUp({
      organizationName: patch.name,
      email: patch.email,
      planSelected: 'starter',
    })
    trackAePendingValidation({
      organizationName: patch.name,
      email: patch.email,
      planSelected: 'starter',
    })

    return { error: null }
  } catch (error) {
    return { error: toUserError(error, 'save') }
  }
}
