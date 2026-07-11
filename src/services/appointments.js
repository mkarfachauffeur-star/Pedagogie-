import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'
import { filterBookableStudents } from './students'

const APPOINTMENT_SELECT = `
  id,
  kind,
  starts_at,
  duration_minutes,
  status,
  notes,
  student_id,
  teacher_id,
  vehicle_id,
  student:student_id(id, first_name, last_name),
  teacher:teacher_id(id, full_name),
  vehicle:vehicle_id(id, brand, model, plate)
`

function studentLabel(student) {
  if (!student) return '—'
  return `${student.last_name || ''} ${student.first_name || ''}`.trim() || 'Élève'
}

function vehicleLabel(vehicle) {
  if (!vehicle) return '—'
  return [vehicle.brand, vehicle.model, vehicle.plate].filter(Boolean).join(' · ') || 'Véhicule'
}

export function mapAppointmentRow(row) {
  if (!row) return null
  return {
    ...row,
    studentLabel: studentLabel(row.student),
    teacherLabel: row.teacher?.full_name || '—',
    vehicleLabel: vehicleLabel(row.vehicle),
  }
}

export async function listAppointments({ dateFrom, dateTo, teacherId, vehicleId } = {}) {
  try {
    let query = supabase
      .from('appointments')
      .select(APPOINTMENT_SELECT)
      .order('starts_at', { ascending: true })

    if (dateFrom) query = query.gte('starts_at', `${dateFrom}T00:00:00`)
    if (dateTo) query = query.lte('starts_at', `${dateTo}T23:59:59`)
    if (teacherId) query = query.eq('teacher_id', teacherId)
    if (vehicleId) query = query.eq('vehicle_id', vehicleId)

    const { data, error } = await query
    if (error) throw error
    return { appointments: (data || []).map(mapAppointmentRow), error: null }
  } catch (error) {
    return { appointments: [], error }
  }
}

export async function createAppointment({
  organizationId,
  studentId,
  teacherId,
  vehicleId,
  kind,
  startsAt,
  durationMinutes,
  status,
  notes,
}) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        organization_id: organizationId,
        student_id: studentId || null,
        teacher_id: teacherId || null,
        vehicle_id: vehicleId || null,
        kind: kind || 'Leçon',
        starts_at: startsAt,
        duration_minutes: durationMinutes || 60,
        status: status || 'Planifié',
        notes: notes?.trim() || null,
      })
      .select(APPOINTMENT_SELECT)
      .single()
    if (error) throw error
    return { appointment: mapAppointmentRow(data), error: null }
  } catch (error) {
    return { appointment: null, error: toUserError(error, 'save') }
  }
}

export async function loadPlanningOptions() {
  const result = {
    students: [],
    teachers: [],
    vehicles: [],
    error: null,
    warnings: [],
  }

  const [studentsRes, vehiclesRes, teachersRes] = await Promise.all([
    supabase
      .from('students')
      .select('id, first_name, last_name, file_number, status, license_result, is_archived')
      .order('last_name'),
    supabase.from('vehicles').select('id, brand, model, plate').order('created_at'),
    supabase
      .from('teachers')
      .select('profile_id')
      .eq('resource_type', 'teacher')
      .order('created_at'),
  ])

  if (studentsRes.error) {
    result.warnings.push('élèves')
  } else {
    result.students = filterBookableStudents(studentsRes.data || []).map((s) => ({
      id: s.id,
      label: `${s.last_name || ''} ${s.first_name || ''}`.trim() || s.file_number || s.id,
    }))
  }

  if (vehiclesRes.error) {
    result.warnings.push('véhicules')
  } else {
    result.vehicles = (vehiclesRes.data || []).map((v) => ({
      id: v.id,
      label: vehicleLabel(v),
    }))
  }

  if (teachersRes.error) {
    result.warnings.push('enseignants')
  } else {
    const teacherRows = teachersRes.data || []
    const profileIds = [...new Set(teacherRows.map((row) => row.profile_id).filter(Boolean))]
    const profileNames = new Map()

    if (profileIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds)

      if (profilesError) {
        result.warnings.push('enseignants')
      } else {
        for (const profile of profiles || []) {
          profileNames.set(profile.id, profile.full_name)
        }
      }
    }

    if (!result.warnings.includes('enseignants')) {
      result.teachers = teacherRows.map((t) => ({
        id: t.profile_id,
        label: profileNames.get(t.profile_id)?.trim() || 'Enseignant',
      }))
    }
  }

  if (result.warnings.length) {
    result.error = new Error(`Impossible de charger : ${result.warnings.join(', ')}.`)
  }

  return result
}
