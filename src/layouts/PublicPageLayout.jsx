import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import PublicFooter from '../components/marketing/PublicFooter'
import BetaDevelopmentBanner from '../components/marketing/BetaDevelopmentBanner'

export default function PublicPageLayout({ title, children, showBetaBanner = true }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-950 text-white">
      {showBetaBanner && <BetaDevelopmentBanner isDark />}
      <header className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <BrandLogo />
          <Link
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            to="/"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" />
            Accueil
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6" id="main-content">
        <article className="mx-auto w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white p-6 text-slate-800 shadow-2xl md:p-8">
          <h1 className="text-3xl font-extrabold text-slate-950">{title}</h1>
          <div className="prose-public mt-8 space-y-6 text-sm leading-7 text-slate-600">
            {children}
          </div>
        </article>
      </main>

      <PublicFooter isDark compact />
    </div>
  )
}
