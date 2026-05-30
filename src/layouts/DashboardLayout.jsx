import { Bell, ChevronLeft, LogOut, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
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
    return <div className="full-width-page min-h-screen w-full bg-[#f0f7ff]">{children}</div>
  }

  const closeSidebar = () => setSidebarOpen(false)
  const activeItem = config.items.find((item) => location.pathname === item.href)

  return (
    <div className="pd-shell relative flex min-h-screen">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-[70] bg-slate-900/20 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`app-sidebar pointer-events-auto fixed left-0 top-0 z-[80] h-[100dvh] max-h-[100dvh] shrink-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] lg:sticky lg:z-50 lg:h-screen lg:max-h-screen ${sidebarCollapsed ? 'lg:w-[84px]' : 'lg:w-[280px]'} w-[280px]
          border-r border-blue-100/90 bg-white text-slate-800 shadow-[var(--shadow-sidebar)]
          transition-all duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <button
          aria-label={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          className="absolute -right-4 top-8 z-[90] hidden h-8 w-8 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-500 shadow-md transition hover:border-blue-300 hover:text-blue-600 lg:flex"
          onClick={() => setSidebarCollapsed((current) => !current)}
          title={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          type="button"
        >
          <ChevronLeft className={`h-4 w-4 transition ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex h-full min-h-0 flex-col">
          <div
            className={`border-b border-blue-50 px-5 py-5 transition-all duration-300 ${sidebarCollapsed ? 'lg:flex lg:justify-center lg:px-3' : ''}`}
          >
            <Link aria-label="PEDAGOGIA DRIVE" onClick={closeSidebar} to="/">
              <BrandLogo animated={false} compact={sidebarCollapsed} idPrefix={`sidebar-${role}`} variant="light" />
            </Link>
            {!sidebarCollapsed && (
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Espace professionnel
              </p>
            )}
          </div>

          {config.user && (
            <div
              className={`mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-blue-100/80 bg-blue-50/70 p-3 transition-all duration-300 ${sidebarCollapsed ? 'lg:mx-3 lg:justify-center lg:px-2' : ''}`}
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg text-white shadow-sm">
                {config.user.avatar}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div
                className={`min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}
              >
                <p className="truncate text-sm font-semibold text-slate-900">{config.user.name}</p>
                {config.user.role && (
                  <p className="text-xs text-slate-500">{config.user.role}</p>
                )}
              </div>
            </div>
          )}

          <nav
            className={`flex-1 space-y-1 overflow-y-auto px-3 py-4 ${sidebarCollapsed ? 'lg:px-2' : ''}`}
            aria-label="Navigation principale"
          >
            {config.items.map((item) => {
              const active = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  title={item.label}
                  to={item.href}
                  onClick={closeSidebar}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''} ${
                    active
                      ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10'
                      : 'border border-transparent text-slate-600 hover:border-blue-100 hover:bg-blue-50/80 hover:text-slate-900'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-400" />
                  )}
                  <span
                    className={`pd-nav-icon ${active ? 'border-blue-200 bg-blue-50 text-blue-600' : 'group-hover:border-blue-200 group-hover:bg-white'}`}
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

          <div className={`border-t border-blue-50 p-4 ${sidebarCollapsed ? 'lg:px-3' : ''}`}>
            <button
              type="button"
              onClick={() => {
                clearStoredRole()
                navigate('/login')
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 ${sidebarCollapsed ? 'lg:px-2' : ''}`}
              title="Changer de profil"
            >
              <LogOut className="h-4 w-4 shrink-0" />
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
        <header className="pd-topbar">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                {activeItem?.label || 'Tableau de bord'}
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {config.user?.name || 'PEDAGOGIA DRIVE'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                3
              </span>
            </button>
            {config.user && (
              <div className="hidden items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm sm:flex">
                <span className="text-lg">{config.user.avatar}</span>
                <span className="text-sm font-medium text-slate-700">{config.user.name}</span>
              </div>
            )}
          </div>
        </header>

        <main className="pd-main flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
          <div className="page-shell" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
