import { useCallback, useEffect, useState } from 'react'

// Historique des encaissements — structure compatible Supabase.
//
// Tables cibles (Supabase) :
//   contracts(student_id pk, contract_total, currency, updated_at)
//   encaissements(id pk, student_id fk, student_name, amount, currency,
//                 paid_at, method, nature, comment, created_at)
//
// En attendant l'intégration Supabase, les données sont conservées en
// localStorage avec la même forme, prêtes à être migrées.

const STORAGE_KEY = 'pedagogia-drive-encaissements-v1'

export const PAYMENT_METHODS = ['Carte bancaire', 'Espèces', 'Chèque', 'Virement']

export const PAYMENT_NATURES = [
  'Inscription',
  'Forfait',
  'Heure supplémentaire',
  'Présentation examen',
  'Régularisation',
  'Autre',
]

function loadStore() {
  if (typeof window === 'undefined') return { contracts: {}, encaissements: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { contracts: {}, encaissements: [] }
    const parsed = JSON.parse(raw)
    return {
      contracts: parsed?.contracts && typeof parsed.contracts === 'object' ? parsed.contracts : {},
      encaissements: Array.isArray(parsed?.encaissements) ? parsed.encaissements : [],
    }
  } catch {
    return { contracts: {}, encaissements: [] }
  }
}

export function usePaymentsStore() {
  const [store, setStore] = useState(loadStore)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  }, [store])

  const setContractTotal = useCallback((studentId, total) => {
    if (!studentId) return
    setStore((current) => ({
      ...current,
      contracts: { ...current.contracts, [studentId]: Number(total) || 0 },
    }))
  }, [])

  const addEncaissement = useCallback((payload) => {
    setStore((current) => {
      const contracts = { ...current.contracts }
      if (payload.contractTotal != null && payload.contractTotal !== '') {
        contracts[payload.studentId] = Number(payload.contractTotal) || 0
      }
      const record = {
        id: `ENC-${Date.now()}`,
        studentId: payload.studentId,
        studentName: payload.studentName || '',
        amount: Number(payload.amount) || 0,
        currency: 'EUR',
        paidAt: payload.date,
        method: payload.method,
        nature: payload.nature,
        comment: payload.comment || '',
        createdAt: new Date().toISOString(),
      }
      return { contracts, encaissements: [record, ...current.encaissements] }
    })
  }, [])

  const getStudentSummary = useCallback(
    (studentId) => {
      const contractTotal = Number(store.contracts[studentId] || 0)
      const paid = store.encaissements
        .filter((item) => item.studentId === studentId)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)
      return { contractTotal, paid, remaining: Math.max(contractTotal - paid, 0) }
    },
    [store],
  )

  const getStudentEncaissements = useCallback(
    (studentId) => store.encaissements.filter((item) => item.studentId === studentId),
    [store],
  )

  return {
    contracts: store.contracts,
    encaissements: store.encaissements,
    setContractTotal,
    addEncaissement,
    getStudentSummary,
    getStudentEncaissements,
  }
}
