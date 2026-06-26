import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { href: '/platform/dashboard', label: 'Tableau de bord' },
  { href: '/platform/organizations', label: 'Auto-écoles' },
  { href: '/platform/subscriptions', label: 'Abonnements' },
  { href: '/platform/audit', label: 'Audits' },
]

export default function PlatformLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-64 shrink-0 border-r-2 border-slate-300 bg-navy-950 p-5 text-white">
        <BrandLogo />
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-cyan-300">Super Admin</p>
        <nav className="mt-8 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`block rounded-xl px-4 py-2.5 text-sm font-bold transition ${location.pathname === item.href ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button type="button" className="mt-8 text-sm font-bold text-slate-400 hover:text-white" onClick={() => { signOut(); navigate('/login') }}>
          Déconnexion
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
