import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandLogo from '../BrandLogo'

export default function PrivateBetaSignupClosed() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-950 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <BrandLogo />
          <Link
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-cyan-100 shadow-sm backdrop-blur transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            to="/"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" />
            Retour accueil
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-600">🚧 Version Bêta Privée</p>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-950">Inscriptions publiques fermées</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Pedagogia Drive est actuellement en phase de tests avec un nombre limité d&apos;auto-écoles
            partenaires. La création de compte en ligne n&apos;est pas disponible pour le moment.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Vous avez déjà un compte ? Connectez-vous normalement. Sinon, demandez une démonstration
            pour découvrir la plateforme et les conditions d&apos;accès à la bêta.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="pd-btn-primary text-center" to="/login">
              Se connecter
            </Link>
            <a className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50" href="/#demonstration">
              Demander une démonstration
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
