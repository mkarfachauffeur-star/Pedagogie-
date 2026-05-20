import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { roleDestinations, roleLabels, setStoredRole } from '../utils/authSession'

const roles = [
  { id: 'student', label: 'Élève', hint: 'Accès suivi REMC, QCU, lexique, progression.' },
  { id: 'teacher', label: 'Enseignant', hint: 'Accès validation, pédagogie et suivi élèves.' },
  { id: 'secretary', label: 'Secrétariat', hint: 'Accès inscriptions, dossiers, paiements, planning.' },
  { id: 'manager', label: 'Gérant', hint: 'Accès pilotage global, statistiques et organisation.' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')

  const canSubmit = useMemo(() => Boolean(role), [role])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setStoredRole(role)
    navigate(roleDestinations[role], { replace: true })
  }

  const handleQuickAccess = (selectedRole) => {
    setStoredRole(selectedRole)
    navigate(roleDestinations[selectedRole], { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030b18] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.25),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.2),transparent_32%),linear-gradient(145deg,#020617,#071827,#0b2f43)]" />
        <div className="absolute left-1/2 top-10 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_1fr]"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <section className="rounded-[2rem] border border-white/15 bg-white/[0.07] p-6 shadow-2xl shadow-cyan-900/20 backdrop-blur-2xl sm:p-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Accès privé sécurisé
            </p>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Connexion à{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                PEDAGOGIA DRIVE
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-cyan-50/80 sm:text-base">
              Connectez-vous pour accéder à votre espace privé selon votre rôle : élève, enseignant, secrétariat ou gérant.
            </p>
            <div className="mt-8 grid gap-3">
              {roles.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 text-sm text-cyan-50/85"
                >
                  <p className="font-black text-white">{item.label}</p>
                  <p className="mt-1">{item.hint}</p>
                </div>
              ))}
            </div>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 transition hover:text-cyan-100"
            >
              Retour à la page d'accueil
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
            <div className="mb-5 rounded-2xl border border-cyan-200/25 bg-cyan-400/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100">Accès démo rapide</p>
              <p className="mt-1 text-xs leading-5 text-cyan-100/80">
                Ouvrez directement un dashboard sans saisir d'e-mail ni de mot de passe.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {roles.map((item) => (
                  <button
                    key={`quick-${item.id}`}
                    type="button"
                    onClick={() => handleQuickAccess(item.id)}
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-[#0d1f31]/80 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:border-cyan-200/40 hover:bg-[#12304a]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="text-sm font-bold text-cyan-100">
                E-mail
                <span className="mt-2 flex items-center gap-2 rounded-2xl border border-white/20 bg-[#0d1f31]/70 px-4 py-3">
                  <Mail className="h-4 w-4 text-cyan-200" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="contact@auto-école.fr"
                    className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-300/60"
                  />
                </span>
              </label>

              <label className="text-sm font-bold text-cyan-100">
                Mot de passe
                <span className="mt-2 flex items-center gap-2 rounded-2xl border border-white/20 bg-[#0d1f31]/70 px-4 py-3">
                  <LockKeyhole className="h-4 w-4 text-cyan-200" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-300/60"
                  />
                </span>
              </label>

              <label className="text-sm font-bold text-cyan-100">
                Rôle utilisateur
                <span className="mt-2 flex items-center gap-2 rounded-2xl border border-white/20 bg-[#0d1f31]/70 px-4 py-3">
                  <UserRound className="h-4 w-4 text-cyan-200" />
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                  >
                    {roles.map((item) => (
                      <option key={item.id} value={item.id} className="bg-[#0d1f31] text-white">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-cyan-700/40 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Connexion
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-xs leading-6 text-cyan-100/70">
                Espace <strong>{roleLabels[role]}</strong> : redirection automatique après connexion.
              </p>
            </form>
          </section>
        </motion.div>
      </main>
    </div>
  )
}
