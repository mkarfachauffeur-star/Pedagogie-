import { useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import { listAuditLogs } from '../../services/platform'

export default function PlatformAuditPage() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    listAuditLogs({ limit: 200 }).then(({ logs: rows }) => setLogs(rows))
  }, [])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHero
        eyebrow="Super Admin"
        title="Journaux d'audit"
        subtitle="Conservation 7 ans — création, modification, suppression, connexion, exports."
      />
      <div className="overflow-x-auto rounded-2xl border-2 border-slate-300 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs font-black uppercase text-slate-400">
              <th className="p-3">Date</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entité</th>
              <th className="p-3">Utilisateur</th>
              <th className="p-3">Org</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-50">
                <td className="p-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                <td className="p-3 font-bold">{log.action}</td>
                <td className="p-3">{log.entity_type} {log.entity_label ? `· ${log.entity_label}` : ''}</td>
                <td className="p-3">{log.actor_email || log.actor_id?.slice(0, 8) || '—'}</td>
                <td className="p-3 text-xs text-slate-500">{log.organization_id?.slice(0, 8) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
