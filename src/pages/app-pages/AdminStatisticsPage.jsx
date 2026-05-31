import { useCallback, useEffect, useMemo, useState } from 'react'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../context/AuthContext'
import {
  EXPENSE_CATEGORIES,
  PAYMENT_NATURES,
  fetchFinancialData,
  formatEur,
  todayIso,
} from '../../services/finance'

function defaultDateFrom() {
  const now = new Date()
  return `${now.getFullYear()}-01-01`
}

export default function AdminStatisticsPage() {
  const { profileId } = useAuth()
  const [dateFrom, setDateFrom] = useState(defaultDateFrom)
  const [dateTo, setDateTo] = useState(todayIso())
  const [summary, setSummary] = useState(null)
  const [payments, setPayments] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const refresh = useCallback(async () => {
    if (!profileId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    const result = await fetchFinancialData({
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    })
    if (result.error) setLoadError('Impossible de charger les statistiques financières.')
    setSummary(result.summary)
    setPayments(result.payments)
    setExpenses(result.expenses)
    setLoading(false)
  }, [profileId, dateFrom, dateTo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const monthlyTrend = useMemo(() => {
    const buckets = {}
    const addToBucket = (dateStr, amount, kind) => {
      const key = String(dateStr).slice(0, 7)
      if (!key || key.length < 7) return
      if (!buckets[key]) buckets[key] = { income: 0, expense: 0 }
      buckets[key][kind] += Number(amount || 0)
    }
    payments.forEach((item) => addToBucket(item.paid_at, item.amount, 'income'))
    expenses.forEach((item) => addToBucket(item.spent_at, item.amount, 'expense'))
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month,
        label: formatMonthLabel(month),
        ...values,
        net: values.income - values.expense,
      }))
  }, [payments, expenses])

  const maxMonthly = useMemo(
    () => Math.max(...monthlyTrend.map((row) => Math.max(row.income, row.expense)), 1),
    [monthlyTrend],
  )

  if (!profileId) {
    return <EmptyState title="Connexion requise" message="Connectez-vous avec votre compte gérant." icon="📈" />
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          Analyse
        </p>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Statistiques financières</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50">
          Vue consolidée des entrées et sorties enregistrées par le secrétariat et les enseignants.
        </p>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-md">
          <FilterField label="Période — du" type="date" value={dateFrom} onChange={setDateFrom} />
          <FilterField label="Période — au" type="date" value={dateTo} onChange={setDateTo} />
        </div>
      </section>

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {loadError}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement des statistiques…</p>
      ) : summary ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Chiffre encaissé" value={formatEur(summary.totalIncome)} hint={`${summary.paymentCount} encaissement(s)`} />
            <StatCard label="Total dépenses" value={formatEur(summary.totalExpenses)} hint={`${summary.expenseCount} dépense(s)`} tone="rose" />
            <StatCard
              label="Résultat net"
              value={formatEur(summary.netBalance)}
              hint="Encaissements − dépenses"
              tone={summary.netBalance >= 0 ? 'cyan' : 'rose'}
            />
            <StatCard label="Contrats signés" value={formatEur(summary.contractTotal)} hint={`Reste à payer : ${formatEur(summary.remaining)}`} tone="amber" />
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-extrabold text-slate-950">Évolution mensuelle</h2>
            {monthlyTrend.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Pas de mouvements sur la période.</p>
            ) : (
              <div className="mt-6 grid gap-4">
                {monthlyTrend.map((row) => (
                  <div key={row.month}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-black text-slate-800">{row.label}</span>
                      <span className={`font-black ${row.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Net {formatEur(row.net)}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      <BarRow label="Entrées" amount={row.income} max={maxMonthly} color="bg-emerald-500" />
                      <BarRow label="Sorties" amount={row.expense} max={maxMonthly} color="bg-rose-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <CategoryGrid title="Répartition des encaissements" categories={PAYMENT_NATURES} data={summary.incomeByNature} tone="income" />
            <CategoryGrid title="Répartition des dépenses" categories={EXPENSE_CATEGORIES} data={summary.expensesByCategory} tone="expense" />
          </section>
        </>
      ) : null}
    </div>
  )
}

function formatMonthLabel(ym) {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function FilterField({ label, type, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-800"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function StatCard({ label, value, hint, tone = 'cyan' }) {
  const color = tone === 'rose' ? 'text-rose-600' : tone === 'amber' ? 'text-amber-600' : 'text-cyan-600'
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
      {hint && <p className="mt-2 text-xs font-semibold text-slate-400">{hint}</p>}
    </article>
  )
}

function BarRow({ label, amount, max, color }) {
  const pct = max > 0 ? Math.round((amount / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs font-bold text-slate-500">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-24 shrink-0 text-right text-xs font-black text-slate-700">{formatEur(amount)}</span>
    </div>
  )
}

function CategoryGrid({ title, categories, data, tone }) {
  const total = Object.values(data || {}).reduce((sum, value) => sum + value, 0)
  const textColor = tone === 'income' ? 'text-emerald-600' : 'text-rose-600'

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
      <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {categories.map((category) => {
          const amount = data?.[category] || 0
          const pct = total > 0 ? Math.round((amount / total) * 100) : 0
          return (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3" key={category}>
              <p className="text-xs font-bold text-slate-500">{category}</p>
              <p className={`mt-1 text-lg font-black ${amount > 0 ? textColor : 'text-slate-400'}`}>
                {formatEur(amount)}
              </p>
              {amount > 0 && <p className="text-xs text-slate-400">{pct} % du total</p>}
            </div>
          )
        })}
      </div>
    </article>
  )
}
