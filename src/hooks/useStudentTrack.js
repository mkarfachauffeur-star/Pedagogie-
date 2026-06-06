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

  useEffect(() => {
    if (!profileId) {
      setStudent(null)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('students')
      .select('id, license_category, package_name, formation_type, first_name, last_name')
      .eq('profile_id', profileId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setStudent(data)
          setLoading(false)
        }
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
    isPermisB: isPermisBStudent(student),
    isAac: isAacFormation(student),
    navItems,
  }
}
