import { supabase } from '../lib/supabase'
import { getAppPlatform, getAppVersion } from '../lib/appPlatform'
import { toUserError } from '../lib/userFacingError'

export async function fetchStudentReviewStatus() {
  try {
    const { data, error } = await supabase.rpc('student_review_status')
    if (error) throw error
    return {
      status: {
        needsReview: Boolean(data?.needs_review),
        eligible: Boolean(data?.eligible),
        submitted: Boolean(data?.submitted),
      },
      error: null,
    }
  } catch (error) {
    return {
      status: { needsReview: false, eligible: false, submitted: false },
      error,
    }
  }
}

export async function submitStudentReview({ rating, comment }) {
  try {
    const { data, error } = await supabase.rpc('submit_student_review', {
      p_rating: rating,
      p_comment: comment || null,
      p_platform: getAppPlatform(),
      p_app_version: getAppVersion(),
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: toUserError(error, 'save') }
  }
}
