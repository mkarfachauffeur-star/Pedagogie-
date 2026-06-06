import { supabase } from '../lib/supabase'
import { toUserError } from '../lib/userFacingError'

export const PAYMENT_METHODS = ['Carte bancaire', 'Espèces', 'Chèque', 'Virement']

export const PAYMENT_NATURES = [
  'Inscription',
  'Forfait',
  'Heure supplémentaire',
  'Code de la route',
  'Présentation examen',
  'Régularisation',
  'Autre',
]

export const EXPENSE_CATEGORIES = [
  'Carburant',
  'Entretien / réparation',
  'Code de la route',
  'Fournitures',
  'Frais administratifs',
  'Autre',
]

export const formatEur = (value) => `${Number(value || 0).toLocaleString('fr-FR')} €`

export const formatDateFr = (value) => {
  if (!value) return '—'
  const [year, month, day] = String(value).slice(0, 10).split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export const todayIso = () => new Date().toISOString().slice(0, 10)

export function studentLabel(student) {
  if (!student) return 'Élève'
  return `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Élève'
}

export async function listPayments(filters = {}) {
  try {
    let query = supabase
      .from('payments')
      .select(`
        id,
        student_id,
        amount,
        currency,
        paid_at,
        method,
        nature,
        comment,
        created_at,
        created_by,
        students:student_id(first_name, last_name, file_number)
      `)
      .order('paid_at', { ascending: false })

    if (filters.dateFrom) query = query.gte('paid_at', filters.dateFrom)
    if (filters.dateTo) query = query.lte('paid_at', filters.dateTo)
    if (filters.studentId) query = query.eq('student_id', filters.studentId)

    const { data, error } = await query
    if (error) throw error
    return { payments: data || [], error: null }
  } catch (error) {
    return { payments: [], error }
  }
}

export async function createPayment(payload) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        organization_id: payload.organizationId,
        student_id: payload.studentId,
        amount: Number(payload.amount),
        paid_at: payload.paidAt,
        method: payload.method,
        nature: payload.nature,
        comment: payload.comment || null,
        created_by: payload.createdBy,
      })
      .select('id')
      .single()
    if (error) throw error
    return { payment: data, error: null }
  } catch (error) {
    return { payment: null, error: toUserError(error, 'save') }
  }
}

export async function listExpenses(filters = {}) {
  try {
    let query = supabase
      .from('expenses')
      .select(`
        id,
        category,
        amount,
        currency,
        spent_at,
        vehicle_id,
        comment,
        created_at,
        created_by,
        vehicles:vehicle_id(brand, model, plate)
      `)
      .order('spent_at', { ascending: false })

    if (filters.dateFrom) query = query.gte('spent_at', filters.dateFrom)
    if (filters.dateTo) query = query.lte('spent_at', filters.dateTo)
    if (filters.category) query = query.eq('category', filters.category)

    const { data, error } = await query
    if (error) throw error
    return { expenses: data || [], error: null }
  } catch (error) {
    return { expenses: [], error }
  }
}

export async function createExpense(payload) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        organization_id: payload.organizationId,
        category: payload.category,
        amount: Number(payload.amount),
        spent_at: payload.spentAt,
        vehicle_id: payload.vehicleId || null,
        comment: payload.comment || null,
        created_by: payload.createdBy,
      })
      .select('id')
      .single()
    if (error) throw error
    return { expense: data, error: null }
  } catch (error) {
    return { expense: null, error: toUserError(error, 'save') }
  }
}

export async function listContracts() {
  try {
    const { data, error } = await supabase.from('contracts').select('student_id, contract_total')
    if (error) throw error
    return { contracts: data || [], error: null }
  } catch (error) {
    return { contracts: [], error }
  }
}

export async function upsertContract({ organizationId, studentId, contractTotal }) {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .upsert(
        {
          organization_id: organizationId,
          student_id: studentId,
          contract_total: Number(contractTotal) || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id' },
      )
      .select('student_id, contract_total')
      .single()
    if (error) throw error
    return { contract: data, error: null }
  } catch (error) {
    return { contract: null, error }
  }
}

export async function listVehicles() {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, brand, model, plate')
      .order('created_at', { ascending: true })
    if (error) throw error
    return { vehicles: data || [], error: null }
  } catch (error) {
    return { vehicles: [], error }
  }
}

export function contractsMap(contracts = []) {
  return Object.fromEntries(
    contracts.map((row) => [row.student_id, Number(row.contract_total || 0)]),
  )
}

export function getStudentSummary(studentId, payments, contractTotals) {
  const contractTotal = Number(contractTotals[studentId] || 0)
  const paid = payments
    .filter((item) => item.student_id === studentId)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  return { contractTotal, paid, remaining: Math.max(contractTotal - paid, 0) }
}

export function buildFinancialSummary({ payments = [], expenses = [], contracts = [] }) {
  const totalIncome = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const contractTotal = contracts.reduce((sum, item) => sum + Number(item.contract_total || 0), 0)

  const paidByStudent = {}
  payments.forEach((item) => {
    paidByStudent[item.student_id] = (paidByStudent[item.student_id] || 0) + Number(item.amount || 0)
  })

  const contractByStudent = contractsMap(contracts)
  const studentIds = new Set([...Object.keys(paidByStudent), ...Object.keys(contractByStudent)])
  let remaining = 0
  studentIds.forEach((id) => {
    remaining += Math.max((contractByStudent[id] || 0) - (paidByStudent[id] || 0), 0)
  })

  const incomeByNature = {}
  payments.forEach((item) => {
    incomeByNature[item.nature] = (incomeByNature[item.nature] || 0) + Number(item.amount || 0)
  })

  const expensesByCategory = {}
  expenses.forEach((item) => {
    expensesByCategory[item.category] = (expensesByCategory[item.category] || 0) + Number(item.amount || 0)
  })

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    contractTotal,
    remaining,
    paymentCount: payments.length,
    expenseCount: expenses.length,
    incomeByNature,
    expensesByCategory,
  }
}

export async function fetchFinancialData(filters = {}) {
  const [paymentsRes, expensesRes, contractsRes] = await Promise.all([
    listPayments(filters),
    listExpenses(filters),
    listContracts(),
  ])
  const summary = buildFinancialSummary({
    payments: paymentsRes.payments,
    expenses: expensesRes.expenses,
    contracts: contractsRes.contracts,
  })
  return {
    payments: paymentsRes.payments,
    expenses: expensesRes.expenses,
    contracts: contractsRes.contracts,
    summary,
    error: paymentsRes.error || expensesRes.error || contractsRes.error,
  }
}

export function vehicleLabel(vehicle) {
  if (!vehicle) return null
  const name = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim()
  return vehicle.plate ? `${name} · ${vehicle.plate}` : name || 'Véhicule'
}
