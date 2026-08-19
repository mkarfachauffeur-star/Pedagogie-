import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BrandLogo from '../../BrandLogo'
import MarketingThemeToggle from '../MarketingThemeToggle'
import { useMarketingTheme } from '../../../hooks/useMarketingTheme'
import { trackDemoRequestClick } from '../../../lib/analytics'
import { isLandingHome, LANDING_NAV_LINKS, scrollToLandingSection } from './landingNav'

function NavItem({ item, className, onNavigate, isHome }) {
  if (item.route) {
    return (
      <Link className={className} onClick={onNavigate} to={item.href}>
        {item.label}
      </Link>
    )
  }

  if (!isHome) {
    return (
      <Link className={className} onClick={onNavigate} to={`/${item.href}`}>
        {item.label}
      </Link>
    )
  }

  return (
    <a
      className={className}
      href={item.href}
      onClick={(event) => {
        const id = item.href.startsWith('#') ? item.href.slice(1) : ''
        if (!id || !document.getElementById(id)) return
        event.preventDefault()
        onNavigate?.()
        window.setTimeout(() => {
          scrollToLandingSection(item.href)
          window.history.replaceState(null, '', item.href)
        }, 0)
      }}
    >
      {item.label}
    </a>
  )
}

export default function LandingHeader() {
  const { pathname } = useLocation()
  const isHome = isLandingHome(pathname)
  const { isDark, toggleTheme } = useMarketingTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const navClass = 'text-sm font-medium text-[var(--lp-muted)] transition hover:text-[var(--lp-ink)]'
  const toggleClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--lp-border)] text-[var(--lp-ink)] transition hover:bg-[var(--lp-bg-alt)]'
  const demoClass =
    'inline-flex h-10 items-center justify-center rounded-[12px] bg-[#EF3340] px-5 text-sm font-semibold text-white transition hover:bg-[#d92b38]'

  const logo = <BrandLogo animated={false} idPrefix="landing-nav" variant={isDark ? 'marketing' : 'light'} />

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition ${
        scrolled ? 'border-[var(--lp-border)] bg-[var(--lp-bg)]/80' : 'border-transparent bg-[var(--lp-bg)]/55'
      }`}
    >
      <div className="mx-auto grid h-16 max-w-[1280px] grid-cols-[1fr_auto] items-center gap-3 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        {isHome ? (
          <a aria-label="PEDAGOGIA DRIVE - Accueil" className="inline-flex shrink-0 items-center" href="#accueil">
            {logo}
          </a>
        ) : (
          <Link aria-label="PEDAGOGIA DRIVE - Accueil" className="inline-flex shrink-0 items-center" to="/">
            {logo}
          </Link>
        )}
        <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
          {LANDING_NAV_LINKS.map((item) => (
            <NavItem className={navClass} isHome={isHome} item={item} key={item.href} />
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              className="inline-flex h-10 items-center rounded-[12px] px-4 text-sm font-medium text-[var(--lp-muted)] transition hover:text-[var(--lp-ink)]"
              to="/login"
            >
              Se connecter
            </Link>
            {isHome ? (
              <a className={demoClass} href="#demonstration" onClick={() => trackDemoRequestClick('header')}>
                Demander une démonstration
              </a>
            ) : (
              <Link className={demoClass} onClick={() => trackDemoRequestClick('header')} to="/#demonstration">
                Demander une démonstration
              </Link>
            )}
          </div>
          <MarketingThemeToggle className={toggleClass} isDark={isDark} onToggle={toggleTheme} />
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--lp-border)] lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            type="button"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-[var(--lp-border)] bg-[var(--lp-bg)]/95 px-4 py-5 backdrop-blur-xl lg:hidden">
          <motion.div animate={{ opacity: 1, y: 0 }} className="grid gap-1" initial={{ opacity: 0, y: -6 }}>
            {LANDING_NAV_LINKS.map((item) => (
              <NavItem
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-[var(--lp-ink)]"
                isHome={isHome}
                item={item}
                key={item.href}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
            <Link
              className="mt-3 flex h-11 items-center justify-center rounded-[12px] border-2 border-[var(--lp-ink)] bg-[var(--lp-card)] text-sm font-semibold text-[var(--lp-ink)] shadow-sm"
              onClick={() => setMobileOpen(false)}
              to="/login"
            >
              Se connecter
            </Link>
            {isHome ? (
              <a
                className="flex h-11 items-center justify-center rounded-[12px] bg-[#EF3340] text-sm font-semibold text-white"
                href="#demonstration"
                onClick={() => {
                  trackDemoRequestClick('mobile_menu')
                  setMobileOpen(false)
                }}
              >
                Demander une démonstration
              </a>
            ) : (
              <Link
                className="flex h-11 items-center justify-center rounded-[12px] bg-[#EF3340] text-sm font-semibold text-white"
                onClick={() => {
                  trackDemoRequestClick('mobile_menu')
                  setMobileOpen(false)
                }}
                to="/#demonstration"
              >
                Demander une démonstration
              </Link>
            )}
          </motion.div>
        </div>
      )}
    </header>
  )
}
