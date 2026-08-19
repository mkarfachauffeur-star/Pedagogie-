import { motion, useReducedMotion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import DemoRequestForm from '../components/marketing/DemoRequestForm'
import MarketingThemeToggle from '../components/marketing/MarketingThemeToggle'
import {
  LandingAllInOneSection,
  LandingBenefitsSection,
  LandingFaq,
  LandingFinalCta,
  LandingFooter,
  LandingGpsSection,
  LandingHero,
  LandingQcuSection,
  LandingRolesSection,
  LandingTrustStrip,
  LandingVideosSection,
} from '../components/marketing/landing/LandingSections'
import PageSeo from '../components/seo/PageSeo'
import { useMarketingTheme } from '../hooks/useMarketingTheme'
import { trackDemoRequestClick } from '../lib/analytics'
import { buildHomeJsonLd, SEO_PAGES } from '../lib/seo'

const navLinks = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Pour les auto-écoles', href: '#comment-ca-marche' },
  { label: 'Ressources', href: '/blog', route: true },
  { label: 'FAQ', href: '#faq' },
]

function NavItem({ item, className, onNavigate }) {
  if (item.route) {
    return (
      <Link className={className} onClick={onNavigate} to={item.href}>
        {item.label}
      </Link>
    )
  }
  return (
    <a className={className} href={item.href} onClick={onNavigate}>
      {item.label}
    </a>
  )
}

export default function ProfileSelection() {
  const shouldReduceMotion = useReducedMotion()
  const { theme, isDark, toggleTheme } = useMarketingTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const homeJsonLd = useMemo(() => buildHomeJsonLd(), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (window.location.hash !== '#demonstration') return
    const timer = window.setTimeout(() => {
      document.getElementById('demonstration')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => window.clearTimeout(timer)
  }, [])

  const navClass = 'text-sm font-medium text-[var(--lp-muted)] transition hover:text-[var(--lp-ink)]'
  const toggleClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--lp-border)] text-[var(--lp-ink)] transition hover:bg-[var(--lp-bg-alt)]'

  return (
    <div className="landing-page min-h-screen overflow-x-clip" data-theme={theme}>
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-xl focus:bg-[#1769FF] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        href="#main-content"
      >
        Aller au contenu principal
      </a>
      <PageSeo {...SEO_PAGES.home} jsonLd={homeJsonLd} />

      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition ${
          scrolled ? 'border-[var(--lp-border)] bg-[var(--lp-bg)]/80' : 'border-transparent bg-[var(--lp-bg)]/55'
        }`}
      >
        <div className="mx-auto grid h-16 max-w-[1280px] grid-cols-[1fr_auto] items-center gap-3 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          <a aria-label="PEDAGOGIA DRIVE - Accueil" className="inline-flex shrink-0 items-center" href="#accueil">
            <BrandLogo animated={false} idPrefix="landing-nav" variant={isDark ? 'marketing' : 'light'} />
          </a>
          <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
            {navLinks.map((item) => (
              <NavItem className={navClass} item={item} key={item.href} />
            ))}
          </nav>
          <div className="flex items-center justify-end gap-2">
            <div className="hidden items-center gap-2 lg:flex">
              <Link className="inline-flex h-10 items-center rounded-[12px] px-4 text-sm font-medium text-[var(--lp-muted)] transition hover:text-[var(--lp-ink)]" to="/login">
                Se connecter
              </Link>
              <a
                className="inline-flex h-10 items-center rounded-[12px] bg-[#EF3340] px-5 text-sm font-semibold text-white transition hover:bg-[#d92b38]"
                href="#demonstration"
                onClick={() => trackDemoRequestClick('header')}
              >
                Demander une démonstration
              </a>
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
              {navLinks.map((item) => (
                <NavItem
                  className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-[var(--lp-ink)]"
                  item={item}
                  key={item.href}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
              <Link
                className="mt-3 flex h-11 items-center justify-center rounded-[12px] border border-[var(--lp-border)] text-sm font-semibold"
                onClick={() => setMobileOpen(false)}
                to="/login"
              >
                Se connecter
              </Link>
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
            </motion.div>
          </div>
        )}
      </header>

      <main id="main-content">
        <LandingHero shouldReduceMotion={shouldReduceMotion} />
        <LandingTrustStrip shouldReduceMotion={shouldReduceMotion} />
        <LandingQcuSection shouldReduceMotion={shouldReduceMotion} />
        <LandingVideosSection shouldReduceMotion={shouldReduceMotion} />
        <LandingGpsSection shouldReduceMotion={shouldReduceMotion} />
        <LandingAllInOneSection shouldReduceMotion={shouldReduceMotion} />
        <LandingRolesSection shouldReduceMotion={shouldReduceMotion} />
        <LandingBenefitsSection shouldReduceMotion={shouldReduceMotion} />
        <LandingFinalCta shouldReduceMotion={shouldReduceMotion} />
        <LandingFaq />

        <section className="relative overflow-hidden bg-[var(--lp-bg-alt)] px-4 py-14 sm:px-6 lg:px-8 lg:py-16" id="contact">
          <DemoRequestForm isDark={isDark} />
        </section>
      </main>

      <LandingFooter isDark={isDark} />
    </div>
  )
}
