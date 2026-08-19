import { KeyRound } from 'lucide-react'
import { useId } from 'react'
import DashboardWarningIcon from '../../DashboardWarningIcon'
import { LANDING_SCHEMAS } from './landingAssets'

const REMC_COMPETENCIES = [
  { code: 'C1', title: 'Maîtriser le véhicule' },
  { code: 'C2', title: 'Appréhender la route' },
  { code: 'C3', title: 'Partager la route' },
  { code: 'C4', title: 'Devenir autonome' },
]

const REAL_QCU = {
  lesson: 'Connaître les principaux organes du véhicule',
  question: 'Quelle commande sert surtout à arrêter le véhicule en sécurité ?',
  choices: ['Le frein', 'La boîte de vitesses', 'Le système de refroidissement du moteur'],
}

function AppChrome({ children }) {
  return <div className="overflow-hidden bg-[#f6f8fb] text-left">{children}</div>
}

const DASHBOARD_STATS = [
  { label: 'Évaluation de départ', value: 'Réalisée', detail: 'Avant les premières leçons' },
  { label: 'Heures de conduite', value: 'Suivi horaire', detail: 'Recommandées · effectuées · restantes' },
  { label: 'QCU', value: 'Seuil 80 %', detail: 'Correction immédiate' },
  { label: 'Livret REMC', value: '4 compétences', detail: 'C1 ouverte dès maintenant' },
]

const C1_MODULES = [
  { title: 'Installation au poste de conduite', tag: 'Leçon' },
  { title: 'Organes du véhicule', tag: 'QCU' },
  { title: 'Voyants du tableau de bord', tag: 'QCU' },
]

export function ManagerScreen() {
  return (
    <AppChrome>
      <div className="bg-[#f4f7fb] text-left">
        <div className="bg-gradient-to-br from-[#0b1628] via-[#10233f] to-[#1e3a8a] px-5 py-5 text-white">
          <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
            Espace gérant
          </span>
          <p className="mt-3 text-xl font-semibold tracking-tight">Tableau de bord</p>
          <p className="mt-1 text-[13px] leading-5 text-indigo-100">Chiffre d’affaires, encaissements et activité.</p>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'CA du mois', value: 'Encaissements' },
              { label: 'CA annuel', value: 'Sur l’année' },
              { label: 'Reste à encaisser', value: 'Contrats' },
              { label: 'Élèves actifs', value: 'En formation' },
            ].map((item) => (
              <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3" key={item.label}>
                <p className="text-[12px] font-medium text-slate-500">{item.label}</p>
                <p className="mt-1 text-[15px] font-semibold leading-5 text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[15px] font-semibold text-slate-950">Évolution du CA</p>
              <span className="text-[11px] font-medium text-slate-500">Synthèse financière</span>
            </div>
            <svg aria-hidden="true" className="mt-3 h-28 w-full" viewBox="0 0 320 112">
              <path d="M12 88 C52 82, 76 64, 108 70 S164 94, 200 52 S264 28, 308 34" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="4" />
              <path d="M12 88 C52 82, 76 64, 108 70 S164 94, 200 52 S264 28, 308 34 V112 H12 Z" fill="#2563eb" fillOpacity="0.12" />
              <circle cx="200" cy="52" fill="#2563eb" r="4.5" stroke="#fff" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </AppChrome>
  )
}

export function TeacherScreen() {
  return (
    <AppChrome>
      <div className="bg-[#f4f7fb] text-left">
        <div className="bg-gradient-to-br from-[#0b1628] via-[#10233f] to-[#1e3a8a] px-5 py-5 text-white">
          <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
            Espace enseignant
          </span>
          <p className="mt-3 text-xl font-semibold tracking-tight">Élèves de mon auto-école</p>
          <p className="mt-1 text-[13px] leading-5 text-indigo-100">Tous les élèves de l’établissement, sans attribution fixe.</p>
        </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Élèves prêts', detail: 'Préparation examen' },
                { label: 'Élèves à risque', detail: 'Points de vigilance' },
                { label: 'Examens blancs', detail: 'Épreuve pratique' },
                { label: 'Planning', detail: 'Mes leçons' },
              ].map((item) => (
                <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5" key={item.label}>
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Liste des élèves</p>
              <div className="mt-3 space-y-2">
                {[
                  { formation: 'Permis B', status: 'En formation' },
                  { formation: 'AAC', status: 'En formation' },
                  { formation: 'CS', status: 'En formation' },
                  { formation: 'Permis B', status: 'Évaluation de départ' },
                ].map((row, index) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                    key={`${row.formation}-${index}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">Élève</p>
                      <p className="text-[11px] text-slate-500">{row.formation}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>
    </AppChrome>
  )
}

export function SecretaryScreen() {
  return (
    <AppChrome>
      <div className="bg-[#f4f7fb] text-left">
        <div className="bg-gradient-to-br from-[#0b1628] via-[#10233f] to-[#1e3a8a] px-5 py-5 text-white">
          <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
            Espace secrétariat
          </span>
          <p className="mt-3 text-xl font-semibold tracking-tight">Dossiers élèves</p>
          <p className="mt-1 text-[13px] leading-5 text-indigo-100">Inscriptions, paiements et contrats au même endroit.</p>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Inscriptions', value: 'Dossiers à suivre' },
              { label: 'Pré-inscriptions', value: 'Demandes reçues' },
              { label: 'Paiements', value: 'Encaissements' },
              { label: 'Contrats', value: 'Documents' },
            ].map((item) => (
              <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3" key={item.label}>
                <p className="text-[12px] font-medium text-slate-500">{item.label}</p>
                <p className="mt-1 text-[15px] font-semibold leading-5 text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">Priorités du jour</p>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Inscriptions', title: 'Dossiers en attente' },
                { label: 'Paiements', title: 'Encaissements à enregistrer' },
                { label: 'Contrats', title: 'Documents à vérifier' },
              ].map((item) => (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-3" key={item.title}>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className="mt-0.5 text-[14px] font-semibold text-slate-900">{item.title}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
                    À traiter
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  )
}

const REAL_VOYANT_QCU = {
  lesson: 'Voyants du tableau de bord',
  question: 'Que signifie ce voyant ?',
  hint: 'Identifiez la signification de ce témoin',
  iconType: 'oil-pressure',
  choices: [
    'Il signale un manque d’huile moteur (danger pour le moteur).',
    'Il signale que le niveau d’huile est normal',
    'Il signale que le moteur surchauffe.',
    'Il indique un manque de liquide lave-glace.',
  ],
}

export function QcuScreen() {
  return (
    <AppChrome title="Pedagogia Drive — QCU">
      <div className="min-h-[20rem] bg-[#f4f7fb] p-4 sm:min-h-[24rem] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">QCU interactif</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">{REAL_QCU.lesson}</p>
          </div>
          <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-[11px] font-semibold text-cyan-700">
            Question 1
          </span>
        </div>
        <article className="mt-5 rounded-2xl border border-white bg-white p-5 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)]">
          <p className="text-lg font-semibold leading-8 text-slate-950 sm:text-xl">{REAL_QCU.question}</p>
          <div className="mt-5 grid gap-2.5">
            {REAL_QCU.choices.map((choice, index) => (
              <div
                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                  index === 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
                key={choice}
              >
                {choice}
              </div>
            ))}
          </div>
        </article>
      </div>
    </AppChrome>
  )
}

export function QcuVoyantScreen({ chrome = true, compact = false }) {
  const choices = compact ? REAL_VOYANT_QCU.choices.slice(0, 3) : REAL_VOYANT_QCU.choices
  const letters = ['A', 'B', 'C', 'D']

  const compactScreen = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f7fb] p-3">
      <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">QCU interactif</p>
      <article className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5">
        <div className="flex shrink-0 items-center gap-2.5">
          <DashboardWarningIcon interactive={false} size={44} type={REAL_VOYANT_QCU.iconType} />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">{REAL_VOYANT_QCU.lesson}</p>
            <p className="mt-0.5 text-sm font-semibold leading-5 text-slate-950">{REAL_VOYANT_QCU.question}</p>
          </div>
        </div>
        <div className="mt-2 grid min-h-0 gap-1.5">
          {choices.map((choice, index) => (
            <div
              className={`flex min-h-0 items-center gap-2 rounded-lg border px-2 py-1.5 text-[11px] font-medium leading-4 ${
                index === 0
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
              key={choice}
            >
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded text-[9px] font-bold ${
                  index === 0 ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'
                }`}
              >
                {letters[index]}
              </span>
              <span className="min-w-0 truncate">{choice}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  )

  const screen = compact ? (
    compactScreen
  ) : (
      <div className="bg-[#f4f7fb] p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">QCU interactif</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              {REAL_VOYANT_QCU.lesson}
            </p>
          </div>
          <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-[11px] font-semibold text-cyan-700">
            Témoin tableau de bord
          </span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-[12%] rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400" />
        </div>
        <article className="mt-5 rounded-[1.4rem] border border-white bg-white p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.4)] sm:p-6">
          <div className="flex flex-col items-center rounded-[1.25rem] bg-gradient-to-br from-slate-50 to-white p-5 shadow-inner">
            <DashboardWarningIcon pulse type={REAL_VOYANT_QCU.iconType} />
            <p className="mt-3 text-center text-sm font-semibold text-slate-500">{REAL_VOYANT_QCU.hint}</p>
          </div>
          <h3 className="mt-5 text-lg font-semibold leading-7 text-slate-950 sm:text-xl">
            {REAL_VOYANT_QCU.question}
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {REAL_VOYANT_QCU.choices.map((choice, index) => (
              <div
                className={`rounded-xl border px-3.5 py-3 text-[13px] font-medium leading-5 ${
                  index === 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
                key={choice}
              >
                {choice}
              </div>
            ))}
          </div>
        </article>
      </div>
  )

  if (!chrome || compact) return screen
  return <AppChrome title="Pedagogia Drive — QCU voyants">{screen}</AppChrome>
}

export function LessonScreen() {
  return (
    <AppChrome title="Pedagogia Drive — Ressources pédagogiques">
      <div className="bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Schémas pédagogiques</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              Compétence 1 — Maîtriser le véhicule
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {LANDING_SCHEMAS.map((schema) => (
            <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50" key={schema.src}>
              <div className="aspect-[16/10] bg-white p-2">
                <img
                  alt={schema.alt}
                  className="h-full w-full object-contain"
                  decoding="async"
                  loading="lazy"
                  src={schema.src}
                />
              </div>
              <figcaption className="border-t border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-500">
                {schema.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </AppChrome>
  )
}

export function GpsScreen() {
  const uid = useId().replace(/:/g, '')
  const route = 'M48 164 L132 164 Q140 164 140 156 L140 108 Q140 100 148 100 L220 100 Q228 100 228 92 L228 44 Q228 36 236 36 L312 36'

  return (
    <AppChrome title="Pedagogia Drive — AAC / CS">
      <div className="bg-white">
        <div className="bg-gradient-to-br from-[#0b1628] via-[#10233f] to-[#1e3a8a] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">Conduite supervisée</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">Tableau de bord CS</p>
            </div>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold">
              Trajet en cours
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              { label: 'Trajets', value: 'Historique GPS' },
              { label: 'Kilomètres', value: 'Distance cumulée' },
              { label: 'Durée', value: 'Temps de conduite' },
            ].map((item) => (
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur" key={item.label}>
                <p className="text-[10px] font-medium text-indigo-100/70">{item.label}</p>
                <p className="mt-1 text-[12px] font-semibold leading-4 text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200">
            <svg aria-hidden="true" className="h-48 w-full sm:h-56" viewBox="0 0 360 200">
              <defs>
                <linearGradient id={`${uid}-bg`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f3f6fa" />
                  <stop offset="100%" stopColor="#dce6f1" />
                </linearGradient>
                <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect fill={`url(#${uid}-bg)`} height="200" width="360" />
              <rect fill="#cfe3c8" height="52" rx="6" width="78" x="18" y="16" />
              <rect fill="#cfe3c8" height="44" rx="6" width="70" x="268" y="128" />
              <rect fill="#bdd4ea" height="36" rx="6" width="88" x="188" y="10" />
              <g stroke="#b7c6d6" strokeWidth="10">
                <path d="M0 36 H360" />
                <path d="M0 100 H360" />
                <path d="M0 164 H360" />
                <path d="M48 0 V200" />
                <path d="M140 0 V200" />
                <path d="M228 0 V200" />
                <path d="M312 0 V200" />
              </g>
              <g stroke="#d5dee8" strokeWidth="4">
                <path d="M0 68 H360" />
                <path d="M0 132 H360" />
                <path d="M94 0 V200" />
                <path d="M184 0 V200" />
                <path d="M270 0 V200" />
              </g>
              <g fill="#e4ebf3">
                <rect height="28" rx="3" width="56" x="58" y="44" />
                <rect height="22" rx="3" width="40" x="154" y="44" />
                <rect height="34" rx="3" width="62" x="154" y="110" />
                <rect height="24" rx="3" width="48" x="242" y="44" />
                <rect height="20" rx="3" width="34" x="322" y="110" />
                <rect height="30" rx="3" width="50" x="6" y="110" />
                <rect height="18" rx="3" width="42" x="58" y="172" />
              </g>
              <path
                d={route}
                fill="none"
                stroke="#ffffff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="8"
              />
              <path
                d={route}
                fill="none"
                filter={`url(#${uid}-glow)`}
                stroke="#2563eb"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4.5"
              />
              <circle cx="140" cy="164" fill="#93c5fd" r="3.5" stroke="#fff" strokeWidth="1.5" />
              <circle cx="140" cy="100" fill="#93c5fd" r="3.5" stroke="#fff" strokeWidth="1.5" />
              <circle cx="228" cy="68" fill="#60a5fa" r="5" stroke="#fff" strokeWidth="2" />
              <circle cx="228" cy="68" fill="#2563eb" r="2.5" />
              <circle cx="48" cy="164" fill="#16a34a" r="6" stroke="#fff" strokeWidth="2" />
              <circle cx="312" cy="36" fill="#dc2626" r="6" stroke="#fff" strokeWidth="2" />
              <rect fill="#0f172a" height="16" rx="4" width="44" x="8" y="172" />
              <text fill="#fff" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="600" x="14" y="183">
                Départ
              </text>
              <rect fill="#0f172a" height="16" rx="4" width="46" x="286" y="12" />
              <text fill="#fff" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="600" x="292" y="23">
                Arrivée
              </text>
            </svg>
            <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
              Suivi GPS
            </div>
            <div className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-[10px] font-bold text-slate-500 shadow-sm">
              N
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {['Distance', 'Durée', 'Points GPS'].map((label) => (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" key={label}>
                <p className="text-[10px] font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-lg bg-emerald-600 px-3.5 py-2 text-[11px] font-semibold text-white">
              Démarrer mon trajet
            </span>
            <span className="rounded-lg bg-rose-600 px-3.5 py-2 text-[11px] font-semibold text-white">
              Terminer mon trajet
            </span>
          </div>
        </div>
      </div>
    </AppChrome>
  )
}

export function StudentScreen() {
  return (
    <AppChrome title="Pedagogia Drive — Suivi élève">
      <div className="min-h-[16rem] bg-[#f4f7fb] p-4 sm:min-h-[18rem] sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Livret pédagogique</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Suivi des compétences REMC</p>
        <p className="mt-1 text-[12px] text-slate-500">
          Tant que la compétence n’est pas à 100 %, la suivante et ses QCU restent verrouillés.
        </p>
        <div className="mt-4 space-y-2.5">
          {REMC_COMPETENCIES.map((item, index) => {
            const complete = index === 0
            const open = index <= 1
            return (
              <div
                className={`rounded-2xl border px-4 py-3.5 ${
                  open ? 'border-slate-200/80 bg-white' : 'border-slate-200/70 bg-slate-50'
                }`}
                key={item.code}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm font-semibold ${open ? 'text-slate-900' : 'text-slate-500'}`}>
                    {item.code} · {item.title}
                  </p>
                  {complete ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      100 %
                    </span>
                  ) : open ? (
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                      En cours
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      <KeyRound className="h-3 w-3" />
                      Bloqué
                    </span>
                  )}
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      complete
                        ? 'w-full bg-gradient-to-r from-blue-500 to-rose-400'
                        : open
                          ? 'w-2/5 bg-gradient-to-r from-blue-500 to-cyan-400'
                          : 'w-0 bg-slate-200'
                    }`}
                  />
                </div>
                <p className={`mt-2 text-[11px] font-medium ${open ? 'text-blue-600' : 'text-slate-400'}`}>
                  {open ? 'QCU et exercices ouverts' : 'QCU et exercices verrouillés'}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </AppChrome>
  )
}

export function ProductFrame({ children, className = '', glow = 'blue', overflow = false }) {
  return (
    <div className={`relative max-w-full ${className}`} data-shot-slot="product">
      <div className={`landing-shot-glow landing-shot-glow-${glow}`} />
      <div
        className={`relative overflow-hidden rounded-[22px] border border-[#07111F]/[0.07] bg-white shadow-[0_36px_80px_-32px_rgba(7,17,31,0.38)] ${
          overflow ? 'lg:scale-[1.06] lg:translate-y-2' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export function DeviceStage({ children, variant = 'laptop', size = 'default', className = '' }) {
  const isLaptop = variant === 'laptop'
  const width =
    size === 'xl'
      ? 'w-full max-w-[68rem]'
      : size === 'large'
        ? 'w-full max-w-5xl'
        : isLaptop
          ? 'w-full max-w-4xl'
          : 'w-full max-w-xl sm:max-w-2xl'

  return (
    <div className={`relative mx-auto max-w-full ${width} ${className}`} data-shot-slot="product">
      <div className="landing-device-halo" />
      <div
        className={`relative origin-top ${
          isLaptop
            ? 'lg:[transform:perspective(2600px)_rotateX(6deg)_rotateY(-3deg)]'
            : 'lg:[transform:perspective(1800px)_rotateY(-4deg)_rotateX(2deg)]'
        }`}
      >
        {isLaptop ? (
          <>
            <div className="rounded-[20px] border border-[#c5ccd6] bg-gradient-to-b from-[#f4f6f8] via-[#d5dce6] to-[#a8b3c2] p-[8px] shadow-[0_40px_80px_-32px_rgba(7,17,31,0.5)] sm:rounded-[22px] sm:p-[11px]">
              <div className="overflow-hidden rounded-[12px] bg-[#0f131a] sm:rounded-[14px]">
                <div className="relative flex items-center px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                    <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                    <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="pointer-events-none absolute left-1/2 max-w-[11rem] -translate-x-1/2 truncate rounded-full bg-white/10 px-3 py-0.5 text-center text-[10px] font-medium text-white/55">
                    Pedagogia Drive
                  </span>
                </div>
                <div className="overflow-hidden bg-white">{children}</div>
              </div>
            </div>
            <div className="relative mx-auto h-2.5 w-[32%] rounded-b-md bg-gradient-to-b from-[#c5cedb] to-[#8e99aa]">
              <div className="absolute inset-x-5 top-0 h-px bg-white/35" />
            </div>
            <div className="mx-auto h-2 w-[64%] rounded-b-[14px] bg-gradient-to-b from-[#8e99aa] to-[#6e7888]" />
          </>
        ) : (
          <div className="rounded-[22px] border border-[#c8d0dc] bg-gradient-to-b from-[#e8edf4] to-[#9aa6b8] p-[3px] shadow-[0_36px_80px_-32px_rgba(7,17,31,0.4)]">
            <div className="rounded-[20px] bg-[#11141b] p-2 sm:p-2.5">
              <div className="mb-1.5 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3a4150] ring-2 ring-black/25" />
              </div>
              <div className="overflow-hidden rounded-[12px] ring-1 ring-white/10">
                {children}
              </div>
              <div className="mt-1.5 flex justify-center">
                <span className="h-1 w-10 rounded-full bg-[#3a4150]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function HeroAppScreen() {
  const nav = [
    { label: 'Tableau de bord', active: true },
    { label: 'Planning' },
    { label: 'Compétences' },
    { label: 'Documents' },
    { label: 'Messages' },
  ]

  return (
    <div className="flex bg-[#f5f7fb] text-left">
      <aside className="hidden w-44 shrink-0 bg-[#0b1628] px-3 py-4 text-white lg:block">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">Pedagogia</p>
        <p className="px-2 text-sm font-semibold tracking-tight">Drive</p>
        <nav className="mt-6 space-y-1">
          {nav.map((item) => (
            <span
              className={`block rounded-lg px-2.5 py-2 text-[12px] font-medium ${
                item.active ? 'bg-white/15 text-white' : 'text-white/60'
              }`}
              key={item.label}
            >
              {item.label}
            </span>
          ))}
        </nav>
        <p className="mt-8 px-2 text-[11px] font-medium text-white/40">Espace élève</p>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="landing-hide-scrollbar flex justify-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {nav.slice(0, 4).map((item) => (
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                item.active ? 'bg-[#1769FF] text-white' : 'bg-slate-100 text-slate-500'
              }`}
              key={item.label}
            >
              {item.label}
            </span>
          ))}
        </div>

        <div className="flex items-start justify-between gap-3 bg-white px-4 pb-3 pt-4">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold tracking-tight text-slate-950 sm:text-[15px]">Tableau de bord</p>
            <p className="mt-0.5 text-[12px] text-slate-500">Livret numérique · Permis B</p>
          </div>
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            C1 en cours
          </span>
        </div>

        <div className="space-y-3 px-3 pb-4 sm:px-4">
          <div className="grid grid-cols-2 gap-2">
            {DASHBOARD_STATS.map((item) => (
              <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]" key={item.label}>
                <p className="text-[10px] font-medium text-slate-500">{item.label}</p>
                <p className="mt-1 text-[13px] font-semibold leading-4 text-slate-950">{item.value}</p>
                <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-slate-950">
                <span className="text-[#1769FF]">C1</span> · Maîtriser le véhicule
              </p>
              <span className="text-[11px] font-semibold text-blue-700">En cours</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-[#1769FF] to-[#7C3AED]" />
            </div>
            <div className="mt-3 space-y-1.5">
              {C1_MODULES.map((item) => (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2" key={item.title}>
                  <p className="min-w-0 truncate text-[12px] font-medium text-slate-800">{item.title}</p>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#1769FF] ring-1 ring-blue-100">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroDashboard() {
  return (
    <div className="bg-[#f4f7fb] text-left">
      <div className="bg-gradient-to-br from-[#0b1628] via-[#10233f] to-[#1e3a8a] px-5 py-5 text-white sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
            Permis B
          </span>
          <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
            Livret numérique
          </span>
        </div>
        <p className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Tableau de bord élève</p>
        <p className="mt-1.5 text-[13px] leading-5 text-indigo-100 sm:text-sm">
          Progression, QCU, heures et leçons de conduite au même endroit.
        </p>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2.5">
          {DASHBOARD_STATS.map((item) => (
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3" key={item.label}>
              <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
              <p className="mt-1 text-[15px] font-semibold leading-5 text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-blue-200 bg-white p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-semibold text-slate-950">
              <span className="text-blue-600">C1</span> · Maîtriser le véhicule
            </p>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              En cours
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {C1_MODULES.map((item) => (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5" key={item.title}>
                <p className="min-w-0 text-[13px] font-medium leading-5 text-slate-800">{item.title}</p>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-100">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
