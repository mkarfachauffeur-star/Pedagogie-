import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { LANDING_WHY } from '../../lib/marketingContent'

function reveal(shouldReduceMotion, delay = 0) {
  return {
    initial: shouldReduceMotion ? undefined : { opacity: 0, y: 20 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.45, delay, ease: 'easeOut' },
  }
}

export default function MarketingWhySection({ isDark, skin, shouldReduceMotion, compact = false }) {
  const items = compact ? LANDING_WHY.slice(0, 4) : LANDING_WHY
  return (
    <section className={`${skin.sectionAlt} py-14 lg:py-20`} id="pourquoi">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal(shouldReduceMotion)} className="mx-auto max-w-2xl text-center">
          <p className={skin.eyebrowBlue}>Pourquoi Pedagogia Drive</p>
          <h2 className={`mt-3 text-2xl font-black sm:text-3xl ${skin.heading}`}>
            Conçu pour les auto-écoles modernes
          </h2>
        </motion.div>

        <ul className={`mt-10 grid gap-4 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {items.map((item, index) => (
            <motion.li
              {...reveal(shouldReduceMotion, index * 0.04)}
              className={`flex gap-4 rounded-2xl border p-5 ${
                isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white shadow-sm'
              }`}
              key={item.title}
            >
              <CheckCircle2
                aria-hidden="true"
                className={`mt-0.5 h-5 w-5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
              />
              <div>
                <h3 className={`text-base font-black ${skin.heading}`}>{item.title}</h3>
                <p className={`mt-1.5 text-sm leading-6 ${skin.bodyMuted}`}>{item.description}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
