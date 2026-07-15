import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import { LIVRET_SEO_SECTIONS } from '../../lib/marketingContent'

function reveal(shouldReduceMotion, delay = 0) {
  if (shouldReduceMotion) return {}
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.45, delay, ease: 'easeOut' },
  }
}

export default function MarketingLivretSeoSection({ isDark, shouldReduceMotion, skin }) {
  const definition = LIVRET_SEO_SECTIONS[0]
  const remc = LIVRET_SEO_SECTIONS[1]

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
      id="livret-numerique"
      aria-labelledby="livret-numerique-title"
    >
      <motion.div {...reveal(shouldReduceMotion)}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${isDark ? 'bg-cyan-500/15 text-cyan-300' : 'bg-cyan-100 text-cyan-800'}`}>
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Livret numérique
          </span>
        </div>
        <h2
          className={`mt-4 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl ${skin.heading}`}
          id="livret-numerique-title"
        >
          {definition.title}
        </h2>
        <p className={`mt-4 max-w-3xl text-base leading-8 ${skin.body}`}>
          {definition.paragraphs[0]}
        </p>
      </motion.div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <motion.article
          {...reveal(shouldReduceMotion, 0.06)}
          className={`rounded-3xl border p-6 sm:p-8 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white shadow-sm'}`}
        >
          <h3 className={`text-lg font-extrabold ${skin.heading}`}>{remc.title}</h3>
          <p className={`mt-3 text-sm leading-7 ${skin.body}`}>{remc.paragraphs[0]}</p>
        </motion.article>
        <motion.article
          {...reveal(shouldReduceMotion, 0.1)}
          className={`rounded-3xl border p-6 sm:p-8 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white shadow-sm'}`}
        >
          <h3 className={`text-lg font-extrabold ${skin.heading}`}>
            Livret pédagogique numérique auto-école
          </h3>
          <ul className={`mt-3 space-y-2 text-sm leading-7 ${skin.body}`}>
            {LIVRET_SEO_SECTIONS[2].bullets.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="text-cyan-500">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.article>
      </div>

      <motion.div {...reveal(shouldReduceMotion, 0.14)} className="mt-8">
        <Link
          className={`inline-flex items-center gap-2 text-sm font-black transition ${isDark ? 'text-cyan-300 hover:text-cyan-200' : 'text-cyan-700 hover:text-cyan-800'}`}
          to="/livret-numerique-auto-ecole"
        >
          En savoir plus sur le livret pédagogique d&apos;apprentissage auto-école
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </motion.div>
    </section>
  )
}
