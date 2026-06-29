import { Link } from 'react-router-dom'
import BrandLogo from '../BrandLogo'

export default function PublicFooter({ isDark = true, compact = false }) {
  const linkClass = isDark
    ? 'text-sm font-semibold text-slate-400 transition hover:text-white'
    : 'text-sm font-semibold text-slate-600 transition hover:text-slate-900'
  const copyClass = isDark ? 'text-xs text-slate-600' : 'text-xs text-slate-500'
  const borderClass = isDark ? 'border-white/10' : 'border-slate-300'
  const shellClass = isDark
    ? 'border-t border-white/10 bg-[#020817] px-4 py-10 sm:px-6 lg:px-8'
    : 'border-t-2 border-slate-300 bg-slate-100 px-4 py-10 sm:px-6 lg:px-8'

  return (
    <footer className={shellClass}>
      <div className={`mx-auto flex w-full max-w-7xl flex-col gap-8 ${compact ? '' : 'sm:flex-row sm:items-start sm:justify-between'}`}>
        {!compact && (
          <div className="shrink-0">
            <BrandLogo animated={false} />
          </div>
        )}
        <nav
          aria-label="Liens légaux et contact"
          className="flex flex-wrap items-center gap-x-6 gap-y-3"
        >
          <Link className={linkClass} to="/mentions-legales">
            Mentions légales
          </Link>
          <Link className={linkClass} to="/confidentialite">
            Politique de confidentialité
          </Link>
          <Link className={linkClass} to="/blog">
            Blog
          </Link>
          <Link className={linkClass} to="/contact">
            Contact
          </Link>
        </nav>
      </div>
      <div className={`mx-auto mt-8 max-w-7xl border-t pt-6 text-center ${borderClass}`}>
        <p className={copyClass}>© {new Date().getFullYear()} Pedagogia Drive</p>
        <p className={`mt-2 ${copyClass}`}>
          Le site est actuellement en phase de développement et de tests.
        </p>
      </div>
    </footer>
  )
}
