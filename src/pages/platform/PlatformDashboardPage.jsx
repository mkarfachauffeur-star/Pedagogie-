import { useEffect, useState } from 'react'
import { fetchPlatformStats } from '../../services/platform'
import { fetchGlobalProfitabilityStats, formatEur } from '../../services/profitability'
import PageHero from '../../components/ui/PageHero'

export default function PlatformDashboardPage() {
  const [stats, setStats] = useState(null)
  const [profitability, setProfitability] = useState(null)

  useEffect(() => {
    fetchPlatformStats().then(setStats)
    fetchGlobalProfitabilityStats().then(({ dashboard }) => setProfitability(dashboard))
  }, [])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHero
        eyebrow="Super Admin"
        title="Tableau de bord PEDAGOGIA DRIVE"
        subtitle="Vue globale de la plateforme SaaS — statistiques agrégées de toutes les auto-écoles (lecture seule)."
      />

      {stats && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Auto-écoles" value={stats.totalOrganizations} />
          <Kpi label="Élèves (total)" value={stats.totalStudents} />
          <Kpi label="En essai" value={stats.orgsByStatus?.trial ?? 0} />
          <Kpi label="Actives" value={stats.orgsByStatus?.active ?? 0} />
          <Kpi label="Suspendues" value={stats.orgsByStatus?.suspended ?? 0} />
          <Kpi label="Annulées" value={stats.orgsByStatus?.cancelled ?? 0} />
          <Kpi label="Demandes démo" value={stats.totalDemoRequests} />
          <Kpi label="Utilisateurs" value={stats.totalUsers} />
        </section>
      )}

      {profitability && (
        <section className="rounded-[1.5rem] border-2 border-slate-300 bg-white p-5">
          <h2 className="text-xl font-extrabold text-slate-950">Rentabilité globale (toutes organisations)</h2>
          <p className="mt-1 text-sm text-slate-500">Les tarifs unitaires restent modifiables uniquement par chaque gérant.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi label="CA mensuel global" value={formatEur(profitability.monthlyRevenue)} />
            <Kpi label="CA annuel global" value={formatEur(profitability.annualRevenue)} />
            <Kpi label="Élèves actifs" value={profitability.activeStudents} />
            <Kpi label="Heures réalisées" value={`${profitability.hoursCompleted} h`} />
            <Kpi label="Panier moyen / élève" value={formatEur(profitability.averageBasket)} />
            <Kpi label="Restant à encaisser" value={formatEur(profitability.remainingToCollect)} />
          </div>
        </section>
      )}
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <article className="rounded-2xl border-2 border-slate-300 bg-white p-5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-cyan-700">{value}</p>
    </article>
  )
}
