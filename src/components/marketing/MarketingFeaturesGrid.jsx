import { motion } from 'framer-motion'
import { LANDING_FEATURES } from '../../lib/marketingContent'

function reveal(shouldReduceMotion, delay = 0) {
  return {
    initial: shouldReduceMotion ? undefined : { opacity: 0, y: 20 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.45, delay, ease: 'easeOut' },
  }
}

export default function MarketingFeaturesGrid({ isDark, skin, shouldReduceMotion, compact = false }) {
  const features = compact ? LANDING_FEATURES.slice(0, 6) : LANDING_FEATURES
  return (
    <section id="fonctionnalites" className={`${skin.sectionAlt} py-14 lg:py-20`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...reveal(shouldReduceMotion)} className="mx-auto max-w-2xl text-center">
          <p className={skin.eyebrowEmerald}>Fonctionnalités</p>
          <h2 className={`mt-3 text-2xl font-black sm:text-3xl ${skin.heading}`}>
            Tout ce dont votre auto-école a besoin
          </h2>
          <p className={`mt-4 text-base leading-8 ${skin.bodyMuted}`}>
            Une plateforme complète pour gérer, accompagner et faire progresser vos élèves au quotidien.
          </p>
        </motion.div>

        <div className={`mt-10 grid gap-5 ${compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
          {features.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.article
                {...reveal(shouldReduceMotion, index * 0.03)}
                className={`${skin.card} p-5`}
                key={item.title}
              >
                <div
                  className={`inline-flex rounded-xl border p-2.5 ${
                    isDark
                      ? 'border-blue-400/20 bg-blue-500/10 text-blue-300'
                      : 'border-blue-300 bg-blue-50 text-blue-600'
                  }`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </div>
                <h3 className={`mt-4 text-sm font-black leading-snug ${skin.heading}`}>{item.title}</h3>
                <p className={`mt-2 text-sm leading-6 ${skin.bodyMuted}`}>{item.description}</p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
