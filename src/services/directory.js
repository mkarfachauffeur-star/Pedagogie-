import { supabase } from '../lib/supabase'

// Annuaire des contacts joignables (filtré côté serveur par la RLS + can_converse).
// Sert à démarrer une conversation : interne (staff) ou Secrétariat <-> Élève.

// Contacts internes : staff de l'auto-école (gérant, secrétariat, enseignants).
export async function listInternalContacts(profileId) {
  try {
    let query = supabase
      .from('profiles')
      .select('id, full_name, role, avatar_emoji')
      .in('role', ['manager', 'secretary', 'teacher'])
    if (profileId) query = query.neq('id', profileId)
    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

// Résout l'identifiant du dossier élève (students.id) à partir d'un profil.
export async function getStudentIdByProfile(profileId) {
  if (!profileId) return null
  try {
    const { data } = await supabase.from('students').select('id').eq('profile_id', profileId).maybeSingle()
    return data?.id || null
  } catch {
    return null
  }
}

// Contacts autorisés pour un ÉLÈVE : secrétariat + enseignant(s) référent(s).
export async function listStudentAllowedContacts(profileId) {
  if (!profileId) return []
  try {
    const contacts = []
    // Secrétariat de l'auto-école (visible par l'élève via RLS).
    const { data: secs } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'secretary')
    ;(secs || []).forEach((s) => contacts.push(s))

    // Enseignant(s) référent(s) : via le dossier élève + affectations.
    const { data: me } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle()
    if (me?.id) {
      const { data: asg } = await supabase
        .from('student_assignments')
        .select('teacher:teacher_id (id, full_name, role)')
        .eq('student_id', me.id)
      ;(asg || []).forEach((row) => row.teacher && contacts.push(row.teacher))
    }
    // Dédoublonnage
    const seen = new Set()
    return contacts.filter((c) => (c && !seen.has(c.id) ? seen.add(c.id) : false))
  } catch {
    return []
  }
}

// Élèves joignables (avec un compte). La RLS limite déjà aux élèves accessibles
// (tout l'org pour le staff admin, élèves affectés pour l'enseignant).
export async function listStudentContacts({ search = '' } = {}) {
  try {
    let query = supabase
      .from('students')
      .select('id, profile_id, first_name, last_name, file_number')
      .not('profile_id', 'is', null)
      .order('last_name', { ascending: true })
    const term = search.trim()
    if (term) {
      query = query.or(
        `first_name.ilike.%${term}%,last_name.ilike.%${term}%,file_number.ilike.%${term}%`,
      )
    }
    const { data, error } = await query
    if (error) throw error
    return (data || []).map((s) => ({
      profileId: s.profile_id,
      studentId: s.id,
      name: `${s.first_name} ${s.last_name}`.trim(),
      fileNumber: s.file_number,
    }))
  } catch {
    return []
  }
}
