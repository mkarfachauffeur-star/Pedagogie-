import { useEffect, useState } from 'react'
import PageHero from '../../components/ui/PageHero'
import { listAllProfiles, updateProfileBySuperAdmin } from '../../services/platform'
import { roleLabels } from '../../utils/authSession'

export default function PlatformUsersPage() {
  const [profiles, setProfiles] = useState([])

  const refresh = () => {
    listAllProfiles().then(({ profiles: rows }) => setProfiles(rows))
  }

  useEffect(() => {
    refresh()
  }, [])

  const toggleActive = async (profile) => {
    await updateProfileBySuperAdmin(profile.id, { is_active: !profile.is_active })
    refresh()
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHero
        eyebrow="Super Admin"
        title="Utilisateurs"
        subtitle="Tous les comptes rattachés aux auto-écoles (hors Super Admin)."
      />
      <div className="overflow-x-auto rounded-2xl border-2 border-slate-300 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs font-black uppercase text-slate-400">
              <th className="p-4">Nom</th>
              <th className="p-4">E-mail</th>
              <th className="p-4">Rôle</th>
              <th className="p-4">Auto-école</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr className="border-b" key={profile.id}>
                <td className="p-4 font-bold">{profile.full_name || '—'}</td>
                <td className="p-4">{profile.email || '—'}</td>
                <td className="p-4">{roleLabels[profile.role] || profile.role}</td>
                <td className="p-4">{profile.organization?.name || '—'}</td>
                <td className="p-4">{profile.is_active ? 'Actif' : 'Désactivé'}</td>
                <td className="p-4">
                  <button
                    className="text-xs font-bold text-cyan-700"
                    onClick={() => toggleActive(profile)}
                    type="button"
                  >
                    {profile.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
