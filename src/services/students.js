import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'
import { subscribePostgresChanges } from './realtime'
import { allowsActiveBookings } from '../lib/studentJourney'

const STUDENT_SELECT_FIELDS = `
  id,
  organization_id,
  file_number,
  first_name,
  last_name,
  email,
  phone,
  birth_date,
  street,
  license_category,
  package_name,
  extra_hours,
  formation_type,
  status,
  registration_date,
  profile_id,
  code_status,
  license_result,
  license_obtained_at,
  archived_at,
  is_archived
`

function mergeStudentsWithAssignments(students, assignments, teacherProfilesById) {
  const assignmentsByStudent = new Map()
  for (const assignment of assignments || []) {
    const bucket = assignmentsByStudent.get(assignment.student_id) || []
    bucket.push(assignment)
    assignmentsByStudent.set(assignment.student_id, bucket)
  }

  return (students || []).map((student) => ({
    ...student,
    student_assignments: (assignmentsByStudent.get(student.id) || []).map((assignment) => ({
      is_referent: assignment.is_referent,
      teacher_id: assignment.teacher_id,
      teacher: {
        id: assignment.teacher_id,
        full_name: teacherProfilesById.get(assignment.teacher_id)?.full_name ?? null,
      },
    })),
  }))
}

export const PACKAGE_OPTIONS = [
  'Permis B 20h + Code',
  'Permis B 20h sans Code',
  'Permis B automatique 13h + Code',
  'Permis B automatique 13h sans Code',
  'AAC 20h + Code',
  'AAC 20h sans Code',
  'Conduite supervisée',
  'Passerelle B78 → B',
]

export async function listStudents({ teacherId = null } = {}) {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const authUserId = sessionData.session?.user?.id ?? null
    const resolvedTeacherId = teacherId || authUserId

    let teacherProfile = null
    if (resolvedTeacherId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, organization_id, full_name, is_active')
        .eq('id', resolvedTeacherId)
        .maybeSingle()
      if (error) throw error
      teacherProfile = data
    }

    const isTeacherRole = teacherProfile?.role === 'teacher'
    let assignments = []

    if (isTeacherRole && resolvedTeacherId) {
      const { data, error } = await supabase
        .from('student_assignments')
        .select('student_id, teacher_id, is_referent')
        .eq('teacher_id', resolvedTeacherId)
      if (error) throw error
      assignments = data || []

      if (!assignments.length) {
        return { students: [], error: null, teacherProfile }
      }
    }

    const assignedStudentIds = [...new Set(assignments.map((row) => row.student_id))]

    let studentsQuery = supabase
      .from('students')
      .select(STUDENT_SELECT_FIELDS)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })

    if (isTeacherRole && assignedStudentIds.length) {
      studentsQuery = studentsQuery.in('id', assignedStudentIds)
    }

    const { data: studentRows, error: studentsError } = await studentsQuery
    if (studentsError) throw studentsError

    if (!isTeacherRole && (studentRows || []).length) {
      const studentIds = studentRows.map((row) => row.id)
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('student_assignments')
        .select('student_id, teacher_id, is_referent')
        .in('student_id', studentIds)
      if (assignmentsError) throw assignmentsError
      assignments = allAssignments || []
    }

    const teacherIds = [...new Set((assignments || []).map((row) => row.teacher_id).filter(Boolean))]
    const teacherProfilesById = new Map()
    if (teacherIds.length) {
      const { data: teacherProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds)
      if (profilesError) throw profilesError
      for (const profile of teacherProfiles || []) {
        teacherProfilesById.set(profile.id, profile)
      }
    }

    const students = mergeStudentsWithAssignments(studentRows || [], assignments, teacherProfilesById)
    return { students, error: null, teacherProfile }
  } catch (error) {
    return { students: [], error, teacherProfile: null }
  }
}

export function filterBookableStudents(students = []) {
  return students.filter(allowsActiveBookings)
}

export async function listOrganizationTeachers() {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('profile_id, profiles:profile_id(id, full_name)')
      .eq('resource_type', 'teacher')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data || []).map((row) => ({
      id: row.profile_id,
      name: row.profiles?.full_name?.trim() || 'Enseignant',
    }))
  } catch {
    return []
  }
}

export async function createStudent(payload) {
  const { data, error } = await supabase.functions.invoke('create-student', {
    body: payload,
  })
  if (error) return { error: toUserError(error, 'createStudent') }
  if (data?.error) return { error: toUserError(data.error, 'createStudent') }
  return {
    error: null,
    student: data.student,
    email: data.email,
    fullName: data.full_name,
    message: data.message,
    tempPassword: data.temp_password,
    emailSent: data.email_sent,
    invited: data.invited,
  }
}

export async function resendStudentAccessEmail(studentId) {
  const { data, error } = await supabase.functions.invoke('resend-student-access', {
    body: { student_id: studentId },
  })
  if (error) return { error: toUserError(error, 'invite'), message: null, tempPassword: null, emailSent: false }
  if (data?.error) return { error: toUserError(data.error, 'invite'), message: null, tempPassword: null, emailSent: false }
  return {
    error: null,
    message: data.message,
    tempPassword: data.temp_password,
    emailSent: data.email_sent,
  }
}

export function subscribeStudents(onChange) {
  return subscribePostgresChanges({
    topicBase: 'students-list',
    listeners: [
      { config: { event: '*', schema: 'public', table: 'students' }, callback: onChange },
      { config: { event: '*', schema: 'public', table: 'student_assignments' }, callback: onChange },
    ],
  })
}
