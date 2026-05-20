import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BookOpenCheck,
  CarFront,
  Check,
  Gauge,
  ListChecks,
  MonitorSmartphone,
  MonitorUp,
  ScanLine,
  Sparkles,
  TabletSmartphone,
  UserRoundCog,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const audiences = [
  {
    title: 'AUTO-ÉCOLES INDÉPENDANTES',
    description: 'Centralisez la gestion élèves, le suivi pédagogique et l’organisation quotidienne dans une seule plateforme.',
    icon: Users,
  },
  {
    title: 'GROUPES D’AUTO-ÉCOLES',
    description: 'Pilotez plusieurs établissements avec un suivi unifié et une organisation simplifiée.',
    icon: MonitorUp,
  },
  {
    title: 'ENSEIGNANTS DE LA CONDUITE',
    description: 'Suivez les compétences, préparez les élèves plus efficacement et gagnez du temps sur le terrain.',
    icon: UserRoundCog,
  },
  {
    title: 'SECRÉTARIAT & GESTION',
    description: 'Planning, dossiers, suivi administratif et communication centralisés.',
    icon: TabletSmartphone,
  },
]

const gains = [
  'Gain de temps',
  'Réduction des tâches administratives',
  'Meilleure organisation',
  'Élèves mieux préparés',
  'Meilleure image moderne',
  'Suivi simplifié',
  'Pédagogie interactive',
  'Moins de papier',
  'Meilleure communication',
  'Gestion centralisée',
]

const pedagogyFeatures = [
  { title: 'QCU interactifs', icon: ListChecks },
  { title: 'Exercices maison', icon: BookOpenCheck },
  { title: 'Panneaux interactifs', icon: CarFront },
  { title: 'Lexique illustré', icon: ScanLine },
  { title: 'Suivi REMC', icon: Gauge },
  { title: 'Progression élève', icon: MonitorSmartphone },
]

const heroPillars = [
  {
    title: 'PÉDAGOGIE MODERNE',
    summary: 'QCU, exercices maison et suivi interactif.',
    icon: ListChecks,
  },
  {
    title: 'GESTION CENTRALISÉE',
    summary: 'Planning, élèves, secrétariat et suivi réunis.',
    icon: MonitorUp,
  },
  {
    title: 'CONÇU PAR UN ENSEIGNANT',
    summary: 'Pensé pour les vrais besoins terrain des auto-écoles.',
    icon: UserRoundCog,
  },
]

const navLinks = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Pour qui', href: '#pour-qui' },
  { label: 'Gains', href: '#gains' },
  { label: 'Pédagogie', href: '#pedagogie' },
  { label: 'Contact', href: '#cta-final' },
]

function SectionTitle({ eyebrow, title, text, light = false }) {
  return (
    <div className="max-w-3xl">
      <p
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] ${
          light ? 'border-cyan-200/30 bg-cyan-500/10 text-cyan-100' : 'border-cyan-800/35 bg-cyan-950/10 text-cyan-700'
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </p>
      <h2 className={`mt-5 text-3xl font-black tracking-tight sm:text-4xl ${light ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      <p className={`mt-4 text-base leading-8 ${light ? 'text-cyan-50/80' : 'text-slate-600'}`}>{text}</p>
    </div>
  )
}

function MotionSection({ shouldReduceMotion, children, ...rest }) {
  return (
    <motion.section
      {...rest}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}

export default function ProfileSelection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#030b18] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_84%_20%,rgba(37,99,235,0.14),transparent_30%),linear-gradient(140deg,#020617_0%,#071a2f_58%,#041223_100%)]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-cyan-200/20 bg-[#030b18]/78 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a
            href="#accueil"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-400/15"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
              PEDAGOGIA DRIVE
            </span>
          </a>

          <nav
            className="order-3 w-full overflow-x-auto pb-1 [scrollbar-width:none] sm:order-2 sm:w-auto sm:max-w-[70%]"
            aria-label="Navigation des sections de la page d’accueil"
          >
            <ul className="flex min-w-max items-center gap-2">
              {navLinks.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold text-cyan-50/85 transition hover:border-cyan-200/30 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <Link
            to="/login"
            className="order-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/40 bg-white/[0.1] px-4 py-2 text-xs font-black text-cyan-50 transition hover:border-cyan-200/60 hover:bg-white/[0.16] sm:order-3"
          >
            Connexion
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-32 lg:pt-8">
        <MotionSection
          id="accueil"
          className="scroll-mt-32 rounded-[2rem] border border-white/15 bg-white/[0.06] p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-sm sm:p-8 lg:scroll-mt-36 lg:p-10"
          shouldReduceMotion={shouldReduceMotion}
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100">
                Plateforme métier
              </p>
              <div className="relative mt-7 max-w-3xl">
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-5 -inset-y-4 rounded-[1.6rem] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.3),rgba(37,99,235,0.2)_42%,transparent_72%)] blur-2xl"
                  animate={shouldReduceMotion ? undefined : { opacity: [0.56, 0.82, 0.56], scale: [0.99, 1.02, 0.99] }}
                  transition={shouldReduceMotion ? undefined : { duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <h1 className="relative text-5xl font-black uppercase tracking-[0.09em] text-transparent drop-shadow-[0_0_22px_rgba(56,189,248,0.32)] sm:text-6xl lg:text-7xl">
                  <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-blue-400 bg-clip-text">PEDAGOGIA DRIVE</span>
                </h1>
              </div>
              <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-cyan-50 sm:text-xl">
                La plateforme premium qui élève la performance pédagogique et opérationnelle des auto-écoles.
              </p>
              <p className="mt-4 max-w-3xl text-base leading-8 text-cyan-50/85 sm:text-lg">
                Une solution complète, pensée pour l’exploitation quotidienne, le suivi des élèves et une expérience claire pour toute l’équipe.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#pour-qui"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-700/30 transition hover:translate-y-[-1px] hover:brightness-105"
                >
                  Voir les profils concernés
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#pedagogie"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/30 bg-white/[0.1] px-6 py-3 text-sm font-black text-cyan-50 transition hover:border-cyan-200/45 hover:bg-white/[0.16]"
                >
                  Découvrir la pédagogie
                  <BookOpenCheck className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {heroPillars.map((item) => {
                const Icon = item.icon
                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-cyan-200/25 bg-[linear-gradient(135deg,rgba(12,30,51,0.95),rgba(11,39,66,0.85))] px-4 py-4 shadow-lg shadow-cyan-950/35"
                  >
                    <div className="inline-flex rounded-lg border border-cyan-200/30 bg-cyan-400/10 p-2 text-cyan-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-[11px] font-black uppercase tracking-[0.13em] text-cyan-100">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-cyan-50/90">{item.summary}</p>
                  </article>
                )
              })}
              
            </div>
          </div>
        </MotionSection>

        <MotionSection
          id="pour-qui"
          className="mt-20 scroll-mt-32 rounded-[2rem] border border-cyan-900/20 bg-slate-50/95 p-6 text-slate-900 shadow-2xl shadow-cyan-900/10 sm:p-8 lg:mt-24 lg:scroll-mt-36 lg:p-10"
          shouldReduceMotion={shouldReduceMotion}
        >
          <SectionTitle
            eyebrow="Pour qui ?"
            title="Une plateforme claire pour chaque métier"
            text="Un environnement premium pour coordonner la pédagogie, la gestion et l’activité quotidienne."
          />
          <div className="mt-10 grid auto-rows-fr gap-5 sm:grid-cols-2">
            {audiences.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="group flex h-full flex-col rounded-3xl border border-cyan-100/85 bg-[linear-gradient(165deg,#ffffff_0%,#f3f9ff_100%)] p-6 shadow-[0_20px_45px_-30px_rgba(10,37,64,0.45)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_22px_52px_-28px_rgba(2,132,199,0.45)]"
                >
                  <div className="inline-flex w-fit rounded-2xl border border-cyan-300/65 bg-gradient-to-br from-cyan-100 to-blue-100 p-3 text-cyan-800 shadow-sm transition group-hover:scale-[1.02] group-hover:from-cyan-200 group-hover:to-blue-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-base font-black tracking-[0.03em] text-slate-900 sm:text-lg">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{item.description}</p>
                </article>
              )
            })}
          </div>
        </MotionSection>

        <MotionSection
          id="gains"
          className="mt-20 scroll-mt-32 rounded-[2rem] border border-white/15 bg-white/[0.05] p-6 sm:p-8 lg:mt-24 lg:scroll-mt-36 lg:p-10"
          shouldReduceMotion={shouldReduceMotion}
        >
          <SectionTitle
            eyebrow="Ce que les auto-écoles gagnent"
            title="Des bénéfices visibles au quotidien"
            text="Une approche plus claire, plus rapide et mieux structurée que les solutions historiques."
            light
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gains.map((item) => (
              <article
                key={item}
                className="rounded-2xl border border-white/14 bg-white/[0.06] px-4 py-4 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-0.5"
              >
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-50/95">
                  <Check className="h-4 w-4 text-cyan-300" />
                  {item}
                </p>
              </article>
            ))}
          </div>
        </MotionSection>

        <MotionSection
          id="pedagogie"
          className="mt-20 scroll-mt-32 rounded-[2rem] border border-cyan-900/20 bg-slate-50/95 p-6 text-slate-900 shadow-2xl shadow-cyan-900/10 sm:p-8 lg:mt-24 lg:scroll-mt-36 lg:p-10"
          shouldReduceMotion={shouldReduceMotion}
        >
          <SectionTitle
            eyebrow="Pédagogie moderne"
            title="Un apprentissage plus clair pour les élèves"
            text="Conçu par un enseignant de la conduite."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pedagogyFeatures.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-cyan-100/80 bg-white p-5 shadow-lg shadow-cyan-950/8 transition duration-300 hover:-translate-y-1"
                >
                  <div className="inline-flex rounded-xl border border-cyan-200/75 bg-cyan-50 p-2.5 text-cyan-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-black text-slate-900">{item.title}</p>
                </article>
              )
            })}
          </div>
        </MotionSection>

        <MotionSection
          id="cta-final"
          className="mt-20 scroll-mt-32 rounded-[2rem] border border-cyan-200/20 bg-gradient-to-br from-cyan-500/18 via-blue-500/10 to-transparent p-7 shadow-2xl shadow-cyan-900/18 backdrop-blur-sm sm:p-9 lg:mt-24 lg:scroll-mt-36"
          shouldReduceMotion={shouldReduceMotion}
        >
          <h2 className="text-3xl font-black text-white sm:text-4xl">L’environnement nouvelle génération dédié aux auto-écoles.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-cyan-50/85 sm:text-base">
            Pédagogie moderne, gestion centralisée, suivi intelligent et expérience élève optimisée dans une seule plateforme.
          </p>
          <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            <label className="flex flex-col gap-2 text-sm font-semibold text-cyan-50">
              Nom
              <input
                type="text"
                name="nom"
                required
                className="min-h-12 rounded-xl border border-cyan-200/30 bg-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-cyan-50/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                placeholder="Votre nom"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-cyan-50">
              Prénom
              <input
                type="text"
                name="prenom"
                required
                className="min-h-12 rounded-xl border border-cyan-200/30 bg-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-cyan-50/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                placeholder="Votre prénom"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-cyan-50">
              Auto-école
              <input
                type="text"
                name="auto-ecole"
                required
                className="min-h-12 rounded-xl border border-cyan-200/30 bg-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-cyan-50/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                placeholder="Nom de votre auto-école"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-cyan-50">
              Adresse e-mail
              <input
                type="email"
                name="adresse-mail"
                required
                className="min-h-12 rounded-xl border border-cyan-200/30 bg-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-cyan-50/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                placeholder="vous@exemple.com"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-cyan-50">
              Téléphone
              <input
                type="tel"
                name="telephone"
                required
                className="min-h-12 rounded-xl border border-cyan-200/30 bg-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-cyan-50/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                placeholder="Votre téléphone"
              />
            </label>
            <div className="hidden sm:block" />
            <label className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-cyan-200/25 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-cyan-50 sm:col-span-2">
              <input
                type="checkbox"
                name="etre-rappele"
                className="h-4 w-4 rounded border-cyan-200/40 bg-white/[0.15] text-cyan-400 focus:ring-2 focus:ring-cyan-300/70"
              />
              Je souhaite être rappelé(e)
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-cyan-50 sm:col-span-2">
              Créneau de rappel préféré (optionnel)
              <input
                type="text"
                name="creneau-rappel"
                className="min-h-12 rounded-xl border border-cyan-200/30 bg-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-cyan-50/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                placeholder="Ex : matin, entre 12h et 14h, après 18h"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-700/30 transition hover:translate-y-[-1px] hover:brightness-105 sm:col-span-2 sm:w-fit"
            >
              Être contacté(e)
            </button>
          </form>
        </MotionSection>
      </main>
    </div>
  )
}
