import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function BlogArticleCta({ isDark, skin }) {
  return (
    <section
      aria-labelledby="blog-article-cta"
      className={`mt-12 rounded-[1.25rem] border-2 p-6 sm:p-8 ${
        isDark
          ? 'border-blue-400/25 bg-gradient-to-br from-blue-500/10 to-cyan-500/5'
          : 'border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50'
      }`}
    >
      <h2 className={`text-xl font-black sm:text-2xl ${skin.heading}`} id="blog-article-cta">
        Demandez une démonstration gratuite de Pedagogia Drive
      </h2>
      <p className={`mt-3 max-w-2xl text-sm leading-7 sm:text-base ${skin.bodyMuted}`}>
        Découvrez comment le livret numérique Pedagogia Drive simplifie le suivi REMC, la gestion
        des élèves et la communication avec votre équipe pédagogique.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
          to="/#demonstration"
        >
          Demander une démonstration
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <Link
          className={`inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-black transition ${skin.loginBtn}`}
          to="/contact"
        >
          Nous contacter
        </Link>
      </div>
    </section>
  )
}
