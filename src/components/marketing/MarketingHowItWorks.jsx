import { motion } from 'framer-motion'
import { LANDING_HOW_IT_WORKS } from '../../lib/marketingContent'

function reveal(shouldReduceMotion, delay = 0) {
  return {
    initial: shouldReduceMotion ? undefined : { opacity: 0, y: 20 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.45, delay, ease: 'easeOut' },
  }
}

export default function MarketingHowItWorks({ isDark, skin, shouldReduceMotion }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20" id="comment-ca-marche">
      <motion.div {...reveal(shouldReduceMotion)} className="mx-auto max-w-2xl text-center">
        <p className={skin.eyebrowBlue}>Comment ça fonctionne</p>
        <h2 className={`mt-3 text-2xl font-black sm:text-3xl ${skin.heading}`}>
          De la démo à votre auto-école en ligne
        </h2>
      </motion.div>

      <ol className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
        {LANDING_HOW_IT_WORKS.map((item, index) => (
          <li className="flex flex-col" key={item.step}>
            <motion.div
              {...reveal(shouldReduceMotion, index * 0.06)}
              className={`h-full rounded-2xl border p-5 text-center sm:p-6 ${
                isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
                  isDark ? 'bg-blue-500/20 text-blue-200' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {item.step}
              </span>
              <p className={`mt-3 text-sm font-bold leading-6 sm:text-base ${skin.heading}`}>{item.title}</p>
            </motion.div>
          </li>
        ))}
      </ol>
    </section>
  )
}
