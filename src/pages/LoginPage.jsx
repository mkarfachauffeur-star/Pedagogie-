import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  ClipboardList,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Shield,
  ShieldCheck,
  Smartphone,
  UserRound,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import StorePlatformBadges from '../components/StorePlatformBadges'
import { roleDestinations, roleLabels, setStoredRole } from '../utils/authSession'

const roles = [
  { id: 'student', label: 'Élève', icon: GraduationCap },
  { id: 'teacher', label: 'Enseignant', icon: UserRound },
  { id: 'secretary', label: 'Secrétariat', icon: Briefcase },
  { id: 'manager', label: 'Gérant', icon: Shield },
]

const featureHighlights = [
  {
    title: 'QCU intelligents',
    description: 'Des milliers de questions mises à jour régulièrement',
    icon: ClipboardList,
  },
  {
    title: 'Suivi pédagogique',
    description: 'Un accompagnement complet des élèves',
    icon: Users,
  },
  {
    title: 'Dashboard moderne',
    description: 'Pilotez votre activité en temps réel',
    icon: BarChart3,
  },
  {
    title: 'Livret numérique',
    description: 'Votre REMC, vos leçons et vos validations — tout suit votre progression en temps réel',
    icon: BookOpen,
  },
]

function LoginBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-[#030712]">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#020617_0%,#030712_45%,#071426_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(37,99,235,0.16),transparent_42%),radial-gradient(circle_at_84%_18%,rgba(239,68,68,0.11),transparent_38%)]" />

      <div className="absolute inset-x-0 bottom-0 flex justify-center opacity-80">
        <svg
          className="h-[min(52vh,480px)] w-full max-w-4xl"
          fill="none"
          preserveAspectRatio="xMidYMax meet"
          viewBox="0 0 800 480"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="login-road-blue" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0" />
              <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="login-road-red" x1="1" x2="0" y1="1" y2="0">
              <stop offset="0%" stopColor="#b91c1c" stopOpacity="0" />
              <stop offset="45%" stopColor="#ef4444" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="login-road-surface" x1="400" x2="400" y1="120" y2="480" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0f172a" />
              <stop offset="1" stopColor="#020617" />
            </linearGradient>
            <filter id="login-road-glow-blue">
              <feGaussianBlur result="blur" stdDeviation="8" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="login-road-glow-red">
              <feGaussianBlur result="blur" stdDeviation="8" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M120 480 L320 140 L480 140 L680 480 Z"
            fill="url(#login-road-surface)"
            opacity="0.95"
          />
          <path
            d="M120 480 L320 140 L400 140 L400 480 Z"
            filter="url(#login-road-glow-blue)"
            stroke="url(#login-road-blue)"
            strokeWidth="3"
          />
          <path
            d="M680 480 L480 140 L400 140 L400 480 Z"
            filter="url(#login-road-glow-red)"
            stroke="url(#login-road-red)"
            strokeWidth="3"
          />
          <line stroke="rgba(255,255,255,0.35)" strokeDasharray="10 14" strokeWidth="2" x1="400" x2="400" y1="160" y2="470" />
          <line opacity="0.5" stroke="rgba(59,130,246,0.25)" strokeWidth="1" x1="200" x2="360" y1="480" y2="200" />
          <line opacity="0.5" stroke="rgba(59,130,246,0.25)" strokeWidth="1" x1="280" x2="380" y1="480" y2="260" />
          <line opacity="0.5" stroke="rgba(239,68,68,0.25)" strokeWidth="1" x1="600" x2="440" y1="480" y2="200" />
          <line opacity="0.5" stroke="rgba(239,68,68,0.25)" strokeWidth="1" x1="520" x2="420" y1="480" y2="260" />
        </svg>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent" />
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [forgotOpen, setForgotOpen] = useState(false)

  useEffect(() => {
    const savedEmail = window.localStorage.getItem('pedagogia-drive-login-email')
    if (savedEmail) setEmail(savedEmail)
  }, [])

  useEffect(() => {
    const previousBodyBg = document.body.style.backgroundColor
    const previousHtmlBg = document.documentElement.style.backgroundColor
    document.body.classList.add('login-page-active')
    document.body.style.backgroundColor = '#030712'
    document.documentElement.style.backgroundColor = '#030712'

    return () => {
      document.body.classList.remove('login-page-active')
      document.body.style.backgroundColor = previousBodyBg
      document.documentElement.style.backgroundColor = previousHtmlBg
    }
  }, [])

  const canSubmit = useMemo(() => Boolean(role), [role])
  const selectedRole = roles.find((item) => item.id === role)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return
    if (rememberMe && email) {
      window.localStorage.setItem('pedagogia-drive-login-email', email)
    }
    setStoredRole(role)
    navigate(roleDestinations[role], { replace: true })
  }

  const handleQuickAccess = (selectedRoleId) => {
    setStoredRole(selectedRoleId)
    navigate(roleDestinations[selectedRoleId], { replace: true })
  }

  const fadeUp = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: 'easeOut' },
        }

  return (
    <div className="login-page-shell fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden bg-[#030712] text-white">
      <LoginBackground />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1280px] flex-col px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Colonne gauche — branding */}
          <motion.div
            className="flex flex-col justify-center lg:min-h-[calc(100vh-5rem)]"
            {...fadeUp(0)}
          >
            <BrandLogo animated={!shouldReduceMotion} idPrefix="login" variant="login" />

            <p className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              Accès privé sécurisé
            </p>

            <h1 className="mt-8 max-w-lg text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Bienvenue sur{' '}
              <span className="block sm:inline">
                PEDAGOGIA{' '}
                <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-red-500 bg-clip-text text-transparent">
                  DRIVE
                </span>
              </span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-400">
              La plateforme premium pensée pour les auto-écoles modernes.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {featureHighlights.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    className="glass-card"
                    {...fadeUp(0.08 + index * 0.04)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-black text-white">{feature.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{feature.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Colonne droite — carte connexion */}
          <motion.div className="flex items-center justify-center" {...fadeUp(0.1)}>
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-[1px] rounded-[1.75rem] bg-gradient-to-br from-blue-500/70 via-violet-500/40 to-red-500/70 opacity-80 blur-[1px]" />
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-600/15 via-transparent to-red-600/15 blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c1424] p-6 shadow-2xl shadow-black/50 sm:p-8">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-blue-500/60 via-violet-400/30 to-red-500/60" />

                {/* Accès démo rapide */}
                <div className="rounded-2xl border border-white/10 bg-[#070d18]/80 p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-blue-200">
                    <Zap className="h-4 w-4 text-blue-400" />
                    Accès démo rapide
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    Ouvrez directement un dashboard sans saisir d&apos;e-mail ni de mot de passe.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {roles.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={`quick-${item.id}`}
                          type="button"
                          onClick={() => handleQuickAccess(item.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0a1220] px-3 py-2.5 text-xs font-bold text-slate-200 transition hover:border-blue-400/35 hover:bg-blue-500/10 hover:text-white"
                        >
                          <Icon className="h-3.5 w-3.5 text-blue-400" />
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Connexion par profil
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {roles.map((item) => {
                        const Icon = item.icon
                        const active = role === item.id
                        return (
                          <button
                            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                              active
                                ? 'border-blue-400/50 bg-blue-500/15 text-white shadow-inner shadow-blue-900/20'
                                : 'border-white/10 bg-[#0a1220] text-slate-300 hover:border-blue-400/30 hover:text-white'
                            }`}
                            key={item.id}
                            onClick={() => setRole(item.id)}
                            type="button"
                          >
                            <Icon className={`h-3.5 w-3.5 ${active ? 'text-blue-300' : 'text-blue-400'}`} />
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <label className="block text-sm font-bold text-slate-200">
                    E-mail
                    <span className="mt-2 flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#070d18] px-4 py-3">
                      <Mail className="h-4 w-4 shrink-0 text-blue-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="votre@email.com"
                        className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600"
                      />
                    </span>
                  </label>

                  <label className="block text-sm font-bold text-slate-200">
                    Mot de passe
                    <span className="mt-2 flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#070d18] px-4 py-3">
                      <LockKeyhole className="h-4 w-4 shrink-0 text-blue-400" />
                      <input
                        autoComplete="current-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600"
                      />
                      <button
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="shrink-0 text-slate-500 transition hover:text-slate-300"
                        onClick={() => setShowPassword((current) => !current)}
                        type="button"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-slate-400">
                      <input
                        checked={rememberMe}
                        className="h-4 w-4 rounded border-white/20 bg-[#070d18] text-blue-500"
                        onChange={(event) => setRememberMe(event.target.checked)}
                        type="checkbox"
                      />
                      Se souvenir de moi
                    </label>
                    <button
                      className="font-semibold text-blue-400 transition hover:text-blue-300"
                      onClick={() => setForgotOpen(true)}
                      type="button"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  {forgotOpen && (
                    <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 p-4 text-sm leading-6 text-slate-300">
                      <p className="font-bold text-white">Réinitialisation du mot de passe</p>
                      <p className="mt-2">
                        Contactez le secrétariat de votre auto-école pour obtenir un nouvel accès. En
                        démo, utilisez l&apos;accès rapide ci-dessus.
                      </p>
                      <button
                        className="mt-3 text-xs font-bold text-blue-300 underline"
                        onClick={() => setForgotOpen(false)}
                        type="button"
                      >
                        Fermer
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="group mt-1 flex w-full overflow-hidden rounded-xl shadow-lg shadow-blue-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span className="flex flex-1 items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 py-3.5 text-sm font-black text-white">
                      Connexion
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                    <span className="flex items-center justify-center border-l border-white/20 bg-gradient-to-b from-red-500 to-red-600 px-4 py-3.5 text-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>

                  <p className="text-center text-xs text-slate-500">
                    Espace{' '}
                    <strong className="font-semibold text-slate-300">
                      {selectedRole?.label || roleLabels[role]}
                    </strong>{' '}
                    : redirection automatique après connexion.
                  </p>
                </form>

                <Link
                  to="/"
                  className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-blue-400 transition hover:text-blue-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la page d&apos;accueil
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.footer
          className="relative z-10 mt-auto border-t border-white/10 pt-8 sm:pt-10"
          {...fadeUp(0.2)}
        >
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              <Smartphone className="h-4 w-4 text-blue-400" />
              Applications mobiles
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Téléchargez PEDAGOGIA DRIVE sur votre smartphone pour réviser et suivre votre formation où que vous soyez.
            </p>
            <StorePlatformBadges className="mt-5" size="large" />
            <p className="mt-8 text-xs text-slate-600">
              © 2024 Pedagogia Drive. Tous droits réservés.
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}
