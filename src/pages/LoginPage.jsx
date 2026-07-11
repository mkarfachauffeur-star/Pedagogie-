import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import MarketingThemeToggle from '../components/marketing/MarketingThemeToggle'
import PageSeo from '../components/seo/PageSeo'
import StorePlatformBadges from '../components/StorePlatformBadges'
import { useAuth } from '../context/AuthContext'
import { useMarketingTheme } from '../hooks/useMarketingTheme'
import { trackLogin, trackFirstLogin } from '../lib/analytics'
import { supabase } from '../lib/supabase'
import { getUserFacingError } from '../lib/userFacingError'
import { marketingSkin } from '../lib/marketingTheme'
import { breadcrumbsForPage, buildPageJsonLd, SEO_PAGES } from '../lib/seo'
import { roleDestinations } from '../utils/authSession'

function LoginRoadArt() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-0 flex justify-center opacity-80"
      >
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

        <path d="M120 480 L320 140 L480 140 L680 480 Z" fill="url(#login-road-surface)" opacity="0.95" />
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
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-32 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent"
      />
    </>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInWithPassword, completePasswordChange, mustChangePassword: sessionMustChange, role: sessionRole } = useAuth()
  const { isDark, toggleTheme } = useMarketingTheme()
  const skin = marketingSkin(isDark ? 'dark' : 'light')
  const shouldReduceMotion = useReducedMotion()
  const [authError, setAuthError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotSending, setForgotSending] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [pendingRole, setPendingRole] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const loginPage = SEO_PAGES.login
  const loginJsonLd = useMemo(
    () =>
      buildPageJsonLd({
        path: loginPage.path,
        title: loginPage.title,
        description: loginPage.description,
        breadcrumbTrail: breadcrumbsForPage('login'),
      }),
    [loginPage.description, loginPage.path, loginPage.title],
  )

  useEffect(() => {
    const savedEmail = window.localStorage.getItem('pedagogia-drive-login-email')
    if (savedEmail) setEmail(savedEmail)
  }, [])

  useEffect(() => {
    if (sessionMustChange) {
      setMustChangePassword(true)
      setPendingRole(sessionRole)
    }
  }, [sessionMustChange, sessionRole])

  useEffect(() => {
    if (location.state?.forcePasswordChange) {
      setMustChangePassword(true)
    }
  }, [location.state?.forcePasswordChange])

  useEffect(() => {
    const previousBodyBg = document.body.style.backgroundColor
    const previousHtmlBg = document.documentElement.style.backgroundColor
    const pageBg = isDark ? '#030712' : '#ffffff'

    document.body.classList.add('login-page-active')
    document.body.style.backgroundColor = pageBg
    document.documentElement.style.backgroundColor = pageBg

    return () => {
      document.body.classList.remove('login-page-active')
      document.body.style.backgroundColor = previousBodyBg
      document.documentElement.style.backgroundColor = previousHtmlBg
    }
  }, [isDark])

  const canSubmit = useMemo(() => Boolean(email.trim() && password), [email, password])

  const handleForgotPassword = async () => {
    setAuthError('')
    setForgotSent(false)
    const targetEmail = email.trim().toLowerCase()
    if (!targetEmail) {
      setAuthError('Saisissez votre e-mail pour recevoir un lien de réinitialisation.')
      return
    }
    setForgotSending(true)
    const redirectTo = `${window.location.origin}/accept-invite`
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo })
    setForgotSending(false)
    if (error) {
      setAuthError(getUserFacingError(error, 'reset_password'))
      return
    }
    setForgotSent(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    if (!email.trim() || !password) {
      setAuthError('Saisissez votre e-mail et votre mot de passe.')
      return
    }
    if (rememberMe && email) {
      window.localStorage.setItem('pedagogia-drive-login-email', email)
    }
    setSubmitting(true)
    const { error, role: realRole, mustChangePassword: forceChange } = await signInWithPassword(email, password)
    setSubmitting(false)
    if (error) {
      setAuthError(error.message || getUserFacingError(error, 'login'))
      return
    }
    if (forceChange) {
      setMustChangePassword(true)
      setPendingRole(realRole)
      setNewPassword('')
      setConfirmPassword('')
      setAuthError('')
      return
    }
    const destination = roleDestinations[realRole] || '/'
    const { data: sessionData } = await supabase.auth.getUser()
    trackFirstLogin(sessionData.user?.id, realRole)
    trackLogin(realRole)
    navigate(destination, { replace: true })
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    setAuthError('')
    if (newPassword.length < 8) {
      setAuthError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Les mots de passe ne correspondent pas.')
      return
    }
    if (newPassword === password) {
      setAuthError('Choisissez un mot de passe différent du mot de passe temporaire.')
      return
    }
    setSubmitting(true)
    const { error } = await completePasswordChange(newPassword)
    setSubmitting(false)
    if (error) {
      setAuthError(error.message || getUserFacingError(error, 'save'))
      return
    }
    setMustChangePassword(false)
    const destination = roleDestinations[pendingRole] || '/'
    const { data: sessionData } = await supabase.auth.getUser()
    trackFirstLogin(sessionData.user?.id, pendingRole)
    trackLogin(pendingRole)
    navigate(destination, { replace: true })
  }

  const fadeUp = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: 'easeOut' },
        }

  const inputIconClass = isDark ? 'h-4 w-4 shrink-0 text-blue-400' : 'h-4 w-4 shrink-0 text-blue-600'
  const passwordToggleClass = isDark
    ? 'shrink-0 text-slate-500 transition hover:text-slate-300'
    : 'shrink-0 text-slate-400 transition hover:text-slate-600'
  const checkboxClass = isDark
    ? 'h-4 w-4 rounded border-white/20 bg-[#070d18] text-blue-500'
    : 'h-4 w-4 rounded border-2 border-slate-400 bg-white text-blue-600'

  return (
    <div
      className={`login-page-shell fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden ${isDark ? 'bg-[#030712] text-white' : 'bg-white text-slate-900'}`}
    >
      <PageSeo {...loginPage} jsonLd={loginJsonLd} />
      <div aria-hidden className={skin.ambient.replace(' -z-10', '')} />
      {isDark && <LoginRoadArt />}

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1280px] flex-col px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <header className="mb-8 flex items-center justify-between lg:mb-10">
          <Link aria-label="Retour à l'accueil" to="/">
            <BrandLogo
              animated={!shouldReduceMotion}
              idPrefix="login"
              variant={isDark ? 'marketing' : 'light'}
            />
          </Link>
          <MarketingThemeToggle className={skin.themeToggle} isDark={isDark} onToggle={toggleTheme} />
        </header>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div
            className="flex flex-col justify-center lg:min-h-[calc(100vh-8rem)]"
            {...fadeUp(0)}
          >
            <p className={skin.loginHeroBadge}>
              <ShieldCheck className="h-3.5 w-3.5" />
              Accès privé sécurisé
            </p>

            <h1
              className={`mt-6 max-w-lg text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1] ${skin.heading}`}
            >
              Bienvenue sur{' '}
              <span className="block sm:inline">
                PEDAGOGIA{' '}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-red-400 bg-clip-text text-transparent">
                  DRIVE
                </span>
              </span>
            </h1>
            <p className={`mt-5 max-w-md text-base leading-7 sm:text-lg ${skin.bodyMuted}`}>
              La plateforme premium pensée pour les auto-écoles modernes.
            </p>
          </motion.div>

          <motion.div className="flex items-center justify-center" {...fadeUp(0.1)}>
            <div className="relative w-full max-w-md">
              {isDark && (
                <>
                  <div className="absolute -inset-[1px] rounded-[1.75rem] bg-gradient-to-br from-blue-500/70 via-violet-500/40 to-red-500/70 opacity-80 blur-[1px]" />
                  <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-600/15 via-transparent to-red-600/15 blur-2xl" />
                </>
              )}

              <div className={skin.loginFormCard}>
                {isDark && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-blue-500/60 via-violet-400/30 to-red-500/60" />
                )}

                {mustChangePassword ? (
                  <form className="grid gap-4" onSubmit={handlePasswordChange}>
                    <div className={skin.loginForgotBox}>
                      <p className={`font-black ${skin.heading}`}>Changement de mot de passe obligatoire</p>
                      <p className="mt-2 text-sm">
                        Pour des raisons de sécurité, définissez un nouveau mot de passe personnel avant d&apos;accéder à votre espace.
                      </p>
                    </div>
                    <label className={skin.loginLabel}>
                      Nouveau mot de passe
                      <span className={skin.loginInputWrap}>
                        <LockKeyhole className={inputIconClass} />
                        <input
                          autoComplete="new-password"
                          className={skin.loginInput}
                          minLength={8}
                          onChange={(event) => setNewPassword(event.target.value)}
                          placeholder="Minimum 8 caractères"
                          required
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                        />
                        <button
                          aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                          className={passwordToggleClass}
                          onClick={() => setShowNewPassword((current) => !current)}
                          type="button"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </span>
                    </label>
                    <label className={skin.loginLabel}>
                      Confirmer le mot de passe
                      <span className={skin.loginInputWrap}>
                        <LockKeyhole className={inputIconClass} />
                        <input
                          autoComplete="new-password"
                          className={skin.loginInput}
                          minLength={8}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="Répétez le mot de passe"
                          required
                          type={showNewPassword ? 'text' : 'password'}
                          value={confirmPassword}
                        />
                      </span>
                    </label>
                    {authError && <p className={skin.loginError}>{authError}</p>}
                    <button
                      className="group mt-1 flex w-full overflow-hidden rounded-xl shadow-lg shadow-blue-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={submitting || newPassword.length < 8 || !confirmPassword}
                      type="submit"
                    >
                      <span className="flex flex-1 items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 py-3.5 text-sm font-black text-white">
                        Enregistrer et continuer
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  </form>
                ) : (
                <form className="grid gap-4" onSubmit={handleSubmit}>
                  <label className={skin.loginLabel}>
                    E-mail
                    <span className={skin.loginInputWrap}>
                      <Mail className={inputIconClass} />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="votre@email.com"
                        className={skin.loginInput}
                      />
                    </span>
                  </label>

                  <label className={skin.loginLabel}>
                    Mot de passe
                    <span className={skin.loginInputWrap}>
                      <LockKeyhole className={inputIconClass} />
                      <input
                        autoComplete="current-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        className={skin.loginInput}
                      />
                      <button
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className={passwordToggleClass}
                        onClick={() => setShowPassword((current) => !current)}
                        type="button"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </span>
                  </label>

                  <div className={`flex flex-wrap items-center justify-between gap-3 text-sm ${skin.loginMuted}`}>
                    <label className={`inline-flex cursor-pointer items-center gap-2 ${skin.loginMuted}`}>
                      <input
                        checked={rememberMe}
                        className={checkboxClass}
                        onChange={(event) => setRememberMe(event.target.checked)}
                        type="checkbox"
                      />
                      Se souvenir de moi
                    </label>
                    <button className={skin.loginLink} onClick={() => setForgotOpen(true)} type="button">
                      Mot de passe oublié ?
                    </button>
                  </div>

                  {forgotOpen && (
                    <div className={skin.loginForgotBox}>
                      <p className={`font-black ${skin.heading}`}>Réinitialisation du mot de passe</p>
                      {forgotSent ? (
                        <p className="mt-2">
                          Si un compte existe pour <strong>{email.trim()}</strong>, un e-mail avec un lien de
                          réinitialisation vient d&apos;être envoyé. Vérifiez vos spams.
                        </p>
                      ) : (
                        <>
                          <p className="mt-2">
                            Un lien sécurisé sera envoyé à l&apos;adresse saisie ci-dessus pour définir un nouveau mot de passe.
                          </p>
                          <button
                            className={`mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-50`}
                            disabled={forgotSending || !email.trim()}
                            onClick={handleForgotPassword}
                            type="button"
                          >
                            {forgotSending ? 'Envoi…' : 'Envoyer le lien'}
                          </button>
                        </>
                      )}
                      <button
                        className={`mt-3 text-xs font-bold underline ${skin.loginLink}`}
                        onClick={() => { setForgotOpen(false); setForgotSent(false) }}
                        type="button"
                      >
                        Fermer
                      </button>
                    </div>
                  )}

                  {authError && <p className={skin.loginError}>{authError}</p>}

                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="group mt-1 flex w-full overflow-hidden rounded-xl shadow-lg shadow-blue-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 py-3.5 text-sm font-black text-white">
                      {submitting ? 'Connexion…' : 'Connexion'}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </button>

                  <p className={`text-center text-xs ${skin.loginSubtle}`}>
                    Redirection automatique vers votre espace après connexion.
                  </p>
                </form>
                )}

                <Link className={`mt-6 flex items-center justify-center gap-2 ${skin.loginBackLink}`} to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la page d&apos;accueil
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.footer
          className={`relative z-10 mt-auto border-t pt-8 sm:pt-10 ${skin.loginFooterBorder}`}
          {...fadeUp(0.2)}
        >
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <nav
              aria-label="Liens légaux"
              className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold ${skin.loginMuted}`}
            >
              <Link className={`transition ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`} to="/mentions-legales">
                Mentions légales
              </Link>
              <Link className={`transition ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`} to="/politique-confidentialite">
                Politique de confidentialité
              </Link>
              <Link className={`transition ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`} to="/contact">
                Contact
              </Link>
            </nav>
            <p
              className={`mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] ${skin.loginMuted}`}
            >
              <Smartphone className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              Applications mobiles
            </p>
            <p className={`mt-2 max-w-md text-sm leading-6 ${skin.loginSubtle}`}>
              Téléchargez PEDAGOGIA DRIVE sur votre smartphone pour réviser et suivre votre formation où que vous
              soyez.
            </p>
            <StorePlatformBadges className="mt-5" size="large" />
            <p className={`mt-8 text-xs ${skin.loginSubtle}`}>
              © {new Date().getFullYear()} Pedagogia Drive. Tous droits réservés.
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}
