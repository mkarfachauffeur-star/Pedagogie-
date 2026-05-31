import { useEffect, useState } from 'react'
import { fetchPlatformStats } from '../../services/platform'

export default function PlatformDashboardPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchPlatformStats().then(setStats)
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-950">Tableau de bord PEDAGOGIA DRIVE</h1>
      <p className="text-slate-500">Vue globale de la plateforme SaaS.</p>
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Auto-écoles" value={stats.totalOrganizations} />
          <Kpi label="Élèves (total)" value={stats.totalStudents} />
          <Kpi label="En essai" value={stats.orgsByStatus?.trial ?? 0} />
          <Kpi label="Actives" value={stats.orgsByStatus?.active ?? 0} />
          <Kpi label="Suspendues" value={stats.orgsByStatus?.suspended ?? 0} />
          <Kpi label="Annulées" value={stats.orgsByStatus?.cancelled ?? 0} />
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-cyan-700">{value}</p>
    </article>
  )
}
