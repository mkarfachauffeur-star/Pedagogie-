import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DemoRequestForm from '../components/marketing/DemoRequestForm'
import MarketingFaq from '../components/marketing/MarketingFaq'
import MarketingFeaturesGrid from '../components/marketing/MarketingFeaturesGrid'
import MarketingHowItWorks from '../components/marketing/MarketingHowItWorks'
import MarketingWhySection from '../components/marketing/MarketingWhySection'
import MarketingThemeToggle from '../components/marketing/MarketingThemeToggle'
import PublicFooter from '../components/marketing/PublicFooter'
import PageSeo from '../components/seo/PageSeo'
import { useMarketingTheme } from '../hooks/useMarketingTheme'
import { trackDemoRequestClick } from '../lib/analytics'
import { LANDING_FAQ_HOME, LANDING_HERO } from '../lib/marketingContent'
import { buildHomeJsonLd, SEO_PAGES } from '../lib/seo'
import { marketingSkin } from '../lib/marketingTheme'

const primaryNavLinks = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Comment ça marche', href: '#comment-ca-marche' },
  { label: 'Pourquoi nous', href: '#pourquoi' },
  { label: 'Blog', href: '/blog', route: true },
  { label: 'FAQ', href: '#faq' },
]

function menuLinks() {
  return [
    ...primaryNavLinks,
    { label: 'Démonstration', href: '#demonstration' },
    { label: 'Contact', href: '/contact', route: true },
  ]
}

function MarketingNavItem({ item, className, onNavigate, children }) {
  if (item.route) {
    return (
      <Link className={className} to={item.href} onClick={onNavigate}>
        {item.label}
        {children}
      </Link>
    )
  }
  return (
    <a className={className} href={item.href} onClick={onNavigate}>
      {item.label}
      {children}
    </a>
  )
}

const headerActionSizeClass =
  'inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-2xl px-5 text-sm font-black 2xl:px-6'

function reveal(shouldReduceMotion, delay = 0) {
  return {
    initial: shouldReduceMotion ? undefined : { opacity: 0, y: 20 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, delay, ease: 'easeOut' },
  }
}

function BrandLogo({ isDark = true }) {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <svg
        aria-hidden="true"
        className="h-11 w-11 shrink-0 sm:h-12 sm:w-12"
        fill="none"
        viewBox="0 0 56 56"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pd-logo-blue" x1="8" x2="28" y1="52" y2="4" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e3a8a" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="pd-logo-red" x1="48" x2="28" y1="52" y2="4" gradientUnits="userSpaceOnUse">
            <stop stopColor="#b91c1c" />
            <stop offset="1" stopColor="#ef4444" />
          </linearGradient>
          <clipPath id="pd-logo-road">
            <polygon points="28,6 38,52 18,52" />
          </clipPath>
        </defs>
        <polygon fill="url(#pd-logo-blue)" points="28,6 6,52 28,52" />
        <polygon fill="url(#pd-logo-red)" points="28,6 50,52 28,52" />
        <polygon fill="#111827" points="28,6 38,52 18,52" />
        <g clipPath="url(#pd-logo-road)">
          <rect fill="rgba(255,255,255,0.92)" height="3.5" rx="1" width="2.2" x="26.9" y="16" />
          <rect fill="rgba(255,255,255,0.92)" height="4.2" rx="1" width="2.6" x="26.7" y="24" />
          <rect fill="rgba(255,255,255,0.92)" height="5" rx="1" width="3" x="26.5" y="33" />
          <rect fill="rgba(255,255,255,0.92)" height="5.8" rx="1" width="3.4" x="26.3" y="42" />
        </g>
      </svg>
      <div className="min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-[0.26em] sm:text-[11px] ${isDark ? 'text-white' : 'text-slate-800'}`}>PEDAGOGIA</p>
        <p className="text-[1.35rem] font-black uppercase leading-none tracking-[0.04em] sm:text-[1.55rem]">
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">DRI</span>
          <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">VE</span>
        </p>
        <motion.div className="mt-1.5 h-[2px] w-full bg-gradient-to-r from-blue-500 via-violet-500 to-red-500" />
      </div>
    </motion.div>
  )
}

function DashboardPreview() {
  const shouldReduceMotion = useReducedMotion()

  const stats = [
    { value: '1/4', label: 'Compétences REMC', sub: '5 sous-comp. validées' },
    { value: '12', label: 'Leçons', sub: 'dont 3 cette semaine' },
    { value: '24', label: 'Lexique', sub: 'termes validés' },
  ]

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-3 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.35rem] bg-slate-950 p-4 sm:p-5"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Livret numérique</p>
            <p className="mt-1 text-lg font-black text-white">Dupont Marie</p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Forfait 20h · Permis B</p>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">En ligne</span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Progression globale</span>
            <span className="font-black text-cyan-300">38 %</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              animate={{ width: '38%' }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              initial={shouldReduceMotion ? undefined : { width: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {stats.map(({ value, label, sub }, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/[0.08] p-3.5"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
              key={label}
              transition={{ duration: 0.35, delay: 0.15 + index * 0.06 }}
            >
              <p className="text-xl font-black text-white sm:text-2xl">{value}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-300">{label}</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">{sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-blue-300">
                Compétence REMC 1 <span className="text-slate-500">/ 4</span>
              </p>
              <p className="mt-1 text-sm font-bold text-white">Maîtriser le poste de conduite</p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-black text-blue-200">
              En cours
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold">
            <span className="text-slate-500">Sous-compétences</span>
            <span className="text-blue-300">4 / 6 validées</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              animate={{ width: '67%' }}
              className="h-full rounded-full bg-blue-500"
              initial={shouldReduceMotion ? undefined : { width: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.35 }}
            />
          </div>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.08] p-4"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-emerald-100">QCU Compétence 1 — réussi</p>
            <p className="mt-0.5 text-xs text-emerald-200/80">Score 88 % · Validé le 12 mai 2026</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-black text-emerald-300">
            88 %
          </span>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function ProfileSelection() {
  const shouldReduceMotion = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, isDark, toggleTheme } = useMarketingTheme()
  const skin = marketingSkin(theme)
  const links = menuLinks()
  const desktopNavLinks = links
  const demoCtaClass =
    `${headerActionSizeClass} bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-900/35 transition hover:-translate-y-0.5 hover:brightness-110`

  useEffect(() => {
    if (window.location.hash !== '#demonstration') return
    const timer = window.setTimeout(() => {
      document.getElementById('demonstration')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => window.clearTimeout(timer)
  }, [])
  const heroCtaClass =
    'inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 sm:w-auto'
  const homeJsonLd = useMemo(() => buildHomeJsonLd(), [])

  return (
    <div className={skin.page} data-theme={theme}>
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-xl focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        href="#main-content"
      >
        Aller au contenu principal
      </a>
      <PageSeo {...SEO_PAGES.home} jsonLd={homeJsonLd} />
      <div className={skin.ambient} />

      <header className={skin.header}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 2xl:grid 2xl:grid-cols-[auto_minmax(0,1fr)_auto] 2xl:items-center 2xl:gap-8 2xl:px-8">
          <a className="inline-flex shrink-0 items-center" href="#accueil" aria-label="PEDAGOGIA DRIVE - Accueil">
            <BrandLogo isDark={isDark} />
          </a>
          <nav
            aria-label="Navigation principale"
            className="hidden shrink-0 items-center justify-center gap-8 2xl:flex 2xl:gap-10"
          >
            {desktopNavLinks.map((item, index) => (
              <MarketingNavItem
                className={skin.navLink(index === 0)}
                item={item}
                key={item.href}
              >
                {index === 0 ? (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                ) : null}
              </MarketingNavItem>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4 2xl:justify-self-end 2xl:gap-5">
            <div className="hidden items-center gap-5 2xl:flex 2xl:gap-6">
              <Link
                to="/login"
                className={`${headerActionSizeClass} ${skin.loginBtn}`}
              >
                Se connecter
              </Link>
              <a className={demoCtaClass} href="#demonstration" onClick={() => trackDemoRequestClick('header')}>
                Demander une démo
              </a>
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
            <motion.div animate={{ opacity: 1, y: 0 }} className="grid gap-5" initial={{ opacity: 0, y: -6 }}>
              {links.map((item) => (
                <MarketingNavItem
                  className={skin.mobileNav}
                  item={item}
                  key={item.href}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
              <div className={`mt-4 grid gap-5 border-t pt-5 sm:gap-6 ${skin.mobileDivider}`}>
                <Link
                  className={`inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-2xl px-4 text-sm font-black transition ${skin.mobileLogin}`}
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                >
                  Se connecter
                </Link>
                <a
                  className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 text-sm font-black text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110"
                  href="#demonstration"
                  onClick={() => {
                    trackDemoRequestClick('mobile_menu')
                    setMobileOpen(false)
                  }}
                >
                  Demander une démo
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </header>

      <main id="main-content">
        {/* Hero */}
        <section id="accueil" className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <motion.div {...reveal(shouldReduceMotion)}>
              <h1 className={`text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl lg:leading-[1.1] ${skin.heading}`}>
                {LANDING_HERO.title}
              </h1>
              <p className={`mt-5 max-w-xl text-base leading-8 sm:text-lg ${skin.body}`}>
                {LANDING_HERO.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  className={heroCtaClass}
                  href="#demonstration"
                  onClick={() => trackDemoRequestClick('hero_primary')}
                >
                  {LANDING_HERO.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-black backdrop-blur sm:w-auto ${skin.loginBtn}`}
                  href="#fonctionnalites"
                >
                  {LANDING_HERO.secondaryCta}
                </a>
              </div>
            </motion.div>
            <motion.div {...reveal(shouldReduceMotion, 0.1)}>
              <DashboardPreview />
            </motion.div>
          </div>
        </section>

        <MarketingFeaturesGrid compact isDark={isDark} shouldReduceMotion={shouldReduceMotion} skin={skin} />
        <MarketingHowItWorks isDark={isDark} shouldReduceMotion={shouldReduceMotion} skin={skin} />
        <MarketingWhySection isDark={isDark} shouldReduceMotion={shouldReduceMotion} skin={skin} compact />

        {/* FAQ */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20" id="faq">
          <motion.div {...reveal(shouldReduceMotion, 0.04)}>
            <MarketingFaq isDark={isDark} items={LANDING_FAQ_HOME} showBlogLink skin={skin} />
          </motion.div>
        </section>

        {/* Contact / démonstration */}
        <section className="relative overflow-hidden py-16 lg:py-24" id="contact">
          <div className={skin.contactGlow} />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...reveal(shouldReduceMotion, 0.06)}>
              <DemoRequestForm isDark={isDark} />
            </motion.div>
          </div>
        </section>
      </main>

      <PublicFooter isDark={isDark} />
    </div>
  )
}
