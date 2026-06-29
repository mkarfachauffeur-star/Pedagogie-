import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import BetaDevelopmentBanner from '../components/marketing/BetaDevelopmentBanner'
import MarketingThemeToggle from '../components/marketing/MarketingThemeToggle'
import PublicFooter from '../components/marketing/PublicFooter'
import { useMarketingTheme } from '../hooks/useMarketingTheme'
import { marketingSkin } from '../lib/marketingTheme'

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]

export default function BlogMarketingLayout({ children }) {
  const { theme, toggleTheme } = useMarketingTheme()
  const skin = marketingSkin(theme)
  const isDark = skin.isDark
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const headerActionSizeClass =
    'inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-2xl px-5 text-sm font-black 2xl:px-6'

  return (
    <div className={skin.page} data-theme={theme}>
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-xl focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        href="#main-content"
      >
        Aller au contenu principal
      </a>
      <div className={skin.ambient} />

      <header className={skin.header}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link aria-label="Pedagogia Drive — Accueil" className="inline-flex shrink-0 items-center" to="/">
            <BrandLogo isDark={isDark} />
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-6 md:flex">
            {navLinks.map((item) => (
              <Link
                className={skin.navLink(location.pathname === item.to || (item.to === '/blog' && location.pathname.startsWith('/blog')))}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <Link className={`${headerActionSizeClass} ${skin.loginBtn}`} to="/login">
                Se connecter
              </Link>
              <Link
                className={`${headerActionSizeClass} bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-900/35 transition hover:-translate-y-0.5 hover:brightness-110`}
                to="/#demonstration"
              >
                Demander une démo
              </Link>
            </div>
            <MarketingThemeToggle className={skin.themeToggle} isDark={isDark} onToggle={toggleTheme} />
            <button
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className={skin.menuToggle}
              onClick={() => setMobileOpen((value) => !value)}
              type="button"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className={skin.mobileMenu}>
            <div className="grid gap-3">
              {navLinks.map((item) => (
                <Link
                  className={skin.mobileNav}
                  key={item.to}
                  onClick={() => setMobileOpen(false)}
                  to={item.to}
                >
                  {item.label}
                </Link>
              ))}
              <div className={`mt-3 grid gap-3 border-t pt-4 ${skin.mobileDivider}`}>
                <Link className={`inline-flex h-12 items-center justify-center rounded-2xl text-sm font-black ${skin.mobileLogin}`} onClick={() => setMobileOpen(false)} to="/login">
                  Se connecter
                </Link>
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 text-sm font-black text-white"
                  onClick={() => setMobileOpen(false)}
                  to="/#demonstration"
                >
                  Demander une démo
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <BetaDevelopmentBanner isDark={isDark} />

      <main id="main-content">{children}</main>

      <PublicFooter isDark={isDark} />
    </div>
  )
}

export function useBlogSkin() {
  const { theme } = useMarketingTheme()
  const skin = marketingSkin(theme)
  return { skin, isDark: skin.isDark }
}
