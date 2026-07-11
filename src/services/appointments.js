import { supabase } from '../lib/supabase'
import { TEACHING_RESOURCE_TYPES } from '../lib/teachingResources'
import { toUserError } from '../lib/userFacingError'
import { filterBookableStudents, listStudents } from './students'
import { listTeachers } from './teachers'
import { listFleetVehicles, formatVehiclePlanningLabel } from './vehicles'

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
    const appointment = mapAppointmentRow(data)
    if (organizationId) {
      const { trackFirstLessonMilestone } = await import('../lib/analytics')
      void trackFirstLessonMilestone(organizationId)
    }
    return { appointment, error: null }
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
    listStudents(),
    listFleetVehicles(),
    listTeachers(),
  ])

  if (studentsRes.error) {
    result.warnings.push('élèves')
  } else {
    result.students = filterBookableStudents(studentsRes.students || []).map((student) => ({
      id: student.id,
      label: `${student.last_name || ''} ${student.first_name || ''}`.trim()
        || student.file_number
        || student.id,
    }))
  }

  if (vehiclesRes.error) {
    result.warnings.push('véhicules')
  } else {
    result.vehicles = (vehiclesRes.vehicles || []).map((vehicle) => ({
      id: vehicle.id,
      label: formatVehiclePlanningLabel(vehicle),
    }))
  }

  if (teachersRes.error) {
    result.warnings.push('enseignants')
  } else {
    result.teachers = (teachersRes.teachers || [])
      .filter((teacher) => (
        teacher.resource_type === TEACHING_RESOURCE_TYPES.TEACHER
        && teacher.is_active !== false
        && teacher.account_is_active !== false
      ))
      .map((teacher) => ({
        id: teacher.profile_id,
        label: teacher.full_name?.trim() || 'Enseignant',
      }))
  }

  if (result.warnings.length) {
    result.error = new Error(`Impossible de charger : ${result.warnings.join(', ')}.`)
  }

  return result
}
