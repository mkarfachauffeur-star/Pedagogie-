import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { NAVIGATION } from '../config/navigation'
import { clearStoredRole } from '../utils/authSession'

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
    return <div className="full-width-page min-h-screen w-full bg-[#030b18]">{children}</div>
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="pd-shell relative flex min-h-screen">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-[70] bg-[#071a2f]/45 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`app-sidebar pointer-events-auto fixed left-0 top-0 z-[80] h-[100dvh] max-h-[100dvh] w-[270px] shrink-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] lg:sticky lg:z-50 lg:h-screen lg:max-h-screen ${sidebarCollapsed ? 'lg:w-[84px]' : 'lg:w-[270px]'}
          border-r border-white/18 bg-[#0a223c]/70 text-white shadow-[var(--shadow-sidebar)] backdrop-blur-2xl
          transition-all duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <button
          aria-label={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          className="absolute -right-4 top-8 z-[90] hidden h-9 w-9 items-center justify-center rounded-full border border-white/22 bg-white/16 text-base font-bold text-cyan-100 shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-cyan-300/45 hover:bg-white/20 lg:flex"
          onClick={() => setSidebarCollapsed((current) => !current)}
          title={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          type="button"
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>

        <div
          className="flex min-h-screen flex-col overflow-y-auto [-webkit-overflow-scrolling:touch]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div
            className={`flex items-center border-b border-white/16 px-5 py-6 transition-all duration-300 ${sidebarCollapsed ? 'lg:justify-center lg:px-3' : 'gap-3'}`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.16] text-xl shadow-sm backdrop-blur-sm">
              {'\u{1F697}'}
            </div>
            <div
              className={`min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}
            >
              <p className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-blue-400 bg-clip-text text-[11px] font-bold uppercase tracking-[0.14em] text-transparent">
                PEDAGOGIA DRIVE
              </p>
              <p className="mt-0.5 text-xs font-medium text-cyan-50/70">Espace professionnel</p>
            </div>
            <button
              aria-label="Fermer le menu"
              className="ml-auto inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.14] px-3 text-sm font-semibold text-cyan-50 transition hover:bg-white/[0.2] lg:hidden"
              onClick={closeSidebar}
              type="button"
            >
              <span className="text-lg leading-none">←</span>
              Fermer
            </button>
          </div>

          {config.user && (
            <div
              className={`mx-4 mt-5 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.14] p-3.5 shadow-sm backdrop-blur-md transition-all duration-300 ${sidebarCollapsed ? 'lg:mx-3 lg:justify-center lg:px-2' : ''}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-cyan-600 text-lg text-white shadow-sm">
                {config.user.avatar}
              </div>
              <div
                className={`min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}
              >
                <p className="truncate text-sm font-semibold text-white">{config.user.name}</p>
                {config.user.role && <p className="text-xs text-cyan-50/65">{config.user.role}</p>}
              </div>
            </div>
          )}

          <nav
            className={`flex-1 space-y-1 overflow-y-auto px-3 py-5 [-webkit-overflow-scrolling:touch] ${sidebarCollapsed ? 'lg:px-2' : ''}`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {config.items.map((item) => {
              const active = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  title={item.label}
                  to={item.href}
                  onClick={closeSidebar}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''} ${
                    active
                      ? 'border border-cyan-300/35 bg-white/[0.2] text-white shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                      : 'border border-transparent text-cyan-50/85 hover:border-white/20 hover:bg-white/[0.16] hover:text-white'
                  }`}
                >
                  <span
                    className={`pd-nav-icon ${active ? 'border-cyan-300/35 bg-cyan-500/15' : 'group-hover:border-white/18 group-hover:bg-white/[0.08]'}`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`truncate transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className={`border-t border-white/10 p-4 transition-all duration-300 ${sidebarCollapsed ? 'lg:px-3' : ''}`}>
            <button
              type="button"
              onClick={() => {
                clearStoredRole()
                navigate('/login')
              }}
            className={`flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/18 bg-white/[0.12] px-4 py-2.5 text-sm font-medium text-cyan-50/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-white/25 hover:bg-white/[0.18] hover:text-white ${sidebarCollapsed ? 'lg:px-2' : ''}`}
              title="Choisir un profil"
            >
              <span className="text-base leading-none">{'\u{1F519}'}</span>
              <span
                className={`truncate transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}
              >
                Changer de profil
              </span>
            </button>
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/16 bg-[#0a223c]/68 px-4 py-3.5 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.14] px-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:border-cyan-300/35 hover:bg-white/[0.2]"
            aria-label="Ouvrir le menu"
          >
            <span className="text-lg leading-none">→</span>
            Menu
          </button>
          <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-blue-400 bg-clip-text text-[11px] font-bold uppercase tracking-[0.14em] text-transparent">
            PEDAGOGIA DRIVE
          </span>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-x-hidden p-5 md:p-7 lg:p-9 animate-fade-in">{children}</main>
      </div>
    </div>
  )
}
