import { Link } from 'react-router-dom'

const icons = {
  student: (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
      <path
        d="M4 6.75 12 3l8 3.75-8 3.75L4 6.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 9.25v4.25c0 1.8 2.45 3.25 5.5 3.25s5.5-1.45 5.5-3.25V9.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M20 7.25v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  teacher: (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
      <path
        d="M8 8.25a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.75 20.5c.7-3.1 3.4-5.25 7.25-5.25s6.55 2.15 7.25 5.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M17.25 4.75h3v8.5h-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  secretary: (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
      <path
        d="M8 7.5V6.25A2.25 2.25 0 0 1 10.25 4h3.5A2.25 2.25 0 0 1 16 6.25V7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.5 8.25h15v9A2.75 2.75 0 0 1 16.75 20h-9.5A2.75 2.75 0 0 1 4.5 17.25v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M4.75 12h14.5M10 12v1.25h4V12" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  manager: (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
      <path
        d="M12 3.75 19 7v5.25c0 4.25-2.85 7.1-7 8-4.15-.9-7-3.75-7-8V7l7-3.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.25 12.15 11.15 14l3.75-4.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
}

const profiles = [
  {
    id: 'student',
    href: '/student/dashboard',
    eyebrow: 'Parcours conduite',
    title: 'Élève',
    description:
      'Suivez votre progression REMC, consultez vos leçons et gérez vos réservations',
    accent: 'from-cyan-300 via-sky-400 to-blue-500',
    glow: 'group-hover:shadow-cyan-400/25',
  },
  {
    id: 'teacher',
    href: '/teacher/dashboard',
    eyebrow: 'Pédagogie REMC',
    title: 'Enseignant',
    description:
      'Gérez vos élèves, validez les compétences et organisez votre planning',
    accent: 'from-teal-300 via-cyan-400 to-sky-500',
    glow: 'group-hover:shadow-teal-400/25',
  },
  {
    id: 'secretary',
    href: '/secretary/dashboard',
    eyebrow: 'Gestion opérationnelle',
    title: 'Secrétariat',
    description:
      'Gérez les inscriptions, les paiements et la communication avec les élèves',
    accent: 'from-indigo-300 via-cyan-400 to-blue-500',
    glow: 'group-hover:shadow-indigo-400/25',
  },
  {
    id: 'manager',
    href: '/manager/dashboard',
    eyebrow: 'Pilotage premium',
    title: 'Gérant',
    description:
      'Consultez les statistiques, gérez les enseignants et optimisez votre auto-école',
    accent: 'from-slate-200 via-cyan-300 to-sky-500',
    glow: 'group-hover:shadow-cyan-300/25',
  },
]

export default function ProfileSelection() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030b18] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.20),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(59,130,246,0.22),transparent_28%),linear-gradient(135deg,#020617_0%,#071827_48%,#0b2f43_100%)]" />
        <div className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-[110px]" />
        <div className="absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-blue-500/15 blur-[100px]" />
        <div className="absolute -right-32 -top-40 h-96 w-96 rounded-full bg-cyan-400/15 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-3xl text-center animate-slide-up">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-5 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
            Auto-école premium
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-2xl sm:text-6xl lg:text-7xl">
            PEDAGOGIA{' '}
            <span className="bg-gradient-to-r from-cyan-200 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
              DRIVE
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-cyan-50/80 sm:text-lg">
            Sélectionnez votre profil pour accéder à l’application
          </p>
        </header>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6 animate-slide-up [animation-delay:80ms]">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              to={profile.href}
              className={`group relative isolate flex min-h-[21rem] flex-col items-center justify-center overflow-hidden rounded-[2.25rem]
                border border-white/18 bg-white/[0.08] p-7 shadow-2xl shadow-black/35 ring-1 ring-white/10
                backdrop-blur-[34px] transition-all duration-500 hover:-translate-y-2 hover:scale-[1.015]
                text-center hover:border-cyan-100/45 hover:bg-white/[0.12] hover:shadow-2xl ${profile.glow}`}
            >
              <div
                className={`absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br ${profile.accent} opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40`}
              />
              <div className="absolute -bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-300/12 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(145deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04)_42%,rgba(255,255,255,0.02)),radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.28),transparent_28%)]" />
              <div className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              <div className="absolute inset-y-8 left-0 w-px bg-gradient-to-b from-transparent via-white/35 to-transparent" />

              <div
                className={`mb-7 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/25 bg-gradient-to-br ${profile.accent} text-white shadow-2xl shadow-cyan-950/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1`}
              >
                {icons[profile.id]}
              </div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/70">
                {profile.eyebrow}
              </p>
              <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-lg">
                {profile.title}
              </h2>
              <p className="mt-4 max-w-md text-base font-medium leading-7 text-cyan-50/82">
                {profile.description}
              </p>
              <span
                className="mt-8 inline-flex w-fit items-center gap-3 rounded-2xl border border-white/25 bg-white/[0.12] px-5 py-3 text-sm font-extrabold text-white shadow-xl shadow-black/20 backdrop-blur-2xl transition-all duration-300 group-hover:bg-cyan-300 group-hover:text-navy-950"
              >
                Accéder
                <span
                  className="grid h-6 w-6 place-items-center rounded-full bg-white/15 transition-colors group-hover:bg-navy-950/10"
                  aria-hidden="true"
                >
                  {'\u2192'}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 max-w-2xl rounded-[1.75rem] border border-white/15 bg-white/[0.07] px-6 py-4 text-center shadow-2xl shadow-black/25 backdrop-blur-[28px] animate-slide-up [animation-delay:160ms]">
          <p className="text-sm font-semibold text-cyan-50/85">
            MODE DÉMONSTRATION — Accès libre à toutes les fonctionnalités sans authentification
          </p>
        </div>
      </div>
    </div>
  )
}
