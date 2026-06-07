import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'
import { subscribePostgresChanges } from './realtime'
import { DEMO_STUDENT, isLocalDemoSession } from '../data/demoPracticeExam'

function getDemoStudents() {
  return [{
    id: DEMO_STUDENT.id,
    first_name: DEMO_STUDENT.firstName,
    last_name: DEMO_STUDENT.lastName,
    package_name: DEMO_STUDENT.formationType,
    formation_type: DEMO_STUDENT.formationType,
    student_assignments: [{ is_referent: true, teacher: { full_name: DEMO_STUDENT.teacher } }],
  }]
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

function logStudentsQuery(context, payload) {
  console.group(`[listStudents] ${context}`)
  Object.entries(payload).forEach(([key, value]) => {
    if (value instanceof Error) {
      console.error(key, {
        message: value.message,
        code: value.code,
        details: value.details,
        hint: value.hint,
      })
    } else {
      console.info(key, value)
    }
  })
  console.groupEnd()
}

export async function listStudents({ teacherId = null, organizationId = null, logContext = 'default' } = {}) {
  if (isLocalDemoSession()) {
    const students = getDemoStudents()
    logStudentsQuery(logContext, {
      teacherId,
      organizationId,
      mode: 'demo',
      studentCount: students.length,
      error: null,
    })
    return { students, error: null }
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const authUserId = sessionData.session?.user?.id ?? null

    let teacherProfile = null
    if (teacherId || authUserId) {
      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, organization_id, full_name, email, is_active')
        .eq('id', teacherId || authUserId)
        .maybeSingle()

      if (profileError) {
        logStudentsQuery(logContext, {
          teacherId: teacherId || authUserId,
          organizationId,
          authUserId,
          profileError: profileError.message,
          profileErrorCode: profileError.code,
        })
      }
      teacherProfile = profileRow
    }

    const { data, error } = await supabase
      .from('students')
      .select(`
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
        student_assignments(
          is_referent,
          teacher_id,
          teacher:teacher_id(id, full_name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logStudentsQuery(logContext, {
        teacherId: teacherId || authUserId,
        organizationId: organizationId ?? teacherProfile?.organization_id ?? null,
        authUserId,
        teacherRole: teacherProfile?.role ?? null,
        teacherProfileFound: Boolean(teacherProfile),
        teacherIsActive: teacherProfile?.is_active ?? null,
        studentCount: 0,
        error,
      })
      throw error
    }

    const students = data || []
    logStudentsQuery(logContext, {
      teacherId: teacherId || authUserId,
      organizationId: organizationId ?? teacherProfile?.organization_id ?? null,
      authUserId,
      teacherRole: teacherProfile?.role ?? null,
      teacherProfileFound: Boolean(teacherProfile),
      teacherIsActive: teacherProfile?.is_active ?? null,
      teacherName: teacherProfile?.full_name ?? null,
      studentCount: students.length,
      studentIds: students.map((row) => row.id),
      error: null,
    })

    return { students, error: null, teacherProfile }
  } catch (error) {
    logStudentsQuery(`${logContext} — échec`, {
      teacherId,
      organizationId,
      studentCount: 0,
      error,
    })
    return { students: [], error, teacherProfile: null }
  }
}

export async function listOrganizationTeachers() {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('profile_id, profiles:profile_id(id, full_name)')
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

export function subscribeStudents(onChange) {
  return subscribePostgresChanges({
    topicBase: 'students-list',
    listeners: [
      { config: { event: '*', schema: 'public', table: 'students' }, callback: onChange },
    ],
  })
}
