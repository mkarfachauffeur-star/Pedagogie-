import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { NAVIGATION } from '../config/navigation'

export default function DashboardLayout({ role, children, fullWidth = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const config = NAVIGATION[role]
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!sidebarOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const previousPosition = document.body.style.position
    const previousTop = document.body.style.top
    const previousWidth = document.body.style.width
    const scrollY = window.scrollY

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.position = previousPosition
      document.body.style.top = previousTop
      document.body.style.width = previousWidth
      window.scrollTo(0, scrollY)
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
          className="fixed inset-0 z-[70] bg-navy-950/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`app-sidebar pointer-events-auto fixed left-0 top-0 z-[80] h-[100dvh] max-h-[100dvh] w-[270px] shrink-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] lg:sticky lg:z-50 lg:h-screen lg:max-h-screen ${sidebarCollapsed ? 'lg:w-[84px]' : 'lg:w-[270px]'}
          bg-gradient-to-b from-navy-900 to-navy-950 text-white
          border-r border-white/5 shadow-xl
          transition-all duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <button
          aria-label={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          className="absolute -right-4 top-7 z-[90] hidden h-9 w-9 items-center justify-center rounded-full border border-cyan-200/70 bg-white text-lg font-black text-navy-950 shadow-xl shadow-cyan-950/20 transition hover:scale-105 hover:bg-cyan-100 lg:flex"
          onClick={() => setSidebarCollapsed((current) => !current)}
          title={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          type="button"
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
        <div className="flex min-h-screen flex-col overflow-y-auto [-webkit-overflow-scrolling:touch]" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className={`flex items-center border-b border-white/10 px-4 py-6 transition-all duration-300 ${sidebarCollapsed ? 'lg:justify-center lg:px-3' : 'gap-3 lg:justify-start'}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-lg shadow-lg shadow-cyan-500/30">
              {'\u{1F697}'}
            </div>
            <div className={`min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}>
              <p className="text-sm font-bold tracking-wide leading-tight">PEDAGOGIA</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-400/90">
                Drive
              </p>
            </div>
            <button
              aria-label="← Fermer"
              className="ml-auto flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-black text-cyan-100 transition hover:bg-white/15 lg:hidden"
              onClick={closeSidebar}
              type="button"
            >
              <span className="text-xl leading-none">←</span>
              Fermer
            </button>
          </div>

          {config.user && (
            <div className={`mx-4 mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all duration-300 ${sidebarCollapsed ? 'lg:mx-3 lg:justify-center lg:px-2' : ''}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-700 to-cyan-600 text-lg">
                {config.user.avatar}
              </div>
              <div className={`min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}>
                <p className="truncate text-sm font-semibold">{config.user.name}</p>
                {config.user.role && (
                  <p className="text-xs text-white/50">{config.user.role}</p>
                )}
              </div>
            </div>
          )}

          <nav className={`flex-1 overflow-y-auto px-3 py-4 space-y-0.5 [-webkit-overflow-scrolling:touch] ${sidebarCollapsed ? 'lg:px-2' : ''}`} style={{ WebkitOverflowScrolling: 'touch' }}>
            {config.items.map((item) => {
              const active = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  title={item.label}
                  to={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''} ${
                    active
                      ? 'bg-cyan-500/20 text-white shadow-inner border-l-2 border-cyan-400'
                      : 'text-white/65 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="w-6 text-center text-base shrink-0">{item.icon}</span>
                  <span className={`truncate transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className={`border-t border-white/10 p-4 transition-all duration-300 ${sidebarCollapsed ? 'lg:px-3' : ''}`}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white ${sidebarCollapsed ? 'lg:px-2' : ''}`}
              title="Retour accueil"
            >
              <span>{'\u{1F3E0}'}</span>
              <span className={`truncate transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}>Retour accueil</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy-950 px-3 text-sm font-black text-white shadow-md shadow-navy-950/10 transition-colors hover:bg-cyan-700"
            aria-label="→ Menu"
          >
            <span className="text-xl leading-none">→</span>
            Menu
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
