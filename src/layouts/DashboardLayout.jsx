import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { NAVIGATION } from '../config/navigation'

export default function DashboardLayout({ role, children, fullWidth = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const config = NAVIGATION[role]
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!sidebarOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
    }
  }, [sidebarOpen])

  if (fullWidth) {
    return <div className="full-width-page min-h-screen w-full bg-slate-50">{children}</div>
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-screen bg-slate-100">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 z-50 flex h-[100vh] max-h-[100vh] w-[270px] shrink-0 flex-col overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]
          bg-gradient-to-b from-navy-900 to-navy-950 text-white
          border-r border-white/5 shadow-xl
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-lg shadow-lg shadow-cyan-500/30">
            {'\u{1F697}'}
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide leading-tight">PEDAGOGIA</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-400/90">
              Drive
            </p>
          </div>
        </div>

        {config.user && (
          <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-700 to-cyan-600 text-lg">
              {config.user.avatar}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{config.user.name}</p>
              {config.user.role && (
                <p className="text-xs text-white/50">{config.user.role}</p>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {config.items.map((item) => {
            const active = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-cyan-500/20 text-white shadow-inner border-l-2 border-cyan-400'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="w-6 text-center text-base shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {'\u{1F3E0}'} Retour accueil
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl bg-slate-100 p-2.5 text-navy-900 hover:bg-slate-200 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-navy-900">PEDAGOGIA DRIVE</span>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
