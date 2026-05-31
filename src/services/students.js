import { supabase } from '../lib/supabase'

export const PACKAGE_OPTIONS = [
  'Forfait 20h',
  'Forfait 30h',
  'Forfait 40h',
  'Heures à la carte',
  'Permis B traditionnel',
  'Boîte automatique',
  'AAC',
  'Conduite supervisée',
]

export async function listStudents() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        file_number,
        first_name,
        last_name,
        email,
        phone,
        birth_date,
        street,
        package_name,
        extra_hours,
        formation_type,
        status,
        registration_date,
        profile_id,
        student_assignments(
          is_referent,
          teacher:teacher_id(id, full_name)
        )
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return { students: data || [], error: null }
  } catch (error) {
    return { students: [], error }
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
  if (error) return { error }
  if (data?.error) return { error: new Error(data.error) }
  return {
    error: null,
    student: data.student,
    email: data.email,
    fullName: data.full_name,
    message: data.message,
    invited: data.invited,
  }
}
