import { supabase } from '../lib/supabase'
import { contractsMap, formatEur, buildFinancialSummary } from './finance'

const ACTIVE_STATUSES = new Set(['En cours', 'En formation', 'Validé', 'En attente', 'Pièces manquantes'])

function isRealizedLesson(status = '') {
  const s = String(status).toLowerCase()
  return s.includes('réalis') || s.includes('realis') || s.includes('valid') || s.includes('termin')
}

function monthKey(dateStr) {
  return String(dateStr || '').slice(0, 7)
}

function yearKey(dateStr) {
  return String(dateStr || '').slice(0, 4)
}

function sumPayments(payments = [], predicate = () => true) {
  return payments.filter(predicate).reduce((sum, row) => sum + Number(row.amount || 0), 0)
}

export async function fetchProfitabilityDashboard({ organizationId, global = false } = {}) {
  try {
    let paymentsQuery = supabase.from('payments').select('id, student_id, amount, paid_at, nature, organization_id')
    let contractsQuery = supabase.from('contracts').select('student_id, contract_total, organization_id')
    let studentsQuery = supabase.from('students').select('id, status, organization_id')
    let appointmentsQuery = supabase
      .from('appointments')
      .select('id, duration_minutes, status, kind, starts_at, organization_id')

    if (!global && organizationId) {
      paymentsQuery = paymentsQuery.eq('organization_id', organizationId)
      contractsQuery = contractsQuery.eq('organization_id', organizationId)
      studentsQuery = studentsQuery.eq('organization_id', organizationId)
      appointmentsQuery = appointmentsQuery.eq('organization_id', organizationId)
    }

    const [paymentsRes, contractsRes, studentsRes, appointmentsRes] = await Promise.all([
      paymentsQuery,
      contractsQuery,
      studentsQuery,
      appointmentsQuery,
    ])

    const error =
      paymentsRes.error || contractsRes.error || studentsRes.error || appointmentsRes.error
    if (error) throw error

    const payments = paymentsRes.data || []
    const contracts = contractsRes.data || []
    const students = studentsRes.data || []
    const appointments = appointmentsRes.data || []

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentYear = String(now.getFullYear())

    const monthlyRevenue = sumPayments(payments, (row) => monthKey(row.paid_at) === currentMonth)
    const annualRevenue = sumPayments(payments, (row) => yearKey(row.paid_at) === currentYear)

    const activeStudents = students.filter((row) => ACTIVE_STATUSES.has(row.status)).length
    const contractTotals = contractsMap(contracts)
    const contractTotal = contracts.reduce((sum, row) => sum + Number(row.contract_total || 0), 0)
    const averageBasket = activeStudents > 0 ? contractTotal / activeStudents : 0

    const summary = buildFinancialSummary({ payments, expenses: [], contracts })

    const lessonRows = appointments.filter(
      (row) => String(row.kind || '').toLowerCase().includes('leçon') || String(row.kind || '').toLowerCase().includes('lecon'),
    )
    const realizedLessons = lessonRows.filter((row) => isRealizedLesson(row.status))
    const hoursCompleted = realizedLessons.reduce(
      (sum, row) => sum + Number(row.duration_minutes || 0) / 60,
      0,
    )

    const monthlyTrend = {}
    payments.forEach((row) => {
      const key = monthKey(row.paid_at)
      if (!key) return
      monthlyTrend[key] = (monthlyTrend[key] || 0) + Number(row.amount || 0)
    })
    const monthlyTrendRows = Object.entries(monthlyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, revenue]) => ({
        month,
        label: formatMonthLabel(month),
        revenue,
      }))

    const maxMonthly = Math.max(...monthlyTrendRows.map((row) => row.revenue), 1)

    return {
      dashboard: {
        monthlyRevenue,
        annualRevenue,
        activeStudents,
        hoursCompleted: Math.round(hoursCompleted * 10) / 10,
        averageBasket,
        remainingToCollect: summary.remaining,
        revenueByNature: summary.incomeByNature,
        totalCollected: summary.totalIncome,
        contractTotal,
        monthlyTrend: monthlyTrendRows,
        maxMonthly,
      },
      error: null,
    }
  } catch (error) {
    return { dashboard: null, error }
  }
}

export async function fetchGlobalProfitabilityStats() {
  return fetchProfitabilityDashboard({ global: true })
}

function formatMonthLabel(ym) {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export { formatEur, formatMonthLabel }
