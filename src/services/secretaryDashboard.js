import { supabase } from '../lib/supabase'
import { formatPersonName } from '../lib/staffAccounts'
import { formatDateFr, formatEur, studentLabel } from './finance'
import { listAppointments } from './appointments'

const PENDING_STATUSES = new Set(['En attente', 'Pièces manquantes'])

function localTodayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function addDaysIso(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(iso) {
  if (!iso) return '—'
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function mapStudentName(row) {
  if (row?.student) return studentLabel(row.student)
  return studentLabel(row)
}

export async function fetchSecretaryDashboard({ organizationId } = {}) {
  if (!organizationId) {
    return { dashboard: null, error: new Error('Organisation requise') }
  }

  try {
    const today = localTodayIso()
    const weekEnd = addDaysIso(today, 7)

    const [
      todayAppointmentsRes,
      weekAppointmentsRes,
      studentsRes,
      documentsRes,
      examsRes,
      paymentsRes,
      assessmentsRes,
    ] = await Promise.all([
      listAppointments({ dateFrom: today, dateTo: today }),
      listAppointments({ dateFrom: today, dateTo: weekEnd }),
      supabase
        .from('students')
        .select('id, first_name, last_name, status, package_name, registration_date')
        .eq('organization_id', organizationId)
        .order('registration_date', { ascending: false })
        .limit(8),
      supabase
        .from('documents')
        .select('id, type, status, student:student_id(first_name, last_name)')
        .eq('organization_id', organizationId)
        .in('status', ['À compléter', 'À vérifier'])
        .limit(8),
      supabase
        .from('exams')
        .select('id, type, exam_date, exam_time, status, center, student:student_id(first_name, last_name)')
        .eq('organization_id', organizationId)
        .gte('exam_date', today)
        .order('exam_date', { ascending: true })
        .limit(6),
      supabase
        .from('payments')
        .select('id, amount, paid_at, method, nature, student:student_id(first_name, last_name)')
        .eq('organization_id', organizationId)
        .order('paid_at', { ascending: false })
        .limit(5),
      supabase
        .from('student_initial_assessments')
        .select('id, status, student:student_id(first_name, last_name)')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .limit(5),
    ])

    if (studentsRes.error) throw studentsRes.error

    const students = studentsRes.data || []
    const todayLessons = (todayAppointmentsRes.appointments || []).filter(
      (row) => !['Annulé', 'Annule'].includes(row.status),
    )
    const weekLessons = (weekAppointmentsRes.appointments || []).filter(
      (row) => !['Annulé', 'Annule'].includes(row.status),
    )

    const scheduleItems = (todayLessons.length > 0 ? todayLessons : weekLessons)
      .slice(0, 8)
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

    for (const student of students.filter((row) => PENDING_STATUSES.has(row.status)).slice(0, 4)) {
      priorities.push({
        id: `student-${student.id}`,
        tone: 'amber',
        label: student.status,
        title: `${formatPersonName(student)} — dossier à finaliser`,
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

    for (const assessment of assessmentsRes.data || []) {
      priorities.push({
        id: `assessment-${assessment.id}`,
        tone: 'cyan',
        label: 'Évaluation',
        title: `${mapStudentName(assessment)} — évaluation de départ à planifier`,
      })
    }

    for (const exam of examsRes.data || []) {
      priorities.push({
        id: `exam-${exam.id}`,
        tone: 'violet',
        label: exam.type,
        title: `${mapStudentName(exam)} — ${exam.type} le ${formatDateFr(exam.exam_date)}`,
      })
    }

    const recentStudents = students.slice(0, 6).map((row) => ({
      id: row.id,
      name: formatPersonName(row) || 'Élève',
      formation: row.package_name || '—',
      status: row.status || '—',
      date: formatDateFr(row.registration_date),
    }))

    const recentPayments = (paymentsRes.data || []).map((row) => ({
      id: row.id,
      student: mapStudentName(row),
      nature: row.nature,
      amount: Number(row.amount || 0),
      date: formatDateFr(row.paid_at),
      method: row.method,
    }))

    return {
      dashboard: {
        summary: {
          pendingDossiers: students.filter((row) => PENDING_STATUSES.has(row.status)).length,
          todayLessons: todayLessons.length,
          weekLessons: weekLessons.length,
          documentsToReview: (documentsRes.data || []).length,
          upcomingExams: (examsRes.data || []).length,
        },
        scheduleMode: todayLessons.length > 0 ? 'today' : 'week',
        scheduleItems,
        priorities: priorities.slice(0, 8),
        recentStudents,
        recentPayments,
      },
      error: null,
    }
  } catch (error) {
    return { dashboard: null, error }
  }
}
