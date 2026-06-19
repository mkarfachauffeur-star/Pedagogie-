import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'

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
  try {
    const [{ data: students, error: studentsError }, { data: teachers, error: teachersError }, { data: vehicles, error: vehiclesError }] =
      await Promise.all([
        supabase.from('students').select('id, first_name, last_name, file_number').order('last_name'),
        supabase.from('teachers').select('profile_id, profiles:profile_id(full_name)').eq('resource_type', 'teacher').order('created_at'),
        supabase.from('vehicles').select('id, brand, model, plate').order('created_at'),
      ])

    if (studentsError) throw studentsError
    if (teachersError) throw teachersError
    if (vehiclesError) throw vehiclesError

    return {
      students: (students || []).map((s) => ({
        id: s.id,
        label: `${s.last_name || ''} ${s.first_name || ''}`.trim() || s.file_number || s.id,
      })),
      teachers: (teachers || []).map((t) => ({
        id: t.profile_id,
        label: t.profiles?.full_name?.trim() || 'Enseignant',
      })),
      vehicles: (vehicles || []).map((v) => ({
        id: v.id,
        label: vehicleLabel(v),
      })),
      error: null,
    }
  } catch (error) {
    return { students: [], teachers: [], vehicles: [], error }
  }
}
