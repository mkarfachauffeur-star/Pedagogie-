import { useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import { listDemoRequests } from '../../services/platform'

export default function PlatformDemoRequestsPage() {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    listDemoRequests().then(({ requests: rows }) => setRequests(rows))
  }, [])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHero
        eyebrow="Super Admin"
        title="Demandes de démonstration"
        subtitle="Formulaire public de la page d'accueil — traiter manuellement puis créer l'auto-école."
      />
      <div className="overflow-x-auto rounded-2xl border-2 border-slate-300 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs font-black uppercase text-slate-400">
              <th className="p-4">Date</th>
              <th className="p-4">Auto-école</th>
              <th className="p-4">Contact</th>
              <th className="p-4">E-mail</th>
              <th className="p-4">Téléphone</th>
              <th className="p-4">Élèves</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((row) => (
              <tr className="border-b" key={row.id}>
                <td className="p-4 text-slate-600">
                  {new Date(row.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="p-4 font-bold">{row.school_name}</td>
                <td className="p-4">{row.contact_name}</td>
                <td className="p-4">
                  <a className="font-semibold text-cyan-700" href={`mailto:${row.email}`}>
                    {row.email}
                  </a>
                </td>
                <td className="p-4">{row.phone}</td>
                <td className="p-4">{row.approximate_students || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
