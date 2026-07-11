import { supabase } from '../lib/supabase'
import { formatPersonName } from '../lib/staffAccounts'
import { formatDateFr, formatEur, studentLabel } from './finance'
import { listAppointments } from './appointments'
import { fetchProfitabilityDashboard } from './profitability'
import { ACTIVE_STUDENT_STATUSES } from '../lib/studentJourney'

const ACTIVE_STATUSES = ACTIVE_STUDENT_STATUSES

function localTodayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDaysIso(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(iso) {
  if (!iso) return '—'
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`)
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function mapStudentName(row) {
  if (row?.student) return studentLabel(row.student)
  return studentLabel(row)
}

export async function fetchManagerDashboard({ organizationId } = {}) {
  if (!organizationId) {
    return { dashboard: null, error: new Error('Organisation requise') }
  }

  try {
    const today = localTodayIso()
    const weekEnd = addDaysIso(today, 7)

    const [
      profitabilityRes,
      upcomingAppointmentsRes,
      recentAppointmentsRes,
      studentsRes,
      teachersRes,
      assessmentsRes,
      documentsRes,
      examsRes,
      vehiclesRes,
      paymentsRes,
    ] = await Promise.all([
      fetchProfitabilityDashboard({ organizationId }),
      listAppointments({ dateFrom: today, dateTo: weekEnd }),
      listAppointments({ dateFrom: addDaysIso(today, -14), dateTo: today }),
      supabase
        .from('students')
        .select('id, first_name, last_name, status, package_name, code_status, registration_date')
        .eq('organization_id', organizationId)
        .order('registration_date', { ascending: false })
        .limit(8),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', organizationId)
        .eq('role', 'teacher')
        .eq('is_active', true),
      supabase
        .from('student_initial_assessments')
        .select('id, status, student:student_id(first_name, last_name)')
        .eq('organization_id', organizationId)
        .eq('status', 'pending'),
      supabase
        .from('documents')
        .select('id, type, status, student:student_id(first_name, last_name)')
        .eq('organization_id', organizationId)
        .in('status', ['À compléter', 'À vérifier'])
        .limit(6),
      supabase
        .from('exams')
        .select('id, type, exam_date, exam_time, status, center, student:student_id(first_name, last_name)')
        .eq('organization_id', organizationId)
        .gte('exam_date', today)
        .order('exam_date', { ascending: true })
        .limit(5),
      supabase.from('vehicles').select('id, brand, model, plate, details').eq('organization_id', organizationId),
      supabase
        .from('payments')
        .select('id, amount, paid_at, method, nature, student:student_id(first_name, last_name)')
        .eq('organization_id', organizationId)
        .order('paid_at', { ascending: false })
        .limit(6),
    ])

    if (studentsRes.error) throw studentsRes.error
    if (profitabilityRes.error && !profitabilityRes.dashboard) throw profitabilityRes.error

    const students = studentsRes.data || []
    const teachers = teachersRes.data || []
    const vehicles = vehiclesRes.data || []
    const profitability = profitabilityRes.dashboard || {}

    const activeStudents = students.filter((row) => ACTIVE_STATUSES.has(row.status)).length
    const upcomingAppointments = (upcomingAppointmentsRes.appointments || []).filter(
      (row) => !['Annulé', 'Annule'].includes(row.status),
    )
    const recentAppointments = (recentAppointmentsRes.appointments || [])
      .filter((row) => !['Annulé', 'Annule'].includes(row.status))
      .sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at))
      .slice(0, 6)

    const scheduleItems = (upcomingAppointments.length > 0 ? upcomingAppointments : recentAppointments)
      .slice(0, 6)
      .map((appt) => ({
        id: appt.id,
        day: formatDayLabel(appt.starts_at),
        time: formatTime(appt.starts_at),
        title: appt.studentLabel,
        subtitle: appt.kind,
        meta: [appt.teacherLabel, appt.vehicleLabel, appt.status].filter(Boolean).join(' · '),
        status: appt.status,
      }))

    const priorities = []

    for (const assessment of assessmentsRes.data || []) {
      priorities.push({
        id: `assessment-${assessment.id}`,
        tone: 'amber',
        label: 'Évaluation',
        title: `${mapStudentName(assessment)} — évaluation de départ à réaliser`,
      })
    }

    for (const doc of documentsRes.data || []) {
      priorities.push({
        id: `document-${doc.id}`,
        tone: 'rose',
        label: doc.status,
        title: `${mapStudentName(doc)} — ${doc.type}`,
      })
    }

    for (const exam of examsRes.data || []) {
      priorities.push({
        id: `exam-${exam.id}`,
        tone: 'cyan',
        label: exam.type,
        title: `${mapStudentName(exam)} — ${exam.type} le ${formatDateFr(exam.exam_date)}`,
      })
    }

    if ((profitability.remainingToCollect || 0) > 0) {
      priorities.push({
        id: 'remaining-payments',
        tone: 'emerald',
        label: 'Finances',
        title: `${formatEur(profitability.remainingToCollect)} restent à encaisser`,
      })
    }

    const recentPayments = (paymentsRes.data || []).map((row) => ({
      id: row.id,
      student: mapStudentName(row),
      nature: row.nature,
      amount: Number(row.amount || 0),
      date: formatDateFr(row.paid_at),
      method: row.method,
    }))

    const studentRows = students.map((row) => ({
      id: row.id,
      name: formatPersonName(row) || 'Élève',
      formation: row.package_name || '—',
      code: row.code_status || '—',
      status: row.status || '—',
    }))

    const fleetRows = vehicles.map((row) => ({
      id: row.id,
      label: [row.brand, row.model].filter(Boolean).join(' ') || 'Véhicule',
      plate: row.plate || '—',
      availability: row.details?.availability || 'Disponible',
    }))

    const availableVehicles = fleetRows.filter((row) => row.availability === 'Disponible').length

    return {
      dashboard: {
        summary: {
          activeStudents,
          teacherCount: teachers.length,
          vehicleCount: vehicles.length,
          availableVehicles,
          todayLessons: upcomingAppointments.filter((row) => row.starts_at?.slice(0, 10) === today).length,
          upcomingLessons: upcomingAppointments.length,
        },
        finance: {
          monthlyRevenue: profitability.monthlyRevenue || 0,
          annualRevenue: profitability.annualRevenue || 0,
          totalCollected: profitability.totalCollected || 0,
          contractTotal: profitability.contractTotal || 0,
          remainingToCollect: profitability.remainingToCollect || 0,
          averageBasket: profitability.averageBasket || 0,
          hoursCompleted: profitability.hoursCompleted || 0,
        },
        priorities: priorities.slice(0, 8),
        scheduleItems,
        scheduleMode: upcomingAppointments.length > 0 ? 'upcoming' : 'recent',
        recentPayments,
        studentRows,
        fleetRows,
        teacherNames: teachers
          .map((row) => row.full_name?.trim())
          .filter(Boolean),
      },
      error: null,
    }
  } catch (error) {
    return { dashboard: null, error }
  }
}
