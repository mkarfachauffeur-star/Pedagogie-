import { useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import { listAllPayments } from '../../services/platform'

function formatEur(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0)
}

export default function PlatformPaymentsPage() {
  const [payments, setPayments] = useState([])

  useEffect(() => {
    listAllPayments().then(({ payments: rows }) => setPayments(rows))
  }, [])

  const total = payments.reduce((sum, row) => sum + Number(row.amount || 0), 0)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHero
        eyebrow="Super Admin"
        title="Paiements"
        subtitle="Vue globale des encaissements de toutes les auto-écoles."
      />
      <p className="rounded-2xl border-2 border-slate-300 bg-white p-4 text-sm font-bold text-slate-700">
        Total affiché : {formatEur(total)} ({payments.length} paiements)
      </p>
      <div className="overflow-x-auto rounded-2xl border-2 border-slate-300 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs font-black uppercase text-slate-400">
              <th className="p-4">Date</th>
              <th className="p-4">Auto-école</th>
              <th className="p-4">Élève</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Méthode</th>
              <th className="p-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((row) => (
              <tr className="border-b" key={row.id}>
                <td className="p-4">
                  {row.payment_date ? new Date(row.payment_date).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="p-4 font-bold">{row.organization?.name || '—'}</td>
                <td className="p-4">
                  {row.student ? `${row.student.last_name || ''} ${row.student.first_name || ''}`.trim() : '—'}
                </td>
                <td className="p-4 font-bold text-cyan-700">{formatEur(row.amount)}</td>
                <td className="p-4">{row.method || '—'}</td>
                <td className="p-4">{row.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
