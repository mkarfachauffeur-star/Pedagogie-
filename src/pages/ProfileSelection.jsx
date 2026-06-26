import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Menu,
  MessageSquare,
  Sparkles,
  Target,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import DemoRequestForm from '../components/marketing/DemoRequestForm'
import MarketingThemeToggle from '../components/marketing/MarketingThemeToggle'
import BetaDevelopmentBanner from '../components/marketing/BetaDevelopmentBanner'
import PublicFooter from '../components/marketing/PublicFooter'
import StorePlatformBadges from '../components/StorePlatformBadges'
import { isPrivateBeta } from '../config/beta'
import { useMarketingTheme } from '../hooks/useMarketingTheme'
import { marketingSkin } from '../lib/marketingTheme'

const primaryNavLinks = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Plateforme', href: '#plateforme' },
  { label: 'Bénéfices', href: '#benefices' },
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
]

function menuLinks(privateBeta) {
  const items = [...primaryNavLinks]
  if (privateBeta) {
    items.push({ label: 'Démonstration', href: '#demonstration' })
  }
  items.push({ label: 'Contact', href: '/contact', route: true })
  return items
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

const platformHighlights = [
  {
    title: 'Livret d\'apprentissage numérique',
    text: 'Un espace pédagogique vivant où l\'élève consulte ses leçons, ses QCU et sa progression REMC.',
    icon: BookOpen,
  },
  {
    title: 'Suivi des compétences',
    text: 'Visualisez l\'acquisition des compétences après chaque leçon, pour l\'élève comme pour l\'enseignant.',
    icon: Target,
  },
  {
    title: 'Communication intégrée',
    text: 'Messagerie temps réel entre élève, enseignant et secrétariat — sans multiplier les outils.',
    icon: MessageSquare,
  },
]

const roleBenefits = [
  {
    role: 'Auto-école',
    title: 'Pilotez avec une vision complète',
    text: 'Centralisez pédagogie, administration et suivi des élèves sur une plateforme pensée pour le quotidien des auto-écoles modernes.',
    icon: Building2,
  },
  {
    role: 'Élève',
    title: 'Progresse entre chaque leçon',
    text: 'Livret interactif, QCU par compétence et suivi personnalisé : l\'élève reste acteur de sa formation, même en dehors de la voiture.',
    icon: GraduationCap,
  },
  {
    role: 'Enseignant',
    title: 'Plus de pédagogie, moins de répétitions',
    text: 'Les contenus sont accessibles à tout moment. Les élèves arrivent mieux préparés — concentrez-vous sur la conduite et l\'accompagnement.',
    icon: UserRound,
  },
  {
    role: 'Secrétariat',
    title: 'Gestion centralisée et fluide',
    text: 'Inscriptions, documents, dossiers et informations pédagogiques réunis dans un espace unique, sécurisé et simple à utiliser.',
    icon: Briefcase,
  },
]

const availableFeatures = [
  {
    title: 'Suivi REMC',
    text: 'Compétences et sous-compétences suivies en temps réel.',
    icon: Target,
  },
  {
    title: 'QCU Compétence 1',
    text: 'Exercice interactif inédit — validation à 80 % par l\'élève.',
    icon: ClipboardList,
  },
  {
    title: 'Messagerie temps réel',
    text: 'Échanges directs entre tous les acteurs de la formation.',
    icon: MessageSquare,
  },
  {
    title: 'Documents centralisés',
    text: 'Dossiers élèves, pièces administratives et exports au même endroit.',
    icon: FileText,
  },
  {
    title: 'Gestion élèves & personnel',
    text: 'Gérant, secrétariat, enseignants et élèves — chacun son espace.',
    icon: Users,
  },
  {
    title: 'Notifications intelligentes',
    text: 'Alertes messages, rendez-vous et événements importants.',
    icon: Bell,
  },
]

const upcomingFeatures = [
  { title: 'QCU compétences 2 à 4', text: 'Entraînement par compétence REMC, étape par étape.' },
  { title: 'Vidéos pédagogiques', text: 'Contenus commentés par des professionnels de la conduite.' },
  { title: 'Signalisation interactive', text: 'Panneaux et règles expliqués visuellement.' },
  { title: 'Schémas & situations', text: 'Circulation, priorités et cas concrets de conduite.' },
  { title: 'Préparation examen pratique', text: 'Révisions ciblées avant le jour J.' },
  { title: 'Révision Code par thème', text: 'Thématiques structurées pour ancrer les acquis.' },
]

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
  const links = menuLinks(isPrivateBeta)
  const desktopNavLinks = links
  const demoCtaClass =
    `${headerActionSizeClass} bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-900/35 transition hover:-translate-y-0.5 hover:brightness-110`
  const heroCtaClass =
    'inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 sm:w-auto'
  return (
    <div className={skin.page} data-theme={theme}>
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
              <Link className={demoCtaClass} to="/signup">
                Pré-inscription
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
                <Link
                  className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 text-sm font-black text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110"
                  onClick={() => setMobileOpen(false)}
                  to="/signup"
                >
                  Pré-inscription
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </header>

      <BetaDevelopmentBanner isDark={isDark} />

      <main>
        {/* Hero */}
        <section id="accueil" className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <motion.div {...reveal(shouldReduceMotion)}>
              <p className={skin.heroBadge}>
                <BookOpen className="h-3.5 w-3.5" />
                Enseignant de la conduite · Livret numérique
              </p>
              <h1 className={`mt-6 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl lg:leading-[1.1] ${skin.heading}`}>
                Le livret numérique{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                  réinventé
                </span>
              </h1>
              <p className={`mt-5 max-w-xl text-base leading-8 sm:text-lg ${skin.body}`}>
                PEDAGOGIA DRIVE est le livret numérique nouvelle génération, créé par un enseignant de la
                conduite qui accompagne des élèves au quotidien.
              </p>
              <p className={`mt-3 max-w-xl text-sm leading-7 sm:text-base ${skin.bodyMuted}`}>
                REMC, QCU, documents, messagerie et gestion des élèves — une plateforme qui prolonge
                l&apos;apprentissage bien au-delà des heures de conduite.
              </p>
              <ul className="mt-6 space-y-2.5">
                {(isPrivateBeta
                  ? [
                      'Conçu sur le terrain, pas depuis un bureau',
                      'QCU Compétence 1 déjà disponible pour les élèves',
                      'Accès sur invitation — bêta privée en cours',
                    ]
                  : [
                      'Conçu sur le terrain, pas depuis un bureau',
                      'QCU Compétence 1 déjà disponible pour les élèves',
                      'Essai gratuit 30 jours · 20 élèves inclus',
                    ]
                ).map((point) => (
                  <li className={`flex items-center gap-2.5 text-sm font-semibold ${skin.listItem}`} key={point}>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:hidden">
                <Link className={heroCtaClass} to="/signup">
                  Pré-inscription
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-black backdrop-blur sm:w-auto ${skin.loginBtn}`}
                >
                  Se connecter
                </Link>
              </div>
            </motion.div>
            <motion.div {...reveal(shouldReduceMotion, 0.1)}>
              <DashboardPreview />
            </motion.div>
          </div>
        </section>

        {/* Plateforme */}
        <section id="plateforme" className={`${skin.sectionAlt} py-14 lg:py-20`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...reveal(shouldReduceMotion)} className="mx-auto max-w-2xl text-center">
              <p className={skin.eyebrowBlue}>La plateforme</p>
              <h2 className={`mt-3 text-2xl font-black sm:text-3xl ${skin.heading}`}>
                Bien plus qu&apos;un logiciel de gestion
              </h2>
              <p className={`mt-4 text-base leading-8 ${skin.bodyMuted}`}>
                Les outils classiques gèrent les dossiers.
                <br />
                PEDAGOGIA DRIVE accompagne l&apos;apprentissage — avec des ressources pédagogiques évolutives,
                dont les vidéos commentées arrivent prochainement.
              </p>
            </motion.div>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {platformHighlights.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.article
                    {...reveal(shouldReduceMotion, index * 0.05)}
                    className={`${skin.card} p-5`}
                    key={item.title}
                  >
                    <div className={`inline-flex rounded-xl border p-2.5 ${isDark ? 'border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-600'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className={`mt-4 text-base font-black ${skin.heading}`}>{item.title}</h3>
                    <p className={`mt-2 text-sm leading-6 ${skin.bodyMuted}`}>{item.text}</p>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Bénéfices par rôle */}
        <section id="benefices" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <motion.div {...reveal(shouldReduceMotion)} className="mx-auto max-w-2xl text-center">
            <p className={skin.eyebrowBlue}>Pour qui ?</p>
            <h2 className={`mt-3 text-2xl font-black sm:text-3xl ${skin.heading}`}>
              Une plateforme pensée pour toute l&apos;équipe
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-400">
              Auto-école, élève, enseignant ou secrétariat — chacun dispose d&apos;un espace adapté à son rôle,
              connecté au même fil pédagogique.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {roleBenefits.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.article
                    {...reveal(shouldReduceMotion, index * 0.04)}
                    className={skin.cardHover}
                    key={item.role}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
                    <div className="flex items-start gap-4">
                      <div className={`inline-flex shrink-0 rounded-xl border p-2.5 ${isDark ? 'border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-600'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={skin.roleLabel}>{item.role}</p>
                        <h3 className={`mt-1 text-base font-black ${skin.heading}`}>{item.title}</h3>
                        <p className={`mt-2 text-sm leading-7 ${skin.bodyMuted}`}>{item.text}</p>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
        </section>

        {/* Fonctionnalités */}
        <section id="fonctionnalites" className={`${skin.sectionAlt} py-14 sm:px-6 lg:py-20`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...reveal(shouldReduceMotion)} className="mx-auto max-w-2xl text-center">
              <p className={skin.eyebrowEmerald}>Outils</p>
              <h2 className={`mt-3 text-2xl font-black sm:text-3xl ${skin.heading}`}>
                Fonctionnalités pédagogiques
              </h2>
              <p className={`mt-4 text-base leading-8 ${skin.bodyMuted}`}>
                Des outils opérationnels dès aujourd&apos;hui, et une feuille de route riche pour les mois à venir.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-10 lg:grid-cols-2">
              <motion.div {...reveal(shouldReduceMotion)}>
                <p className={`mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-wide ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Disponible actuellement
                </p>
                <ul className="space-y-3">
                  {availableFeatures.map((item) => {
                    const Icon = item.icon
                    return (
                      <li
                        className={skin.featureRow}
                        key={item.title}
                      >
                        <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${isDark ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={`font-black ${skin.heading}`}>{item.title}</p>
                          <p className={`mt-1 text-sm leading-6 ${skin.bodyMuted}`}>{item.text}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </motion.div>

              <motion.div {...reveal(shouldReduceMotion, 0.06)}>
                <p className={`mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-wide ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>
                  <span className="h-2 w-2 rounded-full bg-violet-400" />
                  Bientôt disponible
                </p>
                <ul className="space-y-3">
                  {upcomingFeatures.map((item) => (
                    <li
                      className={skin.featureRow}
                      key={item.title}
                    >
                      <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${isDark ? 'border-violet-400/20 bg-violet-500/10 text-violet-300' : 'border-violet-200 bg-violet-50 text-violet-600'}`}>
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={skin.upcomingTitle}>{item.title}</p>
                        <p className={skin.upcomingText}>{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Contact / démonstration */}
        <section className="relative overflow-hidden py-16 lg:py-24" id="contact">
          <div className={skin.contactGlow} />
          <div className="relative mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
            {isPrivateBeta ? (
              <>
                <motion.div {...reveal(shouldReduceMotion)} className="mx-auto max-w-2xl text-center">
                  <p className={skin.eyebrowBlue}>Bêta privée</p>
                  <h2 className={`mt-3 text-2xl font-black sm:text-3xl ${skin.heading}`}>Pourquoi une bêta privée ?</h2>
                  <p className={`mt-4 text-base leading-8 ${skin.bodyMuted}`}>
                    Nous préférons tester et perfectionner Pedagogia Drive avec un nombre limité
                    d&apos;établissements avant l&apos;ouverture officielle.
                  </p>
                  <p className={`mt-3 text-base leading-8 ${skin.bodyMuted}`}>
                    Notre objectif est de proposer un logiciel fiable, moderne et adapté aux besoins
                    réels des auto-écoles.
                  </p>
                </motion.div>
                <motion.div {...reveal(shouldReduceMotion, 0.06)}>
                  <DemoRequestForm isDark={isDark} />
                </motion.div>
              </>
            ) : (
              <motion.div {...reveal(shouldReduceMotion)} className="mx-auto max-w-2xl text-center">
                <h2 className={`text-3xl font-black sm:text-4xl ${skin.heading}`}>
                  Remettez la pédagogie au centre
                </h2>
                <p className={`mt-4 text-base leading-8 ${skin.bodyMuted}`}>
                  Rejoignez les auto-écoles qui modernisent leur livret d&apos;apprentissage avec une plateforme
                  conçue par un enseignant de la conduite, pour des enseignants et leurs élèves.
                </p>
                <p className={`mt-2 text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                  Essai gratuit 30 jours · 20 élèves inclus · Sans engagement
                </p>
                <Link
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5"
                  to="/signup"
                >
                  Pré-inscription
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            )}
          </div>
        </section>

        {/* Mobile */}
        <section id="applications-mobiles" className={`${skin.sectionAlt} border-t py-14 sm:py-16`}>
          <motion.div {...reveal(shouldReduceMotion)} className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className={`text-2xl font-black sm:text-3xl ${skin.heading}`}>Disponible sur iOS et Android</h2>
            <p className={`mx-auto mt-4 max-w-lg text-base leading-7 ${skin.bodyMuted}`}>
              Retrouvez votre livret numérique, votre suivi REMC et vos documents sur smartphone —
              la formation vous suit partout.
            </p>
            <StorePlatformBadges className="mt-8" size="large" />
          </motion.div>
        </section>
      </main>

      <PublicFooter isDark={isDark} />
    </div>
  )
}
