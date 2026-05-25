import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  GraduationCap,
  Menu,
  MonitorSmartphone,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const navLinks = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Démonstration', href: '#demonstration' },
  { label: 'Tarifs', href: '#contact' },
  { label: 'Contact', href: '#contact' },
]

const featureCards = [
  { title: 'Gestion des élèves', text: 'Suivi complet, dossiers, progression et historique centralisés.', icon: Users },
  { title: 'Planning intelligent', text: 'Organisez leçons, disponibilités et créneaux en quelques clics.', icon: CalendarDays },
  { title: 'QCU intelligents', text: 'Entraînement par compétences avec correction et suivi des résultats.', icon: GraduationCap },
  { title: 'Statistiques avancées', text: 'Pilotez votre activité avec des indicateurs clairs et actionnables.', icon: BarChart3 },
  { title: '100% Mobile', text: 'Accessible sur téléphone, tablette et ordinateur, partout.', icon: MonitorSmartphone },
  { title: 'Sauvegarde cloud', text: 'Données sécurisées, synchronisées et disponibles en permanence.', icon: Cloud },
  { title: 'Exports & Rapports', text: 'Générez vos exports et rapports pour votre organisation interne.', icon: Download },
  { title: 'Multi-utilisateurs', text: 'Gérant, secrétariat, enseignants et élèves, chacun son espace.', icon: ShieldCheck },
]

const previewPoints = [
  'Vue d’ensemble en temps réel',
  'Accès rapide aux fonctionnalités clés',
  'Notifications et alertes intelligentes',
  'Données sécurisées et synchronisées',
]

const stats = [
  { value: '+850', label: 'Auto-écoles équipées', icon: Building2 },
  { value: '+12 000', label: 'Utilisateurs actifs', icon: Users },
  { value: '99,9%', label: 'Disponibilité', icon: ShieldCheck },
  { value: '4,9/5', label: 'Satisfaction client', icon: Star },
]

const testimonials = [
  {
    quote: 'PEDAGOGIA DRIVE a transformé notre organisation. Le suivi élèves et le planning sont devenus beaucoup plus simples au quotidien.',
    name: 'Auto-École Conduite Plus',
    city: 'Lyon',
  },
  {
    quote: 'Une interface moderne, claire et efficace. Nos enseignants gagnent un temps précieux sur le terrain et en secrétariat.',
    name: 'Permis & Co',
    city: 'Marseille',
  },
  {
    quote: 'Nos élèves adorent les QCU et le lexique. La préparation à l’examen est nettement plus structurée qu’avant.',
    name: 'École de Conduite Horizon',
    city: 'Paris',
  },
]

const footerLinks = {
  Produit: ['Fonctionnalités', 'Tarifs', 'Démonstration', 'Mises à jour'],
  Ressources: ['Documentation', 'FAQ', 'Blog', 'Guides'],
  Entreprise: ['À propos', 'Contact', 'Partenaires', 'Carrières'],
  Légal: ['Mentions légales', 'CGU', 'Confidentialité', 'Cookies'],
}

function reveal(shouldReduceMotion, delay = 0) {
  return {
    initial: shouldReduceMotion ? undefined : { opacity: 0, y: 20 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, delay, ease: 'easeOut' },
  }
}

function BrandLogo() {
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
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white sm:text-[11px]">PEDAGOGIA</p>
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
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-3 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.35rem] bg-slate-950 p-4 sm:p-5"
        initial={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between gap-4 border-b border-white/10 pb-4"
          initial={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Tableau de bord</p>
            <p className="mt-1 text-lg font-black text-white">Auto-école Lumière</p>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">En ligne</span>
        </motion.div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['248', 'Élèves actifs'],
            ['18', 'Leçons aujourd’hui'],
            ['78%', 'Taux de réussite'],
          ].map(([value, label], index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/[0.08] p-4"
              initial={{ opacity: 0, y: 10 }}
              key={label}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
            >
              <p className="text-2xl font-black text-white sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{label}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/[0.08] p-4"
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            <p className="text-sm font-black text-white">Réussite QCU</p>
            <motion.div
              animate={{ scaleX: 1 }}
              className="mt-4 h-28 origin-bottom rounded-xl bg-gradient-to-t from-blue-500/20 to-transparent"
              initial={{ scaleX: 0.85, opacity: 0.5 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <div className="flex h-full items-end gap-2 px-2 pb-2">
                {[38, 52, 47, 61, 58, 72, 68].map((height, index) => (
                  <motion.div
                    animate={{ height: `${height}%` }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-300"
                    initial={{ height: 0 }}
                    key={index}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.04 }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/[0.08] p-4"
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.45, delay: 0.25 }}
          >
            <p className="text-sm font-black text-white">Répartition élèves</p>
            <div className="mt-4 flex items-center justify-center">
              <div className="relative h-24 w-24 rounded-full bg-[conic-gradient(#3b82f6_0_42%,#ef4444_42%_68%,#22d3ee_68%_100%)]">
                <motion.div
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-4 rounded-full bg-slate-950"
                  initial={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.45, delay: 0.35 }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default function ProfileSelection() {
  const shouldReduceMotion = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [testimonialIndex, setTestimonialIndex] = useState(0)

  return (
    <div className="min-h-screen overflow-x-clip bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(37,99,235,0.18),transparent_30%),radial-gradient(circle_at_78%_16%,rgba(220,38,38,0.12),transparent_32%),linear-gradient(135deg,#020617_0%,#071426_56%,#0c1020_100%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030712]/80 backdrop-blur-2xl">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#accueil" aria-label="PEDAGOGIA DRIVE - Accueil">
            <BrandLogo />
          </a>
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex" aria-label="Navigation principale">
            {navLinks.map((item, index) => (
              <a
                className={`relative px-4 py-2 text-sm font-semibold transition hover:text-white ${index === 0 ? 'text-white' : 'text-slate-300'}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
                {index === 0 ? <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" /> : null}
              </a>
            ))}
          </nav>
          <a
            href="#contact"
            className="hidden items-center rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/35 transition hover:-translate-y-0.5 hover:brightness-110 lg:inline-flex"
          >
            Demander une démo
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
          <button className="rounded-2xl border border-white/15 p-2 lg:hidden" onClick={() => setMobileOpen((value) => !value)} type="button">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-white/10 bg-[#030712]/95 px-4 py-4 lg:hidden">
            <motion.div animate={{ opacity: 1, y: 0 }} className="grid gap-2" initial={{ opacity: 0, y: -6 }}>
              {navLinks.map((item) => (
                <a className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10" href={item.href} key={item.href} onClick={() => setMobileOpen(false)}>
                  {item.label}
                </a>
              ))}
              <a className="mt-2 rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white" href="#contact">
                Demander une démo
              </a>
            </motion.div>
          </div>
        )}
      </header>

      <main>
        <section id="accueil" className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
          <motion.div {...reveal(shouldReduceMotion)} className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              Fonctionnalités
            </p>
            <h1 className="mt-6 text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              Tout ce dont votre auto-école a besoin, réuni dans une{' '}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">seule plateforme.</span>
            </h1>
          </motion.div>

          <div id="fonctionnalites" className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.article
                  {...reveal(shouldReduceMotion, index * 0.03)}
                  whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                  className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5 shadow-lg shadow-black/20 backdrop-blur transition"
                  key={item.title}
                >
                  <div className={`absolute inset-x-0 top-0 h-px ${index % 2 === 0 ? 'bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_16px_rgba(59,130,246,0.55)]' : 'bg-gradient-to-r from-transparent via-red-400 to-transparent shadow-[0_0_16px_rgba(239,68,68,0.55)]'}`} />
                  <div className="inline-flex rounded-xl border border-blue-400/25 bg-blue-500/10 p-2.5 text-blue-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-base font-black text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
                </motion.article>
              )
            })}
          </div>
        </section>

        <section id="demonstration" className="border-y border-white/10 bg-[#07111f] py-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <motion.div {...reveal(shouldReduceMotion)}>
              <p className="inline-flex rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-200">
                Aperçu plateforme
              </p>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">Une interface pensée pour votre quotidien.</h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Un tableau de bord clair et complet pour piloter votre auto-école en toute simplicité.
              </p>
              <ul className="mt-6 space-y-3">
                {previewPoints.map((point) => (
                  <li className="flex items-center gap-3 text-sm font-semibold text-slate-200" key={point}>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400" />
                    {point}
                  </li>
                ))}
              </ul>
              <a
                href="#demonstration"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-blue-400/35 bg-blue-500/10 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-500/20"
              >
                Découvrir la démonstration
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
            <motion.div {...reveal(shouldReduceMotion, 0.1)}>
              <DashboardPreview />
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <motion.h2 {...reveal(shouldReduceMotion)} className="text-center text-2xl font-black text-white sm:text-3xl">
            Une plateforme qui fait la différence.
          </motion.h2>
          <motion.div
            {...reveal(shouldReduceMotion, 0.08)}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {stats.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.article
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-6 text-center"
                  initial={{ opacity: 0, y: 12 }}
                  key={item.label}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                >
                  <motion.div className="mx-auto inline-flex rounded-xl border border-blue-400/25 bg-blue-500/10 p-2.5 text-blue-300">
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <p className="mt-4 text-3xl font-black text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.label}</p>
                </motion.article>
              )
            })}
          </motion.div>
        </section>

        <section className="border-y border-white/10 bg-[#07111f] py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...reveal(shouldReduceMotion)} className="text-center">
              <p className="inline-flex rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-200">
                Ils nous font confiance
              </p>
              <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">Ce que disent nos clients</h2>
            </motion.div>
            <div className="relative mt-10">
              <div className="grid gap-4 lg:grid-cols-3">
                {testimonials.map((item, index) => (
                  <motion.article
                    {...reveal(shouldReduceMotion, index * 0.05)}
                    className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-6"
                    key={item.name}
                  >
                    <motion.div
                      animate={{ opacity: 1, scale: 1 }}
                      className={`absolute inset-x-0 top-0 h-px ${index % 2 === 0 ? 'bg-gradient-to-r from-transparent via-blue-400 to-transparent' : 'bg-gradient-to-r from-transparent via-red-400 to-transparent'}`}
                      initial={{ opacity: 0, scaleX: 0.6 }}
                      transition={{ duration: 0.45, delay: 0.1 + index * 0.05 }}
                    />
                    <Quote className="h-8 w-8 text-blue-400/80" />
                    <p className="mt-4 text-sm leading-7 text-slate-200">{item.quote}</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-red-500 text-xs font-black">
                        {item.name.charAt(0)}
                      </div>
                      <motion.div animate={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -4 }}>
                        <p className="text-sm font-black text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.city}</p>
                      </motion.div>
                    </div>
                  </motion.article>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:bg-white/10"
                  onClick={() => setTestimonialIndex((value) => (value === 0 ? testimonials.length - 1 : value - 1))}
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <span className={`h-2 w-2 rounded-full ${index === testimonialIndex ? 'bg-blue-400' : 'bg-white/25'}`} key={index} />
                  ))}
                </div>
                <button
                  className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:bg-white/10"
                  onClick={() => setTestimonialIndex((value) => (value === testimonials.length - 1 ? 0 : value + 1))}
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="relative overflow-hidden py-20 lg:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.15),transparent_40%),radial-gradient(circle_at_80%_50%,rgba(239,68,68,0.12),transparent_40%)]" />
          <motion.div
            animate={shouldReduceMotion ? undefined : { opacity: [0.35, 0.7, 0.35] }}
            className="pointer-events-none absolute bottom-[20%] left-[-5%] h-[3px] w-[55%] rotate-[-8deg] rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-[0.5px]"
            transition={shouldReduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            animate={shouldReduceMotion ? undefined : { opacity: [0.35, 0.7, 0.35] }}
            className="pointer-events-none absolute bottom-[15%] right-[-5%] h-[3px] w-[55%] rotate-[8deg] rounded-full bg-gradient-to-r from-transparent via-red-400 to-transparent blur-[0.5px]"
            transition={shouldReduceMotion ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          <motion.div {...reveal(shouldReduceMotion)} className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-black leading-tight text-white sm:text-5xl">
              Prêt à faire passer votre auto-école à la{' '}
              <span className="bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">vitesse supérieure ?</span>
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Rejoignez les centaines d’auto-écoles qui modernisent leur gestion et leur pédagogie avec PEDAGOGIA DRIVE.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#contact" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-900/35 transition hover:-translate-y-0.5">
                Demander une démo
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/10">
                Essayer gratuitement
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#020817] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
              La plateforme tout-en-un pour gérer, suivre et développer votre auto-école avec une expérience moderne.
            </p>
            <div className="mt-5 flex gap-3">
              {['Facebook', 'Instagram', 'LinkedIn'].map((network) => (
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-400" key={network}>
                  {network}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <p className="text-sm font-black text-white">{title}</p>
                <ul className="mt-3 space-y-2">
                  {links.map((link) => (
                    <li className="text-sm text-slate-400" key={link}>
                      {link}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          © 2026 Pedagogia Drive. Tous droits réservés.
        </p>
      </footer>
    </div>
  )
}
