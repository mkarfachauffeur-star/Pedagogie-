import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  isAacFormation,
  isPermisBStudent,
  resolveStudentTrack,
} from '../lib/studentTrack'
import { getStudentNavItems } from '../config/navigation'

export function useStudentTrack(profileId) {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(Boolean(profileId))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profileId) {
      setStudent(null)
      setError(null)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .from('students')
      .select('id, license_category, package_name, formation_type, first_name, last_name')
      .eq('profile_id', profileId)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (cancelled) return
        if (queryError) {
          console.error('[useStudentTrack] students query failed', {
            profileId,
            message: queryError.message,
            code: queryError.code,
          })
          setError(queryError)
          setStudent(null)
        } else {
          setStudent(data)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [profileId])

  const track = useMemo(() => resolveStudentTrack(student), [student])
  const navItems = useMemo(
    () => getStudentNavItems(track, student),
    [track, student],
  )

  return {
    student,
    track,
    loading,
    error,
    isPermisB: isPermisBStudent(student),
    isAac: isAacFormation(student),
    navItems,
  }
}
